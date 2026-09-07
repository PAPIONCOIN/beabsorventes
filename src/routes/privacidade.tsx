import { createFileRoute } from "@tanstack/react-router";
import { CONTACT_EMAIL, mailToUrl } from "@/lib/contact";

export const Route = createFileRoute("/privacidade")({ component: Privacidade });

function Privacidade() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs font-medium tracking-wide text-primary uppercase">
        Legal
      </p>
      <h1 className="mt-3 font-display text-4xl italic">Política de privacidade</h1>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted">
        <p>
          A beabsorventes trata os dados pessoais com responsabilidade e em
          conformidade com a legislação aplicável, inclusive a Lei Geral de
          Proteção de Dados (LGPD).
        </p>
        <p>
          Ao acessar o site, enviar mensagens ou concluir um pedido, você
          declara ciência desta política. Utilizamos os dados para processar
          compras, calcular o envio, comunicar o andamento do pedido e aprimorar
          a experiência da loja.
        </p>
        <p>
          Não comercializamos seus dados. Podemos compartilhá-los com o Mercado
          Pago, os Correios e provedores essenciais para pagamento, entrega e
          hospedagem.
        </p>
        <p>
          Para exercer seus direitos de acesso, correção ou exclusão, escreva
          para{" "}
          <a className="text-fg underline-offset-4 hover:underline" href={mailToUrl("Privacidade beabsorventes")}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    </article>
  );
}
