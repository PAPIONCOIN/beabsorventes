import { createHmac, timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import {
  getCustomerByEmail,
  isAdmin,
  upsertCustomer,
  type Customer,
} from "@/lib/customers";
import { digitsOnly } from "@/lib/utils";
import { getPasswordHash, setPasswordForEmail, verifyPassword } from "@/lib/customer-auth";
import { createMelhorEnvioShipment, getMelhorEnvioAccount } from "@/lib/melhor-envio";

const COOKIE = "bea_conta";

export type ShopOrder = {
  orderId: string;
  email: string;
  name: string;
  phone: string;
  status: string;
  payment: string;
  items: Array<{ slug?: string; name: string; size?: string; qty: number; unitCents: number }>;
  totals: { subtotal: number; discount: number; shipping: number; total: number };
  address: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  shippingLabel: string;
  tracking: string;
  trackingUrl: string;
  shippingServiceId: number;
  meUuid: string;
  createdAt: string;
};

export type PersistOrderInput = {
  orderId: string;
  email: string;
  name: string;
  phone?: string;
  status: string;
  payment: string;
  items: ShopOrder["items"];
  totals: ShopOrder["totals"];
  address: ShopOrder["address"];
  shippingLabel?: string;
  shippingServiceId?: number;
};

const profileSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().optional().default(""),
  cep: z.string().trim().optional().default(""),
  street: z.string().trim().optional().default(""),
  number: z.string().trim().optional().default(""),
  complement: z.string().trim().optional().default(""),
  neighborhood: z.string().trim().optional().default(""),
  city: z.string().trim().optional().default(""),
  state: z.string().trim().optional().default(""),
  document: z.string().trim().optional().default(""),
});

function cookieSecret() {
  return process.env.ADMIN_PASSWORD?.trim() || "Be271003";
}

function signedEmail(email: string) {
  const value = email.trim().toLowerCase();
  const sig = createHmac("sha256", cookieSecret()).update(`conta:${value}`).digest("hex");
  return `${value}::${sig}`;
}

function readSignedEmail(raw: string) {
  const at = raw.lastIndexOf("::");
  if (at < 0) return "";
  const email = raw.slice(0, at);
  const sig = raw.slice(at + 2);
  const expected = createHmac("sha256", cookieSecret()).update(`conta:${email}`).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return "";
  return email;
}

async function cookieValue() {
  const { getRequest } = await import("@tanstack/react-start/server");
  const raw = getRequest().headers.get("cookie") ?? "";
  const match = raw.split(/;\s*/).find((part) => part.startsWith(`${COOKIE}=`));
  return match ? decodeURIComponent(match.slice(COOKIE.length + 1)) : "";
}

async function sessionEmail() {
  return readSignedEmail(await cookieValue());
}

async function ensureOrdersTable() {
  const sql = await getSql();
  await sql`
    create table if not exists orders (
      id serial primary key,
      order_id text not null unique,
      email text not null,
      name text not null,
      phone text not null default '',
      status text not null default 'pending',
      payment text not null default 'card',
      items jsonb not null default '[]'::jsonb,
      totals jsonb not null default '{}'::jsonb,
      address jsonb not null default '{}'::jsonb,
      shipping_label text not null default '',
      tracking text not null default '',
      tracking_url text not null default '',
      shipping_service_id integer not null default 0,
      me_uuid text not null default '',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
  await sql`alter table orders add column if not exists shipping_service_id integer not null default 0`;
  await sql`alter table orders add column if not exists me_uuid text not null default ''`;
  return sql;
}

function asJson<T>(value: unknown, fallback: T): T {
  if (value && typeof value === "object") return value as T;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function mapOrder(row: {
  order_id: string;
  email: string;
  name: string;
  phone: string;
  status: string;
  payment: string;
  items: unknown;
  totals: unknown;
  address: unknown;
  shipping_label: string;
  tracking: string;
  tracking_url: string;
  shipping_service_id?: number;
  me_uuid?: string;
  created_at: string | Date;
}): ShopOrder {
  return {
    orderId: row.order_id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    status: row.status,
    payment: row.payment,
    items: asJson(row.items, []),
    totals: asJson(row.totals, { subtotal: 0, discount: 0, shipping: 0, total: 0 }),
    address: asJson(row.address, {
      cep: "",
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
    }),
    shippingLabel: row.shipping_label,
    tracking: row.tracking,
    trackingUrl: row.tracking_url,
    shippingServiceId: row.shipping_service_id ?? 0,
    meUuid: row.me_uuid ?? "",
    createdAt: typeof row.created_at === "string" ? row.created_at : row.created_at.toISOString(),
  };
}

export function orderStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "Aguardando pagamento",
    paid: "Pagamento aprovado",
    posted: "Enviado",
    delivered: "Entregue",
    cancelled: "Cancelado",
    canceled: "Cancelado",
    demo: "Registrado",
  };
  return map[status] ?? status;
}

function phonesMatch(given: string, stored: string) {
  const a = digitsOnly(given);
  const b = digitsOnly(stored);
  if (a.length < 8 || b.length < 8) return false;
  return a.slice(-8) === b.slice(-8);
}

function cepsMatch(given: string, stored: string) {
  const a = digitsOnly(given);
  const b = digitsOnly(stored);
  return a.length === 8 && a === b;
}

export async function persistOrder(input: PersistOrderInput) {
  try {
    const sql = await ensureOrdersTable();
    await sql`
      insert into orders (
        order_id, email, name, phone, status, payment, items, totals, address, shipping_label, shipping_service_id, updated_at
      ) values (
        ${input.orderId},
        ${input.email.trim().toLowerCase()},
        ${input.name},
        ${input.phone ?? ""},
        ${input.status},
        ${input.payment},
        ${JSON.stringify(input.items)}::jsonb,
        ${JSON.stringify(input.totals)}::jsonb,
        ${JSON.stringify(input.address)}::jsonb,
        ${input.shippingLabel ?? ""},
        ${input.shippingServiceId ?? 0},
        now()
      )
      on conflict (order_id) do update set
        name = excluded.name,
        phone = case when excluded.phone = '' then orders.phone else excluded.phone end,
        status = excluded.status,
        payment = excluded.payment,
        items = excluded.items,
        totals = excluded.totals,
        address = excluded.address,
        shipping_label = case when excluded.shipping_label = '' then orders.shipping_label else excluded.shipping_label end,
        shipping_service_id = case when excluded.shipping_service_id = 0 then orders.shipping_service_id else excluded.shipping_service_id end,
        updated_at = now()
    `;
  } catch (error) {
    console.error("[orders] persist", error);
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  extra?: { tracking?: string; trackingUrl?: string },
) {
  if (!orderId) return;
  try {
    const sql = await ensureOrdersTable();
    const tracking = extra?.tracking ?? "";
    const trackingUrl = extra?.trackingUrl ?? "";
    await sql`
      update orders set
        status = ${status},
        tracking = case when ${tracking} = '' then tracking else ${tracking} end,
        tracking_url = case when ${trackingUrl} = '' then tracking_url else ${trackingUrl} end,
        updated_at = now()
      where order_id = ${orderId}
    `;
  } catch (error) {
    console.error("[orders] status", error);
  }
}

export async function updateOrderTracking(update: {
  orderId?: string | null;
  tracking?: string | null;
  trackingUrl?: string | null;
  status: string;
}) {
  const statusKey = update.status.replace(/^order\./, "").toLowerCase();
  const mapped =
    statusKey === "delivered"
      ? "delivered"
      : statusKey === "posted" || statusKey === "generated"
        ? "posted"
        : statusKey === "cancelled" || statusKey === "canceled"
          ? "cancelled"
          : "";
  try {
    const sql = await ensureOrdersTable();
    const tracking = update.tracking ?? "";
    const trackingUrl = update.trackingUrl ?? "";
    const orderId = update.orderId ?? "";
    if (orderId) {
      await sql`
        update orders set
          status = case when ${mapped} = '' then status else ${mapped} end,
          tracking = case when ${tracking} = '' then tracking else ${tracking} end,
          tracking_url = case when ${trackingUrl} = '' then tracking_url else ${trackingUrl} end,
          updated_at = now()
        where order_id = ${orderId}
      `;
      return;
    }
    if (tracking) {
      await sql`
        update orders set
          status = case when ${mapped} = '' then status else ${mapped} end,
          tracking = ${tracking},
          tracking_url = case when ${trackingUrl} = '' then tracking_url else ${trackingUrl} end,
          updated_at = now()
        where tracking = ${tracking} or order_id = ${tracking}
      `;
    }
  } catch (error) {
    console.error("[orders] tracking", error);
  }
}

export const openAccount = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().trim().email(),
      password: z.string().optional().default(""),
      phone: z.string().trim().optional().default(""),
      cep: z.string().trim().optional().default(""),
    }),
  )
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    let customer: Customer | null = null;
    try {
      customer = await getCustomerByEmail(email);
    } catch (error) {
      console.error("[conta] customer", error);
    }

    let orders: ShopOrder[] = [];
    try {
      const sql = await ensureOrdersTable();
      const rows = await sql<Parameters<typeof mapOrder>[0]>`
        select * from orders where email = ${email} order by created_at desc
      `;
      orders = rows.map(mapOrder);
    } catch (error) {
      console.error("[conta] orders", error);
    }

    if (!customer && orders.length === 0) {
      return { ok: false as const, message: "Não encontramos cadastro com este e-mail." };
    }

    const storedHash = customer ? await getPasswordHash(email) : "";
    if (data.password) {
      if (!storedHash) {
        return {
          ok: false as const,
          message: "Este e-mail ainda não tem senha. Use o primeiro acesso ou recupere a senha.",
        };
      }
      if (!(await verifyPassword(data.password, storedHash))) {
        return { ok: false as const, message: "E-mail ou senha incorretos." };
      }
    } else {
      if (storedHash) {
        return { ok: false as const, message: "Informe a senha da conta." };
      }
      const storedPhone = customer?.phone || orders[0]?.phone || "";
      const storedCep = customer?.cep || orders[0]?.address.cep || "";
      const phoneOk = data.phone ? phonesMatch(data.phone, storedPhone) : false;
      const cepOk = data.cep ? cepsMatch(data.cep, storedCep) : false;
      if (!phoneOk && !cepOk) {
        return {
          ok: false as const,
          message: "Confira o WhatsApp ou o CEP usados no cadastro.",
        };
      }
    }

    const { setCookie } = await import("@tanstack/react-start/server");
    setCookie(COOKIE, signedEmail(email), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 14,
    });
    return {
      ok: true as const,
      customer,
      orders,
      hasPassword: Boolean(storedHash),
    };
  });

export const getAccount = createServerFn({ method: "GET" }).handler(async () => {
  const email = await sessionEmail();
  if (!email) {
    return {
      ok: false as const,
      customer: null,
      orders: [] as ShopOrder[],
      hasPassword: false,
    };
  }
  let customer: Customer | null = null;
  try {
    customer = await getCustomerByEmail(email);
  } catch (error) {
    console.error("[conta] session customer", error);
  }
  let orders: ShopOrder[] = [];
  try {
    const sql = await ensureOrdersTable();
    const rows = await sql<Parameters<typeof mapOrder>[0]>`
      select * from orders where email = ${email} order by created_at desc
    `;
    orders = rows.map(mapOrder);
  } catch (error) {
    console.error("[conta] session orders", error);
  }
  const hasPassword = Boolean(await getPasswordHash(email));
  return { ok: true as const, customer, orders, hasPassword };
});

export const getShopSession = createServerFn({ method: "GET" }).handler(async () => {
  const email = await sessionEmail();
  if (!email) return { ok: false as const, name: "", email: "" };
  try {
    const customer = await getCustomerByEmail(email);
    return { ok: true as const, name: customer?.name || "", email };
  } catch {
    return { ok: true as const, name: "", email };
  }
});

export const closeAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { setCookie } = await import("@tanstack/react-start/server");
  setCookie(COOKIE, "", { path: "/", httpOnly: true, sameSite: "lax", maxAge: 0 });
  return { ok: true as const };
});

export const updateAccount = createServerFn({ method: "POST" })
  .validator(profileSchema)
  .handler(async ({ data }) => {
    const email = await sessionEmail();
    if (!email) return { ok: false as const, message: "Entre de novo para salvar." };
    try {
      const customer = await upsertCustomer({ ...data, email, source: "cadastro" });
      return { ok: true as const, customer };
    } catch (error) {
      console.error("[conta] update", error);
      return { ok: false as const, message: "Não foi possível salvar agora." };
    }
  });

export const changeAccountPassword = createServerFn({ method: "POST" })
  .validator(
    z.object({
      current: z.string().optional().default(""),
      password: z.string().min(6),
    }),
  )
  .handler(async ({ data }) => {
    const email = await sessionEmail();
    if (!email) return { ok: false as const, message: "Entre de novo para salvar." };
    const stored = await getPasswordHash(email);
    if (stored) {
      if (!data.current || !(await verifyPassword(data.current, stored))) {
        return { ok: false as const, message: "A senha atual não confere." };
      }
    }
    try {
      await setPasswordForEmail(email, data.password);
      return { ok: true as const };
    } catch (error) {
      console.error("[conta] password", error);
      return { ok: false as const, message: "Não foi possível salvar a senha." };
    }
  });

export const listAdminOrders = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await isAdmin())) {
    return { ok: false as const, orders: [] as ShopOrder[] };
  }
  try {
    const sql = await ensureOrdersTable();
    const rows = await sql<Parameters<typeof mapOrder>[0]>`
      select * from orders order by created_at desc, id desc
    `;
    return { ok: true as const, orders: rows.map(mapOrder) };
  } catch (error) {
    console.error("[orders] admin list", error);
    return { ok: true as const, orders: [] as ShopOrder[] };
  }
});

export async function sendPaidOrderToMelhorEnvio(orderId: string, extraDocument = "") {
  try {
    const sql = await ensureOrdersTable();
    const rows = await sql<Parameters<typeof mapOrder>[0]>`
      select * from orders where order_id = ${orderId} limit 1
    `;
    const order = rows[0] ? mapOrder(rows[0]) : null;
    if (!order) return { ok: false as const, message: "Pedido não encontrado." };
    if (order.meUuid) return { ok: true as const, uuid: order.meUuid };
    let document = extraDocument;
    if (!document) {
      const customer = await getCustomerByEmail(order.email).catch(() => null);
      document = customer?.document ?? "";
    }
    const result = await createMelhorEnvioShipment({
      orderId: order.orderId,
      serviceId: order.shippingServiceId,
      name: order.name,
      email: order.email,
      phone: order.phone,
      address: order.address,
      items: order.items,
      document,
    });
    if (!result.ok) return result;
    await sql`
      update orders set
        me_uuid = ${result.uuid},
        tracking = case when ${result.tracking} = '' then tracking else ${result.tracking} end,
        tracking_url = case when ${result.trackingUrl} = '' then tracking_url else ${result.trackingUrl} end,
        updated_at = now()
      where order_id = ${orderId}
    `;
    return result;
  } catch (error) {
    console.error("[orders] melhor-envio", error);
    return { ok: false as const, message: "Não foi possível enviar ao Melhor Envio." };
  }
}

export const getMelhorEnvioStatus = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await isAdmin())) return { ready: false, name: "", email: "" };
  return getMelhorEnvioAccount();
});

export const adminSendToMelhorEnvio = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId: z.string().min(3),
      document: z.string().optional().default(""),
    }),
  )
  .handler(async ({ data }) => {
    if (!(await isAdmin())) {
      return { ok: false as const, message: "Entre de novo." };
    }
    return sendPaidOrderToMelhorEnvio(data.orderId, data.document);
  });
