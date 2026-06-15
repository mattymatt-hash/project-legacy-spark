import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRow({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <div className={cn("inline-flex items-center", className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={cn(n <= Math.round(value) ? "fill-current" : "fill-none")}
          style={{ color: n <= Math.round(value) ? "var(--color-accent)" : "var(--muted-foreground)" }}
        />
      ))}
    </div>
  );
}

export function StarInput({
  value,
  onChange,
  size = 22,
}: {
  value: number;
  onChange: (n: number) => void;
  size?: number;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          className="rounded p-0.5 transition hover:scale-110"
        >
          <Star
            size={size}
            className={n <= value ? "fill-current" : "fill-none"}
            style={{ color: n <= value ? "var(--color-accent)" : "var(--muted-foreground)" }}
          />
        </button>
      ))}
    </div>
  );
}
