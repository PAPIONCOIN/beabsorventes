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
      <BrandMark className={cn("size-10 shrink-0 sm:size-12", markClassName)} />
      {withName ? (
        <span className="truncate font-display text-[1.15rem] italic leading-none sm:text-xl">
          beabsorventes
        </span>
      ) : null}
    </Link>
  );
}
