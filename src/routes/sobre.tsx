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
          <BrandMark className="mb-5 size-28 sm:mb-6 sm:size-36" />
          <p className="text-[11px] font-medium tracking-[0.16em] text-primary uppercase">
            Quem somos
          </p>
          <h1 className="mt-3 font-display text-4xl italic sm:text-5xl">
            Cuidado artesanal, ciclo após ciclo.
          </h1>
          <p className="mt-5 leading-relaxed text-muted">
            A beabsorventes produz absorventes reutilizáveis de algodão
            orgânico, costurados um a um em ateliê. Cada peça é pensada para
            acompanhar o ciclo com conforto, discrição e menor impacto
            ambiental.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            A marca nasceu de duas convicções: reduzir o volume de resíduos
            gerado pela higiene menstrual e devolver à menstruação o lugar de
            cuidado que ela merece.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            Ao longo da vida, uma pessoa menstruante usa cerca de 150 kg de
            absorventes descartáveis. Um ano com tecido evita até 500 unidades
            — o equivalente a aproximadamente 4 kg de resíduo.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            Sem química agressiva na composição e com tecido respirável, as
            peças são uma alternativa mais amena para a saúde íntima do que os
            descartáveis convencionais.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            Desejamos que a experiência com a beabsorventes mostre que o ciclo
            pode ser melhor para o corpo, para o ambiente e para o orçamento.
          </p>
          <Button asChild className="mt-8">
            <Link to="/loja">Conhecer as peças</Link>
          </Button>
        </div>
        <ProductPhoto
          src="/images/about.jpg"
          alt="Absorvente reutilizável de tecido beabsorventes"
          className="aspect-square rounded-lg"
        />
      </section>
    </div>
  );
}
