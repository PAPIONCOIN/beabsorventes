import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/logo";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_WHATSAPP,
  mailToUrl,
} from "@/lib/contact";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface pb-[max(5rem,env(safe-area-inset-bottom))] sm:pb-0">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo withName={false} markClassName="size-20 sm:size-28" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Absorventes reutilizáveis de algodão orgânico, com tingimento GOTS.
            Produzidos artesanalmente no ateliê.
          </p>
          <p className="mt-3 max-w-sm font-display text-lg italic text-fg">
            Feito girassol: conecte-se ao seu ciclo.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="mb-1 text-[11px] font-medium tracking-[0.14em] text-muted uppercase">
            Loja
          </p>
          <Link to="/loja" className="flex min-h-11 items-center text-muted hover:text-fg">
            Peças
          </Link>
          <Link to="/guia" className="flex min-h-11 items-center text-muted hover:text-fg">
            Modelos
          </Link>
          <Link to="/cuidados" className="flex min-h-11 items-center text-muted hover:text-fg">
            Como lavar
          </Link>
          <Link to="/sobre" className="flex min-h-11 items-center text-muted hover:text-fg">
            Quem somos
          </Link>
          <Link to="/conta" className="flex min-h-11 items-center text-muted hover:text-fg">
            Login
          </Link>
          <Link to="/rastreio" className="flex min-h-11 items-center text-muted hover:text-fg">
            Rastrear pedido
          </Link>
          <Link to="/admin" className="flex min-h-11 items-center text-muted hover:text-fg">
            Administração
          </Link>
        </div>
        <div className="text-sm">
          <p className="mb-3 text-[11px] font-medium tracking-[0.14em] text-muted uppercase">
            Ateliê
          </p>
          <p className="text-muted">Envios para todo o Brasil.</p>
          <p className="mt-1 text-muted">O tempo de confecção é de 5 dias.</p>
          <p className="mt-4">
            <a className="break-all text-muted hover:text-fg" href={mailToUrl()}>
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="mt-1">
            <a
              className="text-muted hover:text-fg"
              href={CONTACT_WHATSAPP}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp {CONTACT_PHONE_DISPLAY}
            </a>
          </p>
          <p className="mt-6">
            <Link to="/privacidade" className="text-xs text-muted hover:text-fg">
              Política de privacidade
            </Link>
          </p>
          <p className="mt-2 text-xs text-muted">
            © {new Date().getFullYear()} beabsorventes
          </p>
        </div>
      </div>
    </footer>
  );
}
