import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { PublicListing } from "@/lib/listings.functions";
import { PriceTag } from "./PriceTag";
import { useFavorites } from "@/lib/store/favorites";
import { cn } from "@/lib/utils";

const PLACEHOLDER = "https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=600&q=70";

export function ListingCard({ listing }: { listing: PublicListing }) {
  const { has, toggle } = useFavorites();
  const favored = has(listing.id);
  const cover = listing.image_urls[0] ?? PLACEHOLDER;

  return (
    <div className="group relative flex flex-col">
      <Link to="/product/$id" params={{ id: listing.id }} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
          <img
            src={cover}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {listing.original_price_cents && listing.original_price_cents > listing.price_cents && (
            <span
              className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium"
              style={{ color: "var(--color-sale)" }}
            >
              Sale
            </span>
          )}
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          toggle(listing.id);
        }}
        aria-label={favored ? "Remove from favorites" : "Add to favorites"}
        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 backdrop-blur transition-colors hover:bg-background"
      >
        <Heart size={16} className={cn("transition-colors", favored ? "fill-current text-[var(--color-sale)]" : "text-foreground")} />
      </button>
      <div className="mt-3 flex flex-col gap-1.5">
        <Link to="/product/$id" params={{ id: listing.id }} className="line-clamp-2 text-sm font-medium leading-snug hover:underline">
          {listing.title}
        </Link>
        <Link
          to="/store/$handle"
          params={{ handle: listing.store.handle }}
          className="text-xs text-muted-foreground hover:underline"
        >
          by {listing.store.name}
        </Link>
        <div className="mt-1">
          <PriceTag price={listing.price_cents} original={listing.original_price_cents ?? undefined} />
        </div>
      </div>
    </div>
  );
}
