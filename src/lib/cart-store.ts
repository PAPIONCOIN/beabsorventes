import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getProduct, type PrintId, type SizeId } from "@/lib/products";
import { PIX_DISCOUNT, shippingFor } from "@/lib/utils";

export type CartLine = {
  slug: string;
  printId: string;
  size: string;
  qty: number;
};

export function lineKey(line: Pick<CartLine, "slug" | "printId" | "size">) {
  return `${line.slug}|${line.printId}|${line.size}`;
}

export function sanitizeLines(lines: CartLine[]): CartLine[] {
  const next: CartLine[] = [];
  for (const line of lines) {
    const product = getProduct(line.slug);
    if (!product) continue;
    const printId = product.prints.includes(line.printId as PrintId)
      ? line.printId
      : (product.prints[0] ?? "padrao");
    const size = product.sizes.includes(line.size as SizeId)
      ? line.size
      : (product.sizes[0] ?? "Único");
    const qty = Math.min(20, Math.max(1, Math.floor(Number(line.qty) || 1)));
    const existing = next.find(
      (item) => item.slug === product.slug && item.printId === printId && item.size === size,
    );
    if (existing) {
      existing.qty = Math.min(20, existing.qty + qty);
    } else {
      next.push({ slug: product.slug, printId, size, qty });
    }
  }
  return next;
}

export function cartCount(lines: CartLine[]) {
  return sanitizeLines(lines).reduce((n, line) => n + line.qty, 0);
}

export function cartSubtotal(lines: CartLine[]) {
  return sanitizeLines(lines).reduce((sum, line) => {
    const product = getProduct(line.slug);
    return sum + (product ? product.priceCents * line.qty : 0);
  }, 0);
}

export function cartTotals(
  lines: CartLine[],
  payment: "pix" | "card",
  shippingCents?: number,
) {
  const subtotal = cartSubtotal(lines);
  const discount = payment === "pix" ? Math.round(subtotal * PIX_DISCOUNT) : 0;
  const shipping =
    shippingCents === undefined ? shippingFor(subtotal) : shippingCents;
  const total = Math.max(0, subtotal - discount + shipping);
  return { subtotal, discount, shipping, total };
}

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  add: (line: Omit<CartLine, "qty"> & { qty?: number }) => void;
  setQty: (key: Omit<CartLine, "qty">, qty: number) => void;
  remove: (key: Omit<CartLine, "qty">) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  setOpen: (open: boolean) => void;
};

function sameLine(a: CartLine, b: Omit<CartLine, "qty">) {
  return a.slug === b.slug && a.printId === b.printId && a.size === b.size;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      isOpen: false,
      add: (line) => {
        if (!getProduct(line.slug)) return;
        const qty = line.qty ?? 1;
        const lines = [...get().lines];
        const index = lines.findIndex((item) => sameLine(item, line));
        if (index >= 0) {
          const current = lines[index];
          if (current) {
            lines[index] = { ...current, qty: Math.min(20, current.qty + qty) };
          }
        } else {
          lines.push({
            slug: line.slug,
            printId: line.printId,
            size: line.size,
            qty,
          });
        }
        set({ lines: sanitizeLines(lines), isOpen: true });
      },
      setQty: (key, qty) => {
        if (qty <= 0) {
          set({
            lines: get().lines.filter((item) => !sameLine(item, key)),
          });
          return;
        }
        set({
          lines: get().lines.map((item) =>
            sameLine(item, key) ? { ...item, qty: Math.min(20, qty) } : item,
          ),
        });
      },
      remove: (key) =>
        set({
          lines: get().lines.filter((item) => !sameLine(item, key)),
        }),
      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: "bea-cart",
      partialize: (state) => ({ lines: state.lines }),
      skipHydration: true,
      merge: (persisted, current) => {
        const stored = persisted as { lines?: CartLine[] } | undefined;
        return {
          ...current,
          lines: sanitizeLines(stored?.lines ?? current.lines),
        };
      },
    },
  ),
);
