import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  cartTotals,
  sanitizeLines,
  useCartStore,
} from "@/lib/cart-store";
import { createMpCheckout, getMercadoPagoStatus } from "@/lib/mercadopago";
import { quoteShipping } from "@/lib/shipping";
import { saveLastOrder } from "@/lib/orders";
import { sendOrderMail } from "@/lib/order-mail";
import { getProduct } from "@/lib/products";
import { BrandMark } from "@/components/logo";
import { digitsOnly, formatBRL, formatCep, formatPhone, FREE_SHIPPING_FROM } from "@/lib/utils";
import { ORIGIN_CEP_LABEL, readSavedCep, saveCep } from "@/lib/origin-cep";

export const Route = createFileRoute("/checkout")({ component: Checkout });

function Checkout() {
  const navigate = useNavigate();
  const lines = useCartStore((s) => s.lines);
  const clear = useCartStore((s) => s.clear);
  const [payment, setPayment] = useState<"pix" | "card">("pix");
  const [quotes, setQuotes] = useState<
    {
      serviceId: number;
      name: string;
      company: string;
      priceCents: number;
      days: number;
      payableCents: number;
    }[]
  >([]);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [quoting, setQuoting] = useState(false);
  const selected = quotes.find((quote) => quote.serviceId === serviceId) ?? quotes[0];
  const totals = cartTotals(lines, payment, selected?.payableCents);
  const [mpReady, setMpReady] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
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
    const saved = readSavedCep();
    if (saved.length === 8) {
      setForm((prev) => ({ ...prev, cep: formatCep(saved) }));
      void lookupCep(saved);
    }
  }, []);

  async function loadQuotes(cep: string) {
    if (cep.length !== 8 || lines.length === 0) return;
    setQuoting(true);
    try {
      const result = await quoteShipping({
        data: { cep, items: sanitizeLines(lines) },
      });
      setQuotes(result.quotes);
      setServiceId(result.quotes[0]?.serviceId ?? null);
    } catch {
      setQuotes([]);
      setServiceId(null);
    } finally {
      setQuoting(false);
    }
  }

  async function lookupCep(cepDigits?: string) {
    const cep = cepDigits ?? digitsOnly(form.cep);
    if (cep.length !== 8) return;
    void loadQuotes(cep);
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
          phone: digitsOnly(form.phone),
          payment,
          items: sanitizeLines(lines),
          shippingServiceId: serviceId ?? undefined,
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
      const shippingLabel =
        "shippingLabel" in result && result.shippingLabel
          ? result.shippingLabel
          : selected
            ? `${selected.company} ${selected.name}`
            : "Correios";
      const mailPayload = {
        orderId: result.orderId,
        name: form.name,
        email: form.email,
        phone: form.phone,
        payment,
        items,
        totals: result.totals,
        shippingLabel,
        address: {
          cep: form.cep,
          street: form.street,
          number: form.number,
          complement: form.complement,
          neighborhood: form.neighborhood,
          city: form.city,
          state: form.state,
        },
      };
      if (result.ok) {
        saveLastOrder({
          ...mailPayload,
          createdAt: new Date().toISOString(),
          status: "pending",
        });
        try {
          await sendOrderMail({
            ...mailPayload,
            status: "Aguardando pagamento",
          });
        } catch (error) {
          console.error("[order-mail]", error);
        }
        clear();
        window.location.href = result.url;
        return;
      }
      if (result.reason === "missing_token") {
        saveLastOrder({
          ...mailPayload,
          createdAt: new Date().toISOString(),
          status: "demo",
        });
        try {
          await sendOrderMail({
            ...mailPayload,
            status: "Teste (sem Mercado Pago)",
          });
        } catch (error) {
          console.error("[order-mail]", error);
        }
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
        <h1 className="font-display text-3xl italic">Sua sacola está vazia</h1>
        <p className="mt-3 text-muted">Adicione um modelo para finalizar a compra.</p>
        <Button asChild className="mt-6">
          <Link to="/loja">Ir para a loja</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:gap-12 sm:px-6 sm:py-12 lg:grid-cols-[1fr_22rem]">
      <form onSubmit={onSubmit} className="space-y-5">
        <h1 className="font-display text-[2rem] italic sm:text-4xl">Finalizar pedido</h1>
        {mpReady === false ? (
          <p className="rounded-md bg-bg-warm px-4 py-3 text-sm text-muted">
            O Mercado Pago ainda não está configurado nesta hospedagem. O pedido
            será registrado para conferência. Em produção, adicione a variável
            MERCADOPAGO_ACCESS_TOKEN.
          </p>
        ) : null}
        <Field
          label="CEP"
          inputMode="numeric"
          autoComplete="postal-code"
          value={form.cep}
          onChange={(v) => {
            const cep = formatCep(v);
            setForm((prev) => ({ ...prev, cep }));
            if (digitsOnly(cep).length === 8) {
              saveCep(digitsOnly(cep));
              void lookupCep(digitsOnly(cep));
            }
          }}
        />
        <fieldset>
          <legend className="text-sm font-medium">Frete</legend>
          <p className="mt-1 text-xs text-muted">
            Postagem saindo de {ORIGIN_CEP_LABEL}, com valores do Melhor Envio.
            Frete grátis a partir de {formatBRL(FREE_SHIPPING_FROM)}.
          </p>
          <div className="mt-3 space-y-2">
            {quoting ? (
              <p className="text-sm text-muted">Consultando prazos e valores…</p>
            ) : null}
            {quotes.map((quote) => {
              const active = (selected?.serviceId ?? null) === quote.serviceId;
              return (
                <button
                  key={quote.serviceId}
                  type="button"
                  onClick={() => setServiceId(quote.serviceId)}
                  className={`flex w-full items-center justify-between gap-3 rounded-md border px-4 py-3 text-left text-sm ${
                    active ? "border-fg bg-fg text-bg" : "border-border bg-surface"
                  }`}
                >
                  <span>
                    <span className="block font-medium">
                      {quote.company} {quote.name}
                    </span>
                    <span className={active ? "text-bg/80" : "text-muted"}>
                      {quote.days} dia{quote.days === 1 ? "" : "s"} úteis
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {quote.payableCents === 0 ? "Grátis" : formatBRL(quote.payableCents)}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
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
          label="WhatsApp"
          inputMode="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: formatPhone(v) })}
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
                className={`h-11 flex-1 rounded-md border px-4 text-sm sm:flex-none ${
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
      <aside className="order-first h-fit rounded-xl bg-bg-warm p-5 sm:p-6 lg:order-last">
        <BrandMark className="mb-4 size-24" />
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
            value={
              quoting
                ? "…"
                : totals.shipping === 0
                  ? "Grátis"
                  : formatBRL(totals.shipping)
            }
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
  type = "text",
  required = true,
  inputMode,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  inputMode?: "numeric" | "tel" | "email" | "text";
  autoComplete?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        required={required}
        value={value}
        inputMode={inputMode}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
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
