import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/logo";
import { getAccount, openAccount } from "@/lib/shop-orders";
import { formatCep, formatPhone } from "@/lib/utils";

export const Route = createFileRoute("/conta")({ component: Conta });

function Conta() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstAccess, setFirstAccess] = useState(false);
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");

  useEffect(() => {
    void getAccount().then((result) => {
      if (result.ok) {
        void navigate({ to: "/compras" });
        return;
      }
      setReady(true);
    });
  }, [navigate]);

  async function onLogin(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await openAccount({
        data: firstAccess ? { email, phone, cep, password: "" } : { email, password },
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      await navigate({ to: "/compras" });
    } catch {
      setError("Não foi possível entrar agora.");
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

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <BrandMark className="mb-6 size-24" />
      <p className="text-xs font-medium tracking-wide text-primary uppercase">
        Minha conta
      </p>
      <h1 className="mt-3 font-display text-4xl italic">Login</h1>
      <p className="mt-3 text-sm text-muted">
        Entre com o e-mail e a senha. O cadastro e as compras ficam em páginas
        separadas.
      </p>
      <form onSubmit={onLogin} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="login-email">E-mail</Label>
          <Input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {firstAccess ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="login-phone">WhatsApp</Label>
              <Input
                id="login-phone"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-cep">CEP</Label>
              <Input
                id="login-cep"
                inputMode="numeric"
                value={cep}
                onChange={(e) => setCep(formatCep(e.target.value))}
              />
            </div>
          </>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="login-senha">Senha</Label>
            <Input
              id="login-senha"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}
        {error ? <p className="text-sm text-primary">{error}</p> : null}
        <Button type="submit" className="w-full" size="lg" disabled={busy}>
          {busy ? "Entrando…" : "Entrar"}
        </Button>
      </form>
      <p className="mt-6 space-y-2 text-sm text-muted">
        <button
          type="button"
          className="block underline-offset-2 hover:underline"
          onClick={() => {
            setFirstAccess((value) => !value);
            setError("");
          }}
        >
          {firstAccess ? "Já tenho senha" : "Primeiro acesso, ainda sem senha"}
        </button>
        <Link
          to="/conta/recuperar"
          className="block text-fg underline-offset-2 hover:underline"
        >
          Esqueci a senha
        </Link>
        <span className="block">
          Ainda não tem cadastro?{" "}
          <Link to="/cadastro" className="text-fg underline-offset-2 hover:underline">
            Cadastre-se
          </Link>
        </span>
      </p>
    </div>
  );
}
