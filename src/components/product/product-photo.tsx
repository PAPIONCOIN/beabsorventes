import { cn } from "@/lib/utils";

export function ProductPhoto({
  src,
  alt,
  className,
  imgClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div className={cn("overflow-hidden bg-surface", className)}>
      <img
        src={src}
        alt={alt}
        className={cn(
          "h-full w-full object-contain p-5 sm:p-7",
          imgClassName,
        )}
      />
    </div>
  );
}
