import { createFileRoute } from "@tanstack/react-router";
import { sendOrderMail } from "@/lib/order-mail";
import { getOrder, sendPaidOrderToMelhorEnvio, updateOrderStatus } from "@/lib/shop-orders";

type MpPayment = {
  id?: number;
  status?: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
  payment_type_id?: string;
  payment_method_id?: string;
  metadata?: Record<string, string | undefined>;
  payer?: {
    email?: string;
    first_name?: string;
    last_name?: string;
  };
};

async function paymentIdFrom(request: Request) {
  const url = new URL(request.url);
  const topic = url.searchParams.get("topic") || url.searchParams.get("type");
  if (topic === "merchant_order") return null;
  const queryId =
    (topic === "payment" ? url.searchParams.get("id") : null) ||
    url.searchParams.get("data.id") ||
    url.searchParams.get("id");

  const raw = await request.text();
  if (!raw) return queryId;
  try {
    const body = JSON.parse(raw) as {
      type?: string;
      topic?: string;
      action?: string;
      data?: { id?: string };
    };
    if (body.type === "merchant_order" || body.topic === "merchant_order") {
      return null;
    }
    return body.data?.id ?? queryId;
  } catch {
    return queryId;
  }
}

export const Route = createFileRoute("/api/webhooks/mercadopago")({
  server: {
    handlers: {
      GET: async () => Response.json({ ok: true, service: "beabsorventes-mp" }),
      POST: async ({ request }) => {
        const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!token) {
          return Response.json({ ok: false, error: "no_token" }, { status: 503 });
        }
        const paymentId = await paymentIdFrom(request);
        if (!paymentId) return Response.json({ ok: true, ignored: true });

        const response = await fetch(
          `https://api.mercadopago.com/v1/payments/${paymentId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!response.ok) {
          const detail = await response.text();
          if (response.status === 404) {
            return Response.json({ ok: true, ignored: true, reason: "payment_not_found" });
          }
          console.error("[mp-webhook] payment", response.status, detail);
          return Response.json({ ok: false }, { status: 502 });
        }
        const payment = (await response.json()) as MpPayment;
        const orderId = payment.external_reference || payment.metadata?.orderId || "";
        if (payment.status !== "approved") {
          return Response.json({ ok: true, status: payment.status });
        }
        if (!orderId) {
          return Response.json({ ok: true, ignored: true });
        }

        const existing = await getOrder(orderId);
        const alreadyPaid = existing?.status === "paid" || existing?.status === "posted" || existing?.status === "delivered";
        await updateOrderStatus(orderId, alreadyPaid ? existing?.status || "paid" : "paid");

        if (!alreadyPaid) {
          try {
            await sendPaidOrderToMelhorEnvio(orderId);
          } catch (error) {
            console.error("[mp-webhook] melhor-envio", error);
          }
        }

        if (alreadyPaid) {
          return Response.json({ ok: true, status: "approved", duplicate: true });
        }

        const meta = payment.metadata ?? {};
        const cents = (value: string | undefined, fallback: number) => {
          const n = Number(value);
          return Number.isFinite(n) ? n : fallback;
        };
        const total = Math.round((payment.transaction_amount ?? 0) * 100);

        try {
          await sendOrderMail({
            orderId,
            status: "Pagamento aprovado",
            name:
              meta.name ||
              existing?.name ||
              [payment.payer?.first_name, payment.payer?.last_name]
                .filter(Boolean)
                .join(" ") ||
              "Cliente",
            email: meta.email || existing?.email || payment.payer?.email || "",
            phone: meta.phone || existing?.phone,
            payment: (meta.payment as "pix" | "card") || "card",
            items: existing?.items?.length
              ? existing.items.map((item) => ({
                  name: item.name,
                  size: item.size ?? "",
                  qty: item.qty,
                  unitCents: item.unitCents,
                }))
              : meta.items
                ? [{ name: meta.items, size: "", qty: 1, unitCents: total }]
                : [{ name: "Pedido beabsorventes", size: "", qty: 1, unitCents: total }],
            shippingLabel: meta.shipping || existing?.shippingLabel || "Correios",
            totals: existing?.totals ?? {
              subtotal: cents(meta.subtotal, total),
              discount: cents(meta.discount, 0),
              shipping: cents(meta.freight, 0),
              total: cents(meta.total, total),
            },
            address: existing?.address ?? {
              cep: meta.cep || "",
              street: meta.street || "",
              number: meta.number || "",
              complement: meta.complement,
              neighborhood: meta.neighborhood || "",
              city: meta.city || "",
              state: meta.state || "",
            },
          });
        } catch (error) {
          console.error("[mp-webhook] mail", error);
        }

        return Response.json({ ok: true, status: "approved" });
      },
    },
  },
});
