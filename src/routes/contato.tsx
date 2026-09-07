import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_TOPICS,
  CONTACT_WHATSAPP,
  mailToUrl,
  type ContactTopic,
} from "@/lib/contact";
import { formatPhone } from "@/lib/utils";
import { BrandMark } from "@/components/logo";

export const Route = createFileRoute("/contato")({ component: Contato });

function Contato() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    topic: CONTACT_TOPICS[0] as ContactTopic,
    message: "",
  });

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || "não informado",
          topic: form.topic,
          message: form.message,
          _subject: `Contato beabsorventes · ${form.topic}`,
          _template: "box",
          _captcha: "false",
          _replyto: form.email,
        }),
      });
      if (!res.ok) {
        throw new Error("formsubmit");
      }
      setSent(true);
    } catch {
      setError(
        "Não foi possível enviar agora. Use o e-mail ao lado ou tente de novo.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:gap-12 sm:px-6 sm:py-12 lg:grid-cols-[1fr_22rem]">
      <div>
        <p className="text-xs font-medium tracking-wide text-primary uppercase">
          Contato
        </p>
        <h1 className="mt-3 font-display text-4xl italic sm:text-5xl">Fale conosco</h1>
        <p className="mt-4 max-w-xl text-muted">
          A mensagem deste formulário chega no e-mail {CONTACT_EMAIL}.
        </p>

        {sent ? (
          <div className="mt-10 rounded-xl bg-bg-warm p-6">
            <h2 className="font-display text-2xl italic">Mensagem enviada</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Recebemos no e-mail {CONTACT_EMAIL}. Respondemos em horário comercial.
            </p>
            <button
              type="button"
              className="mt-6 text-sm text-muted hover:text-fg"
              onClick={() => {
                setSent(false);
                setForm((prev) => ({ ...prev, message: "" }));
              }}
            >
              Escrever nova mensagem
            </button>
          </div>
        ) : (
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
              label="Telefone"
              required={false}
              value={form.phone}
              onChange={(value) => setForm({ ...form, phone: formatPhone(value) })}
            />
            <div className="space-y-1.5">
              <Label htmlFor="assunto">Assunto</Label>
              <select
                id="assunto"
                required
                value={form.topic}
                onChange={(e) =>
                  setForm({
                    ...form,
                    topic: e.target.value as ContactTopic,
                  })
                }
                className="flex h-11 w-full rounded-md border border-border bg-surface px-3 text-base text-fg focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {CONTACT_TOPICS.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mensagem">Mensagem</Label>
              <Textarea
                id="mensagem"
                required
                minLength={10}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
            {error ? <p className="text-sm text-primary">{error}</p> : null}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? "Enviando…" : "Enviar e-mail"}
            </Button>
          </form>
        )}
      </div>

      <aside className="h-fit rounded-xl bg-bg-warm p-6">
        <BrandMark className="mb-4 size-28" />
        <h2 className="font-display text-2xl italic">Atendimento</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Segunda a sexta, das 9h às 18h.
        </p>
        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="text-muted">E-mail</dt>
            <dd>
              <a className="hover:text-primary" href={mailToUrl()}>
                {CONTACT_EMAIL}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-muted">WhatsApp</dt>
            <dd>
              <a
                className="hover:text-primary"
                href={CONTACT_WHATSAPP}
                target="_blank"
                rel="noreferrer"
              >
                {CONTACT_PHONE_DISPLAY}
              </a>
            </dd>
          </div>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
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
      />
    </div>
  );
}
