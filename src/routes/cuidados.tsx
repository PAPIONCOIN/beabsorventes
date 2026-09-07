import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cuidados")({ component: Cuidados });

const STEPS = [
  {
    title: "Enxágue frio",
    text: "Assim que tirar, passe água fria até sair o excesso. Água quente fixa o ferro no tecido.",
    image: "/images/products/ciclo-mini.jpg",
    alt: "Ciclo Mini, absorvente de tecido beabsorventes",
  },
  {
    title: "Pode ir à máquina",
    text: "Lave com sabão neutro, ciclo delicado. Sem alvejante e sem amaciante. Não utilize secadora.",
    image: "/images/products/ciclo-principal.jpg",
    alt: "Ciclo Principal, absorvente de tecido beabsorventes",
  },
  {
    title: "Seque à sombra",
    text: "Varal ventilado. Sol forte e secadora endurecem o algodão e encurtam a vida da peça.",
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
      <h1 className="mt-3 font-display text-[2rem] italic sm:text-4xl">Lavar, secar, repetir</h1>
      <p className="mt-4 max-w-xl text-muted">
        Pode ser lavado em máquina. Não utilizar secadora. Três gestos, sempre
        iguais.
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
