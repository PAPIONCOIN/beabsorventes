import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PRODUCTS,
  featuredProducts,
  getProduct,
  productsByCategory,
  recommendFromQuiz,
  relatedProducts,
  shipBoxFor,
} from "./products.ts";
import {
  FREE_SHIPPING_FROM,
  PIX_DISCOUNT,
  SHIPPING_CENTS,
  digitsOnly,
  formatBRL,
  formatCep,
  formatCpf,
  formatPhone,
  shippingFor,
} from "./utils.ts";
import {
  SITE_ORIGIN,
  adminEmail,
  adminPassword,
  hostAllowed,
  publicOrigin,
  rateLimit,
  sessionCookie,
  sessionSecret,
} from "./security.ts";
import { ORIGIN_CEP, ORIGIN_CEP_LABEL } from "./origin-cep.ts";
import {
  cartCount,
  cartSubtotal,
  cartTotals,
  lineKey,
  sanitizeLines,
} from "./cart-store.ts";
import { tableShippingQuotes } from "./shipping-table.ts";
import {
  hexEqual,
  hmacDigestEqual,
  hmacHex,
  randomHex,
  scryptHash,
  scryptSalt,
  sha256Hex,
} from "./hmac.ts";

const here = dirname(fileURLToPath(import.meta.url));

function priced(slug: string, qty: number) {
  const product = getProduct(slug);
  assert.ok(product, `produto ${slug} existe`);
  return product.priceCents * qty;
}

function totals(slugs: { slug: string; qty: number }[], payment: "pix" | "card", freight: number) {
  const subtotal = slugs.reduce((sum, line) => sum + priced(line.slug, line.qty), 0);
  const discount = payment === "pix" ? Math.round(subtotal * PIX_DISCOUNT) : 0;
  return {
    subtotal,
    discount,
    shipping: freight,
    total: Math.max(0, subtotal - discount + freight),
  };
}

describe("catálogo", () => {
  it("tem peças com slug, sku e preço únicos e válidos", () => {
    assert.ok(PRODUCTS.length >= 6);
    const slugs = PRODUCTS.map((p) => p.slug);
    const skus = PRODUCTS.map((p) => p.sku);
    assert.equal(new Set(slugs).size, slugs.length);
    assert.equal(new Set(skus).size, skus.length);
    for (const product of PRODUCTS) {
      assert.ok(product.priceCents >= 1000, product.slug);
      assert.equal(product.leadDays, 5);
      assert.ok(product.image.startsWith("/images/"));
      assert.ok(getProduct(product.slug));
      assert.ok(shipBoxFor(product.slug));
    }
  });

  it("kits só listam peças que existem no catálogo", () => {
    const kits = PRODUCTS.filter((p) => p.contents?.length);
    assert.ok(kits.length >= 1);
    for (const kit of kits) {
      for (const item of kit.contents ?? []) {
        assert.ok(getProduct(item.slug), `${kit.slug} → ${item.slug}`);
        assert.ok(item.qty >= 1);
      }
    }
  });

  it("vitrine, categorias e relacionados fecham o ciclo da loja", () => {
    assert.ok(featuredProducts().length >= 3);
    assert.ok(productsByCategory("pad").every((p) => p.category === "pad"));
    assert.equal(productsByCategory("all").length, PRODUCTS.length);
    const related = relatedProducts("ciclo-mini");
    assert.ok(related.every((p) => p.slug !== "ciclo-mini"));
    assert.equal(getProduct("nao-existe"), undefined);
  });

  it("o quiz recomenda um modelo do catálogo", () => {
    assert.equal(recommendFromQuiz({ flow: "leve", night: false }).slug, "ciclo-mini");
    assert.equal(recommendFromQuiz({ flow: "medio", night: false }).slug, "ciclo-principal");
    assert.equal(recommendFromQuiz({ flow: "intenso", night: false }).slug, "ciclo-denso");
    assert.equal(recommendFromQuiz({ flow: "leve", night: true }).slug, "noturno");
  });
});

describe("checkout: preço + frete", () => {
  it("aplica 5% no PIX e mantém o cartão integral", () => {
    const kit = priced("kit-4", 1);
    const pix = totals([{ slug: "kit-4", qty: 1 }], "pix", 1990);
    const card = totals([{ slug: "kit-4", qty: 1 }], "card", 1990);
    assert.equal(pix.subtotal, kit);
    assert.equal(pix.discount, Math.round(kit * 0.05));
    assert.equal(card.discount, 0);
    assert.equal(pix.total, kit - pix.discount + 1990);
    assert.equal(card.total, kit + 1990);
    assert.match(formatBRL(kit), /105,00/);
  });

  it("libera frete a partir de R$ 180 e zera sacola vazia", () => {
    assert.equal(shippingFor(0), 0);
    assert.equal(shippingFor(FREE_SHIPPING_FROM - 1), SHIPPING_CENTS);
    assert.equal(shippingFor(FREE_SHIPPING_FROM), 0);
    assert.equal(FREE_SHIPPING_FROM, 18000);
  });

  it("soma várias peças como no carrinho", () => {
    const bag = totals(
      [
        { slug: "ciclo-mini", qty: 2 },
        { slug: "ciclo-intimo", qty: 1 },
      ],
      "pix",
      0,
    );
    const expected = priced("ciclo-mini", 2) + priced("ciclo-intimo", 1);
    assert.equal(bag.subtotal, expected);
    assert.equal(bag.discount, Math.round(expected * PIX_DISCOUNT));
    assert.equal(bag.total, expected - bag.discount);
  });
});

describe("sacola", () => {
  it("sanitiza linhas inválidas e junta iguais", () => {
    const lines = sanitizeLines([
      { slug: "ciclo-mini", printId: "padrao", size: "Único", qty: 2 },
      { slug: "ciclo-mini", printId: "padrao", size: "Único", qty: 1 },
      { slug: "nao-existe", printId: "padrao", size: "Único", qty: 4 },
      { slug: "kit-4", printId: "x", size: "GG", qty: 99 },
    ]);
    assert.equal(lines.length, 2);
    assert.equal(cartCount(lines), 3 + 20);
    assert.equal(
      lineKey({ slug: "ciclo-mini", printId: "padrao", size: "Único" }),
      "ciclo-mini|padrao|Único",
    );
    const mini = getProduct("ciclo-mini");
    const kit = getProduct("kit-4");
    assert.ok(mini && kit);
    assert.equal(cartSubtotal(lines), mini.priceCents * 3 + kit.priceCents * 20);
  });

  it("reproduz totais da sacola com PIX e frete grátis", () => {
    const lines = sanitizeLines([{ slug: "kit-4", printId: "padrao", size: "Único", qty: 2 }]);
    const pix = cartTotals(lines, "pix");
    const card = cartTotals(lines, "card", 2990);
    assert.equal(pix.subtotal, 21000);
    assert.equal(pix.shipping, 0);
    assert.equal(pix.discount, Math.round(21000 * PIX_DISCOUNT));
    assert.equal(card.shipping, 2990);
    assert.equal(card.discount, 0);
  });
});

describe("tabela de frete", () => {
  it("cota PAC e SEDEX a partir do CEP de origem", () => {
    const praia = tableShippingQuotes(ORIGIN_CEP);
    assert.equal(praia[0]?.name, "PAC");
    assert.equal(praia[1]?.name, "SEDEX");
    assert.equal(praia[0]?.priceCents, 1990);
    assert.equal(praia[1]?.priceCents, 2990);
    const norte = tableShippingQuotes("69000000");
    assert.ok((norte[0]?.priceCents ?? 0) > (praia[0]?.priceCents ?? 0));
  });
});

describe("cadastro: CEP, CPF e telefone", () => {
  it("formata e limpa documentos brasileiros", () => {
    assert.equal(formatCep("11700170"), "11700-170");
    assert.equal(digitsOnly("11700-170"), "11700170");
    assert.equal(formatCpf("12345678901"), "123.456.789-01");
    assert.equal(formatPhone("11995895103"), "(11) 99589-5103");
    assert.equal(ORIGIN_CEP, "11700170");
    assert.equal(ORIGIN_CEP_LABEL, "11700-170");
  });
});

describe("segurança da loja", () => {
  it("prende o domínio público da loja", () => {
    assert.equal(SITE_ORIGIN, "https://beabsorventes.com.br");
    assert.equal(publicOrigin(), "https://beabsorventes.com.br");
    assert.equal(hostAllowed("beabsorventes.com.br"), true);
    assert.equal(hostAllowed("www.beabsorventes.com.br"), true);
    assert.equal(hostAllowed("evil.example"), false);
    assert.equal(adminEmail(), "beabsorventes@gmail.com");
    assert.ok(adminPassword().length >= 6);
    assert.ok(sessionSecret().length >= 6);
  });

  it("cookies de sessão são httpOnly e Secure em produção", () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const cookie = sessionCookie(60);
    assert.equal(cookie.httpOnly, true);
    assert.equal(cookie.sameSite, "lax");
    assert.equal(cookie.secure, true);
    process.env.NODE_ENV = previous;
  });

  it("bloqueia tentativas demais no mesmo e-mail", () => {
    const key = `test:${Date.now()}:${Math.random()}`;
    for (let i = 0; i < 8; i += 1) {
      assert.equal(rateLimit(key, 8, 60_000).ok, true);
    }
    const blocked = rateLimit(key, 8, 60_000);
    assert.equal(blocked.ok, false);
    if (!blocked.ok) {
      assert.match(blocked.message, /tentativas/i);
    }
  });

  it("módulos da loja não importam node:crypto no cliente", () => {
    for (const file of ["customers.ts", "shop-orders.ts", "customer-auth.ts", "contact.ts"]) {
      const src = readFileSync(join(here, file), "utf8");
      assert.doesNotMatch(src, /from ["']node:crypto["']/, file);
    }
  });
});

describe("hmac e senha", () => {
  it("assina e compara valores sem vazar o segredo", async () => {
    const sig = await hmacHex("loja-secreta", "conta:ana@example.com");
    assert.equal(sig.length, 64);
    assert.equal(await hmacDigestEqual("loja-secreta", "ok", "ok"), true);
    assert.equal(await hmacDigestEqual("loja-secreta", "ok", "no"), false);
    assert.equal(await hexEqual(sig, sig), true);
    assert.equal(await hexEqual("aa", "bb"), false);
  });

  it("deriva senha com scrypt e confere o hash", async () => {
    const salt = await scryptSalt();
    const hash = await scryptHash("Be271003", salt);
    const again = await scryptHash("Be271003", salt);
    const other = await scryptHash("outra", salt);
    assert.equal(await hexEqual(hash, again), true);
    assert.equal(await hexEqual(hash, other), false);
    const token = await randomHex(24);
    assert.equal(token.length, 48);
    assert.equal((await sha256Hex(token)).length, 64);
  });
});
