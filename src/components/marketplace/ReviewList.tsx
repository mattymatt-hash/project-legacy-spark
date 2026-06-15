import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { StarRow } from "./StarRating";
import { getListingReviews, getStoreReviews } from "@/lib/reviews.functions";

function timeAgo(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function ListingReviews({ listingId }: { listingId: string }) {
  const load = useServerFn(getListingReviews);
  const { data, isLoading } = useQuery({
    queryKey: ["listing-reviews", listingId],
    queryFn: () => load({ data: { listing_id: listingId } }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading reviews…</p>;
  if (!data?.length) {
    return (
      <p className="rounded-2xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
        No reviews yet. Be the first to share what you think after a purchase.
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {data.map((r) => {
        const buyer = (r as { buyer?: { display_name?: string | null; avatar_url?: string | null } | null }).buyer;
        const name = buyer?.display_name?.trim() || "Verified buyer";
        return (
          <li key={r.id} className="rounded-2xl border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {buyer?.avatar_url ? (
                  <img src={buyer.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-muted text-xs font-medium">{name[0]}</div>
                )}
                <span className="text-sm font-medium">{name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</span>
            </div>
            <StarRow value={r.rating} className="mt-2" />
            {r.body && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{r.body}</p>}
          </li>
        );
      })}
    </ul>
  );
}

export function StoreReviews({ handle }: { handle: string }) {
  const load = useServerFn(getStoreReviews);
  const { data, isLoading } = useQuery({
    queryKey: ["store-reviews", handle],
    queryFn: () => load({ data: { handle } }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading reviews…</p>;
  if (!data?.length) {
    return (
      <p className="rounded-2xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
        No reviews yet for this store.
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {data.map((r) => {
        const listing = (r as { listing?: { title: string; image_urls: string[] } | null }).listing;
        return (
          <li key={r.id} className="rounded-2xl border bg-card p-4">
            <div className="flex items-start gap-3">
              {listing?.image_urls?.[0] && (
                <img src={listing.image_urls[0]} alt="" className="h-12 w-12 rounded-md object-cover" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <StarRow value={r.rating} />
                  <span className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</span>
                </div>
                {listing && <div className="mt-1 text-xs text-muted-foreground">on {listing.title}</div>}
                {r.body && <p className="mt-2 whitespace-pre-wrap text-sm">{r.body}</p>}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
