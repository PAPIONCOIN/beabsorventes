import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/logo";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_WHATSAPP,
} from "@/lib/contact";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Absorventes reutilizáveis de tecido. Algodão orgânico, feito para
            durar anos — não horas.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <Link to="/loja" className="text-muted hover:text-fg">
            Loja
          </Link>
          <Link to="/guia" className="text-muted hover:text-fg">
            Guia de fluxo
          </Link>
          <Link to="/cuidados" className="text-muted hover:text-fg">
            Como lavar
          </Link>
          <Link to="/sobre" className="text-muted hover:text-fg">
            O ateliê
          </Link>
          <Link to="/contato" className="text-muted hover:text-fg">
            Contato
          </Link>
        </div>
        <div className="text-sm text-muted">
          <p>Envios para todo o Brasil.</p>
          <p className="mt-1">Frete grátis a partir de R$ 180.</p>
          <p className="mt-4">
            <a className="hover:text-fg" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="mt-1">
            <a
              className="hover:text-fg"
              href={CONTACT_WHATSAPP}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp {CONTACT_PHONE_DISPLAY}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
