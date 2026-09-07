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

type MeAddress = {
  label?: string;
  postal_code?: string;
  address?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state_abbr?: string;
};

type MeProfile = {
  firstname?: string;
  lastname?: string;
  email?: string;
  document?: string;
  phone?: { phone?: string };
};

function meHeaders() {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${meToken()}`,
    "User-Agent": `Beabsorventes (${CONTACT_EMAIL})`,
  };
}

async function meFetch(path: string, init?: RequestInit) {
  const token = meToken();
  if (!token) {
    return { ok: false as const, status: 401, data: null as unknown };
  }
  const response = await fetch(`${meBase()}${path}`, {
    ...init,
    headers: { ...meHeaders(), ...(init?.headers as Record<string, string>) },
  });
  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    console.error("[melhor-envio]", path, response.status, text.slice(0, 800));
  }
  return { ok: response.ok, status: response.status, data };
}

function packedBox(products: ReturnType<typeof quoteProducts>) {
  let length = 16;
  let width = 11;
  let height = 2;
  let weight = 0;
  for (const product of products) {
    length = Math.max(length, product.length);
    width = Math.max(width, product.width);
    height += product.height * product.quantity;
    weight += product.weight * product.quantity;
  }
  return {
    height: Math.max(2, Math.round(Math.min(height, 40))),
    width: Math.max(11, Math.round(width)),
    length: Math.max(16, Math.round(length)),
    weight: Math.max(0.1, Number(weight.toFixed(3))),
  };
}

async function senderFromAccount() {
  const profileRes = await meFetch("/me");
  const profile = (profileRes.ok ? profileRes.data : {}) as MeProfile;
  const addressRes = await meFetch("/me/addresses");
  const addresses = Array.isArray(addressRes.data) ? (addressRes.data as MeAddress[]) : [];
  const origin = fromCep();
  const address =
    addresses.find((item) => (item.postal_code ?? "").replace(/\D/g, "") === origin) ??
    addresses[0] ??
    {};
  const name =
    [profile.firstname, profile.lastname].filter(Boolean).join(" ").trim() ||
    process.env.MELHOR_ENVIO_FROM_NAME?.trim() ||
    "Beabsorventes";
  return {
    name,
    email: profile.email || CONTACT_EMAIL,
    phone: (profile.phone?.phone || process.env.MELHOR_ENVIO_FROM_PHONE || "11995895103").replace(
      /\D/g,
      "",
    ),
    document: (profile.document || process.env.MELHOR_ENVIO_FROM_DOCUMENT || "").replace(/\D/g, ""),
    address: address.address || process.env.MELHOR_ENVIO_FROM_STREET || "Ateliê",
    complement: address.complement || "",
    number: address.number || process.env.MELHOR_ENVIO_FROM_NUMBER || "1",
    district: address.district || process.env.MELHOR_ENVIO_FROM_DISTRICT || "Centro",
    city: address.city || process.env.MELHOR_ENVIO_FROM_CITY || "Praia Grande",
    state_abbr: address.state_abbr || process.env.MELHOR_ENVIO_FROM_STATE || "SP",
    postal_code: (address.postal_code || origin).replace(/\D/g, "").slice(0, 8),
  };
}

export async function getMelhorEnvioAccount() {
  if (!meToken()) {
    return { ready: false as const, name: "", email: "" };
  }
  const result = await meFetch("/me");
  if (!result.ok || !result.data || typeof result.data !== "object") {
    return { ready: false as const, name: "", email: "" };
  }
  const profile = result.data as MeProfile;
  return {
    ready: true as const,
    name: [profile.firstname, profile.lastname].filter(Boolean).join(" ").trim(),
    email: profile.email ?? "",
  };
}

export type MelhorEnvioOrderInput = {
  orderId: string;
  serviceId?: number;
  name: string;
  email: string;
  phone: string;
  address: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  items: Array<{ slug?: string; name: string; qty: number; unitCents: number }>;
};

export async function createMelhorEnvioShipment(input: MelhorEnvioOrderInput) {
  if (!meToken()) {
    return { ok: false as const, message: "MELHOR_ENVIO_TOKEN não está na Vercel." };
  }

  const cartLines = input.items
    .filter((item) => item.slug)
    .map((item) => ({
      slug: item.slug as string,
      printId: "padrao",
      size: "Único",
      qty: item.qty,
    }));
  const products = cartLines.length ? quoteProducts(cartLines) : [];
  const volume = products.length
    ? packedBox(products)
    : { height: 4, width: 16, length: 22, weight: 0.3 };

  let serviceId = input.serviceId && input.serviceId > 0 ? input.serviceId : 0;
  if (!serviceId) {
    const quotes = await fetchMelhorEnvioQuotes(input.address.cep, cartLines);
    serviceId = quotes[0]?.serviceId ?? 1;
  }

  const from = await senderFromAccount();
  const insurance = Number(
    (input.items.reduce((sum, item) => sum + item.unitCents * item.qty, 0) / 100).toFixed(2),
  );

  const payload = {
    service: serviceId,
    from,
    to: {
      name: input.name,
      email: input.email,
      phone: input.phone.replace(/\D/g, ""),
      document: "",
      address: input.address.street,
      complement: input.address.complement || "",
      number: input.address.number || "s/n",
      district: input.address.neighborhood,
      city: input.address.city,
      state_abbr: input.address.state,
      postal_code: input.address.cep.replace(/\D/g, "").slice(0, 8),
      country_id: "BR",
    },
    products: input.items.map((item) => ({
      name: item.name.slice(0, 80),
      quantity: item.qty,
      unitary_value: Number((item.unitCents / 100).toFixed(2)),
    })),
    volumes: [volume],
    options: {
      insurance_value: insurance,
      receipt: false,
      own_hand: false,
      reverse: false,
      non_commercial: true,
      platform: "Beabsorventes",
      reminder: `Pedido ${input.orderId}`,
      tags: [{ tag: input.orderId, url: "https://beabsorventes.com.br/conta" }],
    },
  };

  const cart = await meFetch("/me/cart", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!cart.ok || !cart.data || typeof cart.data !== "object") {
    return {
      ok: false as const,
      message: "O Melhor Envio não aceitou a etiqueta. Confira o endereço e o token.",
    };
  }
  const created = cart.data as {
    id?: string;
    protocol?: string;
    tracking?: string;
    status?: string;
  };
  const uuid = created.id ?? "";
  if (!uuid) {
    return { ok: false as const, message: "O Melhor Envio não devolveu o id da etiqueta." };
  }

  let tracking = created.tracking ?? "";
  let status = created.status ?? "pending";

  if (process.env.MELHOR_ENVIO_AUTO_CHECKOUT === "true") {
    await meFetch("/me/shipment/checkout", {
      method: "POST",
      body: JSON.stringify({ orders: [uuid] }),
    });
    await meFetch("/me/shipment/generate", {
      method: "POST",
      body: JSON.stringify({ orders: [uuid] }),
    });
    const info = await meFetch(`/me/orders/${uuid}`);
    if (info.ok && info.data && typeof info.data === "object") {
      const order = info.data as { tracking?: string; status?: string };
      tracking = order.tracking || tracking;
      status = order.status || status;
    }
  }

  return {
    ok: true as const,
    uuid,
    protocol: created.protocol ?? "",
    tracking,
    trackingUrl: tracking
      ? `https://www.melhorrastreio.com.br/rastreio/${tracking}`
      : "",
    status,
  };
}