import { createFileRoute } from "@tanstack/react-router";
import { CONTACT_EMAIL } from "@/lib/contact";

export const Route = createFileRoute("/privacidade")({ component: Privacidade });

function Privacidade() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs font-medium tracking-wide text-primary uppercase">
        Conteúdo
      </p>
      <h1 className="mt-3 font-display text-4xl italic">Política de privacidade</h1>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted">
        <p>
          A beabsorventes leva a sua privacidade a sério e zela pela segurança e
          proteção dos dados de clientes, parceiras e visitantes desta loja.
        </p>
        <p>
          Ao acessar o site, enviar comunicações ou fornecer dados pessoais,
          você declara estar ciente desta política. Usamos os dados para
          viabilizar pedidos, calcular frete, falar sobre o pedido e melhorar a
          experiência da loja.
        </p>
        <p>
          Não vendemos seus dados. Podemos compartilhá-los com o Mercado Pago,
          os Correios e serviços indispensáveis para pagar, enviar e hospedar o
          site.
        </p>
        <p>
          Para exercer seus direitos da LGPD (acesso, correção, exclusão),
          escreva para{" "}
          <a className="text-fg underline-offset-4 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    </article>
  );
}
