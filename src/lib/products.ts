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
  "Algodão orgânico certificado GOTS, com tingimento sustentável — da fibra à costura.";

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
      "Absorvente de 16 cm, com uma camada absorvente e tecido impermeável. Indicado para o fluxo leve, em especial no final da menstruação.",
    details: [
      "16 cm",
      "1 camada absorvente e tecido impermeável",
      "Algodão orgânico com tingimento GOTS",
      "Fluxo leve, final do ciclo",
      "Tempo de confecção de 5 dias",
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
      "Absorvente de 22 cm, com duas camadas absorventes. A parte posterior é mais fina, para acompanhar a roupa com discrição. Indicado para fluxo leve, em qualquer dia do ciclo.",
    details: [
      "22 cm",
      "2 camadas absorventes e tecido impermeável",
      "Parte posterior mais fina",
      "Fluxo leve, qualquer período",
      "Tempo de confecção de 5 dias",
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
      "Absorvente de 24 cm, com duas camadas absorventes e tecido impermeável. Indicado para fluxos moderados, em qualquer período da menstruação.",
    details: [
      "24 cm",
      "2 camadas absorventes e tecido impermeável",
      "Fluxo moderado, qualquer período",
      "Algodão orgânico com tingimento GOTS",
      "Tempo de confecção de 5 dias",
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
      "Absorvente de 28 cm, com três camadas absorventes e tecido impermeável. Indicado para fluxos intensos, em qualquer período da menstruação.",
    details: [
      "28 cm",
      "3 camadas absorventes e tecido impermeável",
      "Fluxo intenso, qualquer período",
      "Algodão orgânico com tingimento GOTS",
      "Tempo de confecção de 5 dias",
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
      "Absorvente de 30 cm, com quatro camadas absorventes e parte posterior mais larga. Indicado para a noite, com proteção contínua até o despertar.",
    details: [
      "30 cm",
      "4 camadas absorventes e tecido impermeável",
      "Parte posterior mais larga",
      "Uso noturno",
      "Tempo de confecção de 5 dias",
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
      "Protetor diário de algodão, de perfil fino. Indicado para o dia a dia e para os intervalos do ciclo.",
    details: [
      "100% algodão",
      "Uso diário",
      "Tempo de confecção de 5 dias",
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
      "Quatro peças para acompanhar o ciclo completo: Mini 16 cm, Íntimo 22 cm, Principal 24 cm e Denso 28 cm. Algodão orgânico com tingimento GOTS. Lavável em máquina; não utilizar secadora.",
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
    q: "Como lavar o absorvente?",
    a: "Enxágue em água fria logo após o uso. Em seguida, lave em máquina, no ciclo delicado, com sabão neutro. Não utilize secadora. Seque à sombra, em local ventilado.",
  },
  {
    q: "Quantas peças são necessárias?",
    a: "O kit de quatro peças reúne Mini, Íntimo, Principal e Denso e cobre um ciclo completo. Para a noite, acrescente o Noturno de 30 cm.",
  },
  {
    q: "Qual modelo escolher?",
    a: "Ciclo Mini (16 cm) para o fluxo leve do final do ciclo. Ciclo Íntimo (22 cm) para fluxo leve em qualquer dia. Ciclo Principal (24 cm) para fluxo moderado. Ciclo Denso (28 cm) para fluxo intenso. Noturno (30 cm) para dormir.",
  },
  {
    q: "O tecido é certificado?",
    a: "Sim. Utilizamos algodão orgânico com tingimento sustentável e certificação internacional GOTS.",
  },
  {
    q: "Qual o prazo de envio?",
    a: "O tempo de confecção é de 5 dias, acrescidos do prazo dos Correios.",
  },
  {
    q: "É possível parcelar?",
    a: "Sim. O pagamento pode ser feito em até 3 vezes sem juros no cartão, pelo Mercado Pago. No PIX, há 5% de desconto.",
  },
];

export type QuizAnswers = {
  flow: "leve" | "medio" | "intenso";
  night: boolean;
};

export function recommendFromQuiz(answers: QuizAnswers): Product {
  const pick =
    (answers.night ? getProduct("noturno") : null) ??
    (answers.flow === "intenso" ? getProduct("ciclo-denso") : null) ??
    (answers.flow === "medio" ? getProduct("ciclo-principal") : null) ??
    getProduct("ciclo-mini") ??
    PRODUCTS[0];
  if (!pick) {
    throw new Error("Catálogo vazio");
  }
  return pick;
}

export type ShipBox = {
  width: number;
  height: number;
  length: number;
  weightKg: number;
};

const SHIP_BY_SLUG: Record<string, ShipBox> = {
  "ciclo-mini": { width: 11, height: 2, length: 16, weightKg: 0.05 },
  "ciclo-intimo": { width: 12, height: 2, length: 22, weightKg: 0.06 },
  "ciclo-principal": { width: 12, height: 2, length: 24, weightKg: 0.07 },
  "ciclo-denso": { width: 13, height: 2.5, length: 28, weightKg: 0.08 },
  noturno: { width: 14, height: 3, length: 30, weightKg: 0.1 },
  "protetor-diario": { width: 11, height: 2, length: 16, weightKg: 0.05 },
};

export function shipBoxFor(slug: string): ShipBox | null {
  return SHIP_BY_SLUG[slug] ?? { width: 12, height: 2, length: 22, weightKg: 0.08 };
}
