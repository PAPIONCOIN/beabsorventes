import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cuidados")({ component: Cuidados });

const STEPS = [
  {
    title: "Enxágue frio",
    text: "Assim que tirar, passe água fria até sair o excesso. Água quente fixa o ferro no tecido.",
    image: "/images/folding.jpg",
    alt: "Absorvente de tecido sendo dobrado, mostrando os botões das asas",
  },
  {
    title: "Lave com neutro",
    text: "Sabão de coco ou detergente sem amaciante. Máquina no ciclo delicado, ou à mão. Sem alvejante.",
    image: "/images/care.jpg",
    alt: "Absorventes de tecido secando em um varal de madeira perto da janela",
  },
  {
    title: "Seque à sombra",
    text: "Varal ventilado. Sol forte e secadora endurecem o algodão e encurtam a vida da peça.",
    image: "/images/layers.jpg",
    alt: "Camadas de um absorvente de tecido: algodão, núcleo e barreira",
  },
];

function Cuidados() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-xs font-medium tracking-wide text-primary uppercase">
        Cuidados
      </p>
      <h1 className="mt-3 font-display text-4xl italic">Lavar, secar, repetir</h1>
      <p className="mt-4 max-w-xl text-muted">
        A peça dura anos se o cuidado for simples. Três gestos, sempre iguais.
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
              className={`aspect-photo w-full rounded-xl object-cover ${index % 2 ? "lg:order-2" : ""}`}
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
