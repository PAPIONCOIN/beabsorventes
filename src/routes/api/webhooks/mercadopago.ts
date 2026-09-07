import { createFileRoute } from "@tanstack/react-router";
import { sendOrderMail } from "@/lib/order-mail";
import { updateOrderStatus } from "@/lib/shop-orders";

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
  const queryId = url.searchParams.get("data.id") || url.searchParams.get("id");
  if (queryId) return queryId;
  try {
    const body = (await request.json()) as {
      type?: string;
      action?: string;
      data?: { id?: string };
    };
    return body.data?.id ?? null;
  } catch {
    return null;
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
          console.error("[mp-webhook] payment", response.status, await response.text());
          return Response.json({ ok: false }, { status: 502 });
        }
        const payment = (await response.json()) as MpPayment;
        const orderId = payment.external_reference || payment.metadata?.orderId || "";
        if (payment.status === "approved" && orderId) {
          await updateOrderStatus(orderId, "paid");
        }
        if (payment.status !== "approved") {
          return Response.json({ ok: true, status: payment.status });
        }

        const meta = payment.metadata ?? {};
        const cents = (value: string | undefined, fallback: number) => {
          const n = Number(value);
          return Number.isFinite(n) ? n : fallback;
        };
        const total = Math.round((payment.transaction_amount ?? 0) * 100);

        try {
          await sendOrderMail({
            orderId: payment.external_reference || meta.orderId || `MP-${payment.id}`,
            status: "Pagamento aprovado",
            name:
              meta.name ||
              [payment.payer?.first_name, payment.payer?.last_name]
                .filter(Boolean)
                .join(" ") ||
              "Cliente",
            email: meta.email || payment.payer?.email || "",
            phone: meta.phone,
            payment: (meta.payment as "pix" | "card") || payment.payment_type_id || "card",
            items: meta.items
              ? [{ name: meta.items, size: "", qty: 1, unitCents: total }]
              : [{ name: "Pedido beabsorventes", size: "", qty: 1, unitCents: total }],
            shippingLabel: meta.shipping || "Correios",
            totals: {
              subtotal: cents(meta.subtotal, total),
              discount: cents(meta.discount, 0),
              shipping: cents(meta.freight, 0),
              total: cents(meta.total, total),
            },
            address: {
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
