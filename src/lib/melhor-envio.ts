import { CONTACT_EMAIL } from "@/lib/contact";
import { getProduct, shipBoxFor } from "@/lib/products";
import { FREE_SHIPPING_FROM } from "@/lib/utils";
import type { CartLine } from "@/lib/cart-store";
import { ORIGIN_CEP } from "@/lib/origin-cep";
export type ShippingQuote = {
  serviceId: number;
  name: string;
  company: string;
  priceCents: number;
  days: number;
};

type MeQuote = {
  id?: number;
  name?: string;
  company?: { name?: string };
  price?: string | number;
  custom_price?: string | number;
  delivery_time?: number;
  custom_delivery_time?: number;
  error?: string;
};

function meBase() {
  return process.env.MELHOR_ENVIO_SANDBOX === "true"
    ? "https://sandbox.melhorenvio.com.br/api/v2"
    : "https://www.melhorenvio.com.br/api/v2";
}

function meToken() {
  return process.env.MELHOR_ENVIO_TOKEN?.trim() ?? "";
}

function fromCep() {
  return (process.env.MELHOR_ENVIO_FROM_CEP ?? ORIGIN_CEP).replace(/\D/g, "").slice(0, 8);
}

export function quoteProducts(items: CartLine[]) {
  const products: {
    id: string;
    width: number;
    height: number;
    length: number;
    weight: number;
    insurance_value: number;
    quantity: number;
  }[] = [];

  for (const item of items) {
    const product = getProduct(item.slug);
    if (!product) continue;
    const parts = product.contents?.length
      ? product.contents.map((row) => ({
          slug: row.slug,
          qty: row.qty * item.qty,
          unitCents: getProduct(row.slug)?.priceCents ?? 0,
        }))
      : [{ slug: product.slug, qty: item.qty, unitCents: product.priceCents }];

    for (const part of parts) {
      const box = shipBoxFor(part.slug);
      if (!box) continue;
      products.push({
        id: part.slug,
        width: Math.max(1, Math.round(box.width)),
        height: Math.max(1, Math.round(box.height)),
        length: Math.max(1, Math.round(box.length)),
        weight: Math.max(0.1, box.weightKg),
        insurance_value: Number((part.unitCents / 100).toFixed(2)),
        quantity: part.qty,
      });
    }
  }
  return products;
}

function parseQuotes(data: unknown): ShippingQuote[] {
  if (!Array.isArray(data)) return [];
  const quotes: ShippingQuote[] = [];
  for (const raw of data as MeQuote[]) {
    if (!raw || raw.error || typeof raw.id !== "number") continue;
    const price = Number(raw.custom_price ?? raw.price);
    const days = Number(raw.custom_delivery_time ?? raw.delivery_time);
    if (!Number.isFinite(price) || price <= 0) continue;
    quotes.push({
      serviceId: raw.id,
      name: raw.name ?? "Frete",
      company: raw.company?.name ?? "Transportadora",
      priceCents: Math.round(price * 100),
      days: Number.isFinite(days) ? Math.max(1, Math.round(days)) : 8,
    });
  }
  quotes.sort((a, b) => a.priceCents - b.priceCents);
  return quotes.slice(0, 5);
}

export async function fetchMelhorEnvioQuotes(
  destinationCep: string,
  items: CartLine[],
): Promise<ShippingQuote[]> {
  const token = meToken();
  const origin = fromCep();
  const products = quoteProducts(items);
  if (!token || origin.length !== 8 || products.length === 0) return [];

  const response = await fetch(`${meBase()}/me/shipment/calculate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": `Beabsorventes (${CONTACT_EMAIL})`,
    },
    body: JSON.stringify({
      from: { postal_code: origin },
      to: { postal_code: destinationCep.replace(/\D/g, "").slice(0, 8) },
      products,
      options: {
        receipt: false,
        own_hand: false,
        insurance_value: products.reduce(
          (sum, item) => sum + item.insurance_value * item.quantity,
          0,
        ),
      },
    }),
  });

  if (!response.ok) {
    console.error("[melhor-envio] calculate", response.status, await response.text());
    return [];
  }
  return parseQuotes(await response.json());
}

export function shippingPayable(subtotalCents: number, quoteCents: number) {
  if (subtotalCents >= FREE_SHIPPING_FROM) return 0;
  return quoteCents;
}