import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProductCard } from "@/components/product/product-card";
import { productsByCategory, type Category } from "@/lib/products";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/loja")({ component: Loja });

const FILTERS: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "Tudo" },
  { id: "pad", label: "Absorventes" },
  { id: "liner", label: "Protetor diário" },
  { id: "kit", label: "Kits" },
];

function Loja() {
  const [filter, setFilter] = useState<Category | "all">("all");
  const products = productsByCategory(filter);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-[11px] font-medium tracking-[0.16em] text-primary uppercase">
        Loja
      </p>
      <h1 className="mt-3 font-display text-4xl italic">As peças</h1>
      <p className="mt-3 max-w-lg text-muted">
        Absorventes ecológicos reutilizáveis de tecido 100% algodão orgânico.
        Até 3× sem juros.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "h-10 rounded-full border px-4 text-sm transition-colors",
              filter === item.id
                ? "border-fg bg-fg text-bg"
                : "border-border bg-surface text-fg hover:bg-bg-warm",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
