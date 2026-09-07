import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { QtyStepper } from "@/components/product/qty-stepper";
import { useCartStore } from "@/lib/cart-store";
import {
  flowLabel,
  getProduct,
  relatedProducts,
  type PrintId,
  type SizeId,
} from "@/lib/products";
import { formatBRL } from "@/lib/utils";

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
  const [size] = useState<SizeId>(product.sizes[0] ?? "Único");
  const [printId] = useState<PrintId>(product.prints[0] ?? "padrao");
  const [qty, setQty] = useState(1);
  const [photo, setPhoto] = useState(product.image);
  const related = relatedProducts(product.slug);
  const parcel = Math.round(product.priceCents / 3);

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
        <div>
          <div className="overflow-hidden rounded-xl bg-bg-warm">
            <img
              src={photo}
              alt={product.name}
              className="aspect-photo w-full object-cover"
            />
          </div>
          {product.gallery.length > 1 ? (
            <div className="mt-3 flex gap-2">
              {product.gallery.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setPhoto(src)}
                  className={`overflow-hidden rounded-md ${
                    photo === src ? "ring-2 ring-fg" : "ring-1 ring-border"
                  }`}
                >
                  <img src={src} alt="" className="size-16 object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            {flowLabel(product.flow)}
            {product.lengthCm ? ` · ${product.lengthCm} cm` : ""}
          </p>
          <h1 className="mt-2 font-display text-4xl italic">{product.name}</h1>
          <p className="mt-4 text-lg tabular-nums">{formatBRL(product.priceCents)}</p>
          <p className="mt-1 text-sm text-muted">
            até 3× de {formatBRL(parcel)} sem juros
          </p>
          <p className="mt-4 max-w-md leading-relaxed text-muted">
            {product.description}
          </p>
          <p className="mt-3 text-xs text-muted">
            Código {product.sku} · sai em {product.leadDays} dias úteis
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <QtyStepper value={qty} onChange={setQty} />
            <Button
              size="lg"
              onClick={() => add({ slug: product.slug, printId, size, qty })}
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
                    {inner?.lengthCm ? ` · ${inner.lengthCm} cm` : ""}
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
