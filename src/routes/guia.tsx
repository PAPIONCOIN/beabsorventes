import { createFileRoute, Link } from "@tanstack/react-router";
import { CycleQuiz } from "@/components/quiz/cycle-quiz";
import { PRODUCTS, flowLabel } from "@/lib/products";
import { formatBRL } from "@/lib/utils";

export const Route = createFileRoute("/guia")({ component: Guia });

function Guia() {
  const pads = PRODUCTS.filter((p) => p.category === "pad");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-xs font-medium tracking-wide text-primary uppercase">
        Modelos
      </p>
      <h1 className="mt-3 font-display text-4xl italic sm:text-5xl">Guia de modelos</h1>
      <p className="mt-4 max-w-xl text-muted">
        Algodão orgânico certificado GOTS. Escolha o comprimento e o número de
        camadas de acordo com o seu fluxo.
      </p>

      <ul className="mt-10 space-y-3 md:hidden">
        {pads.map((product) => (
          <li key={product.slug}>
            <Link
              to="/produto/$slug"
              params={{ slug: product.slug }}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3"
            >
              <span>
                <span className="block font-medium">{product.shortName}</span>
                <span className="text-xs text-muted">
                  {product.lengthCm} cm · {product.layers} camadas
                </span>
              </span>
              <span className="shrink-0 text-sm tabular-nums">
                {formatBRL(product.priceCents)}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-12 hidden overflow-x-auto md:block">
        <table className="w-full min-w-lg text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="py-3 font-medium">Peça</th>
              <th className="py-3 font-medium">Fluxo</th>
              <th className="py-3 font-medium">Comprimento</th>
              <th className="py-3 font-medium">Camadas</th>
              <th className="py-3 font-medium">Preço</th>
            </tr>
          </thead>
          <tbody>
            {pads.map((product) => (
              <tr key={product.slug} className="border-b border-border">
                <td className="py-3">
                  <Link
                    to="/produto/$slug"
                    params={{ slug: product.slug }}
                    className="hover:text-primary"
                  >
                    {product.shortName}
                  </Link>
                </td>
                <td className="py-3 text-muted">{flowLabel(product.flow)}</td>
                <td className="py-3 tabular-nums text-muted">
                  {product.lengthCm ? `${product.lengthCm} cm` : "—"}
                </td>
                <td className="py-3 tabular-nums text-muted">
                  {product.layers ?? "—"}
                </td>
                <td className="py-3 tabular-nums">
                  {formatBRL(product.priceCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-10 max-w-2xl space-y-4 text-sm leading-relaxed text-muted">
        <li>
          <span className="font-medium text-fg">Ciclo Mini 16 cm</span> — uma
          camada absorvente e tecido impermeável. Indicado para o fluxo leve,
          especialmente no final da menstruação.
        </li>
        <li>
          <span className="font-medium text-fg">Ciclo Íntimo 22 cm</span> — duas
          camadas, com a parte posterior mais fina. Indicado para fluxo leve,
          em qualquer período.
        </li>
        <li>
          <span className="font-medium text-fg">Ciclo Principal 24 cm</span> —
          duas camadas. Indicado para fluxos moderados, em qualquer período.
        </li>
        <li>
          <span className="font-medium text-fg">Ciclo Denso 28 cm</span> — três
          camadas. Indicado para fluxos intensos, em qualquer período.
        </li>
        <li>
          <span className="font-medium text-fg">Noturno 30 cm</span> — quatro
          camadas e parte posterior mais larga. Indicado para o uso noturno.
        </li>
      </ul>

      <section className="mt-16 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl italic">Ainda em dúvida?</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            O questionário indica um modelo, não um kit. O kit de quatro peças
            reúne Mini, Íntimo, Principal e Denso.
          </p>
        </div>
        <CycleQuiz />
      </section>
    </div>
  );
}
