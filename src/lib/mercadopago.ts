import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getProduct, PRINTS } from "@/lib/products";
import { cartTotals, type CartLine } from "@/lib/cart-store";

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
        totals: cartTotals([], data.payment),
        message: "Sua sacola tem peças que saíram do catálogo. Volte à loja e escolha de novo.",
      };
    }
    const totals = cartTotals(data.items, data.payment);
    const orderId = newOrderId();
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!token) {
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
    const preference = {
      external_reference: orderId,
      items: [
        {
          id: orderId,
          title: `Pedido Beabsorventes ${orderId}`,
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

    return {
      ok: true as const,
      orderId,
      url,
      items: lines,
      totals,
    };
  });
