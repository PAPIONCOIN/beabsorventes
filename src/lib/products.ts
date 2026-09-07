export type Category = "pad" | "kit" | "bag";
export type FlowId =
  | "leve"
  | "medio"
  | "intenso"
  | "noturno"
  | "posparto"
  | "kit"
  | "bag";
export type SizeId = "P" | "M" | "G" | "Único";
export type PrintId =
  | "linho"
  | "terra"
  | "flores"
  | "noite"
  | "misto"
  | "argila";

export type Print = {
  id: PrintId;
  name: string;
  swatch: string;
};

export const PRINTS: Record<PrintId, Print> = {
  linho: { id: "linho", name: "Linho", swatch: "bg-print-linho" },
  terra: { id: "terra", name: "Terra", swatch: "bg-print-terra" },
  flores: { id: "flores", name: "Flores", swatch: "bg-print-flores" },
  noite: { id: "noite", name: "Noite", swatch: "bg-print-noite" },
  misto: { id: "misto", name: "Misto", swatch: "bg-print-misto" },
  argila: { id: "argila", name: "Argila", swatch: "bg-print-argila" },
};

export const PAD_PRINTS: PrintId[] = ["linho", "terra", "flores", "noite"];

export type KitContent = {
  slug: string;
  qty: number;
  size?: SizeId;
};

export type Product = {
  slug: string;
  name: string;
  shortName: string;
  priceCents: number;
  flow: FlowId;
  lengthCm: number | null;
  sizes: SizeId[];
  prints: PrintId[];
  image: string;
  category: Category;
  featured?: boolean;
  contents?: KitContent[];
  description: string;
  details: string[];
};

export const PRODUCTS: Product[] = [
  {
    slug: "protetor",
    name: "Protetor diário",
    shortName: "Protetor",
    priceCents: 3200,
    flow: "leve",
    lengthCm: 18,
    sizes: ["Único"],
    prints: PAD_PRINTS,
    image: "/images/products/protetor.jpg",
    category: "pad",
    description:
      "Uma linha fina para o começo e o fim do ciclo, ou para os dias em que o corpo pede pouco. Dezoito centímetros, algodão orgânico, costura firme.",
    details: [
      "18 cm, tamanho único",
      "Camada de algodão orgânico contra a pele",
      "Asas com botão de pressão",
      "Seca rápido no varal",
    ],
  },
  {
    slug: "diurno",
    name: "Absorvente diurno",
    shortName: "Diurno",
    priceCents: 4200,
    flow: "medio",
    lengthCm: 24,
    sizes: ["P", "M", "G"],
    prints: PAD_PRINTS,
    image: "/images/products/diurno.jpg",
    category: "pad",
    featured: true,
    description:
      "O absorvente do dia. Corpo de 24 cm, absorção média, asas que acompanham a calcinha sem marcar. Feito para o trabalho, a casa, a rua.",
    details: [
      "24 cm, tamanhos P, M e G",
      "Núcleo de algodão e flanela",
      "Barreira posterior respirável",
      "Troca a cada 3 a 5 horas, conforme o fluxo",
    ],
  },
  {
    slug: "super",
    name: "Absorvente super",
    shortName: "Super",
    priceCents: 4900,
    flow: "intenso",
    lengthCm: 28,
    sizes: ["M", "G"],
    prints: PAD_PRINTS,
    image: "/images/products/super.jpg",
    category: "pad",
    featured: true,
    description:
      "Para os dias de fluxo intenso. Vinte e oito centímetros, núcleo mais denso, a mesma suavidade do algodão. Fica no lugar.",
    details: [
      "28 cm, tamanhos M e G",
      "Núcleo reforçado em camadas",
      "Asas largas com dois botões",
      "Indicado para a primeira metade do ciclo",
    ],
  },
  {
    slug: "noturno",
    name: "Absorvente noturno",
    shortName: "Noturno",
    priceCents: 5600,
    flow: "noturno",
    lengthCm: 32,
    sizes: ["M", "G"],
    prints: PAD_PRINTS,
    image: "/images/products/noturno.jpg",
    category: "pad",
    featured: true,
    description:
      "Trinta e dois centímetros para dormir sem se preocupar. O comprimento cobre a calcinha inteira; o núcleo aguenta a noite.",
    details: [
      "32 cm, tamanhos M e G",
      "Cauda alongada",
      "Absorção para 8 a 10 horas",
      "Também serve em dias longos fora de casa",
    ],
  },
  {
    slug: "posparto",
    name: "Absorvente pós-parto",
    shortName: "Pós-parto",
    priceCents: 6200,
    flow: "posparto",
    lengthCm: 35,
    sizes: ["Único"],
    prints: PAD_PRINTS,
    image: "/images/products/posparto.jpg",
    category: "pad",
    description:
      "Peça extra longa, pensada para as semanas depois do parto. Tecido macio, sem plástico, para um corpo que ainda se recupera.",
    details: [
      "35 cm, tamanho único",
      "Volume generoso, toque suave",
      "Costura achatada nas bordas",
      "Uso também em fluxos muito intensos",
    ],
  },
  {
    slug: "kit-iniciante",
    name: "Kit iniciante",
    shortName: "Kit iniciante",
    priceCents: 15900,
    flow: "kit",
    lengthCm: null,
    sizes: ["M"],
    prints: ["misto"],
    image: "/images/products/kit-iniciante.jpg",
    category: "kit",
    featured: true,
    contents: [
      { slug: "protetor", qty: 1, size: "Único" },
      { slug: "diurno", qty: 1, size: "M" },
      { slug: "super", qty: 1, size: "M" },
      { slug: "noturno", qty: 1, size: "M" },
    ],
    description:
      "Quatro peças para conhecer o tecido no próprio ciclo: um protetor, um diurno, um super e um noturno, todos no tamanho M.",
    details: [
      "1 protetor, 1 diurno, 1 super, 1 noturno",
      "Tamanho M",
      "Estampas mistas do ateliê",
      "O caminho mais simples para começar",
    ],
  },
  {
    slug: "kit-completo",
    name: "Kit completo",
    shortName: "Kit completo",
    priceCents: 32900,
    flow: "kit",
    lengthCm: null,
    sizes: ["M", "G"],
    prints: ["misto"],
    image: "/images/products/kit-completo.jpg",
    category: "kit",
    contents: [
      { slug: "protetor", qty: 2, size: "Único" },
      { slug: "diurno", qty: 2 },
      { slug: "super", qty: 2 },
      { slug: "noturno", qty: 2 },
      { slug: "necessaire", qty: 1, size: "Único" },
    ],
    description:
      "Duas de cada peça, mais a necessaire de argila. Suficiente para um ciclo inteiro sem lavar no meio — e para guardar tudo no mesmo lugar.",
    details: [
      "2 protetores, 2 diurnos, 2 super, 2 noturnos",
      "Necessaire de lona argila",
      "Tamanhos M ou G",
      "Frete grátis neste valor",
    ],
  },
  {
    slug: "necessaire",
    name: "Necessaire",
    shortName: "Necessaire",
    priceCents: 4800,
    flow: "bag",
    lengthCm: null,
    sizes: ["Único"],
    prints: ["argila"],
    image: "/images/products/necessaire.jpg",
    category: "bag",
    description:
      "Bolsa de lona no tom argila, forrada, para levar as peças limpas e as usadas. Cabe na bolsa, cabe na gaveta.",
    details: [
      "Tamanho único",
      "Lona de algodão, forro impermeável leve",
      "Zíper curto, fácil de abrir com uma mão",
      "Pode ir à máquina, ciclo delicado",
    ],
  },
];

const FLOW_LABELS: Record<FlowId, string> = {
  leve: "Fluxo leve",
  medio: "Fluxo médio",
  intenso: "Fluxo intenso",
  noturno: "Noite",
  posparto: "Pós-parto",
  kit: "Kit",
  bag: "Necessaire",
};

export function flowLabel(flow: FlowId) {
  return FLOW_LABELS[flow];
}

export function getProduct(slug: string) {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function featuredProducts() {
  return PRODUCTS.filter((p) => p.featured);
}

export function productsByCategory(category: Category | "all") {
  if (category === "all") return PRODUCTS;
  return PRODUCTS.filter((p) => p.category === category);
}

export function relatedProducts(slug: string, limit = 3) {
  const current = getProduct(slug);
  if (!current) return PRODUCTS.filter((p) => p.slug !== slug).slice(0, limit);
  const same = PRODUCTS.filter(
    (p) => p.slug !== slug && p.category === current.category,
  );
  const rest = PRODUCTS.filter(
    (p) => p.slug !== slug && p.category !== current.category,
  );
  return [...same, ...rest].slice(0, limit);
}

export const FAQS = [
  {
    q: "Como lavo o absorvente?",
    a: "Enxágue em água fria logo após o uso, até a água sair clara. Depois, lave com sabão neutro à mão ou na máquina, em ciclo delicado, junto com roupas da mesma cor. Seque à sombra.",
  },
  {
    q: "Quantas peças eu preciso?",
    a: "Para um ciclo comum, quatro a seis peças bastam se você puder lavar no meio. O kit iniciante cobre os tipos de fluxo; o kit completo aguenta o mês inteiro.",
  },
  {
    q: "Vaza?",
    a: "Cada modelo tem um fluxo indicado. Use o tamanho certo da calcinha, feche os botões das asas e troque no tempo do seu corpo. A barreira posterior segura o excesso, mas não substitui a troca.",
  },
  {
    q: "Posso usar para dormir?",
    a: "O noturno foi feito para isso: 32 cm, núcleo denso, cauda alongada. Em fluxos muito intensos, combine com uma calcinha de cintura mais alta.",
  },
  {
    q: "Demora para secar?",
    a: "Em varal ventilado, o protetor seca em algumas horas; o noturno, de um dia para o outro. Evite secadora e sol forte, que endurecem o algodão.",
  },
  {
    q: "Serve no pós-parto?",
    a: "Sim. O modelo pós-parto tem 35 cm e volume extra. O tecido é o mesmo algodão orgânico das outras peças — sem perfume, sem plástico contra a pele.",
  },
];

export const TESTIMONIALS = [
  {
    name: "Marina S.",
    city: "São Paulo",
    text: "Troquei no segundo ciclo. O diurno no tamanho M ficou no lugar o dia inteiro, e a lavagem entrou na rotina da roupa de cama.",
  },
  {
    name: "Helena P.",
    city: "Belo Horizonte",
    text: "Comprei o kit iniciante por receio de errar o fluxo. Usei as quatro peças no mesmo mês. Nada de odor, nada de plástico.",
  },
  {
    name: "Luísa R.",
    city: "Porto Alegre",
    text: "O noturno foi o que me convenceu. Durmo de lado e acordo seca. Dois anos com as mesmas peças.",
  },
];

export type QuizAnswers = {
  flow: "leve" | "medio" | "intenso";
  night: boolean;
  postpartum: boolean;
};

export function recommendFromQuiz(answers: QuizAnswers): Product {
  if (answers.postpartum) return getProduct("posparto")!;
  if (answers.night) return getProduct("noturno")!;
  if (answers.flow === "intenso") return getProduct("super")!;
  if (answers.flow === "medio") return getProduct("diurno")!;
  return getProduct("protetor")!;
}
