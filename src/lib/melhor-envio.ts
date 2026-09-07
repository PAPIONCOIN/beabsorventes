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
  return asCep(process.env.MELHOR_ENVIO_FROM_CEP ?? ORIGIN_CEP);
}

function asCep(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 8);
  if (digits.length === 7) return digits.padStart(8, "0");
  return digits;
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
  const list = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)
      ? ((data as { data: unknown[] }).data)
      : [];
  const quotes: ShippingQuote[] = [];
  for (const raw of list as MeQuote[]) {
    if (!raw || raw.error) continue;
    const id = Number(raw.id);
    const price = Number(raw.custom_price ?? raw.price);
    const days = Number(raw.custom_delivery_time ?? raw.delivery_time);
    if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(price) || price <= 0) continue;
    quotes.push({
      serviceId: id,
      name: raw.name ?? "Frete",
      company: raw.company?.name ?? "Transportadora",
      priceCents: Math.round(price * 100),
      days: Number.isFinite(days) ? Math.max(1, Math.round(days)) : 8,
    });
  }
  quotes.sort((a, b) => a.priceCents - b.priceCents);
  return quotes.slice(0, 5);
}

async function destinationPlace(cep: string) {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = (await response.json()) as {
      erro?: boolean;
      localidade?: string;
      uf?: string;
    };
    if (data.erro) return { city: "", state: "" };
    return { city: data.localidade ?? "", state: data.uf ?? "" };
  } catch {
    return { city: "", state: "" };
  }
}

export async function fetchMelhorEnvioQuotes(
  destinationCep: string,
  items: CartLine[],
): Promise<ShippingQuote[]> {
  const token = meToken();
  const origin = fromCep();
  const dest = asCep(destinationCep);
  const products = quoteProducts(items);
  if (!token || origin.length !== 8 || dest.length !== 8 || products.length === 0) return [];

  const place = await destinationPlace(dest);
  const response = await fetch(`${meBase()}/me/shipment/calculate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": `Beabsorventes (${CONTACT_EMAIL})`,
    },
    body: JSON.stringify({
      from: {
        postal_code: origin,
        address: "Rua Principal",
        number: "1",
        city: "Praia Grande",
        state_abbr: "SP",
      },
      to: {
        postal_code: dest,
        city: place.city || undefined,
        state_abbr: place.state || undefined,
      },
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
    console.error("[melhor-envio] calculate", dest, response.status, await response.text());
    return [];
  }
  return parseQuotes(await response.json());
}

export function shippingPayable(subtotalCents: number, quoteCents: number) {
  if (subtotalCents >= FREE_SHIPPING_FROM) return 0;
  return quoteCents;
}

function asText(value: unknown, fallback = ""): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (value && typeof value === "object") {
    const rec = value as Record<string, unknown>;
    for (const key of ["city", "name", "title", "label", "abbreviation", "uf"]) {
      if (typeof rec[key] === "string" && rec[key].trim()) return rec[key].trim();
    }
  }
  return fallback;
}

type MeAddress = {
  label?: unknown;
  postal_code?: unknown;
  address?: unknown;
  number?: unknown;
  complement?: unknown;
  district?: unknown;
  city?: unknown;
  state_abbr?: unknown;
  state?: unknown;
};

type MeProfile = {
  firstname?: string;
  lastname?: string;
  email?: string;
  document?: string;
  phone?: { phone?: string };
};

function meErrorMessage(status: number, data: unknown) {
  if (status === 401 || status === 403) {
    return "Token inválido. Gere um token em Integrações → Permissões de Acesso (não use o Secret do aplicativo).";
  }
  if (typeof data === "string" && data.trim()) return data.slice(0, 280);
  if (data && typeof data === "object") {
    const rec = data as Record<string, unknown>;
    if (typeof rec.message === "string" && rec.message.trim()) return rec.message;
    if (typeof rec.error === "string" && rec.error.trim()) return rec.error;
    if (rec.errors && typeof rec.errors === "object") {
      const parts: string[] = [];
      for (const [key, value] of Object.entries(rec.errors as Record<string, unknown>)) {
        if (Array.isArray(value)) parts.push(`${key}: ${value.join(", ")}`);
        else if (typeof value === "string") parts.push(`${key}: ${value}`);
      }
      if (parts.length) return parts.join(" · ");
    }
  }
  return "O Melhor Envio não aceitou a etiqueta.";
}

function asObject(data: unknown): Record<string, unknown> | null {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const rec = data as Record<string, unknown>;
    if (rec.data && typeof rec.data === "object" && !Array.isArray(rec.data)) {
      return rec.data as Record<string, unknown>;
    }
    return rec;
  }
  return null;
}

function asList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: unknown[] }).data;
  }
  return [];
}

function digitsPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(2);
  return digits;
}

function melhorServiceId(serviceId?: number) {
  if (!serviceId || serviceId <= 0) return 0;
  if (serviceId < 100) return serviceId;
  const code = String(serviceId);
  if (code.includes("3220") || code.includes("40010") || code.includes("4162")) return 2;
  return 1;
}

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
  const profile = (asObject(profileRes.data) ?? {}) as MeProfile;
  const addressRes = await meFetch("/me/addresses");
  const addresses = asList(addressRes.data) as MeAddress[];
  const origin = fromCep();
  const address =
    addresses.find((item) => asText(item.postal_code).replace(/\D/g, "") === origin) ??
    addresses[0] ??
    {};
  const name =
    [profile.firstname, profile.lastname].filter(Boolean).join(" ").trim() ||
    process.env.MELHOR_ENVIO_FROM_NAME?.trim() ||
    "Beabsorventes";
  return {
    name,
    email: asText(profile.email, CONTACT_EMAIL),
    phone: digitsPhone(asText(profile.phone?.phone, process.env.MELHOR_ENVIO_FROM_PHONE || "11995895103")),
    document: asText(profile.document, process.env.MELHOR_ENVIO_FROM_DOCUMENT || "").replace(/\D/g, ""),
    address: asText(address.address, process.env.MELHOR_ENVIO_FROM_STREET || "Rua Principal"),
    complement: asText(address.complement),
    number: asText(address.number, process.env.MELHOR_ENVIO_FROM_NUMBER || "1"),
    district: asText(address.district, process.env.MELHOR_ENVIO_FROM_DISTRICT || "Centro"),
    city: asText(address.city, process.env.MELHOR_ENVIO_FROM_CITY || "Praia Grande"),
    state_abbr: asText(
      address.state_abbr ?? address.state,
      process.env.MELHOR_ENVIO_FROM_STATE || "SP",
    ).slice(0, 2).toUpperCase(),
    postal_code: asCep(address.postal_code || origin),
  };
}

export async function getMelhorEnvioAccount() {
  if (!meToken()) {
    return { ready: false as const, name: "", email: "" };
  }
  const result = await meFetch("/me");
  const profile = asObject(result.data) as MeProfile | null;
  if (!result.ok || !profile) {
    return { ready: false as const, name: "", email: "" };
  }
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
  document?: string;
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

  let serviceId = melhorServiceId(input.serviceId);
  if (!serviceId) {
    const quotes = await fetchMelhorEnvioQuotes(
      input.address.cep,
      cartLines.length
        ? cartLines
        : [{ slug: "ciclo-mini", printId: "padrao", size: "Único", qty: 1 }],
    );
    serviceId = quotes[0]?.serviceId ?? 2;
  }

  const from = await senderFromAccount();
  const account = await getMelhorEnvioAccount();
  if (!account.ready) {
    return {
      ok: false as const,
      message:
        "Token inválido. Gere um token em Integrações → Permissões de Acesso (não use o Secret do aplicativo) e cadastre MELHOR_ENVIO_TOKEN na Vercel.",
    };
  }

  const insurance = Number(
    (input.items.reduce((sum, item) => sum + item.unitCents * item.qty, 0) / 100).toFixed(2),
  );
  const recipientDocument = (input.document ?? "").replace(/\D/g, "");

  const payload = {
    service: serviceId,
    from: {
      ...from,
      company_document: from.document.length > 11 ? from.document : "",
      document: from.document.length <= 11 ? from.document : "",
      state_register: "ISENTO",
    },
    to: {
      name: asText(input.name, "Cliente"),
      email: asText(input.email),
      phone: digitsPhone(input.phone),
      document: recipientDocument,
      address: asText(input.address.street, "Rua"),
      complement: asText(input.address.complement),
      number: asText(input.address.number, "s/n"),
      district: asText(input.address.neighborhood, "Centro"),
      city: asText(input.address.city, "Praia Grande"),
      state_abbr: asText(input.address.state, "SP").slice(0, 2).toUpperCase(),
      postal_code: asCep(input.address.cep),
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
      message: meErrorMessage(cart.status, cart.data),
    };
  }
  const created = (asObject(cart.data) ?? cart.data) as {
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
    cartUrl: "https://melhorenvio.com.br/painel/carrinho",
    status,
  };
}

export function trackingLink(code: string) {
  const tracking = code.replace(/\s/g, "").toUpperCase();
  if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(tracking)) {
    return `https://rastreamento.correios.com.br/app/index.php?objeto=${tracking}`;
  }
  return `https://www.melhorrastreio.com.br/rastreio/${tracking}`;
}

export type MelhorEnvioShipment = {
  id: string;
  tracking: string;
  trackingUrl: string;
  status: string;
  protocol: string;
  orderTag: string;
  email: string;
};

function parseShipment(raw: unknown): MelhorEnvioShipment | null {
  const rec = asObject(raw);
  if (!rec) return null;
  const id = asText(rec.id);
  if (!id) return null;
  const tags = Array.isArray(rec.tags) ? rec.tags : [];
  let orderTag = "";
  for (const tag of tags) {
    const value =
      typeof tag === "string"
        ? tag
        : asText((tag as { tag?: unknown }).tag);
    if (value.toUpperCase().startsWith("BEA-")) {
      orderTag = value.toUpperCase();
    }
  }
  const to = asObject(rec.to) ?? {};
  const tracking = asText(rec.tracking || rec.self_tracking);
  return {
    id,
    tracking,
    trackingUrl: tracking ? trackingLink(tracking) : asText(rec.tracking_url),
    status: asText(rec.status).toLowerCase(),
    protocol: asText(rec.protocol),
    orderTag,
    email: asText(to.email).toLowerCase(),
  };
}

export async function listMelhorEnvioShipments() {
  const paths = [
    "/me/orders",
    "/me/cart",
    "/me/orders?status=Posted",
    "/me/orders?status=Released",
    "/me/orders?status=Delivered",
  ];
  const byId = new Map<string, MelhorEnvioShipment>();
  for (const path of paths) {
    const res = await meFetch(path);
    for (const raw of asList(res.data)) {
      const item = parseShipment(raw);
      if (!item) continue;
      const prev = byId.get(item.id);
      if (!prev || (item.tracking && !prev.tracking)) byId.set(item.id, item);
      else if (!prev) byId.set(item.id, item);
    }
  }
  return [...byId.values()];
}

function trackingFromPayload(data: unknown, uuid: string) {
  if (!data) return null;
  if (Array.isArray(data)) {
    return parseShipment(data.find((item) => asText(asObject(item)?.id) === uuid) ?? data[0]);
  }
  const rec = asObject(data);
  if (!rec) return null;
  if (rec[uuid]) return parseShipment(rec[uuid]);
  if (asText(rec.id) === uuid || rec.tracking) return parseShipment(rec);
  const nested = asObject(rec.data);
  if (nested) return parseShipment(nested);
  return null;
}

export async function fetchMelhorEnvioTracking(uuid: string) {
  if (!uuid) {
    return { ok: false as const, tracking: "", trackingUrl: "", status: "", protocol: "" };
  }

  const info = await meFetch(`/me/orders/${uuid}`);
  let shipment = trackingFromPayload(info.data, uuid);

  if (!shipment?.tracking) {
    const track = await meFetch("/me/shipment/tracking", {
      method: "POST",
      body: JSON.stringify({ orders: [uuid] }),
    });
    shipment = trackingFromPayload(track.data, uuid) ?? shipment;
  }

  if (!shipment?.tracking) {
    const listed = await listMelhorEnvioShipments();
    shipment = listed.find((item) => item.id === uuid) ?? shipment;
  }

  if (!shipment) {
    return { ok: false as const, tracking: "", trackingUrl: "", status: "", protocol: "" };
  }
  return {
    ok: true as const,
    tracking: shipment.tracking,
    trackingUrl: shipment.trackingUrl,
    status: shipment.status,
    protocol: shipment.protocol,
  };
}