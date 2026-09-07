import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/logo";
import {
  adminLogin,
  adminLogout,
  getAdminSession,
  getCustomerStoreStatus,
  listCustomers,
  registerCustomer,
  type Customer,
} from "@/lib/customers";
import { formatCep, formatPhone } from "@/lib/utils";

export const Route = createFileRoute("/admin")({ component: Admin });

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function sourceLabel(source: string) {
  return source === "checkout" ? "Compra" : "Cadastro";
}

function addressLine(customer: Customer) {
  return [
    [customer.street, customer.number].filter(Boolean).join(", "),
    customer.complement,
    customer.neighborhood,
    [customer.city, customer.state].filter(Boolean).join("/"),
    customer.cep,
  ]
    .filter(Boolean)
    .join(" · ");
}

function Admin() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [postgres, setPostgres] = useState<boolean | null>(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    cep: "",
    city: "",
    state: "",
  });

  async function load(sessionOk = authed) {
    if (!sessionOk) return;
    const result = await listCustomers();
    if (result.ok) setCustomers(result.customers);
    else setAuthed(false);
  }

  useEffect(() => {
    void getAdminSession().then((session) => {
      setAuthed(session.ok);
      setReady(true);
      if (session.ok) {
        void load(true);
        void getCustomerStoreStatus().then((status) => setPostgres(status.postgres));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone, customer.city, customer.state, customer.street, customer.cep]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [customers, query]);

  async function onLogin(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const result = await adminLogin({ data: { email, password } });
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPassword("");
    setEmail("");
    setAuthed(true);
    await load(true);
    void getCustomerStoreStatus().then((status) => setPostgres(status.postgres));
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
      <div className="mx-auto max-w-sm px-4 py-16 sm:px-6">
        <BrandMark className="mb-6 size-24" />
        <p className="text-xs font-medium tracking-wide text-primary uppercase">
          Administração
        </p>
        <h1 className="mt-3 font-display text-4xl italic">Clientes da loja</h1>
        <p className="mt-3 text-sm text-muted">
          Entre com o e-mail e a senha da loja.
        </p>
        <form onSubmit={onLogin} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email-admin">E-mail</Label>
            <Input
              id="email-admin"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-primary">{error}</p> : null}
          <Button type="submit" className="w-full" size="lg">
            Entrar
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            Administração
          </p>
          <h1 className="mt-3 font-display text-4xl italic">Clientes</h1>
          <p className="mt-2 text-sm text-muted">
            {customers.length} cadastro{customers.length === 1 ? "" : "s"} ·
            compras e formulário da loja
          </p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            await adminLogout();
            setAuthed(false);
            setCustomers([]);
          }}
        >
          Sair
        </Button>
      </div>

      <Input
        className="mt-8 max-w-md"
        placeholder="Buscar por nome, e-mail, telefone ou cidade"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {postgres === false ? (
        <div className="mt-8 rounded-xl border border-primary/20 bg-bg-warm p-5 text-sm leading-relaxed">
          <p className="font-medium">Os cadastros ainda não ficam guardados.</p>
          <p className="mt-2 text-muted">
            A loja no ar precisa de um banco na Vercel. Sem isso, cada visita
            começa zerada — por isso a lista aparece vazia.
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-5">
            <li>Abra o projeto beabsorventes na Vercel</li>
            <li>Clique em <strong>Storage</strong></li>
            <li>Clique em <strong>Create Database</strong> e escolha <strong>Postgres</strong> (Neon)</li>
            <li>Confirme a criação — a variável DATABASE_URL entra sozinha</li>
            <li>Vá em <strong>Deployments</strong> → ⋯ → <strong>Redeploy</strong></li>
          </ol>
          <p className="mt-4 text-muted">
            Os cadastros e as compras feitos depois do Redeploy aparecem aqui.
            Os anteriores estão no e-mail beabsorventes@gmail.com — você pode
            lançá-los no formulário abaixo.
          </p>
        </div>
      ) : null}

      <form
        className="mt-8 grid gap-3 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          setAdding(true);
          setAddError("");
          try {
            const result = await registerCustomer({
              data: {
                ...newCustomer,
                source: "cadastro",
              },
            });
            if (!result.customer) {
              setAddError("Não gravou. Ligue o banco Postgres na Vercel e faça o Redeploy.");
              return;
            }
            setNewCustomer({
              name: "",
              email: "",
              phone: "",
              cep: "",
              city: "",
              state: "",
            });
            await load(true);
          } catch {
            setAddError("Não foi possível salvar este cliente.");
          } finally {
            setAdding(false);
          }
        }}
      >
        <p className="font-medium sm:col-span-2">Adicionar cliente</p>
        <Input
          required
          placeholder="Nome"
          value={newCustomer.name}
          onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
        />
        <Input
          required
          type="email"
          placeholder="E-mail"
          value={newCustomer.email}
          onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
        />
        <Input
          placeholder="WhatsApp"
          value={newCustomer.phone}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, phone: formatPhone(e.target.value) })
          }
        />
        <Input
          placeholder="CEP"
          value={newCustomer.cep}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, cep: formatCep(e.target.value) })
          }
        />
        <Input
          placeholder="Cidade"
          value={newCustomer.city}
          onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
        />
        <Input
          placeholder="UF"
          value={newCustomer.state}
          onChange={(e) =>
            setNewCustomer({
              ...newCustomer,
              state: e.target.value.toUpperCase().slice(0, 2),
            })
          }
        />
        {addError ? <p className="text-sm text-primary sm:col-span-2">{addError}</p> : null}
        <Button type="submit" className="sm:col-span-2" disabled={adding}>
          {adding ? "Salvando…" : "Salvar cliente"}
        </Button>
      </form>

      {filtered.length === 0 ? (
        <p className="mt-10 text-muted">Nenhum cliente encontrado.</p>
      ) : (
        <>
          <ul className="mt-8 space-y-3 md:hidden">
            {filtered.map((customer) => (
              <li
                key={customer.id}
                className="rounded-lg border border-border bg-surface p-4"
              >
                <p className="font-medium">{customer.name}</p>
                <p className="mt-1 break-all text-sm text-muted">{customer.email}</p>
                {customer.phone ? (
                  <p className="mt-1 text-sm">{customer.phone}</p>
                ) : null}
                <p className="mt-2 text-xs text-muted">
                  {sourceLabel(customer.source)} · {formatDate(customer.createdAt)}
                </p>
                {addressLine(customer) ? (
                  <p className="mt-1 text-xs text-muted">{addressLine(customer)}</p>
                ) : customer.city ? (
                  <p className="mt-1 text-xs text-muted">
                    {customer.city}/{customer.state}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>

          <div className="mt-8 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="py-3 pr-4 font-medium">Nome</th>
                  <th className="py-3 pr-4 font-medium">E-mail</th>
                  <th className="py-3 pr-4 font-medium">WhatsApp</th>
                  <th className="py-3 pr-4 font-medium">Endereço</th>
                  <th className="py-3 pr-4 font-medium">Origem</th>
                  <th className="py-3 font-medium">Desde</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id} className="border-b border-border align-top">
                    <td className="py-3 pr-4 font-medium">{customer.name}</td>
                    <td className="py-3 pr-4 break-all">{customer.email}</td>
                    <td className="py-3 pr-4 tabular-nums">{customer.phone || "—"}</td>
                    <td className="py-3 pr-4 text-muted">
                      {addressLine(customer) || "—"}
                    </td>
                    <td className="py-3 pr-4">{sourceLabel(customer.source)}</td>
                    <td className="py-3 text-muted">{formatDate(customer.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
