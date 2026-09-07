import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/images/brand/logo.png"
      alt="Beabsorventes"
      className={cn("object-contain", className)}
    />
  );
}

export function Logo({
  className,
  markClassName,
  withName = true,
}: {
  className?: string;
  markClassName?: string;
  withName?: boolean;
}) {
  return (
    <Link
      to="/"
      className={cn("flex items-center gap-2.5", className)}
      aria-label="Beabsorventes, página inicial"
    >
      <BrandMark className={cn("size-12", markClassName)} />
      {withName ? (
        <span className="hidden font-display text-xl italic leading-none sm:inline">
          beabsorventes
        </span>
      ) : null}
    </Link>
  );
}
