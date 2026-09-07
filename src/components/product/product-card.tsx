import { Link } from "@tanstack/react-router";
import { flowLabel, type Product } from "@/lib/products";
import { formatBRL } from "@/lib/utils";
import { ProductPhoto } from "@/components/product/product-photo";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/produto/$slug"
      params={{ slug: product.slug }}
      className="group block"
    >
      <ProductPhoto
        src={product.image}
        alt={product.name}
        className="aspect-square rounded-lg"
        imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
      />
      <div className="mt-3 min-w-0">
        <p className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">
          {flowLabel(product.flow)}
          {product.lengthCm ? ` · ${product.lengthCm} cm` : ""}
        </p>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <h3 className="min-w-0 font-display text-lg italic leading-tight sm:text-xl">
            {product.name}
          </h3>
          <p className="shrink-0 text-sm tabular-nums">
            {formatBRL(product.priceCents)}
          </p>
        </div>
      </div>
    </Link>
  );
}
