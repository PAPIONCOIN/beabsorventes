import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { recommendFromQuiz, type QuizAnswers } from "@/lib/products";
import { formatBRL } from "@/lib/utils";

const STEPS = [
  {
    key: "flow" as const,
    question: "Como é o seu fluxo no pico?",
    options: [
      { label: "Leve", value: "leve" as const },
      { label: "Moderado", value: "medio" as const },
      { label: "Intenso", value: "intenso" as const },
    ],
  },
  {
    key: "night" as const,
    question: "Você precisa de cobertura para dormir?",
    options: [
      { label: "Sim, a noite inteira", value: true },
      { label: "Não, só de dia", value: false },
    ],
  },
];

export function CycleQuiz() {
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const step =
    answers.flow === undefined ? 0 : answers.night === undefined ? 1 : 2;
  const current = STEPS[step];
  const done = answers.flow !== undefined && answers.night !== undefined;

  if (done) {
    const product = recommendFromQuiz(answers as QuizAnswers);
    return (
      <div className="rounded-xl bg-bg-warm p-6 sm:p-8">
        <p className="text-xs font-medium tracking-wide text-primary uppercase">
          A peça certa
        </p>
        <h3 className="mt-2 font-display text-3xl italic">{product.name}</h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
          {product.description}
        </p>
        <p className="mt-4 text-sm tabular-nums">{formatBRL(product.priceCents)}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/produto/$slug" params={{ slug: product.slug }}>
              Ver essa peça
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setAnswers({});
            }}
          >
            Refazer
          </Button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="rounded-xl bg-bg-warm p-6 sm:p-8">
      <p className="text-xs text-muted">
        {step + 1} / {STEPS.length}
      </p>
      <h3 className="mt-2 font-display text-2xl italic">{current.question}</h3>
      <div className="mt-6 flex flex-col gap-2">
        {current.options.map((option) => (
          <button
            key={String(option.label)}
            type="button"
            className="h-11 rounded-md border border-border bg-surface px-4 text-left text-sm hover:border-fg"
            onClick={() => {
              setAnswers((prev) => ({ ...prev, [current.key]: option.value }));
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
