import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu, ShoppingBag } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cartCount, useCartStore } from "@/lib/cart-store";
import { closeAccount } from "@/lib/shop-orders";
import { useShopSession, useShopSessionStore } from "@/lib/use-shop-session";

const NAV = [
  { to: "/loja", label: "Loja" },
  { to: "/guia", label: "Modelos" },
  { to: "/cuidados", label: "Como lavar" },
  { to: "/sobre", label: "Quem somos" },
  { to: "/contato", label: "Contato" },
] as const;

function AccountMenu({
  name,
  onNavigate,
}: {
  name: string;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const itemClass = "block px-3 py-2.5 text-sm hover:bg-bg-warm";

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-base text-muted transition-colors hover:text-fg"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        Olá, {name}
        <ChevronDown className={`size-4 ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 min-w-[12rem] rounded-lg border border-border bg-surface py-1 shadow-sm">
          <Link
            to="/cadastro"
            className={itemClass}
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
          >
            Meu cadastro
          </Link>
          <Link
            to="/compras"
            className={itemClass}
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
          >
            Compras
          </Link>
          <button
            type="button"
            className={`${itemClass} w-full text-left`}
            onClick={async () => {
              await closeAccount();
              useShopSessionStore.getState().clear();
              setOpen(false);
              onNavigate?.();
            }}
          >
            Sair
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function SiteHeader() {
  const [menu, setMenu] = useState(false);
  const openCart = useCartStore((s) => s.open);
  const count = useCartStore((s) => cartCount(s.lines));
  const session = useShopSession();

  return (
    <header className="sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
      <p className="bg-primary px-3 py-2.5 text-center text-xs font-medium tracking-[0.08em] text-primary-fg uppercase sm:px-4 sm:tracking-[0.12em]">
        <span className="sm:hidden">PIX 5% · 3 vezes sem juros · confecção em 5 dias</span>
        <span className="hidden sm:inline">
          5% de desconto no PIX · até 3 vezes sem juros · tempo de confecção de 5 dias
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
            {session.ok && session.firstName ? (
              <AccountMenu name={session.firstName} />
            ) : (
              <Link
                to="/conta"
                className="text-base text-muted transition-colors hover:text-fg"
                activeProps={{ className: "text-fg" }}
              >
                Login
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-1">
            <div className="mr-1 lg:hidden">
              {session.ok && session.firstName ? (
                <AccountMenu name={session.firstName} />
              ) : (
                <Link
                  to="/conta"
                  className="px-2 text-sm text-muted hover:text-fg"
                >
                  Login
                </Link>
              )}
            </div>
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
            {session.ok && session.firstName ? (
              <>
                <p className="px-2 pt-4 text-xs tracking-wide text-muted uppercase">
                  Olá, {session.firstName}
                </p>
                <Link
                  to="/cadastro"
                  className="flex h-11 items-center px-2 text-base"
                  onClick={() => setMenu(false)}
                >
                  Meu cadastro
                </Link>
                <Link
                  to="/compras"
                  className="flex h-11 items-center px-2 text-base"
                  onClick={() => setMenu(false)}
                >
                  Compras
                </Link>
              </>
            ) : (
              <Link
                to="/conta"
                className="flex h-11 items-center px-2 text-base"
                onClick={() => setMenu(false)}
              >
                Login
              </Link>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
