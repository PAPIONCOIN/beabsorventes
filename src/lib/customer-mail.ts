import { CONTACT_EMAIL } from "@/lib/contact";

export type CustomerMailInput = {
  name: string;
  email: string;
  phone?: string;
  cep?: string;
  city?: string;
  state?: string;
  source?: string;
};

export async function sendCustomerMail(input: CustomerMailInput) {
  const body = new FormData();
  body.append("_subject", `Novo cadastro — ${input.name}`);
  body.append("_template", "box");
  body.append("_captcha", "false");
  body.append("_replyto", input.email);
  body.append("Nome", input.name);
  body.append("Email", input.email);
  body.append("WhatsApp", input.phone?.trim() || "não informado");
  body.append("CEP", input.cep?.trim() || "—");
  body.append("Cidade", [input.city, input.state].filter(Boolean).join("/") || "—");
  body.append("Origem", input.source === "checkout" ? "Compra" : "Cadastro no site");

  const res = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Falha ao avisar o cadastro (${res.status})`);
  }
}
