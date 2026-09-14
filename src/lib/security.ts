export const SITE_ORIGIN = "https://beabsorventes.com.br";

const ALLOWED_HOSTS = new Set([
  "beabsorventes.com.br",
  "www.beabsorventes.com.br",
]);

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function publicOrigin() {
  const configured = process.env.SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (isProduction()) return SITE_ORIGIN;
  return SITE_ORIGIN;
}

export function adminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || "Be271003";
}

export function adminEmail() {
  return (process.env.ADMIN_EMAIL?.trim() || "beabsorventes@gmail.com").toLowerCase();
}

export function sessionSecret() {
  return (
    process.env.SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    "Be271003"
  );
}

export function sessionCookie(maxAge: number) {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction(),
    maxAge,
  };
}

const attempts = new Map<string, { count: number; until: number }>();

export function rateLimit(key: string, limit = 8, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.until < now) {
    attempts.set(key, { count: 1, until: now + windowMs });
    return { ok: true as const };
  }
  if (current.count >= limit) {
    return { ok: false as const, message: "Muitas tentativas. Espere alguns minutos." };
  }
  current.count += 1;
  return { ok: true as const };
}

export function hostAllowed(host: string) {
  const name = host.split(":")[0]?.toLowerCase() ?? "";
  return ALLOWED_HOSTS.has(name);
}
