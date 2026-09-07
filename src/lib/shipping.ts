import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getProduct } from "@/lib/products";
import { fetchCorreiosQuotes } from "@/lib/correios";
import {
  fetchMelhorEnvioQuotes,
  shippingPayable,
  type ShippingQuote,
} from "@/lib/melhor-envio";
import { FREE_SHIPPING_FROM } from "@/lib/utils";

const itemSchema = z.object({
  slug: z.string().min(1),
  printId: z.string().optional().default("padrao"),
  size: z.string().optional().default("Único"),
  qty: z.number().int().positive(),
});

export type QuotedShipping = ShippingQuote & { payableCents: number };

export function tableShippingQuotes(destinationCep: string): ShippingQuote[] {
  const prefix = Number(destinationCep.replace(/\D/g, "").slice(0, 2));
  let pac = 3290;
  let sedex = 4990;
  let pacDays = 10;
  let sedexDays = 4;
  if (prefix >= 1 && prefix <= 19) {
    pac = 1990;
    sedex = 2990;
    pacDays = 5;
    sedexDays = 2;
  } else if ((prefix >= 20 && prefix <= 28) || (prefix >= 30 && prefix <= 39)) {
    pac = 2490;
    sedex = 3890;
    pacDays = 7;
    sedexDays = 3;
  } else if (prefix >= 80 && prefix <= 89) {
    pac = 2890;
    sedex = 4290;
    pacDays = 8;
    sedexDays = 3;
  } else if (prefix >= 40 && prefix <= 65) {
    pac = 3490;
    sedex = 5290;
    pacDays = 10;
    sedexDays = 4;
  } else if (prefix >= 66 && prefix <= 79) {
    pac = 3890;
    sedex = 5690;
    pacDays = 12;
    sedexDays = 5;
  }
  return [
    { serviceId: 1, name: "PAC", company: "Correios", priceCents: pac, days: pacDays },
    { serviceId: 2, name: "SEDEX", company: "Correios", priceCents: sedex, days: sedexDays },
  ];
}

export async function fetchShippingQuotes(
  cep: string,
  items: z.infer<typeof itemSchema>[],
): Promise<{ ready: boolean; quotes: ShippingQuote[] }> {
  const dest = cep.replace(/\D/g, "").slice(0, 8);
  try {
    const melhor = await fetchMelhorEnvioQuotes(dest, items);
    if (melhor.length > 0) return { ready: true, quotes: melhor };
  } catch (error) {
    console.error("[shipping] melhor-envio", error);
  }

  try {
    const correios = await fetchCorreiosQuotes(dest, items);
    if (correios.length > 0) return { ready: false, quotes: correios };
  } catch (error) {
    console.error("[shipping] correios", error);
  }

  return { ready: false, quotes: tableShippingQuotes(dest) };
}

export const quoteShipping = createServerFn({ method: "POST" })
  .validator(
    z.object({
      cep: z.string().regex(/^\d{8}$/),
      items: z.array(itemSchema).min(1),
    }),
  )
  .handler(async ({ data }) => {
    const subtotal = data.items.reduce((sum, item) => {
      const product = getProduct(item.slug);
      return sum + (product ? product.priceCents * item.qty : 0);
    }, 0);

    const { ready, quotes } = await fetchShippingQuotes(data.cep, data.items);
    return {
      ready,
      source: ready ? ("melhor-envio" as const) : ("tabela" as const),
      quotes: quotes.map((quote) => ({
        ...quote,
        payableCents: shippingPayable(subtotal, quote.priceCents),
      })),
    };
  });

export const testMelhorEnvioQuote = createServerFn({ method: "POST" }).handler(async () => {
  const { isAdmin } = await import("@/lib/customers");
  const { getMelhorEnvioAccount } = await import("@/lib/melhor-envio");
  if (!(await isAdmin())) {
    return { ok: false as const, message: "Entre de novo.", quotes: [] as ShippingQuote[] };
  }
  const account = await getMelhorEnvioAccount();
  if (!account.ready) {
    return {
      ok: false as const,
      message:
        "Token inválido. Em Integrações → Permissões de Acesso, gere um token e cadastre MELHOR_ENVIO_TOKEN na Vercel.",
      quotes: [] as ShippingQuote[],
    };
  }
  const quotes = await fetchMelhorEnvioQuotes("01310100", [
    { slug: "ciclo-mini", printId: "padrao", size: "Único", qty: 1 },
  ]);
  if (quotes.length === 0) {
    return {
      ok: false as const,
      message: "A API não devolveu cotação. Confira o token, as permissões de frete e o CEP de origem 11700-170.",
      quotes: [] as ShippingQuote[],
    };
  }
  return {
    ok: true as const,
    email: account.email,
    quotes,
  };
});

export { shippingPayable, FREE_SHIPPING_FROM };