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
      <section className="overflow-hidden border-b border-border lg:relative">
        <img
          src="/images/brand/banner.jpg"
          alt="Kit de absorventes reutilizáveis de tecido beabsorventes"
          className="h-52 w-full object-cover object-[78%_center] sm:h-72 lg:absolute lg:inset-0 lg:h-[36rem]"
        />
        <div className="bg-bg px-4 py-8 sm:px-6 sm:py-10 lg:relative lg:flex lg:h-[36rem] lg:items-center lg:bg-transparent lg:py-0">
          <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-bg from-15% via-bg/85 to-transparent lg:block" />
          <div className="relative mx-auto w-full max-w-6xl">
            <BrandMark className="mb-4 size-16 sm:size-20 lg:size-24" />
            <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase sm:text-sm sm:tracking-[0.16em]">
              Algodão orgânico · certificado GOTS
            </p>
            <h1 className="mt-3 max-w-xl font-display text-[1.85rem] leading-[1.12] italic sm:mt-4 sm:text-5xl lg:text-6xl">
              Seu ciclo, com outro cuidado.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted sm:mt-5 sm:text-lg">
              Absorventes reutilizáveis de algodão orgânico. O kit reúne Mini,
              Íntimo, Principal e Denso — a proteção certa para cada fase do ciclo.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/produto/$slug" params={{ slug: "kit-4" }}>
                  Comprar o kit
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link to="/loja">Ver a loja</Link>
              </Button>
            </div>
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
              text: "Mini, Íntimo, Principal, Denso e Noturno — um para cada intensidade de fluxo.",
            },
            {
              icon: Recycle,
              title: "Menos 4 kg de resíduo",
              text: "Um ano de uso em tecido evita até 500 absorventes descartáveis.",
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
            <p className="text-xs font-medium tracking-[0.12em] text-primary uppercase">
              Tamanhos e modelos
            </p>
            <h2 className="mt-2 font-display text-3xl italic sm:text-4xl">As peças</h2>
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
              <p className="text-xs font-medium tracking-[0.12em] text-primary uppercase">
                Kit completo
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

      <section className="overflow-x-clip">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-xs font-medium tracking-[0.12em] text-primary uppercase">
          Guia
        </p>
        <h2 className="mt-2 font-display text-3xl italic sm:text-4xl">Do Mini ao Noturno</h2>
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
                imgClassName="p-0"
              />
              <p className="mt-2 font-display text-xl italic leading-tight">
                {product.shortName}
              </p>
              <p className="text-sm text-muted">
                {product.lengthCm} cm · {product.layers} camadas
              </p>
            </Link>
          ))}
        </div>
        </div>
      </section>

      <section className="border-y border-border bg-bg-warm">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium tracking-[0.12em] text-primary uppercase">
              Guia rápido
            </p>
            <h2 className="mt-3 font-display text-3xl italic">
              Qual modelo combina com você?
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
              Duas perguntas objetivas. Uma recomendação alinhada ao seu fluxo.
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
