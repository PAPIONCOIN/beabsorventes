export type Category = "pad" | "kit" | "liner";
export type FlowId = "leve" | "medio" | "intenso" | "noturno" | "kit" | "diario";
export type SizeId = "Único";
export type PrintId = "padrao";

export type Print = {
  id: PrintId;
  name: string;
  swatch: string;
};

export const PRINTS: Record<PrintId, Print> = {
  padrao: { id: "padrao", name: "Algodão orgânico", swatch: "bg-print-linho" },
};

export type KitContent = {
  slug: string;
  qty: number;
  size?: SizeId;
};

export type Product = {
  slug: string;
  sku: string;
  name: string;
  shortName: string;
  priceCents: number;
  flow: FlowId;
  lengthCm: number | null;
  layers: number | null;
  sizes: SizeId[];
  prints: PrintId[];
  image: string;
  gallery: string[];
  category: Category;
  featured?: boolean;
  leadDays: number;
  contents?: KitContent[];
  description: string;
  details: string[];
};

const GOTS =
  "Tecido ecológico 100% algodão orgânico e tingimento sustentável com certificação internacional GOTS. Um produto que gera menor impacto ao planeta.";

export const PRODUCTS: Product[] = [
  {
    slug: "ciclo-mini",
    sku: "7P3N8UPPJ",
    name: "Ciclo Mini",
    shortName: "Ciclo Mini",
    priceCents: 1800,
    flow: "leve",
    lengthCm: 16,
    layers: 1,
    sizes: ["Único"],
    prints: ["padrao"],
    image: "/images/products/ciclo-mini.jpg",
    gallery: ["/images/products/ciclo-mini.jpg", "/images/products/pad-2.jpg"],
    category: "pad",
    featured: true,
    leadDays: 5,
    description:
      "16 cm. Tecido impermeável e uma camada absorvente. Indicado para quando o fluxo está leve, como no final da menstruação.",
    details: [
      "16 cm",
      "1 camada absorvente + tecido impermeável",
      "Algodão orgânico com tingimento GOTS",
      "Fluxo leve · final do ciclo",
      "Disponibilidade: 5 dias úteis",
    ],
  },
  {
    slug: "ciclo-intimo",
    sku: "CLFNR78LK",
    name: "Ciclo Íntimo",
    shortName: "Ciclo Íntimo",
    priceCents: 3000,
    flow: "leve",
    lengthCm: 22,
    layers: 2,
    sizes: ["Único"],
    prints: ["padrao"],
    image: "/images/products/ciclo-intimo.jpg",
    gallery: ["/images/products/ciclo-intimo.jpg", "/images/products/pad-3.jpg"],
    category: "pad",
    featured: true,
    leadDays: 5,
    description:
      "22 cm. Tecido impermeável e duas camadas absorventes. A parte de trás é mais fina, para se sentir mais confortável na roupa. Indicado para fluxo leve, em qualquer período da menstruação.",
    details: [
      "22 cm",
      "2 camadas absorventes + tecido impermeável",
      "Parte de trás mais fina",
      "Fluxo leve · qualquer período",
      "Disponibilidade: 5 dias úteis",
    ],
  },
  {
    slug: "ciclo-principal",
    sku: "BDUCJ9QFQ",
    name: "Ciclo Principal",
    shortName: "Ciclo Principal",
    priceCents: 3200,
    flow: "medio",
    lengthCm: 24,
    layers: 2,
    sizes: ["Único"],
    prints: ["padrao"],
    image: "/images/products/ciclo-principal.jpg",
    gallery: [
      "/images/products/ciclo-principal.jpg",
      "/images/products/hero-pad.jpg",
    ],
    category: "pad",
    featured: true,
    leadDays: 5,
    description:
      "24 cm. Tecido impermeável e duas camadas absorventes. Indicado para fluxos moderados em qualquer período da menstruação.",
    details: [
      "24 cm",
      "2 camadas absorventes + tecido impermeável",
      "Fluxo moderado · qualquer período",
      "Algodão orgânico com tingimento GOTS",
      "Disponibilidade: 5 dias úteis",
    ],
  },
  {
    slug: "ciclo-denso",
    sku: "2B2MTQ7LC",
    name: "Ciclo Denso",
    shortName: "Ciclo Denso",
    priceCents: 3400,
    flow: "intenso",
    lengthCm: 28,
    layers: 3,
    sizes: ["Único"],
    prints: ["padrao"],
    image: "/images/products/ciclo-denso.jpg",
    gallery: [
      "/images/products/ciclo-denso.jpg",
      "/images/products/ciclo-denso-2.jpg",
      "/images/products/ciclo-denso-3.jpg",
    ],
    category: "pad",
    featured: true,
    leadDays: 5,
    description:
      "28 cm. Tecido impermeável e três camadas absorventes. Indicado para fluxos mais intensos em qualquer período da menstruação.",
    details: [
      "28 cm",
      "3 camadas absorventes + tecido impermeável",
      "Fluxo intenso · qualquer período",
      "Algodão orgânico com tingimento GOTS",
      "Disponibilidade: 5 dias úteis",
    ],
  },
  {
    slug: "noturno",
    sku: "P7MNVL8RM",
    name: "Noturno",
    shortName: "Noturno",
    priceCents: 4200,
    flow: "noturno",
    lengthCm: 30,
    layers: 4,
    sizes: ["Único"],
    prints: ["padrao"],
    image: "/images/products/noturno.jpg",
    gallery: [
      "/images/products/noturno.jpg",
      "/images/products/noturno-2.jpg",
      "/images/products/noturno-3.jpg",
    ],
    category: "pad",
    featured: true,
    leadDays: 5,
    description:
      "30 cm. Tecido impermeável, quatro camadas absorventes e a parte de trás mais larga. Indicado para dormir tranquila, sem receio de vazamentos.",
    details: [
      "30 cm",
      "4 camadas absorventes + tecido impermeável",
      "Parte de trás mais larga",
      "Noite inteira, sem vazamento",
      "Disponibilidade: 5 dias úteis",
    ],
  },
  {
    slug: "protetor-diario",
    sku: "ECSWVT8XQ",
    name: "Protetor diário",
    shortName: "Protetor diário",
    priceCents: 1000,
    flow: "diario",
    lengthCm: null,
    layers: null,
    sizes: ["Único"],
    prints: ["padrao"],
    image: "/images/products/protetor.jpg",
    gallery: ["/images/products/protetor.jpg"],
    category: "liner",
    leadDays: 5,
    description:
      "Protetor diário de tecido 100% algodão. Uma linha fina para o dia a dia e os intervalos do ciclo.",
    details: [
      "100% algodão",
      "Uso diário",
      "Disponibilidade: 5 dias úteis",
    ],
  },
  {
    slug: "kit-4",
    sku: "N2WRX248D",
    name: "Kit 4 absorventes",
    shortName: "Kit 4",
    priceCents: 10500,
    flow: "kit",
    lengthCm: null,
    layers: null,
    sizes: ["Único"],
    prints: ["padrao"],
    image: "/images/products/kit-4.jpg",
    gallery: ["/images/products/kit-4.jpg"],
    category: "kit",
    featured: true,
    leadDays: 5,
    contents: [
      { slug: "ciclo-mini", qty: 1 },
      { slug: "ciclo-intimo", qty: 1 },
      { slug: "ciclo-principal", qty: 1 },
      { slug: "ciclo-denso", qty: 1 },
    ],
    description:
      "Quatro peças para um ciclo inteiro: Mini 16 cm, Íntimo 22 cm, Principal 24 cm e Denso 28 cm. Algodão orgânico com tingimento GOTS. Pode ser lavado em máquina. Não utilizar secadora.",
    details: [
      "1× Ciclo Mini 16 cm",
      "1× Ciclo Íntimo 22 cm",
      "1× Ciclo Principal 24 cm",
      "1× Ciclo Denso 28 cm",
      "Lavável em máquina · sem secadora",
    ],
  },
];

const FLOW_LABELS: Record<FlowId, string> = {
  leve: "Fluxo leve",
  medio: "Fluxo moderado",
  intenso: "Fluxo intenso",
  noturno: "Noite",
  kit: "Kit",
  diario: "Uso diário",
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

export const GOTS_LINE = GOTS;

export const FAQS = [
  {
    q: "Como lavo o absorvente?",
    a: "Pode ser lavado em máquina, ciclo delicado. Enxágue em água fria logo após o uso. Não utilize secadora. Seque à sombra.",
  },
  {
    q: "Quantas peças eu preciso?",
    a: "O kit de 4 peças cobre Mini, Íntimo, Principal e Denso — um ciclo completo. Para a noite, some o Noturno de 30 cm.",
  },
  {
    q: "Qual modelo é o meu?",
    a: "Mini 16 cm no fluxo leve do fim do ciclo. Íntimo 22 cm no leve de qualquer dia. Principal 24 cm no moderado. Denso 28 cm no intenso. Noturno 30 cm para dormir.",
  },
  {
    q: "O tecido é certificado?",
    a: "Sim. Algodão orgânico com tingimento sustentável e certificação internacional GOTS.",
  },
  {
    q: "Demora para chegar?",
    a: "As peças saem em até 5 dias úteis, mais o prazo dos Correios.",
  },
  {
    q: "Posso parcelar?",
    a: "Sim, em até 3 vezes sem juros no cartão, pelo Mercado Pago.",
  },
];

export type QuizAnswers = {
  flow: "leve" | "medio" | "intenso";
  night: boolean;
};

export function recommendFromQuiz(answers: QuizAnswers): Product {
  if (answers.night) return getProduct("noturno")!;
  if (answers.flow === "intenso") return getProduct("ciclo-denso")!;
  if (answers.flow === "medio") return getProduct("ciclo-principal")!;
  return getProduct("ciclo-mini")!;
}
