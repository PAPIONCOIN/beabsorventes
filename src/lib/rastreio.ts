import { createHmac, timingSafeEqual } from "node:crypto";
import { CONTACT_EMAIL } from "@/lib/contact";

export type TrackingUpdate = {
  source: "melhor-envio" | "correios" | "generico";
  event: string;
  status: string;
  tracking: string | null;
  trackingUrl: string | null;
  protocol: string | null;
  orderTag: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  created: "Etiqueta criada",
  pending: "Etiqueta no carrinho",
  released: "Etiqueta paga",
  generated: "Etiqueta gerada",
  posted: "Objeto postado",
  received: "Recebido no ponto de distribuição",
  delivered: "Entregue",
  cancelled: "Cancelado",
  canceled: "Cancelado",
  undelivered: "Não entregue",
  paused: "Entrega interrompida",
  suspended: "Envio suspenso",
};

const NOTIFY_EVENTS = new Set([
  "order.generated",
  "order.posted",
  "order.delivered",
  "order.undelivered",
  "order.cancelled",
  "order.paused",
  "order.suspended",
  "posted",
  "delivered",
  "undelivered",
  "cancelled",
  "generated",
]);

export function statusLabel(status: string) {
  const key = status.replace(/^order\./, "").toLowerCase();
  return STATUS_LABEL[key] ?? status;
}

export function shouldNotify(event: string) {
  const key = event.toLowerCase();
  return NOTIFY_EVENTS.has(key) || NOTIFY_EVENTS.has(key.replace(/^order\./, ""));
}

export function verifyHmacSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
) {
  if (!signature) return false;
  const digest = createHmac("sha256", secret).update(rawBody).digest("base64");
  const a = Buffer.from(digest);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function parseTrackingPayload(
  body: unknown,
  userAgent = "",
): TrackingUpdate | null {
  if (!body || typeof body !== "object") return null;
  const rec = body as Record<string, unknown>;

  if (typeof rec.event === "string" && rec.data && typeof rec.data === "object") {
    const data = rec.data as Record<string, unknown>;
    const tags = Array.isArray(data.tags) ? data.tags : [];
    const firstTag = tags[0] as { tag?: string } | undefined;
    const tracking =
      (typeof data.tracking === "string" && data.tracking) ||
      (typeof data.self_tracking === "string" && data.self_tracking) ||
      null;
    return {
      source: userAgent.includes("Melhor Envio") ? "melhor-envio" : "melhor-envio",
      event: rec.event,
      status: typeof data.status === "string" ? data.status : rec.event,
      tracking,
      trackingUrl:
        typeof data.tracking_url === "string"
          ? data.tracking_url
          : tracking
            ? `https://www.melhorrastreio.com.br/rastreio/${tracking}`
            : null,
      protocol: typeof data.protocol === "string" ? data.protocol : null,
      orderTag: firstTag?.tag ?? (typeof data.orderId === "string" ? data.orderId : null),
    };
  }

  if (Array.isArray(rec.objetos) && rec.objetos[0] && typeof rec.objetos[0] === "object") {
    const objeto = rec.objetos[0] as Record<string, unknown>;
    const eventos = Array.isArray(objeto.eventos) ? objeto.eventos : [];
    const last = (eventos[0] ?? {}) as Record<string, unknown>;
    const codigo = typeof objeto.codObjeto === "string" ? objeto.codObjeto : null;
    return {
      source: "correios",
      event: typeof last.codigo === "string" ? last.codigo : "rastro",
      status: typeof last.descricao === "string" ? last.descricao : "atualização",
      tracking: codigo,
      trackingUrl: codigo
        ? `https://rastreamento.correios.com.br/app/index.php?objeto=${codigo}`
        : null,
      protocol: codigo,
      orderTag: typeof rec.pedido === "string" ? rec.pedido : null,
    };
  }

  const tracking =
    (typeof rec.tracking === "string" && rec.tracking) ||
    (typeof rec.codigo === "string" && rec.codigo) ||
    (typeof rec.codigoRastreio === "string" && rec.codigoRastreio) ||
    null;
  const status =
    (typeof rec.status === "string" && rec.status) ||
    (typeof rec.evento === "string" && rec.evento) ||
    "atualização";
  if (!tracking && !status) return null;
  return {
    source: "generico",
    event: typeof rec.event === "string" ? rec.event : status,
    status,
    tracking,
    trackingUrl: tracking
      ? `https://rastreamento.correios.com.br/app/index.php?objeto=${tracking}`
      : null,
    protocol: typeof rec.protocol === "string" ? rec.protocol : null,
    orderTag: typeof rec.pedido === "string" ? rec.pedido : null,
  };
}

export async function notifyTracking(update: TrackingUpdate) {
  if (!shouldNotify(update.event) && !shouldNotify(update.status)) {
    return { notified: false };
  }
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        _subject: `Rastreio: ${statusLabel(update.status)} — beabsorventes`,
        _template: "box",
        _captcha: "false",
        Evento: statusLabel(update.status),
        Origem: update.source,
        Pedido: update.orderTag ?? "—",
        Protocolo: update.protocol ?? "—",
        Codigo: update.tracking ?? "ainda não informado",
        Link: update.trackingUrl ?? "—",
      }),
    });
    if (!res.ok) {
      console.error("[rastreio-notify]", res.status, await res.text());
      return { notified: false };
    }
    return { notified: true };
  } catch (error) {
    console.error("[rastreio-notify]", error);
    return { notified: false };
  }
}
