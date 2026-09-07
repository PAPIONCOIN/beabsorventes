import { CONTACT_EMAIL } from "@/lib/contact";

export type CustomerMailInput = {
  name: string;
  email: string;
  phone?: string;
  document?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  source?: string;
};

export async function sendCustomerMail(input: CustomerMailInput) {
  const endereco = [
    [input.street, input.number].filter(Boolean).join(", "),
    input.complement,
    input.neighborhood,
    [input.city, input.state].filter(Boolean).join("/"),
    input.cep?.trim(),
  ]
    .filter(Boolean)
    .join(" — ");

  const body = new FormData();
  body.append("_subject", `Novo cadastro — ${input.name}`);
  body.append("_template", "box");
  body.append("_captcha", "false");
  body.append("_replyto", input.email);
  body.append("Nome", input.name);
  body.append("Email", input.email);
  body.append("WhatsApp", input.phone?.trim() || "não informado");
  body.append("CPF", input.document?.trim() || "não informado");
  body.append("Endereco", endereco || "não informado");
  body.append("CEP", input.cep?.trim() || "—");
  body.append("Rua", input.street?.trim() || "—");
  body.append("Numero", input.number?.trim() || "—");
  body.append("Complemento", input.complement?.trim() || "—");
  body.append("Bairro", input.neighborhood?.trim() || "—");
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
