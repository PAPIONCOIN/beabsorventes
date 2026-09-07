import { Link } from "@tanstack/react-router";
import { flowLabel, type Product } from "@/lib/products";
import { formatBRL } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/produto/$slug"
      params={{ slug: product.slug }}
      className="group block"
    >
      <div className="overflow-hidden rounded-xl bg-bg-warm">
        <img
          src={product.image}
          alt={product.name}
          className="aspect-photo w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted uppercase">
            {flowLabel(product.flow)}
          </p>
          <h3 className="mt-1 font-display text-xl italic">{product.name}</h3>
        </div>
        <p className="pt-5 text-sm tabular-nums">{formatBRL(product.priceCents)}</p>
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-muted">{product.description}</p>
    </Link>
  );
}
