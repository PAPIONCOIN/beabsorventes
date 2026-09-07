import { createHmac, timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import {
  getCustomerByEmail,
  upsertCustomer,
  type Customer,
} from "@/lib/customers";
import { digitsOnly } from "@/lib/utils";

const COOKIE = "bea_conta";

export type ShopOrder = {
  orderId: string;
  email: string;
  name: string;
  phone: string;
  status: string;
  payment: string;
  items: Array<{ name: string; size?: string; qty: number; unitCents: number }>;
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
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
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
        order_id, email, name, phone, status, payment, items, totals, address, shipping_label, updated_at
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

    const storedPhone = customer?.phone || orders[0]?.phone || "";
    const storedCep = customer?.cep || orders[0]?.address.cep || "";
    const phoneOk = data.phone ? phonesMatch(data.phone, storedPhone) : false;
    const cepOk = data.cep ? cepsMatch(data.cep, storedCep) : false;
    if (!customer && orders.length === 0) {
      return { ok: false as const, message: "Não encontramos cadastro com este e-mail." };
    }
    if (!phoneOk && !cepOk) {
      return {
        ok: false as const,
        message: "Confira o WhatsApp ou o CEP usados no cadastro.",
      };
    }

    const { setCookie } = await import("@tanstack/react-start/server");
    setCookie(COOKIE, signedEmail(email), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 14,
    });
    return { ok: true as const, customer, orders };
  });

export const getAccount = createServerFn({ method: "GET" }).handler(async () => {
  const email = await sessionEmail();
  if (!email) return { ok: false as const, customer: null, orders: [] as ShopOrder[] };
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
  return { ok: true as const, customer, orders };
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
