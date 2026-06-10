import type { Seller } from "@/lib/mock/types";
import { RatingStars } from "./RatingStars";

export function SellerBadge({ seller }: { seller: Seller }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
      <img src={seller.avatar} alt={seller.name} className="h-12 w-12 rounded-full object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="truncate font-display text-base font-semibold">{seller.name}</h4>
          <RatingStars rating={seller.rating} count={seller.sales} />
        </div>
        <p className="text-xs text-muted-foreground">{seller.location} · since {seller.joinedYear}</p>
      </div>
    </div>
  );
}
