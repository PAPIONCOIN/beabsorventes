import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn("flex items-baseline gap-0.5 text-fg", className)}
      aria-label="Beabsorventes, página inicial"
    >
      <span className="font-display text-2xl leading-none italic">Be</span>
      <span className="text-sm font-medium tracking-wide">absorventes</span>
    </Link>
  );
}
