export const ORIGIN_CEP = "11700170";
export const ORIGIN_CEP_LABEL = "11700-170";

export function readSavedCep() {
  if (typeof window === "undefined") return "";
  try {
    return (localStorage.getItem("bea-cep") ?? "").replace(/\D/g, "").slice(0, 8);
  } catch {
    return "";
  }
}

export function saveCep(cep: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("bea-cep", cep.replace(/\D/g, "").slice(0, 8));
  } catch {
    /* ignore */
  }
}
