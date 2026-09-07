import { MessageCircle } from "lucide-react";
import { CONTACT_WHATSAPP } from "@/lib/contact";

export function WhatsAppButton() {
  return (
    <a
      href={CONTACT_WHATSAPP}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-40 flex size-12 items-center justify-center rounded-full bg-primary text-primary-fg shadow-soft transition-transform hover:scale-105 active:scale-95 sm:right-6 sm:bottom-6 sm:left-auto"
    >
      <MessageCircle className="size-5" />
    </a>
  );
}
