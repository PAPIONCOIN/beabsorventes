import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ProductPhoto } from "@/components/product/product-photo";
import { BrandMark } from "@/components/logo";

export const Route = createFileRoute("/sobre")({ component: Sobre });

function Sobre() {
  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2">
        <div>
          <BrandMark className="mb-6 size-24" />
          <p className="text-[11px] font-medium tracking-[0.16em] text-primary uppercase">
            Quem somos
          </p>
          <h1 className="mt-3 font-display text-4xl italic">
            Seja bem-vinde ao beabsorventes.
          </h1>
          <p className="mt-5 leading-relaxed text-muted">
            Os absorventes são produzidos artesanalmente em máquina doméstica.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            Surgiu primeiramente da necessidade de colaborar com o meio
            ambiente, pois a humanidade tem produzido demasiada quantidade de
            lixo. Depois, da urgência de recorrer ao CICLO menstrual e toda
            sabedoria que ele nos revela.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            Ao longo da vida cíclica usamos cerca de 150 kg de absorventes. Se
            usarmos absorventes de tecido por um ano, podemos reduzir até 500
            unidades de descartáveis, equivalente a 4 kg de lixo.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            Os absorventes de tecido são melhores para a saúde porque não
            possuem química em sua composição, são mais respiráveis que os
            descartáveis e por isso mais indicados para a saúde íntima.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            A sociedade moderna mostra-se passiva quando o assunto é
            menstruação: sabe que existe, mas ignora. Enquanto, na verdade, a
            menstruação afeta positivamente o crescimento físico, emocional,
            intelectual e espiritual da mulher.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            Desejamos que sua experiência com beabsorventes revele o quanto sua
            menstruação pode ser boa para o ambiente, para a sua saúde íntima e
            também para o seu bolso.
          </p>
          <Button asChild className="mt-8">
            <Link to="/loja">Ver as peças</Link>
          </Button>
        </div>
        <ProductPhoto
          src="/images/products/pad-3.jpg"
          alt="Absorvente reutilizável de tecido beabsorventes"
          className="aspect-square rounded-lg"
        />
      </section>
    </div>
  );
}
