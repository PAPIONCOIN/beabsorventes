import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SiteShell } from "@/components/layout/site-shell";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

const APP_NAME = "Beabsorventes";

export const Route = createRootRoute({
  notFoundComponent: () => (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-display text-3xl italic">Página não encontrada</h1>
      <p className="mt-3 text-muted">Esse endereço não existe na loja.</p>
      <p className="mt-6">
        <a href="/loja" className="text-primary underline-offset-4 hover:underline">
          Ir para a loja
        </a>
      </p>
    </div>
  ),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Absorventes reutilizáveis de algodão orgânico certificado GOTS. Feitos artesanalmente para acompanhar o seu ciclo.",
      },
      { name: "theme-color", content: "#8c2118" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/images/brand/favicon.png" },
      { rel: "apple-touch-icon", href: "/images/brand/icon-180.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500;1,600&family=Figtree:wght@400;500;600&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="pt-BR" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <SiteShell>
            <Outlet />
          </SiteShell>
          <Toaster position="top-right" />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
