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
        Guia
      </p>
      <h1 className="mt-3 font-display text-4xl italic">
        Fluxo, tamanho, noite
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        O modelo segue o fluxo. O tamanho segue a calcinha. Se restar dúvida,
        o quiz escolhe uma peça — não um kit.
      </p>

      <div className="mt-12 overflow-x-auto">
        <table className="w-full min-w-lg text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="py-3 font-medium">Peça</th>
              <th className="py-3 font-medium">Fluxo</th>
              <th className="py-3 font-medium">Comprimento</th>
              <th className="py-3 font-medium">Tamanhos</th>
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
                <td className="py-3 text-muted">{product.sizes.join(", ")}</td>
                <td className="py-3 tabular-nums">
                  {formatBRL(product.priceCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-16 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl italic">Tamanho da calcinha</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
            <li>
              <span className="font-medium text-fg">P</span> — calcinhas menores,
              cintura baixa, pouca cobertura nas laterais.
            </li>
            <li>
              <span className="font-medium text-fg">M</span> — a maioria. Se a
              sua calcinha é 38–42, comece aqui.
            </li>
            <li>
              <span className="font-medium text-fg">G</span> — mais asa, mais
              comprimento útil. Melhor para cintura média e alta.
            </li>
          </ul>
        </div>
        <CycleQuiz />
      </section>
    </div>
  );
}
