import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn("flex items-center gap-2.5", className)}
      aria-label="beabsorventes, página inicial"
    >
      <img
        src="/images/brand/logo.png"
        alt=""
        className="size-10 rounded-sm object-cover sm:size-11"
      />
      <span className="hidden font-display text-xl italic leading-none sm:inline">
        beabsorventes
      </span>
    </Link>
  );
}
