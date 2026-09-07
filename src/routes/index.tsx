import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Droplets, Leaf, Recycle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { CycleQuiz } from "@/components/quiz/cycle-quiz";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQS, TESTIMONIALS, featuredProducts } from "@/lib/products";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const featured = featuredProducts();

  return (
    <div>
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl lg:grid-cols-2">
          <div className="flex flex-col justify-center px-4 py-16 sm:px-6 sm:py-20 lg:min-h-[36rem] lg:py-24">
            <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
              Absorventes reutilizáveis de tecido
            </p>
            <h1 className="mt-4 font-display text-4xl italic sm:text-5xl">
              O ciclo, com outro cuidado.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
              Peças de algodão orgânico feitas para durar anos — não horas.
              Conforto real, absorção de verdade, zero descarte a cada mês.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/loja">
                  Ver a loja
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/guia">Descubra o seu</Link>
              </Button>
            </div>
          </div>
          <div className="min-h-96 bg-bg-warm lg:min-h-0">
            <img
              src="/images/hero.jpg"
              alt="Mulher em um quarto iluminado ao lado de absorventes de tecido dobrados"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              icon: Leaf,
              title: "Algodão orgânico",
              text: "A camada que toca a pele é tecido, não plástico. Respira, não esquenta.",
            },
            {
              icon: Droplets,
              title: "Absorve de verdade",
              text: "Núcleo em camadas e barreira posterior. Cada modelo tem um fluxo certo.",
            },
            {
              icon: Recycle,
              title: "Anos, não horas",
              text: "Lavar, secar, repetir. Uma peça bem cuidada cobre dezenas de ciclos.",
            },
          ].map((item) => (
            <div key={item.title}>
              <item.icon className="size-5 text-primary" />
              <h2 className="mt-3 font-display text-2xl italic">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl italic">As peças</h2>
            <Link to="/loja" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            Guia rápido
          </p>
          <h2 className="mt-3 font-display text-3xl italic">
            Qual absorvente é o seu?
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            Três perguntas. Uma recomendação honesta — sem empurrar o kit mais
            caro.
          </p>
        </div>
        <CycleQuiz />
      </section>

      <section className="border-y border-border bg-bg-warm">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <blockquote key={item.name}>
              <p className="font-display text-xl leading-snug italic">
                “{item.text}”
              </p>
              <footer className="mt-4 text-sm text-muted">
                {item.name} · {item.city}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <img
          src="/images/vanity.jpg"
          alt="Penteadeira com absorventes de tecido e necessaire de argila"
          className="aspect-photo w-full rounded-xl object-cover"
        />
        <div>
          <h2 className="font-display text-3xl italic">Perguntas frequentes</h2>
          <Accordion type="single" collapsible className="mt-6">
            {FAQS.map((faq) => (
              <AccordionItem key={faq.q} value={faq.q}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
