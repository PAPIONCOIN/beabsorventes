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
  listCustomers,
  type Customer,
} from "@/lib/customers";

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

function Admin() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);

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
      if (session.ok) void load(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone, customer.city, customer.state]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [customers, query]);

  async function onLogin(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const result = await adminLogin({ data: { password } });
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPassword("");
    setAuthed(true);
    await load(true);
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
          Área restrita. Use a senha definida em ADMIN_PASSWORD.
        </p>
        <form onSubmit={onLogin} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
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
                {customer.city ? (
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
                  <th className="py-3 pr-4 font-medium">Cidade</th>
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
                      {customer.city
                        ? `${customer.city}/${customer.state}`
                        : "—"}
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
