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
      { label: "Leve", value: "leve" },
      { label: "Médio", value: "medio" },
      { label: "Intenso", value: "intenso" },
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
  {
    key: "postpartum" as const,
    question: "É para o pós-parto?",
    options: [
      { label: "Sim", value: true },
      { label: "Não", value: false },
    ],
  },
];

export function CycleQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const current = STEPS[step];
  const done =
    answers.flow !== undefined &&
    answers.night !== undefined &&
    answers.postpartum !== undefined;

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
              setStep(0);
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
      <p className="text-xs font-medium tracking-wide text-muted uppercase">
        {step + 1} de {STEPS.length}
      </p>
      <h3 className="mt-3 font-display text-2xl italic sm:text-3xl">
        {current.question}
      </h3>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {current.options.map((option) => (
          <Button
            key={String(option.value)}
            type="button"
            variant="outline"
            className="justify-start bg-surface"
            onClick={() => {
              setAnswers((prev) => ({ ...prev, [current.key]: option.value }));
              setStep((s) => s + 1);
            }}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
