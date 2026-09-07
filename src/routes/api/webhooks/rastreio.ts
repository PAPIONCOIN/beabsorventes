import { createFileRoute } from "@tanstack/react-router";
import {
  notifyTracking,
  parseTrackingPayload,
  verifyHmacSignature,
} from "@/lib/rastreio";

function authorized(request: Request, rawBody: string) {
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("token");
  const shared = process.env.WEBHOOK_RASTREIO_TOKEN?.trim();
  if (shared && queryToken === shared) return true;

  const meSecret = process.env.MELHOR_ENVIO_WEBHOOK_SECRET?.trim();
  const signature = request.headers.get("x-me-signature");
  if (meSecret && signature) {
    return verifyHmacSignature(rawBody, signature, meSecret);
  }

  if (!shared && !meSecret) {
    return true;
  }
  return false;
}

export const Route = createFileRoute("/api/webhooks/rastreio")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          ok: true,
          service: "beabsorventes-rastreio",
        }),
      POST: async ({ request }) => {
        const rawBody = await request.text();
        if (!authorized(request, rawBody)) {
          return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
        }

        let parsed: unknown = {};
        if (rawBody) {
          try {
            parsed = JSON.parse(rawBody) as unknown;
          } catch {
            return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
          }
        }

        const update = parseTrackingPayload(
          parsed,
          request.headers.get("user-agent") ?? "",
        );
        if (!update) {
          return Response.json({ ok: true, ignored: true });
        }

        const result = await notifyTracking(update);
        return Response.json({
          ok: true,
          event: update.event,
          status: update.status,
          tracking: update.tracking,
          ...result,
        });
      },
    },
  },
});
