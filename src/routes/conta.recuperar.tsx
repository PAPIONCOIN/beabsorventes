import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/logo";
import { requestPasswordReset } from "@/lib/customer-auth";

export const Route = createFileRoute("/conta/recuperar")({ component: Recuperar });

function Recuperar() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await requestPasswordReset({ data: { email } });
      setDone(true);
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
      <h1 className="mt-3 font-display text-4xl italic">Esqueci a senha</h1>
      {done ? (
        <>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Se este e-mail estiver cadastrado, enviamos um link para criar uma
            nova senha. No primeiro envio, pode chegar um pedido de confirmação
            do FormSubmit — abra e confirme.
          </p>
          <Button asChild className="mt-8">
            <Link to="/conta">Voltar ao login</Link>
          </Button>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm text-muted">
            Informe o e-mail do cadastro. Você recebe um link para criar outra
            senha.
          </p>
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="recuperar-email">E-mail</Label>
              <Input
                id="recuperar-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={busy}>
              {busy ? "Enviando…" : "Enviar link"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
