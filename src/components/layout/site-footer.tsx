import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/logo";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_WHATSAPP,
} from "@/lib/contact";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Absorventes ecológicos reutilizáveis de tecido 100% algodão
            orgânico, com tingimento GOTS. Feito artesanalmente.
          </p>
          <p className="mt-3 max-w-sm font-display text-lg italic text-fg">
            Feito girassol, conecte-se com seu ciclo e seja seu Sol.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="mb-1 text-[11px] font-medium tracking-[0.14em] text-muted uppercase">
            Loja
          </p>
          <Link to="/loja" className="text-muted hover:text-fg">
            Peças
          </Link>
          <Link to="/guia" className="text-muted hover:text-fg">
            Modelos
          </Link>
          <Link to="/cuidados" className="text-muted hover:text-fg">
            Como lavar
          </Link>
          <Link to="/sobre" className="text-muted hover:text-fg">
            Quem somos
          </Link>
        </div>
        <div className="text-sm">
          <p className="mb-3 text-[11px] font-medium tracking-[0.14em] text-muted uppercase">
            Ateliê
          </p>
          <p className="text-muted">Envios para todo o Brasil.</p>
          <p className="mt-1 text-muted">Peças saem em até 5 dias úteis.</p>
          <p className="mt-4">
            <a className="text-muted hover:text-fg" href={`mailto:${CONTACT_EMAIL}`}>
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
