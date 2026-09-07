import { createHmac, timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";

const COOKIE = "bea_admin";

export type Customer = {
  id: number;
  email: string;
  name: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  source: string;
  createdAt: string;
  updatedAt: string;
};

const customerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().optional().default(""),
  cep: z.string().trim().optional().default(""),
  street: z.string().trim().optional().default(""),
  number: z.string().trim().optional().default(""),
  complement: z.string().trim().optional().default(""),
  neighborhood: z.string().trim().optional().default(""),
  city: z.string().trim().optional().default(""),
  state: z.string().trim().optional().default(""),
  source: z.enum(["cadastro", "checkout"]).optional().default("cadastro"),
});

function expectedPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || "Be271003";
}

function expectedEmail() {
  return (process.env.ADMIN_EMAIL?.trim() || "beabsorventes@gmail.com").toLowerCase();
}

function cookieSecret() {
  return expectedPassword();
}

function signedToken() {
  return createHmac("sha256", cookieSecret()).update("admin-ok").digest("hex");
}

function equal(a: string, b: string) {
  const left = createHmac("sha256", cookieSecret()).update(a).digest();
  const right = createHmac("sha256", cookieSecret()).update(b).digest();
  return timingSafeEqual(left, right);
}

async function cookieValue() {
  const { getRequest } = await import("@tanstack/react-start/server");
  const raw = getRequest().headers.get("cookie") ?? "";
  const match = raw.split(/;\s*/).find((part) => part.startsWith(`${COOKIE}=`));
  return match ? decodeURIComponent(match.slice(COOKIE.length + 1)) : "";
}

async function isAdmin() {
  const value = await cookieValue();
  return Boolean(value) && equal(value, signedToken());
}

function mapRow(row: {
  id: number;
  email: string;
  name: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  source: string;
  created_at: string | Date;
  updated_at: string | Date;
}): Customer {
  return {
    id: Number(row.id),
    email: row.email,
    name: row.name,
    phone: row.phone,
    cep: row.cep,
    street: row.street,
    number: row.number,
    complement: row.complement,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    source: row.source,
    createdAt: typeof row.created_at === "string" ? row.created_at : row.created_at.toISOString(),
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : row.updated_at.toISOString(),
  };
}

export async function upsertCustomer(input: z.infer<typeof customerSchema>) {
  const data = customerSchema.parse(input);
  const sql = await getSql();
  await sql`
    create table if not exists customers (
      id serial primary key,
      email text not null unique,
      name text not null,
      phone text not null default '',
      cep text not null default '',
      street text not null default '',
      number text not null default '',
      complement text not null default '',
      neighborhood text not null default '',
      city text not null default '',
      state text not null default '',
      source text not null default 'cadastro',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
  const rows = await sql<Parameters<typeof mapRow>[0]>`
    insert into customers (
      email, name, phone, cep, street, number, complement, neighborhood, city, state, source, updated_at
    ) values (
      ${data.email.toLowerCase()},
      ${data.name},
      ${data.phone},
      ${data.cep.replace(/\D/g, "").slice(0, 8)},
      ${data.street},
      ${data.number},
      ${data.complement},
      ${data.neighborhood},
      ${data.city},
      ${data.state.toUpperCase().slice(0, 2)},
      ${data.source},
      now()
    )
    on conflict (email) do update set
      name = excluded.name,
      phone = case when excluded.phone = '' then customers.phone else excluded.phone end,
      cep = case when excluded.cep = '' then customers.cep else excluded.cep end,
      street = case when excluded.street = '' then customers.street else excluded.street end,
      number = case when excluded.number = '' then customers.number else excluded.number end,
      complement = case when excluded.complement = '' then customers.complement else excluded.complement end,
      neighborhood = case when excluded.neighborhood = '' then customers.neighborhood else excluded.neighborhood end,
      city = case when excluded.city = '' then customers.city else excluded.city end,
      state = case when excluded.state = '' then customers.state else excluded.state end,
      source = customers.source,
      updated_at = now()
    returning *
  `;
  const row = rows[0];
  return row ? mapRow(row) : null;
}

export async function getCustomerByEmail(email: string) {
  const sql = await getSql();
  const rows = await sql<Parameters<typeof mapRow>[0]>`
    select * from customers where email = ${email.trim().toLowerCase()} limit 1
  `;
  return rows[0] ? mapRow(rows[0]) : null;
}

export const registerCustomer = createServerFn({ method: "POST" })
  .validator(customerSchema)
  .handler(async ({ data }) => {
    try {
      const customer = await upsertCustomer({ ...data, source: "cadastro" });
      return { ok: true as const, customer };
    } catch (error) {
      console.error("[customers] register", error);
      return { ok: true as const, customer: null };
    }
  });

export const saveCheckoutCustomer = createServerFn({ method: "POST" })
  .validator(customerSchema)
  .handler(async ({ data }) => {
    await upsertCustomer({ ...data, source: data.source ?? "checkout" });
    return { ok: true as const };
  });

export const adminLogin = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().trim().email(),
      password: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const emailOk = equal(data.email.trim().toLowerCase(), expectedEmail());
    const passwordOk = equal(data.password, expectedPassword());
    if (!emailOk || !passwordOk) {
      return { ok: false as const, message: "E-mail ou senha incorretos." };
    }
    const { setCookie } = await import("@tanstack/react-start/server");
    setCookie(COOKIE, signedToken(), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { setCookie } = await import("@tanstack/react-start/server");
  setCookie(COOKIE, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
  });
  return { ok: true as const };
});

export const getAdminSession = createServerFn({ method: "GET" }).handler(async () => {
  return { ok: await isAdmin() };
});

export const listCustomers = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await isAdmin())) {
    return { ok: false as const, customers: [] as Customer[] };
  }
  try {
    const sql = await getSql();
    const rows = await sql<Parameters<typeof mapRow>[0]>`
      select * from customers order by created_at desc, id desc
    `;
    return { ok: true as const, customers: rows.map(mapRow) };
  } catch (error) {
    console.error("[customers] list", error);
    return { ok: true as const, customers: [] as Customer[] };
  }
});

export const getCustomerStoreStatus = createServerFn({ method: "GET" }).handler(
  async () => ({
    postgres: Boolean(process.env.DATABASE_URL?.trim()),
  }),
);
