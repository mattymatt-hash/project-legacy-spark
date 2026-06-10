import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PriceTag({ price, original, className }: { price: number; original?: number; className?: string }) {
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className="font-display text-lg font-semibold" style={{ color: "var(--color-price)" }}>{formatPrice(price)}</span>
      {original && original > price && (
        <span className="text-sm text-muted-foreground line-through">{formatPrice(original)}</span>
      )}
    </div>
  );
}
