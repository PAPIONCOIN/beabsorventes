import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/logo";
import { readLastOrder } from "@/lib/orders";
import { formatBRL } from "@/lib/utils";

export const Route = createFileRoute("/pedido")({
  validateSearch: (search: Record<string, unknown>) => ({
    status: typeof search.status === "string" ? search.status : undefined,
  }),
  component: Pedido,
});

function Pedido() {
  const { status } = Route.useSearch();
  const order = typeof window === "undefined" ? null : readLastOrder();

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <BrandMark className="mx-auto mb-6 size-32" />
      <p className="text-xs font-medium tracking-wide text-primary uppercase">
        Pedido
      </p>
      <h1 className="mt-3 font-display text-4xl italic">
        {status === "demo"
          ? "Pedido registrado"
          : status === "pending"
            ? "Pagamento em análise"
            : "Obrigada"}
      </h1>
      <p className="mt-4 leading-relaxed text-muted">
        {status === "demo"
          ? "O Mercado Pago ainda não está ligado nesta hospedagem. Registramos o pedido para que você possa conferir o fluxo completo."
          : "Enviamos um e-mail com o resumo. As peças saem do ateliê em até 5 dias úteis."}
      </p>
      {order ? (
        <div className="mt-8 rounded-xl bg-bg-warm p-6">
          <p className="text-sm text-muted">Número</p>
          <p className="font-medium tabular-nums">{order.orderId}</p>
          <p className="mt-4 text-sm text-muted">{order.name}</p>
          <p className="text-sm text-muted">{order.email}</p>
          <p className="mt-4 text-lg tabular-nums">{formatBRL(order.totals.total)}</p>
        </div>
      ) : null}
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link to="/conta">Meus pedidos</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/loja">Voltar à loja</Link>
        </Button>
      </div>
    </div>
  );
}
