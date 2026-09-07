import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/logo";
import {
  closeAccount,
  getAccount,
  openAccount,
  orderStatusLabel,
  updateAccount,
  type ShopOrder,
} from "@/lib/shop-orders";
import { type Customer } from "@/lib/customers";
import { digitsOnly, formatBRL, formatCep, formatPhone } from "@/lib/utils";

export const Route = createFileRoute("/conta")({ component: Conta });

function Conta() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  function applyAccount(next: { customer: Customer | null; orders: ShopOrder[] }) {
    setCustomer(next.customer);
    setOrders(next.orders);
    const fromOrder = next.orders[0];
    setForm({
      name: next.customer?.name || fromOrder?.name || "",
      phone: next.customer?.phone || fromOrder?.phone || "",
      cep: formatCep(next.customer?.cep || fromOrder?.address.cep || ""),
      street: next.customer?.street || fromOrder?.address.street || "",
      number: next.customer?.number || fromOrder?.address.number || "",
      complement: next.customer?.complement || fromOrder?.address.complement || "",
      neighborhood: next.customer?.neighborhood || fromOrder?.address.neighborhood || "",
      city: next.customer?.city || fromOrder?.address.city || "",
      state: next.customer?.state || fromOrder?.address.state || "",
    });
  }

  useEffect(() => {
    void getAccount().then((result) => {
      if (result.ok) {
        setAuthed(true);
        applyAccount(result);
      }
      setReady(true);
    });
  }, []);

  async function lookupCep(value: string) {
    const digits = digitsOnly(value);
    if (digits.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
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

  async function onLogin(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await openAccount({ data: { email, phone, cep } });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setAuthed(true);
      applyAccount(result);
    } catch {
      setError("Não foi possível entrar agora.");
    } finally {
      setBusy(false);
    }
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setSaved("");
    setError("");
    try {
      const result = await updateAccount({ data: form });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setCustomer(result.customer);
      setSaved("Dados atualizados.");
    } catch {
      setError("Não foi possível salvar agora.");
    } finally {
      setBusy(false);
    }
  }

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
        <p className="text-xs font-medium tracking-wide text-primary uppercase">
          Minha conta
        </p>
        <h1 className="mt-3 font-display text-4xl italic">Meus pedidos</h1>
        <p className="mt-3 text-sm text-muted">
          Entre com o e-mail da compra e o WhatsApp ou o CEP cadastrados.
        </p>
        <form onSubmit={onLogin} className="mt-8 space-y-4">
          <Field
            label="E-mail"
            type="email"
            value={email}
            onChange={setEmail}
          />
          <Field
            label="WhatsApp"
            required={false}
            inputMode="tel"
            value={phone}
            onChange={(value) => setPhone(formatPhone(value))}
          />
          <Field
            label="CEP"
            required={false}
            inputMode="numeric"
            value={cep}
            onChange={(value) => setCep(formatCep(value))}
          />
          {error ? <p className="text-sm text-primary">{error}</p> : null}
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? "Entrando…" : "Ver meus pedidos"}
          </Button>
        </form>
        <p className="mt-6 text-sm text-muted">
          Ainda não tem cadastro?{" "}
          <Link to="/cadastro" className="text-fg underline-offset-2 hover:underline">
            Crie o seu
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            Minha conta
          </p>
          <h1 className="mt-3 font-display text-4xl italic">Meus pedidos</h1>
          <p className="mt-2 text-sm text-muted">
            Consulte a situação das compras e atualize seus dados de entrega.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            await closeAccount();
            setAuthed(false);
            setOrders([]);
            setCustomer(null);
          }}
        >
          Sair
        </Button>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl italic">Pedidos</h2>
        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Nenhum pedido neste e-mail ainda. Quando a compra for concluída, ela
            aparece aqui.
          </p>
        ) : (
          <ul className="mt-5 space-y-4">
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
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl italic">Meus dados</h2>
        <form onSubmit={onSave} className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field
            label="Nome"
            value={form.name}
            onChange={(value) => setForm({ ...form, name: value })}
          />
          <Field
            label="WhatsApp"
            required={false}
            inputMode="tel"
            value={form.phone}
            onChange={(value) => setForm({ ...form, phone: formatPhone(value) })}
          />
          <Field
            label="CEP"
            required={false}
            inputMode="numeric"
            value={form.cep}
            onChange={(value) => {
              const next = formatCep(value);
              setForm((prev) => ({ ...prev, cep: next }));
              if (digitsOnly(next).length === 8) void lookupCep(next);
            }}
          />
          <Field
            label="Rua"
            required={false}
            value={form.street}
            onChange={(value) => setForm({ ...form, street: value })}
          />
          <Field
            label="Número"
            required={false}
            value={form.number}
            onChange={(value) => setForm({ ...form, number: value })}
          />
          <Field
            label="Complemento"
            required={false}
            value={form.complement}
            onChange={(value) => setForm({ ...form, complement: value })}
          />
          <Field
            label="Bairro"
            required={false}
            value={form.neighborhood}
            onChange={(value) => setForm({ ...form, neighborhood: value })}
          />
          <div className="grid grid-cols-3 gap-4 sm:col-span-2">
            <div className="col-span-2">
              <Field
                label="Cidade"
                required={false}
                value={form.city}
                onChange={(value) => setForm({ ...form, city: value })}
              />
            </div>
            <Field
              label="UF"
              required={false}
              value={form.state}
              onChange={(value) =>
                setForm({ ...form, state: value.toUpperCase().slice(0, 2) })
              }
            />
          </div>
          {error ? <p className="text-sm text-primary sm:col-span-2">{error}</p> : null}
          {saved ? <p className="text-sm text-muted sm:col-span-2">{saved}</p> : null}
          <Button type="submit" className="sm:col-span-2" disabled={busy}>
            {busy ? "Salvando…" : "Salvar dados"}
          </Button>
        </form>
      </section>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  inputMode?: "numeric" | "tel" | "email";
}) {
  const id = `conta-${label.toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        required={required}
        value={value}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
