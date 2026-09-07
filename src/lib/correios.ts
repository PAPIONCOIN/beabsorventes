import { quoteProducts, type ShippingQuote } from "@/lib/melhor-envio";
import type { CartLine } from "@/lib/cart-store";

type TokenCache = { token: string; expiresAt: number };

let tokenCache: TokenCache | null = null;

function fromCep() {
  return (
    process.env.CORREIOS_FROM_CEP ??
    process.env.MELHOR_ENVIO_FROM_CEP ??
    ""
  )
    .replace(/\D/g, "")
    .slice(0, 8);
}

function credentials() {
  const user = process.env.CORREIOS_USER?.trim();
  const apiCode = process.env.CORREIOS_API_CODE?.trim();
  const card = process.env.CORREIOS_CARTAO?.replace(/\D/g, "");
  if (!user || !apiCode || !card) return null;
  return {
    user,
    apiCode,
    card,
    contract: process.env.CORREIOS_CONTRATO?.trim(),
    dr: process.env.CORREIOS_DR?.trim(),
  };
}

function packedVolume(items: CartLine[]) {
  const products = quoteProducts(items);
  if (products.length === 0) return null;
  let length = 16;
  let width = 11;
  let height = 2;
  let grams = 0;
  for (const product of products) {
    length = Math.max(length, product.length);
    width = Math.max(width, product.width);
    height += product.height * product.quantity;
    grams += product.weight * 1000 * product.quantity;
  }
  return {
    length: Math.round(length),
    width: Math.round(width),
    height: Math.max(2, Math.round(Math.min(height, 40))),
    grams: Math.max(50, Math.round(grams)),
  };
}

async function correiosToken() {
  const creds = credentials();
  if (!creds) return null;
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }

  const body: Record<string, string | number> = { numero: creds.card };
  if (creds.contract) body.contrato = creds.contract;
  if (creds.dr) body.dr = Number(creds.dr) || creds.dr;

  const response = await fetch(
    "https://api.correios.com.br/token/v1/autentica/cartaopostagem",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${creds.user}:${creds.apiCode}`).toString("base64")}`,
      },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) {
    console.error("[correios] token", response.status, await response.text());
    return null;
  }
  const data = (await response.json()) as {
    token?: string;
    access_token?: string;
    expiraEm?: string;
  };
  const token = data.token || data.access_token;
  if (!token) return null;
  const expiresAt = data.expiraEm
    ? new Date(data.expiraEm).getTime()
    : Date.now() + 50 * 60 * 1000;
  tokenCache = { token, expiresAt };
  return token;
}

function parsePrice(data: unknown) {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return null;
  const rec = row as { pcFinal?: string; txErro?: string };
  if (rec.txErro) return null;
  const price = Number(String(rec.pcFinal ?? "").replace(",", "."));
  if (!Number.isFinite(price) || price <= 0) return null;
  return Math.round(price * 100);
}

function parseDays(data: unknown) {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return 8;
  const rec = row as { prazoEntrega?: number; txErro?: string };
  if (rec.txErro || !Number.isFinite(Number(rec.prazoEntrega))) return 8;
  return Math.max(1, Math.round(Number(rec.prazoEntrega)));
}

async function quoteService(
  token: string,
  code: string,
  origin: string,
  dest: string,
  box: { length: number; width: number; height: number; grams: number },
) {
  const priceUrl = new URL(
    `https://api.correios.com.br/preco/v1/nacional/${code}`,
  );
  priceUrl.searchParams.set("cepOrigem", origin);
  priceUrl.searchParams.set("cepDestino", dest);
  priceUrl.searchParams.set("psObjeto", String(box.grams));
  priceUrl.searchParams.set("tpObjeto", "2");
  priceUrl.searchParams.set("comprimento", String(box.length));
  priceUrl.searchParams.set("largura", String(box.width));
  priceUrl.searchParams.set("altura", String(box.height));

  const prazoUrl = new URL(
    `https://api.correios.com.br/prazo/v1/nacional/${code}`,
  );
  prazoUrl.searchParams.set("cepOrigem", origin);
  prazoUrl.searchParams.set("cepDestino", dest);

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  const [priceRes, prazoRes] = await Promise.all([
    fetch(priceUrl, { headers }),
    fetch(prazoUrl, { headers }),
  ]);

  const priceJson = priceRes.ok ? await priceRes.json() : null;
  const prazoJson = prazoRes.ok ? await prazoRes.json() : null;
  if (!priceRes.ok) {
    console.error("[correios] preco", code, priceRes.status, await priceRes.text().catch(() => ""));
  }
  const priceCents = parsePrice(priceJson);
  if (priceCents === null) return null;
  return { priceCents, days: parseDays(prazoJson) };
}

const SERVICES = [
  {
    id: 3298,
    env: "CORREIOS_PAC_CODE",
    fallback: "03298",
    name: "PAC",
  },
  {
    id: 3220,
    env: "CORREIOS_SEDEX_CODE",
    fallback: "03220",
    name: "SEDEX",
  },
] as const;

export async function fetchCorreiosQuotes(
  destinationCep: string,
  items: CartLine[],
): Promise<ShippingQuote[]> {
  if (!credentials()) return [];
  const origin = fromCep();
  const box = packedVolume(items);
  if (origin.length !== 8 || !box) return [];

  const token = await correiosToken();
  if (!token) return [];

  const quotes: ShippingQuote[] = [];
  for (const service of SERVICES) {
    const code = (process.env[service.env]?.trim() || service.fallback).replace(
      /\D/g,
      "",
    );
    try {
      const quoted = await quoteService(
        token,
        code.padStart(5, "0"),
        origin,
        destinationCep,
        box,
      );
      if (!quoted) continue;
      quotes.push({
        serviceId: service.id,
        name: service.name,
        company: "Correios",
        priceCents: quoted.priceCents,
        days: quoted.days,
      });
    } catch (error) {
      console.error("[correios] service", service.name, error);
    }
  }
  quotes.sort((a, b) => a.priceCents - b.priceCents);
  return quotes;
}
