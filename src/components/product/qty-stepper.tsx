import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  className,
}: {
  value: number;
  onChange: (qty: number) => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex h-11 items-center rounded-md border border-border bg-surface",
        className,
      )}
    >
      <button
        type="button"
        className="flex size-11 items-center justify-center text-muted hover:text-fg"
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Diminuir quantidade"
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-8 text-center text-sm tabular-nums">{value}</span>
      <button
        type="button"
        className="flex size-11 items-center justify-center text-muted hover:text-fg"
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Aumentar quantidade"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
