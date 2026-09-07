import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { getProduct } from "@/lib/products";
import {
  cartCount,
  cartTotals,
  sanitizeLines,
  useCartStore,
} from "@/lib/cart-store";
import { formatBRL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { QtyStepper } from "@/components/product/qty-stepper";
import { FreightQuote } from "@/components/shipping/freight-quote";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BrandMark } from "@/components/logo";
import { useShopSession } from "@/lib/use-shop-session";

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const setOpen = useCartStore((s) => s.setOpen);
  const lines = useCartStore((s) => s.lines);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const totals = cartTotals(lines, "card");
  const count = cartCount(lines);
  const [freight, setFreight] = useState(0);
  const session = useShopSession();

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sacola</SheetTitle>
          <SheetDescription>
            {session.ok && session.firstName
              ? `Olá, ${session.firstName}`
              : count === 0
                ? "Ainda vazia."
                : `${count} ${count === 1 ? "peça" : "peças"}`}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <BrandMark className="size-28" />
              <p className="mt-4 text-sm text-muted">
                Escolha um modelo na loja. O kit de quatro peças é um bom ponto de partida.
              </p>
            </div>
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
                      className="size-20 rounded-md bg-surface object-contain p-1.5"
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
          {lines.length > 0 ? (
            <div className="mt-6">
              <FreightQuote
                inputId="sacola-cep"
                items={sanitizeLines(lines)}
                onQuoted={(_, quotes) => setFreight(quotes[0]?.payableCents ?? 0)}
              />
            </div>
          ) : null}
        </div>
        <div className="border-t border-border p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Subtotal</span>
            <span className="tabular-nums">{formatBRL(totals.subtotal)}</span>
          </div>
          {freight > 0 ? (
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-muted">Frete</span>
              <span className="tabular-nums">{formatBRL(freight)}</span>
            </div>
          ) : null}
          <p className="mt-2 text-xs text-muted">
            Frete cotado pelo CEP antes de pagar. Grátis a partir de R$ 180.
            PIX com 5% de desconto.
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
