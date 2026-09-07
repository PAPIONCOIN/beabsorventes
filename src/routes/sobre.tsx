import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sobre")({ component: Sobre });

function Sobre() {
  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            O ateliê
          </p>
          <h1 className="mt-3 font-display text-4xl italic">
            Costurado devagar, para durar.
          </h1>
          <p className="mt-5 leading-relaxed text-muted">
            Beabsorventes nasceu de um incômodo simples: um produto íntimo não
            deveria ser lixo no fim do dia. Cada peça é cortada em algodão
            orgânico, montada em três camadas e fechada com botão de pressão —
            o suficiente para ficar no lugar, nada a mais.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            Trabalhamos em pequenos lotes. As estampas mudam conforme o tecido
            que entra no ateliê. O que não muda é o toque contra a pele.
          </p>
          <Button asChild className="mt-8">
            <Link to="/loja">Ver as peças</Link>
          </Button>
        </div>
        <img
          src="/images/about.jpg"
          alt="Mesa de ateliê com tecido, tesoura e um absorvente em montagem"
          className="aspect-photo w-full rounded-xl object-cover"
        />
      </section>
    </div>
  );
}
