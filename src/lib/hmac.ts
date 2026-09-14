export async function hmacHex(secret: string, value: string) {
  const { createHmac } = await import("node:crypto");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function hmacDigestEqual(secret: string, left: string, right: string) {
  const { createHmac, timingSafeEqual } = await import("node:crypto");
  const a = createHmac("sha256", secret).update(left).digest();
  const b = createHmac("sha256", secret).update(right).digest();
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function hexEqual(left: string, right: string) {
  const { timingSafeEqual } = await import("node:crypto");
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function sha256Hex(value: string) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(value).digest("hex");
}

export async function randomHex(bytes = 24) {
  const { randomBytes } = await import("node:crypto");
  return randomBytes(bytes).toString("hex");
}

export async function scryptHash(password: string, salt: string) {
  const { scrypt } = await import("node:crypto");
  const { promisify } = await import("node:util");
  const derive = promisify(scrypt);
  const buf = (await derive(password, salt, 32)) as Buffer;
  return buf.toString("hex");
}

export async function scryptSalt() {
  const { randomBytes } = await import("node:crypto");
  return randomBytes(16).toString("hex");
}
