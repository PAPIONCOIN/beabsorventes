import { useEffect, useState } from "react";
import { quoteShipping, type QuotedShipping } from "@/lib/shipping";
import { ORIGIN_CEP_LABEL, readSavedCep, saveCep } from "@/lib/origin-cep";
import { digitsOnly, formatBRL, formatCep } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CartLine } from "@/lib/cart-store";

export function FreightQuote({
  items,
  onQuoted,
  inputId = "frete-cep",
}: {
  items: CartLine[];
  onQuoted?: (cep: string, quotes: QuotedShipping[]) => void;
  inputId?: string;
}) {
  const [cep, setCep] = useState("");
  const [quoting, setQuoting] = useState(false);
  const [quotes, setQuotes] = useState<QuotedShipping[]>([]);
  const [picked, setPicked] = useState<number | null>(null);

  const itemKey = items.map((item) => `${item.slug}:${item.qty}:${item.size}`).join("|");

  useEffect(() => {
    const saved = readSavedCep();
    if (saved.length === 8) {
      setCep(formatCep(saved));
      void load(saved);
    }
    // Reload when the bag contents change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemKey]);

  async function load(cepDigits: string) {
    if (cepDigits.length !== 8 || items.length === 0) return;
    setQuoting(true);
    try {
      const result = await quoteShipping({ data: { cep: cepDigits, items } });
      setQuotes(result.quotes);
      setPicked(result.quotes[0]?.serviceId ?? null);
      onQuoted?.(cepDigits, result.quotes);
    } catch {
      setQuotes([]);
      setPicked(null);
    } finally {
      setQuoting(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-sm font-medium">Calcular frete</p>
      <p className="mt-1 text-xs text-muted">
        Postagem saindo de {ORIGIN_CEP_LABEL}
      </p>
      <div className="mt-3 space-y-1.5">
        <Label htmlFor={inputId}>CEP</Label>
        <Input
          id={inputId}
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          value={cep}
          onChange={(event) => {
            const next = formatCep(event.target.value);
            setCep(next);
            const digits = digitsOnly(next);
            if (digits.length === 8) {
              saveCep(digits);
              void load(digits);
            }
          }}
        />
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-xs text-muted">Escolha uma peça para cotar o envio.</p>
      ) : quoting ? (
        <p className="mt-3 text-sm text-muted">Consultando Correios…</p>
      ) : quotes.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {quotes.map((quote) => {
            const active = picked === quote.serviceId;
            return (
              <li key={quote.serviceId}>
                <button
                  type="button"
                  onClick={() => {
                    setPicked(quote.serviceId);
                    onQuoted?.(digitsOnly(cep), quotes);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left text-sm ${
                    active ? "border-fg bg-fg text-bg" : "border-border"
                  }`}
                >
                  <span>
                    <span className="block font-medium">
                      {quote.company} {quote.name}
                    </span>
                    <span className={active ? "text-bg/80" : "text-muted"}>
                      até {quote.days} dia{quote.days === 1 ? "" : "s"} úteis
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {quote.payableCents === 0 ? "Grátis" : formatBRL(quote.payableCents)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : digitsOnly(cep).length === 8 ? (
        <p className="mt-3 text-xs text-muted">Não foi possível cotar agora. Tente outro CEP.</p>
      ) : null}
    </div>
  );
}
