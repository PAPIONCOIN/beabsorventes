import { useEffect } from "react";
import { create } from "zustand";
import { getShopSession } from "@/lib/shop-orders";

type ShopSession = {
  ok: boolean;
  name: string;
  email: string;
  loaded: boolean;
  apply: (session: { ok: boolean; name: string; email: string }) => void;
  clear: () => void;
  refresh: () => Promise<void>;
};

export const useShopSessionStore = create<ShopSession>((set) => ({
  ok: false,
  name: "",
  email: "",
  loaded: false,
  apply: (session) => set({ ...session, loaded: true }),
  clear: () => set({ ok: false, name: "", email: "", loaded: true }),
  refresh: async () => {
    const session = await getShopSession();
    set({ ...session, loaded: true });
  },
}));

export function useShopSession() {
  const session = useShopSessionStore();
  useEffect(() => {
    if (!session.loaded) void useShopSessionStore.getState().refresh();
  }, [session.loaded]);
  const firstName = session.name.trim().split(/\s+/)[0] ?? "";
  return { ...session, firstName };
}

export function applyShopSession(input: { name?: string | null; email?: string | null }) {
  const name = (input.name ?? "").trim();
  const email = (input.email ?? "").trim();
  useShopSessionStore.getState().apply({
    ok: Boolean(name || email),
    name,
    email,
  });
}
