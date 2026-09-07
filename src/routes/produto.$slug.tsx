import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { QtyStepper } from "@/components/product/qty-stepper";
import { useCartStore } from "@/lib/cart-store";
import {
  PRINTS,
  flowLabel,
  getProduct,
  relatedProducts,
  type PrintId,
  type SizeId,
} from "@/lib/products";
import { cn, formatBRL } from "@/lib/utils";

export const Route = createFileRoute("/produto/$slug")({
  component: ProductPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-display text-3xl italic">Peça não encontrada</h1>
      <p className="mt-3 text-muted">Essa peça saiu do catálogo.</p>
    </div>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const product = getProduct(slug);
  if (!product) throw notFound();

  const add = useCartStore((s) => s.add);
  const [size, setSize] = useState<SizeId>(product.sizes[0] ?? "M");
  const [printId, setPrintId] = useState<PrintId>(product.prints[0] ?? "linho");
  const [qty, setQty] = useState(1);
  const related = relatedProducts(product.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-xs text-muted">
        <Link to="/loja" className="hover:text-fg">
          Loja
        </Link>
        <span className="mx-2">/</span>
        {product.shortName}
      </p>
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl bg-bg-warm">
          <img
            src={product.image}
            alt={product.name}
            className="aspect-photo w-full object-cover"
          />
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            {flowLabel(product.flow)}
            {product.lengthCm ? ` · ${product.lengthCm} cm` : ""}
          </p>
          <h1 className="mt-2 font-display text-4xl italic">{product.name}</h1>
          <p className="mt-4 text-lg tabular-nums">{formatBRL(product.priceCents)}</p>
          <p className="mt-4 max-w-md leading-relaxed text-muted">
            {product.description}
          </p>

          <div className="mt-8">
            <p className="text-sm font-medium">Tamanho</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.sizes.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSize(item)}
                  className={cn(
                    "h-11 min-w-11 rounded-md border px-4 text-sm",
                    size === item
                      ? "border-fg bg-fg text-bg"
                      : "border-border bg-surface hover:bg-bg-warm",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium">Estampa</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.prints.map((id) => {
                const print = PRINTS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPrintId(id)}
                    className={cn(
                      "flex h-11 items-center gap-2 rounded-md border px-3 text-sm",
                      printId === id ? "border-fg" : "border-border",
                    )}
                  >
                    <span
                      className={cn("size-4 rounded-full", print.swatch)}
                      aria-hidden
                    />
                    {print.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <QtyStepper value={qty} onChange={setQty} />
            <Button
              size="lg"
              onClick={() =>
                add({ slug: product.slug, printId, size, qty })
              }
            >
              Adicionar à sacola
            </Button>
          </div>

          {product.contents ? (
            <ul className="mt-8 space-y-1 text-sm text-muted">
              {product.contents.map((item) => {
                const inner = getProduct(item.slug);
                return (
                  <li key={item.slug}>
                    {item.qty}× {inner?.shortName ?? item.slug}
                    {item.size ? ` · ${item.size}` : ""}
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="mt-8 space-y-1 text-sm text-muted">
              {product.details.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-20">
          <h2 className="font-display text-3xl italic">Também na loja</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.slug} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
