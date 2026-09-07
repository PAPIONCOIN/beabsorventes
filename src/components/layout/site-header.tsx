import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cartCount, useCartStore } from "@/lib/cart-store";

const NAV = [
  { to: "/loja", label: "Loja" },
  { to: "/guia", label: "Modelos" },
  { to: "/cuidados", label: "Como lavar" },
  { to: "/sobre", label: "Quem somos" },
  { to: "/cadastro", label: "Cadastro" },
  { to: "/conta", label: "Meus pedidos" },
  { to: "/contato", label: "Contato" },
] as const;

export function SiteHeader() {
  const [menu, setMenu] = useState(false);
  const openCart = useCartStore((s) => s.open);
  const count = useCartStore((s) => cartCount(s.lines));

  return (
    <header className="sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
      <p className="bg-primary px-3 py-2.5 text-center text-xs font-medium tracking-[0.08em] text-primary-fg uppercase sm:px-4 sm:tracking-[0.12em]">
        <span className="sm:hidden">PIX 5% · 3 vezes sem juros · 5 dias úteis</span>
        <span className="hidden sm:inline">
          5% de desconto no PIX · até 3 vezes sem juros · envio em 5 dias úteis
        </span>
      </p>
      <div className="border-b border-border bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:h-[4.5rem] sm:gap-3 sm:px-6">
          <Logo className="shrink-0" />
          <nav className="hidden items-center gap-8 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-base text-muted transition-colors hover:text-fg"
                activeProps={{ className: "text-fg" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => openCart()}
              aria-label={count ? `Sacola, ${count} peças` : "Sacola"}
            >
              <ShoppingBag />
              {count > 0 ? (
                <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-fg">
                  {count}
                </span>
              ) : null}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMenu(true)}
              aria-label="Abrir menu"
            >
              <Menu />
            </Button>
          </div>
        </div>
      </div>
      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" className="max-w-xs">
          <SheetHeader>
            <SheetTitle>
              <Logo withName={false} markClassName="size-20" />
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-4 py-4">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex h-11 items-center px-2 text-base"
                onClick={() => setMenu(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
