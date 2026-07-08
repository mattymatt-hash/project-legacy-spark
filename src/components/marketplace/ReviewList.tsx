import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useInfiniteQuery } from "@tanstack/react-query";
import { StarRow } from "./StarRating";
import { ReviewListSkeleton } from "./skeletons";
import { getListingReviews, getStoreReviews, type ReviewSort } from "@/lib/reviews.functions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE = 10;
const SORT_OPTIONS: { value: ReviewSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Highest rated" },
  { value: "lowest", label: "Lowest rated" },
];

function timeAgo(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function SortBar({
  sort,
  onSort,
  total,
}: {
  sort: ReviewSort;
  onSort: (s: ReviewSort) => void;
  total: number;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {total} review{total === 1 ? "" : "s"}
      </p>
      <Select value={sort} onValueChange={(v) => onSort(v as ReviewSort)}>
        <SelectTrigger className="h-9 w-[170px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function LoadMore({
  onClick,
  loading,
  hasMore,
}: {
  onClick: () => void;
  loading: boolean;
  hasMore: boolean;
}) {
  if (!hasMore) return null;
  return (
    <div className="mt-6 flex justify-center">
      <button
        onClick={onClick}
        disabled={loading}
        className="rounded-full border bg-card px-5 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
      >
        {loading ? "Loading…" : "Load more"}
      </button>
    </div>
  );
}

export function ListingReviews({ listingId }: { listingId: string }) {
  const [sort, setSort] = useState<ReviewSort>("newest");
  const load = useServerFn(getListingReviews);
  const q = useInfiniteQuery({
    queryKey: ["listing-reviews", listingId, sort],
    queryFn: ({ pageParam = 0 }) =>
      load({ data: { listing_id: listingId, limit: PAGE, offset: pageParam, sort } }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.nextOffset < last.total ? last.nextOffset : undefined),
  });

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading reviews…</p>;
  const total = q.data?.pages[0]?.total ?? 0;
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];

  if (!total) {
    return (
      <p className="rounded-2xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
        No reviews yet. Be the first to share what you think after a purchase.
      </p>
    );
  }

  return (
    <div>
      <SortBar sort={sort} onSort={setSort} total={total} />
      <ul className="space-y-4">
        {items.map((r) => {
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
      <LoadMore
        onClick={() => q.fetchNextPage()}
        loading={q.isFetchingNextPage}
        hasMore={!!q.hasNextPage}
      />
    </div>
  );
}

export function StoreReviews({ handle }: { handle: string }) {
  const [sort, setSort] = useState<ReviewSort>("newest");
  const load = useServerFn(getStoreReviews);
  const q = useInfiniteQuery({
    queryKey: ["store-reviews", handle, sort],
    queryFn: ({ pageParam = 0 }) =>
      load({ data: { handle, limit: PAGE, offset: pageParam, sort } }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.nextOffset < last.total ? last.nextOffset : undefined),
  });

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading reviews…</p>;
  const total = q.data?.pages[0]?.total ?? 0;
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];

  if (!total) {
    return (
      <p className="rounded-2xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
        No reviews yet for this store.
      </p>
    );
  }

  return (
    <div>
      <SortBar sort={sort} onSort={setSort} total={total} />
      <ul className="space-y-4">
        {items.map((r) => {
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
      <LoadMore
        onClick={() => q.fetchNextPage()}
        loading={q.isFetchingNextPage}
        hasMore={!!q.hasNextPage}
      />
    </div>
  );
}
