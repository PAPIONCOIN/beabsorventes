import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/logo";
import { lookupPublicTracking } from "@/lib/shop-orders";

export const Route = createFileRoute("/rastreio")({ component: Rastreio });

type TrackingResult = {
  orderId: string;
  status: string;
  statusLabel: string;
  tracking: string;
  trackingUrl: string;
  shippingLabel: string;
  createdAt: string;
  items: string[];
};

function Rastreio() {
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const found = await lookupPublicTracking({
        data: { query, email },
      });
      if (!found.ok) {
        setError(found.message);
        return;
      }
      setResult(found);
    } catch {
      setError("Não foi possível consultar agora.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6 sm:py-12">
      <BrandMark className="mb-6 size-24" />
      <p className="text-xs font-medium tracking-wide text-primary uppercase">
        Pedidos
      </p>
      <h1 className="mt-3 font-display text-4xl italic">Rastrear pedido</h1>
      <p className="mt-3 text-sm text-muted">
        Informe o número do pedido (BEA-XXXX) e o e-mail da compra, ou o código
        de rastreio.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="rastreio-query">Pedido ou código</Label>
          <Input
            id="rastreio-query"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="BEA-Y63M ou código dos Correios"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rastreio-email">E-mail da compra</Label>
          <Input
            id="rastreio-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="necessário para buscar pelo número do pedido"
          />
        </div>
        {error ? <p className="text-sm text-primary">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Consultando…" : "Acompanhar"}
        </Button>
      </form>

      {result ? (
        <div className="mt-8 rounded-xl border border-border bg-surface p-5">
          <p className="text-xs tracking-wide text-muted uppercase">
            Pedido {result.orderId}
          </p>
          <p className="mt-2 font-medium">{result.statusLabel}</p>
          {result.shippingLabel ? (
            <p className="mt-1 text-sm text-muted">{result.shippingLabel}</p>
          ) : null}
          <ul className="mt-4 space-y-1 text-sm text-muted">
            {result.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {result.tracking ? (
            <p className="mt-4 text-sm">
              Rastreio{" "}
              {result.trackingUrl ? (
                <a
                  className="underline-offset-2 hover:underline"
                  href={result.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {result.tracking}
                </a>
              ) : (
                <span className="tabular-nums">{result.tracking}</span>
              )}
            </p>
          ) : (
            <p className="mt-4 text-sm text-muted">
              O código de rastreio aparece depois da postagem, em até 5 dias de
              confecção.
            </p>
          )}
        </div>
      ) : null}

      <p className="mt-8 text-sm text-muted">
        Já tem cadastro?{" "}
        <Link to="/compras" className="text-fg underline-offset-2 hover:underline">
          Ver minhas compras
        </Link>
      </p>
    </div>
  );
}
