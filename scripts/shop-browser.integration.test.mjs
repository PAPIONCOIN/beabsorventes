import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";

const BASE = process.env.SHOP_URL || "http://127.0.0.1:8080";

async function shopUp() {
  try {
    const res = await fetch(BASE, { signal: AbortSignal.timeout(2500) });
    return res.ok;
  } catch {
    return false;
  }
}

describe("navegador: compra e frete", () => {
  /** @type {import('playwright').Browser | undefined} */
  let browser;
  /** @type {import('playwright').Page | undefined} */
  let page;
  /** @type {string[]} */
  const pageErrors = [];

  before(async () => {
    assert.ok(await shopUp(), `loja fora do ar em ${BASE}`);
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });
  });

  after(async () => {
    await browser?.close();
  });

  it("não quebra o cliente com APIs de Node", async () => {
    assert.ok(page);
    await page.goto(`${BASE}/loja`, { waitUntil: "networkidle" });
    assert.equal(
      pageErrors.filter((msg) => /node:crypto|createHmac|externalized/i.test(msg)).length,
      0,
      pageErrors.join("\n"),
    );
    const mark = page.getByText("SITE EM TESTE").first();
    await mark.waitFor({ timeout: 5000 });
  });

  it("adiciona peça na sacola e cota o CEP", async () => {
    assert.ok(page);
    await page.goto(`${BASE}/produto/ciclo-mini`, { waitUntil: "networkidle" });
    await page.getByLabel(/cep/i).first().fill("11700170");
    await page.getByText(/PAC|SEDEX/i).first().waitFor({ timeout: 15000 });
    await page.getByRole("button", { name: "Adicionar à sacola" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ timeout: 8000 });
    const bag = await dialog.innerText();
    assert.match(bag, /Ciclo Mini/i);
    assert.equal(
      pageErrors.filter((msg) => /node:crypto|createHmac|externalized/i.test(msg)).length,
      0,
      pageErrors.join("\n"),
    );
  });

  it("leva a sacola até o checkout", async () => {
    assert.ok(page);
    await page.goto(`${BASE}/loja`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.setItem(
        "bea-cart",
        JSON.stringify({
          state: {
            lines: [{ slug: "ciclo-mini", printId: "padrao", size: "Único", qty: 1 }],
          },
          version: 0,
        }),
      );
    });
    await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
    const body = await page.locator("body").innerText();
    assert.match(body, /Ciclo Mini|Finalizar pedido/i);
    assert.doesNotMatch(body, /sacola está vazia/i);
    assert.match(body, /PIX|Frete|CEP/i);
  });

  it("abre o contato com o e-mail da loja", async () => {
    assert.ok(page);
    await page.goto(`${BASE}/contato`, { waitUntil: "domcontentloaded" });
    const body = await page.locator("body").innerText();
    assert.match(body, /beabsorventes@gmail.com/);
    assert.match(body, /Fale conosco|Contato/i);
  });

  it("mostra o formulário de cadastro", async () => {
    assert.ok(page);
    await page.goto(`${BASE}/cadastro`, { waitUntil: "networkidle" });
    await page.getByText(/Seja cliente|Meu cadastro|Nome/i).first().waitFor({ timeout: 10000 });
    const body = await page.locator("body").innerText();
    assert.match(body, /Nome/);
    assert.match(body, /E-mail/);
    assert.match(body, /CPF/);
    assert.match(body, /Senha|WhatsApp|CEP/i);
  });
});
