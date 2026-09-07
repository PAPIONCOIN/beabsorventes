import { MessageCircle } from "lucide-react";
import { CONTACT_WHATSAPP } from "@/lib/contact";

export function WhatsAppButton() {
  return (
    <a
      href={CONTACT_WHATSAPP}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed right-4 bottom-4 z-50 flex size-12 items-center justify-center rounded-full bg-primary text-primary-fg shadow-soft transition-transform hover:scale-105 active:scale-95 sm:right-6 sm:bottom-6"
    >
      <MessageCircle className="size-5" />
    </a>
  );
}
