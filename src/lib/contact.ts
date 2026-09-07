import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { isAdmin } from "@/lib/customers";
import { sendInboxMail } from "@/lib/send-mail";

export const CONTACT_EMAIL = "beabsorventes@gmail.com";
export const CONTACT_PHONE_DISPLAY = "+55 11 99589-5103";
export const CONTACT_PHONE_E164 = "5511995895103";
export const CONTACT_WHATSAPP = `https://wa.me/${CONTACT_PHONE_E164}`;

export function mailToUrl(subject = "Contato beabsorventes", body = "") {
  const parts = [`subject=${encodeURIComponent(subject)}`];
  if (body.trim()) parts.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${CONTACT_EMAIL}?${parts.join("&")}`;
}

export const CONTACT_TOPICS = [
  "Dúvida sobre modelos",
  "Acompanhar pedido",
  "Troca ou ajuste",
  "Atacado",
  "Outro assunto",
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export function whatsappMessageUrl(input: {
  name: string;
  email: string;
  phone?: string;
  topic: string;
  message: string;
}) {
  const lines = [
    `Olá, sou ${input.name}.`,
    `E-mail: ${input.email}`,
    input.phone ? `Telefone: ${input.phone}` : null,
    `Assunto: ${input.topic}`,
    "",
    input.message,
  ].filter((line): line is string => line !== null);

  return `https://api.whatsapp.com/send?phone=${CONTACT_PHONE_E164}&text=${encodeURIComponent(lines.join("\n"))}`;
}

export type ContactMessage = {
  id: number;
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  createdAt: string;
};

async function ensureContactTable() {
  const sql = await getSql();
  await sql`
    create table if not exists contact_messages (
      id serial primary key,
      name text not null,
      email text not null,
      phone text not null default '',
      topic text not null default '',
      message text not null,
      created_at timestamptz not null default now()
    )
  `;
  return sql;
}

const contactSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().optional().default(""),
  topic: z.string().trim().min(2),
  message: z.string().trim().min(10),
});

export const sendContactMessage = createServerFn({ method: "POST" })
  .validator(contactSchema)
  .handler(async ({ data }) => {
    let saved = false;
    try {
      const sql = await ensureContactTable();
      await sql`
        insert into contact_messages (name, email, phone, topic, message)
        values (
          ${data.name},
          ${data.email.toLowerCase()},
          ${data.phone},
          ${data.topic},
          ${data.message}
        )
      `;
      saved = true;
    } catch (error) {
      console.error("[contact] persist", error);
    }

    const mailed = await sendInboxMail({
      subject: `Contato beabsorventes · ${data.topic}`,
      replyTo: data.email,
      fields: {
        Nome: data.name,
        Email: data.email,
        WhatsApp: data.phone || "não informado",
        Assunto: data.topic,
        Mensagem: data.message,
      },
    });

    if (!saved && !mailed) {
      return { ok: false as const, mailed: false, message: "Não foi possível enviar agora." };
    }
    return { ok: true as const, mailed };
  });

export const listContactMessages = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await isAdmin())) {
    return { ok: false as const, messages: [] as ContactMessage[] };
  }
  try {
    const sql = await ensureContactTable();
    const rows = await sql<{
      id: number;
      name: string;
      email: string;
      phone: string;
      topic: string;
      message: string;
      created_at: string | Date;
    }>`
      select * from contact_messages order by created_at desc, id desc
    `;
    return {
      ok: true as const,
      messages: rows.map((row) => ({
        id: Number(row.id),
        name: row.name,
        email: row.email,
        phone: row.phone,
        topic: row.topic,
        message: row.message,
        createdAt:
          typeof row.created_at === "string" ? row.created_at : row.created_at.toISOString(),
      })),
    };
  } catch (error) {
    console.error("[contact] list", error);
    return { ok: true as const, messages: [] as ContactMessage[] };
  }
});

export const adminDeleteContactMessage = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    if (!(await isAdmin())) {
      return { ok: false as const, message: "Entre de novo." };
    }
    try {
      const sql = await ensureContactTable();
      await sql`delete from contact_messages where id = ${data.id}`;
      return { ok: true as const };
    } catch (error) {
      console.error("[contact] delete", error);
      return { ok: false as const, message: "Não foi possível excluir esta mensagem." };
    }
  });
