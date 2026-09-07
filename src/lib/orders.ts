export type OrderLine = {
  slug: string;
  name: string;
  printId: string;
  printName: string;
  size: string;
  qty: number;
  unitCents: number;
};

export type LastOrder = {
  orderId: string;
  name: string;
  email: string;
  payment: "pix" | "card";
  items: OrderLine[];
  totals: {
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
  };
  address: {
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  createdAt: string;
  status: "demo" | "pending" | "paid";
};

const KEY = "bea-last-order";

export function saveLastOrder(order: LastOrder) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(order));
}

export function readLastOrder(): LastOrder | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastOrder;
  } catch {
    return null;
  }
}
