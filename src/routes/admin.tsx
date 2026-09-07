import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/logo";
import {
  adminDeleteCustomer,
  adminLogin,
  adminLogout,
  adminUpdateCustomer,
  getAdminSession,
  getCustomerStoreStatus,
  listCustomers,
  registerCustomer,
  type Customer,
} from "@/lib/customers";
import { formatCep, formatCpf, formatPhone, formatBRL } from "@/lib/utils";
import { ORIGIN_CEP_LABEL } from "@/lib/origin-cep";
import {
  adminSendToMelhorEnvio,
  getMelhorEnvioStatus,
  listAdminOrders,
  orderStatusLabel,
  type ShopOrder,
} from "@/lib/shop-orders";
import { listContactMessages, type ContactMessage } from "@/lib/contact";

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

const EMPTY_CUSTOMER = {
  name: "",
  email: "",
  phone: "",
  document: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

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
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [postgres, setPostgres] = useState<boolean | null>(null);
  const [melhor, setMelhor] = useState<{ ready: boolean; name: string; email: string } | null>(
    null,
  );
  const [sending, setSending] = useState<string | null>(null);
  const [shipError, setShipError] = useState("");
  const [shipDocs, setShipDocs] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newCustomer, setNewCustomer] = useState(EMPTY_CUSTOMER);

  async function load(sessionOk = authed) {
    if (!sessionOk) return;
    const result = await listCustomers();
    if (result.ok) setCustomers(result.customers);
    else {
      setAuthed(false);
      return;
    }
    const purchases = await listAdminOrders();
    if (purchases.ok) setOrders(purchases.orders);
    const inbox = await listContactMessages();
    if (inbox.ok) setMessages(inbox.messages);
  }

  function startEdit(customer: Customer) {
    setEditingId(customer.id);
    setAddError("");
    setNewCustomer({
      name: customer.name,
      email: customer.email,
      phone: customer.phone ? formatPhone(customer.phone) : "",
      document: customer.document ? formatCpf(customer.document) : "",
      cep: customer.cep ? formatCep(customer.cep) : "",
      street: customer.street,
      number: customer.number,
      complement: customer.complement,
      neighborhood: customer.neighborhood,
      city: customer.city,
      state: customer.state,
    });
  }

  async function removeCustomer(customer: Customer) {
    if (!window.confirm(`Excluir o cadastro de ${customer.name}?`)) return;
    const result = await adminDeleteCustomer({ data: { id: customer.id } });
    if (!result.ok) {
      setAddError(result.message);
      return;
    }
    if (editingId === customer.id) {
      setEditingId(null);
      setNewCustomer(EMPTY_CUSTOMER);
    }
    await load(true);
  }

  useEffect(() => {
    void getAdminSession().then((session) => {
      setAuthed(session.ok);
      setReady(true);
      if (session.ok) {
        void load(true);
        void getCustomerStoreStatus().then((status) => setPostgres(status.postgres));
        void getMelhorEnvioStatus().then(setMelhor);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone, customer.document, customer.city, customer.state, customer.street, customer.cep]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [customers, query]);

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((order) =>
      [
        order.orderId,
        order.name,
        order.email,
        order.phone,
        order.status,
        order.tracking,
        order.items.map((item) => item.name).join(" "),
        order.address.city,
        order.address.state,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [orders, query]);

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
    void getMelhorEnvioStatus().then(setMelhor);
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
          <h1 className="mt-3 font-display text-4xl italic">Pedidos e clientes</h1>
          <p className="mt-2 text-sm text-muted">
            {orders.length} compra{orders.length === 1 ? "" : "s"} · {customers.length}{" "}
            cadastro{customers.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            await adminLogout();
            setAuthed(false);
            setCustomers([]);
            setOrders([]);
            setMessages([]);
          }}
        >
          Sair
        </Button>
      </div>

      {melhor ? (
        <div className="mt-6 rounded-xl border border-border bg-surface p-5 text-sm">
          <p className="font-medium">Sistema de frete</p>
          <p className="mt-2 text-muted">
            Origem {ORIGIN_CEP_LABEL} · Praia Grande/SP · cotação e etiqueta pelo
            Melhor Envio.
          </p>
          <p className={`mt-2 ${melhor.ready ? "text-muted" : "text-primary"}`}>
            {melhor.ready
              ? `Melhor Envio ligado${melhor.email ? ` · ${melhor.email}` : ""}.`
              : "Melhor Envio sem token. Cadastre MELHOR_ENVIO_TOKEN na Vercel."}
          </p>
          <a
            className="mt-3 inline-block underline-offset-2 hover:underline"
            href="https://melhorenvio.com.br/painel/carrinho"
            target="_blank"
            rel="noreferrer"
          >
            Abrir carrinho do Melhor Envio
          </a>
        </div>
      ) : null}

      <Input
        className="mt-8 max-w-md"
        placeholder="Buscar por nome, e-mail, pedido ou cidade"
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

      <section className="mt-10">
        <h2 className="font-display text-3xl italic">Compras</h2>
        {filteredOrders.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Nenhuma compra encontrada. Os pedidos feitos depois do banco ligado
            aparecem aqui, com peças, valor e situação.
          </p>
        ) : (
          <ul className="mt-5 space-y-4">
            {filteredOrders.map((order) => (
              <li
                key={order.orderId}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs tracking-wide text-muted uppercase">
                      {order.orderId}
                    </p>
                    <p className="mt-1 font-medium">{order.name}</p>
                    <p className="mt-1 break-all text-sm text-muted">{order.email}</p>
                    {order.phone ? (
                      <p className="mt-1 text-sm tabular-nums">{order.phone}</p>
                    ) : null}
                    {order.document ? (
                      <p className="mt-1 text-sm tabular-nums">
                        CPF {formatCpf(order.document)}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{orderStatusLabel(order.status)}</p>
                    <p className="mt-1 tabular-nums">{formatBRL(order.totals.total)}</p>
                    <p className="mt-1 text-xs text-muted">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <ul className="mt-4 space-y-1 text-sm text-muted">
                  {order.items.map((item, index) => (
                    <li key={`${order.orderId}-${index}`}>
                      {item.qty}× {item.name}
                      {item.size ? ` · ${item.size}` : ""}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted">
                  {[
                    order.shippingLabel,
                    [order.address.street, order.address.number].filter(Boolean).join(", "),
                    order.address.city && order.address.state
                      ? `${order.address.city}/${order.address.state}`
                      : "",
                    order.address.cep,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
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
                      order.tracking
                    )}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="max-w-[12rem] space-y-1.5">
                    <Label htmlFor={`cpf-${order.orderId}`}>CPF do destinatário</Label>
                    <Input
                      id={`cpf-${order.orderId}`}
                      inputMode="numeric"
                      placeholder="CPF do cadastro"
                      value={
                        shipDocs[order.orderId] ??
                        (order.document ? formatCpf(order.document) : "")
                      }
                      onChange={(e) =>
                        setShipDocs((prev) => ({
                          ...prev,
                          [order.orderId]: formatCpf(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={sending === order.orderId}
                    onClick={async () => {
                      setShipError("");
                      setSending(order.orderId);
                      try {
                        const result = await adminSendToMelhorEnvio({
                          data: {
                            orderId: order.orderId,
                            document:
                              shipDocs[order.orderId] || order.document || "",
                          },
                        });
                        if (!result.ok) {
                          setShipError(result.message);
                          return;
                        }
                        await load(true);
                      } catch {
                        setShipError("Não foi possível falar com o Melhor Envio agora.");
                      } finally {
                        setSending(null);
                      }
                    }}
                  >
                    {order.meUuid
                      ? "Etiqueta no Melhor Envio"
                      : sending === order.orderId
                        ? "Enviando…"
                        : "Gerar envio no Melhor Envio"}
                  </Button>
                  {order.meUuid ? (
                    <a
                      className="text-sm underline-offset-2 hover:underline"
                      href="https://melhorenvio.com.br/painel/carrinho"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir carrinho
                    </a>
                  ) : null}
                </div>
                {shipError ? (
                  <p className="mt-2 text-sm text-primary">{shipError}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl italic">Mensagens do contato</h2>
        {messages.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Nenhuma mensagem ainda.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {messages.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="mt-1 break-all text-sm text-muted">{item.email}</p>
                    {item.phone ? (
                      <p className="mt-1 text-sm">{item.phone}</p>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted">{formatDate(item.createdAt)}</p>
                </div>
                <p className="mt-3 text-xs tracking-wide text-muted uppercase">
                  {item.topic}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm">{item.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form
        className="mt-8 grid gap-3 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          setAdding(true);
          setAddError("");
          try {
            if (editingId) {
              const result = await adminUpdateCustomer({
                data: { id: editingId, ...newCustomer, source: "cadastro" },
              });
              if (!result.ok) {
                setAddError(result.message);
                return;
              }
            } else {
              const result = await registerCustomer({
                data: { ...newCustomer, source: "cadastro" },
              });
              if (!result.customer) {
                setAddError("Não gravou. Ligue o banco Postgres na Vercel e faça o Redeploy.");
                return;
              }
            }
            setEditingId(null);
            setNewCustomer(EMPTY_CUSTOMER);
            await load(true);
          } catch {
            setAddError("Não foi possível salvar este cliente.");
          } finally {
            setAdding(false);
          }
        }}
      >
        <p className="font-medium sm:col-span-2">
          {editingId ? "Editar cliente" : "Adicionar cliente"}
        </p>
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
          placeholder="CPF"
          value={newCustomer.document}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, document: formatCpf(e.target.value) })
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
          placeholder="Rua"
          value={newCustomer.street}
          onChange={(e) => setNewCustomer({ ...newCustomer, street: e.target.value })}
        />
        <Input
          placeholder="Número"
          value={newCustomer.number}
          onChange={(e) => setNewCustomer({ ...newCustomer, number: e.target.value })}
        />
        <Input
          placeholder="Complemento"
          value={newCustomer.complement}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, complement: e.target.value })
          }
        />
        <Input
          placeholder="Bairro"
          value={newCustomer.neighborhood}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, neighborhood: e.target.value })
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
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" disabled={adding}>
            {adding ? "Salvando…" : editingId ? "Salvar alterações" : "Salvar cliente"}
          </Button>
          {editingId ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setNewCustomer(EMPTY_CUSTOMER);
                setAddError("");
              }}
            >
              Cancelar
            </Button>
          ) : null}
        </div>
      </form>

      <h2 className="mt-12 font-display text-3xl italic">Clientes</h2>

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
                {customer.document ? (
                  <p className="mt-1 text-sm tabular-nums">{formatCpf(customer.document)}</p>
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
                <div className="mt-3 flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => startEdit(customer)}>
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void removeCustomer(customer)}
                  >
                    Excluir
                  </Button>
                </div>
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
                  <th className="py-3 pr-4 font-medium">CPF</th>
                  <th className="py-3 pr-4 font-medium">Endereço</th>
                  <th className="py-3 pr-4 font-medium">Origem</th>
                  <th className="py-3 pr-4 font-medium">Desde</th>
                  <th className="py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id} className="border-b border-border align-top">
                    <td className="py-3 pr-4 font-medium">{customer.name}</td>
                    <td className="py-3 pr-4 break-all">{customer.email}</td>
                    <td className="py-3 pr-4 tabular-nums">{customer.phone || "—"}</td>
                    <td className="py-3 pr-4 tabular-nums">
                      {customer.document ? formatCpf(customer.document) : "—"}
                    </td>
                    <td className="py-3 pr-4 text-muted">
                      {addressLine(customer) || "—"}
                    </td>
                    <td className="py-3 pr-4">{sourceLabel(customer.source)}</td>
                    <td className="py-3 pr-4 text-muted">{formatDate(customer.createdAt)}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(customer)}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void removeCustomer(customer)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
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
