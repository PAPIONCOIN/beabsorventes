import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { getCustomerByEmail } from "@/lib/customers";
import { digitsOnly } from "@/lib/utils";

const scrypt = promisify(scryptCb);

export async function ensurePasswordColumns() {
  const sql = await getSql();
  await sql`alter table customers add column if not exists password_hash text not null default ''`;
  await sql`alter table customers add column if not exists reset_token_hash text not null default ''`;
  await sql`alter table customers add column if not exists reset_expires timestamptz`;
  return sql;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scrypt(password, salt, 32)) as Buffer;
  return `${salt}:${buf.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const buf = (await scrypt(password, salt, 32)) as Buffer;
  const expected = Buffer.from(hash, "hex");
  if (buf.length !== expected.length) return false;
  return timingSafeEqual(buf, expected);
}

export async function getPasswordHash(email: string) {
  try {
    const sql = await ensurePasswordColumns();
    const rows = await sql<{ password_hash: string }>`
      select password_hash from customers where email = ${email.trim().toLowerCase()} limit 1
    `;
    return rows[0]?.password_hash ?? "";
  } catch (error) {
    console.error("[auth] hash", error);
    return "";
  }
}

export async function setPasswordForEmail(email: string, password: string) {
  const sql = await ensurePasswordColumns();
  const hash = await hashPassword(password);
  await sql`
    update customers set
      password_hash = ${hash},
      reset_token_hash = '',
      reset_expires = null,
      updated_at = now()
    where email = ${email.trim().toLowerCase()}
  `;
}

async function appOrigin() {
  const { getRequest } = await import("@tanstack/react-start/server");
  const request = getRequest();
  const url = new URL(request.url);
  const proto =
    request.headers.get("x-forwarded-proto") ??
    url.protocol.replace(":", "") ??
    "https";
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    url.host;
  return `${proto}://${host}`;
}

export const requestPasswordReset = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().trim().email() }))
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    const customer = await getCustomerByEmail(email).catch(() => null);
    if (!customer) {
      return { ok: true as const };
    }
    const token = randomBytes(24).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expires = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const sql = await ensurePasswordColumns();
    await sql`
      update customers set
        reset_token_hash = ${tokenHash},
        reset_expires = ${expires},
        updated_at = now()
      where email = ${email}
    `;
    const origin = await appOrigin();
    const link = `${origin}/conta/redefinir?token=${token}`;
    try {
      await fetch(`https://formsubmit.co/ajax/${email}`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: (() => {
          const body = new FormData();
          body.append("_subject", "Redefinir senha — beabsorventes");
          body.append("_template", "box");
          body.append("_captcha", "false");
          body.append(
            "mensagem",
            `Para criar uma nova senha, abra este link em até 2 horas:\n\n${link}\n\nSe você não pediu isso, ignore este e-mail.`,
          );
          return body;
        })(),
      });
    } catch (error) {
      console.error("[auth] reset-mail", error);
    }
    return { ok: true as const };
  });

export const resetPasswordWithToken = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(16),
      password: z.string().min(6),
    }),
  )
  .handler(async ({ data }) => {
    const tokenHash = createHash("sha256").update(data.token).digest("hex");
    const sql = await ensurePasswordColumns();
    const rows = await sql<{ email: string }>`
      select email from customers
      where reset_token_hash = ${tokenHash}
        and reset_expires is not null
        and reset_expires > now()
      limit 1
    `;
    const email = rows[0]?.email;
    if (!email) {
      return { ok: false as const, message: "Este link expirou. Peça um novo." };
    }
    await setPasswordForEmail(email, data.password);
    return { ok: true as const };
  });

export const resetPasswordWithIdentity = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().trim().email(),
      document: z.string().trim().optional().default(""),
      phone: z.string().trim().optional().default(""),
      password: z.string().min(6),
    }),
  )
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    const customer = await getCustomerByEmail(email).catch(() => null);
    if (!customer) {
      return { ok: false as const, message: "E-mail ou dados não conferem." };
    }
    const cpf = digitsOnly(data.document);
    const phone = digitsOnly(data.phone);
    const storedCpf = digitsOnly(customer.document);
    const storedPhone = digitsOnly(customer.phone);
    const cpfOk = cpf.length === 11 && storedCpf.length === 11 && cpf === storedCpf;
    const phoneOk =
      phone.length >= 10 &&
      storedPhone.length >= 10 &&
      phone.slice(-10) === storedPhone.slice(-10);
    if (!cpfOk && !phoneOk) {
      return {
        ok: false as const,
        message: "Informe o CPF ou o WhatsApp do cadastro.",
      };
    }
    try {
      await setPasswordForEmail(email, data.password);
      return { ok: true as const };
    } catch (error) {
      console.error("[auth] reset", error);
      return { ok: false as const, message: "Não foi possível salvar a senha agora." };
    }
  });
