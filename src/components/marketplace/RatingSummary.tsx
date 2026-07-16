import { StarRow } from "./StarRating";

export function RatingSummary({
  avg,
  count,
  label = "reviews",
}: {
  avg: number | string;
  count: number;
  label?: string;
}) {
  const value = Number(avg) || 0;
  if (!count) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
        <StarRow value={0} size={18} />
        <p className="text-sm text-muted-foreground">No {label} yet</p>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4">
      <span className="font-display text-3xl font-bold leading-none">{value.toFixed(1)}</span>
      <div>
        <StarRow value={value} size={18} />
        <p className="mt-1 text-xs text-muted-foreground">
          Based on {count} {count === 1 ? label.replace(/s$/, "") : label}
        </p>
      </div>
    </div>
  );
}
