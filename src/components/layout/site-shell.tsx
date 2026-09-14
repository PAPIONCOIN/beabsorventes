import { useEffect } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { TestWatermark } from "@/components/layout/test-watermark";
import { useCartStore } from "@/lib/cart-store";

export function SiteShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-bg text-fg">
      <SiteHeader />
      <CartDrawer />
      <TestWatermark />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
