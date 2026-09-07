import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/logo";
import { getAccount, orderStatusLabel, type ShopOrder } from "@/lib/shop-orders";
import { formatBRL } from "@/lib/utils";

export const Route = createFileRoute("/compras")({ component: Compras });

function Compras() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [orders, setOrders] = useState<ShopOrder[]>([]);

  useEffect(() => {
    void getAccount().then((result) => {
      setAuthed(result.ok);
      if (result.ok) setOrders(result.orders);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center text-muted">
        Carregando…
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <BrandMark className="mb-6 size-24" />
        <h1 className="font-display text-4xl italic">Compras</h1>
        <p className="mt-3 text-sm text-muted">
          Entre na conta para ver a situação dos seus pedidos.
        </p>
        <Button asChild className="mt-8" size="lg">
          <Link to="/conta">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <p className="text-xs font-medium tracking-wide text-primary uppercase">
        Minha conta
      </p>
      <h1 className="mt-3 font-display text-4xl italic">Compras</h1>
      <p className="mt-2 text-sm text-muted">
        Consulte a situação dos pedidos e o rastreio.
      </p>
      {orders.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          Nenhum pedido neste e-mail ainda.{" "}
          <Link to="/loja" className="underline-offset-2 hover:underline">
            Ir para a loja
          </Link>
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((order) => (
            <li
              key={order.orderId}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs tracking-wide text-muted uppercase">
                    Pedido {order.orderId}
                  </p>
                  <p className="mt-1 font-medium">{orderStatusLabel(order.status)}</p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <p className="tabular-nums">{formatBRL(order.totals.total)}</p>
              </div>
              <ul className="mt-4 space-y-1 text-sm text-muted">
                {order.items.map((item, index) => (
                  <li key={`${order.orderId}-${index}`}>
                    {item.qty}× {item.name}
                    {item.size ? ` · ${item.size}` : ""}
                  </li>
                ))}
              </ul>
              {order.shippingLabel ? (
                <p className="mt-3 text-xs text-muted">{order.shippingLabel}</p>
              ) : null}
              {order.tracking ? (
                <p className="mt-2 text-sm">
                  Rastreio{" "}
                  {order.trackingUrl ? (
                    <a
                      className="underline-offset-2 hover:underline"
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {order.tracking}
                    </a>
                  ) : (
                    <span className="tabular-nums">{order.tracking}</span>
                  )}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
