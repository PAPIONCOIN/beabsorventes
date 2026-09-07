import { useEffect, useState } from "react";
import { getShopSession } from "@/lib/shop-orders";

export function useShopSession() {
  const [session, setSession] = useState({ ok: false, name: "", email: "" });
  useEffect(() => {
    void getShopSession().then(setSession);
  }, []);
  const firstName = session.name.trim().split(/\s+/)[0] ?? "";
  return { ...session, firstName };
}
