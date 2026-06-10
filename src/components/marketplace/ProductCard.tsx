import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/mock/types";
import { getSeller } from "@/lib/mock/data";
import { PriceTag } from "./PriceTag";
import { RatingStars } from "./RatingStars";
import { useFavorites } from "@/lib/store/favorites";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const seller = getSeller(product.sellerId);
  const { has, toggle } = useFavorites();
  const favored = has(product.id);

  return (
    <div className="group relative flex flex-col">
      <Link to="/product/$id" params={{ id: product.id }} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
          <img src={product.images[0]} alt={product.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          {product.originalPrice && (
            <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium" style={{ color: "var(--color-sale)" }}>
              Sale
            </span>
          )}
        </div>
      </Link>
      <button
        onClick={(e) => { e.preventDefault(); toggle(product.id); }}
        aria-label={favored ? "Remove from favorites" : "Add to favorites"}
        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 backdrop-blur transition-colors hover:bg-background"
      >
        <Heart size={16} className={cn("transition-colors", favored ? "fill-current text-[var(--color-sale)]" : "text-foreground")} />
      </button>
      <div className="mt-3 flex flex-col gap-1.5">
        <Link to="/product/$id" params={{ id: product.id }} className="line-clamp-2 text-sm font-medium leading-snug hover:underline">
          {product.title}
        </Link>
        {seller && <span className="text-xs text-muted-foreground">by {seller.name}</span>}
        <div className="mt-1 flex items-center justify-between">
          <PriceTag price={product.price} original={product.originalPrice} />
          <RatingStars rating={product.rating} count={product.reviewCount} />
        </div>
      </div>
    </div>
  );
}
