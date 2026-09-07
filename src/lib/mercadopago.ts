import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CONTACT_EMAIL } from "@/lib/contact";
import { getProduct, PRINTS } from "@/lib/products";
import { cartTotals, type CartLine } from "@/lib/cart-store";
import { fetchMelhorEnvioQuotes, shippingPayable } from "@/lib/melhor-envio";
import { shippingFor } from "@/lib/utils";

const itemSchema = z.object({
  slug: z.string().min(1),
  printId: z.string().min(1),
  size: z.string().min(1),
  qty: z.number().int().positive(),
});

const checkoutSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  cep: z.string().regex(/^\d{8}$/),
  street: z.string().trim().min(2),
  number: z.string().trim().min(1),
  complement: z.string().trim(),
  neighborhood: z.string().trim().min(2),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2).max(2),
  payment: z.enum(["pix", "card"]),
  items: z.array(itemSchema).min(1),
  shippingServiceId: z.number().int().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

function newOrderId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `BEA-${suffix}`;
}

function money(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

async function requestOrigin() {
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

function pricedItems(items: CartLine[]) {
  const lines = [];
  for (const item of items) {
    const product = getProduct(item.slug);
    if (!product) continue;
    const print = PRINTS[item.printId as keyof typeof PRINTS];
    lines.push({
      slug: item.slug,
      name: product.name,
      printId: item.printId,
      printName: print?.name ?? item.printId,
      size: item.size,
      qty: item.qty,
      unitCents: product.priceCents,
    });
  }
  return lines;
}

type PricedLine = ReturnType<typeof pricedItems>[number];

async function resolveShipping(
  items: CartLine[],
  cep: string,
  serviceId: number | undefined,
) {
  const subtotal = cartTotals(items, "card", 0).subtotal;
  try {
    const quotes = await fetchMelhorEnvioQuotes(cep, items);
    const chosen =
      quotes.find((quote) => quote.serviceId === serviceId) ?? quotes[0];
    if (chosen) {
      return {
        cents: shippingPayable(subtotal, chosen.priceCents),
        label: `${chosen.company} ${chosen.name} · ${chosen.days} dia${chosen.days === 1 ? "" : "s"} úteis`,
      };
    }
  } catch (error) {
    console.error("[shipping]", error);
  }
  return {
    cents: shippingFor(subtotal),
    label: "Correios PAC",
  };
}

async function notifyMerchant(input: {
  orderId: string;
  name: string;
  email: string;
  payment: "pix" | "card";
  items: PricedLine[];
  totals: ReturnType<typeof cartTotals>;
  shippingLabel: string;
  address: {
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  status: "pago_pendente" | "demonstracao";
}) {
  const itemsText = input.items
    .map(
      (item) =>
        `${item.qty}× ${item.name} (${item.size}) — ${money(item.unitCents * item.qty)}`,
    )
    .join("\n");
  const cep = input.address.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2");
  const address = [
    `${input.address.street}, ${input.address.number}`,
    input.address.complement,
    input.address.neighborhood,
    `${input.address.city} / ${input.address.state}`,
    `CEP ${cep}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        _subject: `Novo pedido ${input.orderId} — beabsorventes`,
        _template: "box",
        _captcha: "false",
        Pedido: input.orderId,
        Status: input.status === "demonstracao" ? "Teste (sem Mercado Pago)" : "Aguardando pagamento",
        Cliente: input.name,
        Email: input.email,
        Pagamento: input.payment === "pix" ? "PIX (5% de desconto)" : "Cartão em até 3×",
        Endereco: address,
        Itens: itemsText,
        Frete: `${input.shippingLabel} — ${input.totals.shipping === 0 ? "Grátis" : money(input.totals.shipping)}`,
        Subtotal: money(input.totals.subtotal),
        Desconto: money(input.totals.discount),
        Total: money(input.totals.total),
      }),
    });
    if (!res.ok) {
      console.error("[order-notify] formsubmit", res.status, await res.text());
    }
  } catch (error) {
    console.error("[order-notify]", error);
  }
}

export const getMercadoPagoStatus = createServerFn({ method: "GET" }).handler(
  async () => {
    return { ready: Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN) };
  },
);

export const createMpCheckout = createServerFn({ method: "POST" })
  .validator(checkoutSchema)
  .handler(async ({ data }) => {
    const lines = pricedItems(data.items);
    if (lines.length === 0) {
      return {
        ok: false as const,
        reason: "empty" as const,
        orderId: newOrderId(),
        items: [],
        totals: cartTotals([], data.payment, 0),
        message: "Sua sacola tem peças que saíram do catálogo. Volte à loja e escolha de novo.",
      };
    }
    const shipping = await resolveShipping(
      data.items,
      data.cep,
      data.shippingServiceId,
    );
    const totals = cartTotals(data.items, data.payment, shipping.cents);
    const orderId = newOrderId();
    const address = {
      cep: data.cep,
      street: data.street,
      number: data.number,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
    };
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!token) {
      await notifyMerchant({
        orderId,
        name: data.name,
        email: data.email,
        payment: data.payment,
        items: lines,
        totals,
        address,
        shippingLabel: shipping.label,
        status: "demonstracao",
      });
      return {
        ok: false as const,
        reason: "missing_token" as const,
        orderId,
        items: lines,
        totals,
        message:
          "Adicione a variável MERCADOPAGO_ACCESS_TOKEN para habilitar o pagamento com Mercado Pago.",
      };
    }

    const origin = await requestOrigin();
    const itemSummary = lines
      .map((item) => `${item.qty}× ${item.name}`)
      .join(", ");
    const preference = {
      external_reference: orderId,
      items: [
        {
          id: orderId,
          title: `Pedido Beabsorventes ${orderId}`,
          description: itemSummary.slice(0, 250),
          quantity: 1,
          currency_id: "BRL",
          unit_price: Number((totals.total / 100).toFixed(2)),
        },
      ],
      payer: {
        name: data.name,
        email: data.email,
        address: {
          zip_code: data.cep.replace(/\D/g, ""),
          street_name: data.street,
          street_number: data.number,
        },
      },
      back_urls: {
        success: `${origin}/pedido?status=success`,
        pending: `${origin}/pedido?status=pending`,
        failure: `${origin}/checkout`,
      },
      auto_return: "approved",
      statement_descriptor: "BEABSORVENTES",
      payment_methods:
        data.payment === "pix"
          ? {
              excluded_payment_types: [
                { id: "credit_card" },
                { id: "debit_card" },
                { id: "ticket" },
                { id: "atm" },
              ],
            }
          : {
              excluded_payment_types: [{ id: "ticket" }, { id: "atm" }],
            },
      metadata: {
        orderId,
        payment: data.payment,
        items: itemSummary,
        address: `${data.street}, ${data.number} — ${data.neighborhood}, ${data.city}/${data.state} CEP ${data.cep}`,
        shipping: shipping.label,
      },
    };

    const response = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preference),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error("[mercadopago] preference failed", response.status, detail);
      return {
        ok: false as const,
        reason: "gateway" as const,
        orderId,
        items: lines,
        totals,
        message:
          "Não foi possível abrir o Mercado Pago agora. Tente de novo em alguns minutos.",
      };
    }

    const body = (await response.json()) as {
      init_point?: string;
      sandbox_init_point?: string;
    };
    const url = body.init_point || body.sandbox_init_point;
    if (!url) {
      return {
        ok: false as const,
        reason: "gateway" as const,
        orderId,
        items: lines,
        totals,
        message: "O Mercado Pago não devolveu um endereço de pagamento.",
      };
    }

    await notifyMerchant({
      orderId,
      name: data.name,
      email: data.email,
      payment: data.payment,
      items: lines,
      totals,
      address,
      shippingLabel: shipping.label,
      status: "pago_pendente",
    });

    return {
      ok: true as const,
      orderId,
      url,
      items: lines,
      totals,
    };
  });
