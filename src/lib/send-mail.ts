import { CONTACT_EMAIL } from "@/lib/contact";

export const SITE_ORIGIN = "https://beabsorventes.com.br";

export type MailFields = Record<string, string>;

function origin() {
  return (process.env.SITE_URL ?? SITE_ORIGIN).replace(/\/$/, "");
}

function asText(fields: MailFields) {
  return Object.entries(fields)
    .filter(([key]) => !key.startsWith("_"))
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

async function sendResend(subject: string, replyTo: string, fields: MailFields) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return false;
  const from =
    process.env.RESEND_FROM?.trim() || "Beabsorventes <beth.t@example.com>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [CONTACT_EMAIL],
      reply_to: replyTo,
      subject,
      text: asText(fields),
    }),
  });
  if (!response.ok) {
    console.error("[mail] resend", response.status, await response.text());
    return false;
  }
  return true;
}

async function sendFormSubmit(subject: string, replyTo: string, fields: MailFields) {
  const site = origin();
  const response = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Origin: site,
      Referer: `${site}/contato`,
    },
    body: JSON.stringify({
      _subject: subject,
      _template: "box",
      _captcha: "false",
      _replyto: replyTo,
      ...fields,
    }),
  });
  const text = await response.text();
  let ok = response.ok;
  try {
    const parsed = JSON.parse(text) as { success?: boolean | string; message?: string };
    if (parsed.success === false || parsed.success === "false") ok = false;
    if (parsed.success === true || parsed.success === "true") ok = true;
    if (!ok) console.error("[mail] formsubmit", response.status, parsed.message || text.slice(0, 400));
  } catch {
    if (!ok) console.error("[mail] formsubmit", response.status, text.slice(0, 400));
  }
  return ok;
}

export async function sendInboxMail(input: {
  subject: string;
  replyTo: string;
  fields: MailFields;
}) {
  try {
    if (await sendResend(input.subject, input.replyTo, input.fields)) return true;
  } catch (error) {
    console.error("[mail] resend", error);
  }
  try {
    if (await sendFormSubmit(input.subject, input.replyTo, input.fields)) return true;
  } catch (error) {
    console.error("[mail] formsubmit", error);
  }
  return false;
}

export async function sendInboxMailFromBrowser(input: {
  subject: string;
  replyTo: string;
  fields: MailFields;
}) {
  const response = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      _subject: input.subject,
      _template: "box",
      _captcha: "false",
      _replyto: input.replyTo,
      ...input.fields,
    }),
  });
  const parsed = (await response.json().catch(() => ({}))) as {
    success?: boolean | string;
  };
  return (
    parsed.success === true ||
    parsed.success === "true" ||
    response.ok
  );
}
