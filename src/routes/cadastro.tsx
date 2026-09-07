import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/logo";
import { registerCustomer } from "@/lib/customers";
import { sendCustomerMail } from "@/lib/customer-mail";
import {
  changeAccountPassword,
  getAccount,
  openAccount,
  updateAccount,
} from "@/lib/shop-orders";
import { digitsOnly, formatCep, formatCpf, formatPhone } from "@/lib/utils";

export const Route = createFileRoute("/cadastro")({ component: Cadastro });

function Cadastro() {
  const [ready, setReady] = useState(false);
  const [logged, setLogged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
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
    password: "",
    confirm: "",
  });

  useEffect(() => {
    void getAccount().then((result) => {
      if (result.ok && result.customer) {
        const customer = result.customer;
        setLogged(true);
        setForm((prev) => ({
          ...prev,
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
        }));
      }
      setReady(true);
    });
  }, []);

  async function lookupCep(cepDigits: string) {
    if (cepDigits.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
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
    setBusy(true);
    setError("");
    if (form.password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      setBusy(false);
      return;
    }
    if (form.password !== form.confirm) {
      setError("As senhas não coincidem.");
      setBusy(false);
      return;
    }
    if (digitsOnly(form.document).length !== 11) {
      setError("Informe um CPF com 11 números.");
      setBusy(false);
      return;
    }
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      document: form.document,
      cep: form.cep,
      street: form.street,
      number: form.number,
      complement: form.complement,
      neighborhood: form.neighborhood,
      city: form.city,
      state: form.state,
      source: "cadastro" as const,
      password: form.password,
    };
    try {
      let mailed = false;
      try {
        await sendCustomerMail({
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          document: payload.document,
          cep: payload.cep,
          street: payload.street,
          number: payload.number,
          complement: payload.complement,
          neighborhood: payload.neighborhood,
          city: payload.city,
          state: payload.state,
          source: payload.source,
        });
        mailed = true;
      } catch (error) {
        console.error("[cadastro-mail]", error);
      }
      try {
        await registerCustomer({ data: payload });
        try {
          await openAccount({ data: { email: payload.email, password: payload.password } });
        } catch {
          /* login happens on /conta if this fails */
        }
        mailed = true;
      } catch (error) {
        console.error("[cadastro-db]", error);
      }
      if (!mailed) {
        setError("Não foi possível concluir o cadastro. Tente de novo.");
        return;
      }
      setDone(true);
    } catch {
      setError("Não foi possível concluir o cadastro. Tente de novo.");
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

  if (logged) {
    return (
      <CadastroLogado
        form={form}
        setForm={setForm}
        lookupCep={lookupCep}
      />
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <BrandMark className="mx-auto mb-6 size-28" />
        <h1 className="font-display text-4xl italic">Cadastro feito</h1>
        <p className="mt-4 leading-relaxed text-muted">
          Guardamos seus dados para facilitar os próximos pedidos. Você já está
          na conta — o seu nome aparece no topo e na sacola.
        </p>
        <Button asChild className="mt-8">
          <Link to="/loja">Ir para a loja</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6 sm:py-12">
      <p className="text-xs font-medium tracking-wide text-primary uppercase">
        Cadastro
      </p>
      <h1 className="mt-3 font-display text-4xl italic sm:text-5xl">
        Seja cliente beabsorventes
      </h1>
      <p className="mt-4 text-muted">
        Preencha uma vez. Use este e-mail, senha e CPF para ver pedidos e gerar o envio.
      </p>
      <form onSubmit={onSubmit} className="mt-10 space-y-5">
        <Field
          label="Nome"
          value={form.name}
          onChange={(value) => setForm({ ...form, name: value })}
        />
        <Field
          label="E-mail"
          type="email"
          value={form.email}
          onChange={(value) => setForm({ ...form, email: value })}
        />
        <Field
          label="CPF"
          inputMode="numeric"
          value={form.document}
          onChange={(value) => setForm({ ...form, document: formatCpf(value) })}
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
          autoComplete="postal-code"
          value={form.cep}
          onChange={(value) => {
            const cep = formatCep(value);
            setForm((prev) => ({ ...prev, cep }));
            if (digitsOnly(cep).length === 8) void lookupCep(digitsOnly(cep));
          }}
        />
        <Field
          label="Rua"
          required={false}
          autoComplete="address-line1"
          value={form.street}
          onChange={(value) => setForm({ ...form, street: value })}
        />
        <div className="grid grid-cols-2 gap-4">
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
        </div>
        <Field
          label="Bairro"
          required={false}
          value={form.neighborhood}
          onChange={(value) => setForm({ ...form, neighborhood: value })}
        />
        <div className="grid grid-cols-3 gap-4">
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
        <Field
          label="Senha"
          type="password"
          value={form.password}
          onChange={(value) => setForm({ ...form, password: value })}
        />
        <Field
          label="Confirmar senha"
          type="password"
          value={form.confirm}
          onChange={(value) => setForm({ ...form, confirm: value })}
        />
        {error ? <p className="text-sm text-primary">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Salvando…" : "Cadastrar"}
        </Button>
      </form>
    </div>
  );
}

type CadastroForm = {
  name: string;
  email: string;
  phone: string;
  document: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  password: string;
  confirm: string;
};

function CadastroLogado({
  form,
  setForm,
  lookupCep,
}: {
  form: CadastroForm;
  setForm: React.Dispatch<React.SetStateAction<CadastroForm>>;
  lookupCep: (cep: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6 sm:py-12">
      <p className="text-xs font-medium tracking-wide text-primary uppercase">
        Minha conta
      </p>
      <h1 className="mt-3 font-display text-4xl italic sm:text-5xl">Meu cadastro</h1>
      <p className="mt-4 text-muted">Atualize endereço, CPF e senha.</p>
      <form
        className="mt-10 space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          setSaved("");
          try {
            const result = await updateAccount({
              data: {
                name: form.name,
                phone: form.phone,
                document: form.document,
                cep: form.cep,
                street: form.street,
                number: form.number,
                complement: form.complement,
                neighborhood: form.neighborhood,
                city: form.city,
                state: form.state,
              },
            });
            if (!result.ok) {
              setError(result.message);
              return;
            }
            setSaved("Cadastro atualizado.");
          } catch {
            setError("Não foi possível salvar agora.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Nome" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
        <Field
          label="CPF"
          inputMode="numeric"
          value={form.document}
          onChange={(value) => setForm({ ...form, document: formatCpf(value) })}
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
            const cep = formatCep(value);
            setForm((prev) => ({ ...prev, cep }));
            if (digitsOnly(cep).length === 8) void lookupCep(digitsOnly(cep));
          }}
        />
        <Field
          label="Rua"
          required={false}
          value={form.street}
          onChange={(value) => setForm({ ...form, street: value })}
        />
        <div className="grid grid-cols-2 gap-4">
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
        </div>
        <Field
          label="Bairro"
          required={false}
          value={form.neighborhood}
          onChange={(value) => setForm({ ...form, neighborhood: value })}
        />
        <div className="grid grid-cols-3 gap-4">
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
            onChange={(value) => setForm({ ...form, state: value.toUpperCase().slice(0, 2) })}
          />
        </div>
        {error ? <p className="text-sm text-primary">{error}</p> : null}
        {saved ? <p className="text-sm text-muted">{saved}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Salvando…" : "Salvar cadastro"}
        </Button>
      </form>

      <form
        className="mt-12 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          if (newPassword.length < 6) {
            setError("A senha precisa ter pelo menos 6 caracteres.");
            return;
          }
          if (newPassword !== confirm) {
            setError("As senhas não coincidem.");
            return;
          }
          setBusy(true);
          setError("");
          setSaved("");
          try {
            const result = await changeAccountPassword({
              data: { current: currentPassword, password: newPassword },
            });
            if (!result.ok) {
              setError(result.message);
              return;
            }
            setCurrentPassword("");
            setNewPassword("");
            setConfirm("");
            setSaved("Senha atualizada.");
          } catch {
            setError("Não foi possível salvar a senha.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 className="font-display text-2xl italic">Alterar senha</h2>
        <Field
          label="Senha atual"
          type="password"
          required={false}
          value={currentPassword}
          onChange={setCurrentPassword}
        />
        <Field label="Nova senha" type="password" value={newPassword} onChange={setNewPassword} />
        <Field label="Confirmar senha" type="password" value={confirm} onChange={setConfirm} />
        <Button type="submit" disabled={busy}>
          Trocar senha
        </Button>
      </form>
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
  inputMode?: "numeric" | "tel" | "email";
  autoComplete?: string;
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
        inputMode={inputMode}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
