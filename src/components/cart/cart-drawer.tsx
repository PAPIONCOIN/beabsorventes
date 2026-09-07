import { Link } from "@tanstack/react-router";
import { getProduct } from "@/lib/products";
import {
  cartCount,
  cartTotals,
  useCartStore,
} from "@/lib/cart-store";
import { formatBRL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { QtyStepper } from "@/components/product/qty-stepper";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const setOpen = useCartStore((s) => s.setOpen);
  const lines = useCartStore((s) => s.lines);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const totals = cartTotals(lines, "card");
  const count = cartCount(lines);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sacola</SheetTitle>
          <SheetDescription>
            {count === 0
              ? "Ainda vazia."
              : `${count} ${count === 1 ? "peça" : "peças"}`}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {lines.length === 0 ? (
            <p className="text-sm text-muted">
              Escolha um absorvente na loja. O kit de 4 peças é um bom começo.
            </p>
          ) : (
            <ul className="flex flex-col gap-5">
              {lines.map((line) => {
                const product = getProduct(line.slug);
                if (!product) return null;
                return (
                  <li
                    key={`${line.slug}-${line.printId}-${line.size}`}
                    className="flex gap-3"
                  >
                    <img
                      src={product.image}
                      alt=""
                      className="size-20 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{product.shortName}</p>
                      <p className="mt-1 text-sm tabular-nums">
                        {formatBRL(product.priceCents * line.qty)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <QtyStepper
                          value={line.qty}
                          onChange={(qty) =>
                            setQty(
                              {
                                slug: line.slug,
                                printId: line.printId,
                                size: line.size,
                              },
                              qty,
                            )
                          }
                        />
                        <button
                          type="button"
                          className="text-xs text-muted underline-offset-4 hover:text-fg hover:underline"
                          onClick={() =>
                            remove({
                              slug: line.slug,
                              printId: line.printId,
                              size: line.size,
                            })
                          }
                        >
                          Tirar
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="border-t border-border p-6">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Subtotal</span>
            <span className="tabular-nums">{formatBRL(totals.subtotal)}</span>
          </div>
          <p className="mt-2 text-xs text-muted">
            Frete grátis a partir de R$ 180. PIX com 5% de desconto no checkout.
          </p>
          <Button asChild className="mt-4 w-full" disabled={lines.length === 0}>
            <Link to="/checkout" onClick={() => setOpen(false)}>
              Ir para o checkout
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
