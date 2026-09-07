import { CONTACT_EMAIL } from "@/lib/contact";

export type OrderMailItem = {
  name: string;
  size: string;
  qty: number;
  unitCents: number;
};

export type OrderMailInput = {
  orderId: string;
  status: string;
  name: string;
  email: string;
  phone?: string;
  payment: "pix" | "card" | string;
  items: OrderMailItem[];
  shippingLabel: string;
  totals: {
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
  };
  address: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
};

function money(cents: number) {
  return (Number(cents) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatCep(cep: string) {
  const d = cep.replace(/\D/g, "");
  if (d.length === 8) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return cep;
}

export function orderMailFields(input: OrderMailInput) {
  const items = input.items
    .map(
      (item) =>
        `${item.qty}× ${item.name}${item.size ? ` (${item.size})` : ""} — ${money(item.unitCents * item.qty)}`,
    )
    .join("\n");
  const cep = formatCep(input.address.cep);
  const endereco = [
    `${input.address.street}, ${input.address.number}`,
    input.address.complement,
    input.address.neighborhood,
    `${input.address.city} / ${input.address.state}`,
    `CEP ${cep}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    _subject: `Pedido ${input.orderId} — beabsorventes`,
    _template: "box",
    _captcha: "false",
    _replyto: input.email,
    Pedido: input.orderId,
    Status: input.status,
    Cliente: input.name,
    Email: input.email,
    Telefone: input.phone?.trim() || "não informado",
    Pagamento:
      input.payment === "pix"
        ? "PIX (5% de desconto)"
        : input.payment === "card"
          ? "Cartão em até 3 vezes"
          : String(input.payment),
    Endereco: endereco,
    CEP: cep,
    Itens: items || "—",
    Frete: `${input.shippingLabel} — ${input.totals.shipping === 0 ? "Grátis" : money(input.totals.shipping)}`,
    Subtotal: money(input.totals.subtotal),
    Desconto: money(input.totals.discount),
    Total: money(input.totals.total),
  };
}

export async function sendOrderMail(input: OrderMailInput) {
  const fields = orderMailFields(input);
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    body.append(key, value);
  }

  const res = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Falha ao enviar e-mail do pedido (${res.status}) ${detail}`);
  }
  return true;
}
