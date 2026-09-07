import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Droplets, Leaf, Recycle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { ProductPhoto } from "@/components/product/product-photo";
import { BrandMark } from "@/components/logo";
import { CycleQuiz } from "@/components/quiz/cycle-quiz";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQS, PRODUCTS, featuredProducts } from "@/lib/products";
import { formatBRL } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const featured = featuredProducts().filter((p) => p.category !== "kit");
  const kit = PRODUCTS.find((p) => p.slug === "kit-4");
  const pads = PRODUCTS.filter((p) => p.category === "pad");

  return (
    <div>
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl lg:grid-cols-2">
          <div className="flex flex-col justify-center px-4 py-10 sm:px-6 sm:py-20 lg:min-h-[34rem] lg:py-24">
            <BrandMark className="mb-4 size-14 sm:mb-5 sm:size-20" />
            <p className="text-[11px] font-medium tracking-[0.16em] text-primary uppercase sm:tracking-[0.2em]">
              Algodão orgânico · certificado GOTS
            </p>
            <h1 className="mt-3 font-display text-[2.15rem] leading-[1.08] italic sm:mt-4 sm:text-5xl lg:text-6xl">
              O ciclo, com outro cuidado.
            </h1>
            <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-muted sm:mt-5 sm:text-base">
              Absorventes reutilizáveis de tecido. Cinco modelos, camadas
              certas, zero descarte a cada mês.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/loja">
                  Ver a loja
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link to="/guia">Escolher o modelo</Link>
              </Button>
            </div>
          </div>
          <div className="relative order-first min-h-64 bg-bg-warm sm:min-h-80 lg:order-last lg:min-h-0">
            <ProductPhoto
              src="/images/products/hero-pad.jpg"
              alt="Absorvente reutilizável de tecido beabsorventes"
              className="h-full min-h-64 sm:min-h-80"
              imgClassName="p-8 sm:p-16"
            />
            <BrandMark className="absolute right-4 bottom-4 hidden size-24 drop-shadow-md sm:block sm:right-8 sm:bottom-8 sm:size-32" />
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
          {[
            {
              icon: Leaf,
              title: "Certificado GOTS",
              text: "Algodão orgânico e tingimento sustentável, da fibra à costura.",
            },
            {
              icon: Droplets,
              title: "Cinco modelos",
              text: "Mini, Íntimo, Principal, Denso e Noturno — um para cada fluxo.",
            },
            {
              icon: Recycle,
              title: "Menos 4 kg de lixo",
              text: "Um ano de tecido evita até 500 absorventes descartáveis.",
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-4">
              <item.icon className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <h2 className="font-medium">{item.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.16em] text-primary uppercase">
              Tamanhos e modelos
            </p>
            <h2 className="mt-2 font-display text-[1.75rem] italic sm:text-3xl">As peças</h2>
          </div>
          <Link to="/loja" className="shrink-0 text-sm text-primary hover:underline">
            Ver todas
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      {kit ? (
        <section className="border-y border-border bg-surface">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
            <ProductPhoto
              src={kit.image}
              alt={kit.name}
              className="aspect-square rounded-lg"
            />
            <div>
              <p className="text-[11px] font-medium tracking-[0.16em] text-primary uppercase">
                O ciclo completo
              </p>
              <h2 className="mt-3 font-display text-4xl italic">{kit.name}</h2>
              <p className="mt-4 max-w-md leading-relaxed text-muted">
                {kit.description}
              </p>
              <p className="mt-4 text-lg tabular-nums">
                {formatBRL(kit.priceCents)}
              </p>
              <Button asChild className="mt-6 w-full sm:w-auto" size="lg">
                <Link to="/produto/$slug" params={{ slug: kit.slug }}>
                  Comprar o kit
                </Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-[11px] font-medium tracking-[0.16em] text-primary uppercase">
          Guia
        </p>
        <h2 className="mt-2 font-display text-[1.75rem] italic sm:text-3xl">Do Mini ao Noturno</h2>
        <div className="-mx-4 mt-8 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0">
          {pads.map((product) => (
            <Link
              key={product.slug}
              to="/produto/$slug"
              params={{ slug: product.slug }}
              className="w-[42%] shrink-0 snap-start text-center sm:w-auto"
            >
              <ProductPhoto
                src={product.image}
                alt={product.name}
                className="aspect-square rounded-lg"
                imgClassName="p-3 sm:p-4"
              />
              <p className="mt-2 font-display text-lg italic leading-tight">
                {product.shortName}
              </p>
              <p className="text-xs text-muted">
                {product.lengthCm} cm · {product.layers} camadas
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-bg-warm">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-medium tracking-[0.16em] text-primary uppercase">
              Guia rápido
            </p>
            <h2 className="mt-3 font-display text-3xl italic">
              Qual absorvente é o seu?
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
              Duas perguntas. Uma recomendação honesta, no modelo certo do ciclo.
            </p>
          </div>
          <CycleQuiz />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl italic">Perguntas frequentes</h2>
        <Accordion type="single" collapsible className="mt-6">
          {FAQS.map((faq) => (
            <AccordionItem key={faq.q} value={faq.q}>
              <AccordionTrigger>{faq.q}</AccordionTrigger>
              <AccordionContent>{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
