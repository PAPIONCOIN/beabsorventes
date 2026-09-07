import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { ProductPhoto } from "@/components/product/product-photo";
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
import { FreightQuote } from "@/components/shipping/freight-quote";

export const Route = createFileRoute("/produto/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return product;
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-display text-3xl italic">Peça não encontrada</h1>
      <p className="mt-3 text-muted">Essa peça saiu do catálogo.</p>
      <Button asChild className="mt-6">
        <Link to="/loja">Voltar à loja</Link>
      </Button>
    </div>
  ),
});

function ProductPage() {
  const product = Route.useLoaderData();
  const add = useCartStore((s) => s.add);
  const [size, setSize] = useState<SizeId>(product.sizes[0] ?? "Único");
  const [printId, setPrintId] = useState<PrintId>(product.prints[0] ?? "padrao");
  const [qty, setQty] = useState(1);
  const [photo, setPhoto] = useState(product.image);
  const related = relatedProducts(product.slug);
  const parcel = Math.round(product.priceCents / 3);

  useEffect(() => {
    setSize(product.sizes[0] ?? "Único");
    setPrintId(product.prints[0] ?? "padrao");
    setQty(1);
    setPhoto(product.image);
  }, [product]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-xs text-muted">
        <Link to="/loja" className="hover:text-fg">
          Loja
        </Link>
        <span className="mx-2">/</span>
        {product.shortName}
      </p>
      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:items-start">
        <div>
          <ProductPhoto
            src={photo}
            alt={product.name}
            className="aspect-square rounded-lg"
          />
          {product.gallery.length > 1 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {product.gallery.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setPhoto(src)}
                  className={`overflow-hidden rounded-md ${
                    photo === src ? "ring-2 ring-fg" : "ring-1 ring-border"
                  }`}
                >
                  <ProductPhoto
                    src={src}
                    alt=""
                    className="size-16"
                    imgClassName="p-1.5"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="lg:sticky lg:top-36">
          <p className="text-xs font-medium tracking-[0.12em] text-primary uppercase">
            {flowLabel(product.flow)}
            {product.lengthCm ? ` · ${product.lengthCm} cm` : ""}
          </p>
          <h1 className="mt-2 font-display text-4xl italic sm:text-5xl">{product.name}</h1>
          <p className="mt-4 text-3xl tabular-nums">
            {formatBRL(product.priceCents)}
          </p>
          <p className="mt-1 text-base text-muted">
            ou 3 vezes de {formatBRL(parcel)} sem juros
          </p>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
            {product.description}
          </p>

          <div className="mt-8">
            <FreightQuote
              inputId="produto-cep"
              items={[
                {
                  slug: product.slug,
                  printId,
                  size,
                  qty,
                },
              ]}
            />
          </div>

          <div className="mt-8 hidden flex-wrap items-center gap-3 lg:flex">
            <QtyStepper value={qty} onChange={setQty} />
            <Button
              size="lg"
              className="min-w-44"
              onClick={() => add({ slug: product.slug, printId, size, qty })}
            >
              Adicionar à sacola
            </Button>
          </div>

          <dl className="mt-8 grid gap-2 border-t border-border pt-6 text-sm text-muted">
            <div className="flex justify-between gap-4">
              <dt>Envio</dt>
              <dd>em até {product.leadDays} dias úteis</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Tecido</dt>
              <dd>algodão orgânico GOTS</dd>
            </div>
            {product.layers ? (
              <div className="flex justify-between gap-4">
                <dt>Camadas</dt>
                <dd>{product.layers} absorventes + impermeável</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt>Lavagem</dt>
              <dd>máquina, sem secadora</dd>
            </div>
          </dl>

          {product.contents ? (
            <ul className="mt-6 space-y-1 text-sm text-muted">
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
            <ul className="mt-6 space-y-1 text-sm text-muted">
              {product.details.map((line) => (
                <li key={line}>— {line}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-20">
          <h2 className="font-display text-3xl italic">Outros modelos</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.slug} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="h-20 lg:hidden" />
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur-sm lg:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <p className="min-w-0 flex-1 text-sm tabular-nums">
            {formatBRL(product.priceCents)}
          </p>
          <QtyStepper value={qty} onChange={setQty} />
          <Button
            onClick={() => add({ slug: product.slug, printId, size, qty })}
          >
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}
