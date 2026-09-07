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
  { to: "/contato", label: "Fale conosco" },
] as const;

export function SiteHeader() {
  const [menu, setMenu] = useState(false);
  const openCart = useCartStore((s) => s.open);
  const count = useCartStore((s) => cartCount(s.lines));

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-sm">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm text-muted transition-colors hover:text-fg"
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
      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" className="max-w-xs">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
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
