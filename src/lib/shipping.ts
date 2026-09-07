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
  printId: z.string().min(1),
  size: z.string().min(1),
  qty: z.number().int().positive(),
});

export type QuotedShipping = ShippingQuote & { payableCents: number };

export async function fetchShippingQuotes(
  cep: string,
  items: z.infer<typeof itemSchema>[],
): Promise<{ ready: boolean; quotes: ShippingQuote[] }> {
  try {
    const melhor = await fetchMelhorEnvioQuotes(cep, items);
    if (melhor.length > 0) return { ready: true, quotes: melhor };
  } catch (error) {
    console.error("[shipping] melhor-envio", error);
  }

  try {
    const correios = await fetchCorreiosQuotes(cep, items);
    if (correios.length > 0) return { ready: false, quotes: correios };
  } catch (error) {
    console.error("[shipping] correios", error);
  }

  return { ready: false, quotes: [] };
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
      quotes: quotes.map((quote) => ({
        ...quote,
        payableCents: shippingPayable(subtotal, quote.priceCents),
      })),
    };
  });

export { shippingPayable, FREE_SHIPPING_FROM };
