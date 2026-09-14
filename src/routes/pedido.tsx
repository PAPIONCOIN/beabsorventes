import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/logo";
import { useCartStore } from "@/lib/cart-store";
import { readLastOrder } from "@/lib/orders";
import { formatBRL } from "@/lib/utils";

export const Route = createFileRoute("/pedido")({
  validateSearch: (search: Record<string, unknown>) => ({
    status: typeof search.status === "string" ? search.status : undefined,
    collection_status:
      typeof search.collection_status === "string" ? search.collection_status : undefined,
    pedido:
      typeof search.pedido === "string"
        ? search.pedido
        : typeof search.external_reference === "string"
          ? search.external_reference
          : undefined,
  }),
  component: Pedido,
});

function Pedido() {
  const { status, collection_status, pedido } = Route.useSearch();
  const order = typeof window === "undefined" ? null : readLastOrder();
  const clear = useCartStore((s) => s.clear);
  const paid =
    collection_status === "approved" ||
    (status === "success" && Boolean(order || pedido));
  const pending = collection_status === "pending" || status === "pending";
  const demo = status === "demo";

  useEffect(() => {
    if (paid || demo) clear();
  }, [paid, demo, clear]);

  const title = demo
    ? "Pedido registrado"
    : pending
      ? "Pagamento em análise"
      : paid
        ? "Obrigada"
        : "Pedido";
  const copy = demo
    ? "O Mercado Pago ainda não está ligado nesta hospedagem. Registramos o pedido para conferir o fluxo."
    : pending
      ? "Assim que o pagamento confirmar, o pedido entra em confecção. O tempo de confecção é de 5 dias."
      : paid
        ? "Enviamos um e-mail com o resumo. O tempo de confecção é de 5 dias."
        : "Se você acabou de pagar, o comprovante chega no e-mail em instantes.";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <BrandMark className="mx-auto mb-6 size-32" />
      <p className="text-xs font-medium tracking-wide text-primary uppercase">
        Pedido
      </p>
      <h1 className="mt-3 font-display text-4xl italic">{title}</h1>
      <p className="mt-4 leading-relaxed text-muted">{copy}</p>
      {order ? (
        <div className="mt-8 rounded-xl bg-bg-warm p-6">
          <p className="text-sm text-muted">Número</p>
          <p className="font-medium tabular-nums">{order.orderId}</p>
          <p className="mt-4 text-sm text-muted">{order.name}</p>
          <p className="text-sm text-muted">{order.email}</p>
          <p className="mt-4 text-lg tabular-nums">{formatBRL(order.totals.total)}</p>
        </div>
      ) : pedido ? (
        <div className="mt-8 rounded-xl bg-bg-warm p-6">
          <p className="text-sm text-muted">Número</p>
          <p className="font-medium tabular-nums">{pedido}</p>
        </div>
      ) : null}
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link to="/compras">Compras</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/rastreio">Rastrear pedido</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/loja">Voltar à loja</Link>
        </Button>
      </div>
    </div>
  );
}
