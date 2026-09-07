import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/logo";
import { resetPasswordWithToken } from "@/lib/customer-auth";

export const Route = createFileRoute("/conta/redefinir")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  component: Redefinir,
});

function Redefinir() {
  const { token } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (!token) {
      setError("Este link está incompleto. Peça um novo.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await resetPasswordWithToken({ data: { token, password } });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setDone(true);
    } catch {
      setError("Não foi possível salvar agora.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <BrandMark className="mb-6 size-24" />
      <p className="text-xs font-medium tracking-wide text-primary uppercase">
        Minha conta
      </p>
      <h1 className="mt-3 font-display text-4xl italic">Nova senha</h1>
      {done ? (
        <>
          <p className="mt-4 text-sm text-muted">
            Senha atualizada. Entre com o e-mail e a nova senha.
          </p>
          <Button asChild className="mt-8">
            <Link to="/conta">Entrar</Link>
          </Button>
        </>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nova-senha">Nova senha</Label>
            <Input
              id="nova-senha"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmar-senha">Confirmar senha</Label>
            <Input
              id="confirmar-senha"
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-primary">{error}</p> : null}
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? "Salvando…" : "Salvar senha"}
          </Button>
        </form>
      )}
    </div>
  );
}
