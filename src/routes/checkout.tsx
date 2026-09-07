import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  cartTotals,
  useCartStore,
} from "@/lib/cart-store";
import { createMpCheckout, getMercadoPagoStatus } from "@/lib/mercadopago";
import { saveLastOrder } from "@/lib/orders";
import { getProduct } from "@/lib/products";
import { BrandMark } from "@/components/logo";
import { digitsOnly, formatBRL, formatCep } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({ component: Checkout });

function Checkout() {
  const navigate = useNavigate();
  const lines = useCartStore((s) => s.lines);
  const clear = useCartStore((s) => s.clear);
  const [payment, setPayment] = useState<"pix" | "card">("pix");
  const totals = cartTotals(lines, payment);
  const [mpReady, setMpReady] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    void getMercadoPagoStatus().then((s) => setMpReady(s.ready));
  }, []);

  async function lookupCep() {
    const cep = digitsOnly(form.cep);
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = (await res.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (data.erro) return;
      setForm((prev) => ({
        ...prev,
        street: data.logradouro || prev.street,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }));
    } catch {
      /* ignore */
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (lines.length === 0) return;
    setBusy(true);
    try {
      const result = await createMpCheckout({
        data: {
          ...form,
          cep: digitsOnly(form.cep),
          payment,
          items: lines,
        },
      });
      const items = result.items.map((item) => ({
        slug: item.slug,
        name: item.name,
        printId: item.printId,
        printName: item.printName,
        size: item.size,
        qty: item.qty,
        unitCents: item.unitCents,
      }));
      if (result.ok) {
        saveLastOrder({
          orderId: result.orderId,
          name: form.name,
          email: form.email,
          payment,
          items,
          totals: result.totals,
          address: {
            cep: form.cep,
            street: form.street,
            number: form.number,
            complement: form.complement,
            neighborhood: form.neighborhood,
            city: form.city,
            state: form.state,
          },
          createdAt: new Date().toISOString(),
          status: "pending",
        });
        clear();
        window.location.href = result.url;
        return;
      }
      if (result.reason === "missing_token") {
        saveLastOrder({
          orderId: result.orderId,
          name: form.name,
          email: form.email,
          payment,
          items,
          totals: result.totals,
          address: {
            cep: form.cep,
            street: form.street,
            number: form.number,
            complement: form.complement,
            neighborhood: form.neighborhood,
            city: form.city,
            state: form.state,
          },
          createdAt: new Date().toISOString(),
          status: "demo",
        });
        clear();
        await navigate({ to: "/pedido", search: { status: "demo" } });
        return;
      }
      toast.error(result.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível concluir.");
    } finally {
      setBusy(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-3xl italic">A sacola está vazia</h1>
        <p className="mt-3 text-muted">Escolha uma peça para continuar.</p>
        <Button asChild className="mt-6">
          <Link to="/loja">Ir para a loja</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_22rem]">
      <form onSubmit={onSubmit} className="space-y-5">
        <h1 className="font-display text-4xl italic">Checkout</h1>
        {mpReady === false ? (
          <p className="rounded-md bg-bg-warm px-4 py-3 text-sm text-muted">
            Mercado Pago ainda sem token. O pedido será registrado aqui para você
            conferir o fluxo; no ar, basta adicionar MERCADOPAGO_ACCESS_TOKEN.
          </p>
        ) : null}
        <Field
          label="Nome"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
        />
        <Field
          label="E-mail"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
        />
        <Field
          label="CEP"
          value={form.cep}
          onChange={(v) => setForm({ ...form, cep: formatCep(v) })}
          onBlur={lookupCep}
        />
        <Field
          label="Rua"
          value={form.street}
          onChange={(v) => setForm({ ...form, street: v })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Número"
            value={form.number}
            onChange={(v) => setForm({ ...form, number: v })}
          />
          <Field
            label="Complemento"
            required={false}
            value={form.complement}
            onChange={(v) => setForm({ ...form, complement: v })}
          />
        </div>
        <Field
          label="Bairro"
          value={form.neighborhood}
          onChange={(v) => setForm({ ...form, neighborhood: v })}
        />
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Field
              label="Cidade"
              value={form.city}
              onChange={(v) => setForm({ ...form, city: v })}
            />
          </div>
          <Field
            label="UF"
            value={form.state}
            onChange={(v) =>
              setForm({ ...form, state: v.toUpperCase().slice(0, 2) })
            }
          />
        </div>
        <fieldset>
          <legend className="text-sm font-medium">Pagamento</legend>
          <div className="mt-2 flex gap-2">
            {(["pix", "card"] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPayment(method)}
                className={`h-11 rounded-md border px-4 text-sm ${
                  payment === method
                    ? "border-fg bg-fg text-bg"
                    : "border-border bg-surface"
                }`}
              >
                {method === "pix" ? "PIX · 5% off" : "Cartão"}
              </button>
            ))}
          </div>
        </fieldset>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Enviando…" : `Pagar ${formatBRL(totals.total)}`}
        </Button>
      </form>
      <aside className="h-fit rounded-xl bg-bg-warm p-6">
        <BrandMark className="mb-4 size-16" />
        <h2 className="font-display text-2xl italic">Pedido</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {lines.map((line) => {
            const product = getProduct(line.slug);
            if (!product) return null;
            return (
              <li key={`${line.slug}-${line.printId}-${line.size}`}>
                {line.qty}× {product.shortName}
              </li>
            );
          })}
        </ul>
        <dl className="mt-6 space-y-2 text-sm">
          <Row label="Subtotal" value={formatBRL(totals.subtotal)} />
          <Row label="Desconto" value={formatBRL(-totals.discount)} />
          <Row
            label="Frete"
            value={totals.shipping === 0 ? "Grátis" : formatBRL(totals.shipping)}
          />
          <Row label="Total" value={formatBRL(totals.total)} strong />
        </dl>
      </aside>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: string;
  required?: boolean;
}) {
  const id = label.toLowerCase();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className={strong ? "font-medium tabular-nums" : "tabular-nums"}>
        {value}
      </dd>
    </div>
  );
}
