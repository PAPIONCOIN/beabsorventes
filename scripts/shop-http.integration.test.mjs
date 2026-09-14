import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const BASE = process.env.SHOP_URL || "http://127.0.0.1:8080";

async function probe() {
  try {
    const res = await fetch(BASE, { signal: AbortSignal.timeout(2500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureShop() {
  if (await probe()) return;
  spawn("sh", ["/workspace/startup.sh"], {
    cwd: "/workspace",
    detached: true,
    stdio: "ignore",
  }).unref();
  for (let i = 0; i < 60; i += 1) {
    if (await probe()) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Loja não respondeu em ${BASE}`);
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`, {
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
    headers: { accept: "text/html,application/json" },
  });
  const text = await res.text();
  return { status: res.status, text, type: res.headers.get("content-type") ?? "" };
}

describe("HTTP da loja", () => {
  before(ensureShop);

  it("abre a home com a marca e o aviso de teste", async () => {
    const page = await get("/");
    assert.equal(page.status, 200);
    assert.match(page.text, /beabsorventes/i);
    assert.match(page.text, /SITE EM TESTE/);
  });

  it("lista a loja e a ficha de um produto", async () => {
    const loja = await get("/loja");
    assert.equal(loja.status, 200);
    assert.match(loja.text, /Ciclo Mini|Kit 4/i);
    assert.match(loja.text, /SITE EM TESTE/);
    const produto = await get("/produto/ciclo-mini");
    assert.equal(produto.status, 200);
    assert.match(produto.text, /Ciclo Mini/);
    assert.match(produto.text, /Adicionar/);
    assert.match(produto.text, /Calcular frete|CEP/i);
  });

  it("abre cadastro, contato, login, rastreio e checkout vazio", async () => {
    for (const path of ["/cadastro", "/contato", "/conta", "/rastreio", "/checkout", "/admin"]) {
      const page = await get(path);
      assert.equal(page.status, 200, path);
    }
    const contato = await get("/contato");
    assert.match(contato.text, /beabsorventes@gmail.com/);
    const checkout = await get("/checkout");
    assert.match(checkout.text, /sacola está vazia|Adicione um modelo/i);
    const cadastro = await get("/cadastro");
    assert.match(cadastro.text, /cadastro/i);
  });

  it("abre as páginas institucionais e a recuperação de senha", async () => {
    for (const path of ["/guia", "/sobre", "/cuidados", "/privacidade", "/conta/recuperar"]) {
      const page = await get(path);
      assert.equal(page.status, 200, path);
      assert.match(page.text, /SITE EM TESTE/);
    }
  });

  it("responde 404 amigável e o webhook de rastreio exige token", async () => {
    const missing = await get("/pagina-que-nao-existe");
    assert.ok(missing.status === 404 || /não encontrada|nao encontrada/i.test(missing.text));
    const productMissing = await get("/produto/nao-existe");
    assert.ok(
      productMissing.status === 404 || /não encontrada|nao encontrada|não encontrado/i.test(productMissing.text),
    );
    const webhookGet = await get("/api/webhooks/rastreio");
    assert.equal(webhookGet.status, 200);
    assert.match(webhookGet.text, /beabsorventes-rastreio/);
    const webhook = await fetch(`${BASE}/api/webhooks/rastreio`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "order.posted" }),
      signal: AbortSignal.timeout(10000),
    });
    assert.equal(webhook.status, 401);
  });

  it("o webhook do Mercado Pago não aceita lixo sem configuração", async () => {
    const res = await fetch(`${BASE}/api/webhooks/mercadopago`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "payment", data: { id: "0" } }),
      signal: AbortSignal.timeout(10000),
    });
    assert.ok([200, 401, 503, 502].includes(res.status), `status ${res.status}`);
    if (res.status === 200) {
      const body = await res.json();
      assert.equal(typeof body.ok, "boolean");
    }
  });
});
