import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors <ListingCard /> layout: image + title + store + price. */
export function ListingCardSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
      <div className="mt-3 flex flex-col gap-2">
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="mt-1 h-5 w-16" />
      </div>
    </div>
  );
}

export function ListingGrid({
  count = 8,
  className = "grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Reviews list skeleton — 3 cards mirroring ReviewList item shape. */
export function ReviewListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="mt-3 h-4 w-24" />
          <Skeleton className="mt-2 h-3 w-11/12" />
          <Skeleton className="mt-1 h-3 w-9/12" />
        </li>
      ))}
    </ul>
  );
}

/** Generic table body skeleton: n rows × cols columns. */
export function TableRowsSkeleton({ rows = 4, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-t">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="p-3">
              <Skeleton className="h-4 w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** Order row skeleton for the buyer /orders page. */
export function OrderCardSkeleton() {
  return (
    <li className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-5 py-3">
        <div className="flex gap-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="grid gap-4 px-5 py-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-14 w-14 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
        <div className="hidden flex-col items-end gap-2 sm:flex">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    </li>
  );
}

/** Store header + product grid skeleton for /store/$handle. */
export function StorePageSkeleton() {
  return (
    <>
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="mt-6 flex items-end gap-4">
        <Skeleton className="h-20 w-20 -mt-12 rounded-full border-4 border-background" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="mt-6 h-4 w-2/3" />
      <div className="mt-10">
        <ListingGrid count={8} />
      </div>
    </>
  );
}

/** Product detail skeleton for /product/$id. */
export function ProductPageSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <Skeleton className="aspect-square w-full rounded-3xl" />
        <div className="mt-3 flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-20 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-4/5" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-24 w-full" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-28 rounded-full" />
          <Skeleton className="h-12 flex-1 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
        <div className="space-y-2 pt-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-4 w-44" />
        </div>
      </div>
    </div>
  );
}

/** Full form skeleton for the listing editor. */
export function ListingFormSkeleton() {
  return (
    <div className="space-y-5">
      <FieldSkeleton />
      <FieldSkeleton lines={4} />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <FieldSkeleton key={i} />
        ))}
      </div>
      <FieldSkeleton lines={3} />
      <FieldSkeleton />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

function FieldSkeleton({ lines = 1 }: { lines?: number }) {
  const height = lines > 3 ? "h-28" : lines > 1 ? "h-20" : "h-9";
  return (
    <div>
      <Skeleton className="mb-2 h-3 w-20" />
      <Skeleton className={`${height} w-full`} />
    </div>
  );
}

/** Compact profile / avatar form skeleton for /account. */
export function AccountSkeleton() {
  return (
    <div>
      <Skeleton className="h-9 w-48" />
      <div className="mt-6 flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      <div className="mt-8 space-y-4">
        <FieldSkeleton />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
