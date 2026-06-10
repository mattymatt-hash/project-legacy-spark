import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({ rating, count, size = 14, className }: { rating: number; count?: number; size?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-1 text-sm text-muted-foreground", className)}>
      <Star size={size} className="fill-current" style={{ color: "var(--color-accent)" }} />
      <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
      {typeof count === "number" && <span>({count})</span>}
    </div>
  );
}
