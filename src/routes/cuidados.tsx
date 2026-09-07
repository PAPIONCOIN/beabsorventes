import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cuidados")({ component: Cuidados });

const STEPS = [
  {
    title: "Enxágue em água fria",
    text: "Assim que retirar a peça, enxágue em água fria até eliminar o excesso. Água quente fixa o ferro no tecido.",
    image: "/images/products/ciclo-mini.jpg",
    alt: "Ciclo Mini, absorvente de tecido beabsorventes",
  },
  {
    title: "Lave na máquina",
    text: "Use sabão neutro e ciclo delicado. Evite alvejante e amaciante. Não utilize secadora.",
    image: "/images/products/ciclo-principal.jpg",
    alt: "Ciclo Principal, absorvente de tecido beabsorventes",
  },
  {
    title: "Seque à sombra",
    text: "Prefira um varal ventilado. Sol intenso e secadora ressecam o algodão e reduzem a durabilidade da peça.",
    image: "/images/products/noturno-2.jpg",
    alt: "Absorvente noturno de tecido beabsorventes",
  },
];

function Cuidados() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <p className="text-xs font-medium tracking-wide text-primary uppercase">
        Como lavar
      </p>
      <h1 className="mt-3 font-display text-4xl italic sm:text-5xl">Conservação das peças</h1>
      <p className="mt-4 max-w-xl text-muted">
        As peças são laváveis em máquina. Não utilize secadora. Três etapas,
        sempre na mesma ordem.
      </p>
      <div className="mt-12 space-y-16">
        {STEPS.map((step, index) => (
          <article
            key={step.title}
            className="grid items-center gap-8 lg:grid-cols-2"
          >
            <img
              src={step.image}
              alt={step.alt}
              className={`aspect-square w-full rounded-lg bg-surface object-contain p-6 sm:p-8 ${index % 2 ? "lg:order-2" : ""}`}
            />
            <div>
              <p className="text-xs tabular-nums text-muted">0{index + 1}</p>
              <h2 className="mt-2 font-display text-3xl italic">{step.title}</h2>
              <p className="mt-3 max-w-md leading-relaxed text-muted">
                {step.text}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
