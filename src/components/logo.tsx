import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn("block shrink-0", className)}
      aria-label="beabsorventes, página inicial"
    >
      <img
        src="/images/brand/logo.png"
        alt="beabsorventes"
        className="h-11 w-auto object-contain object-left outline-none sm:h-12"
      />
    </Link>
  );
}
