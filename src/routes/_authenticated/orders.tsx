import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ExternalLink, Package, Star } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ReviewDialog } from "@/components/orders/ReviewDialog";
import { OrderCardSkeleton } from "@/components/marketplace/skeletons";
import { getMyOrders } from "@/lib/checkout.functions";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "Your orders — NoBS Market" }] }),
  component: OrdersPage,
});

function statusBadgeClass(status: string) {
  switch (status) {
    case "paid":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
    case "pending":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
    case "refunded":
    case "cancelled":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function OrdersPage() {
  const load = useServerFn(getMyOrders);
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => load(),
  });
  const [reviewing, setReviewing] = useState<{ orderId: string; listingId: string; title: string; rating?: number } | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Your orders</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track purchases and shipping status.
            </p>
          </div>
        </div>

        {isLoading ? (
          <ul className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <OrderCardSkeleton key={i} />)}
          </ul>
        ) : error ? (
          <p className="text-sm text-destructive">{(error as Error).message}</p>
        ) : !data?.length ? (
          <EmptyState />
        ) : (
          <ul className="space-y-4">
            {data.map((o) => {
              const items = (o.order_items ?? []) as { listing_id: string; title: string; quantity: number; unit_price_cents: number; image_url: string | null }[];
              const reviews = ((o as { reviews?: { id: string; listing_id: string; rating: number }[] }).reviews ?? []);
              const reviewByListing = new Map(reviews.map((r) => [r.listing_id, r]));
              const store = (o as { store?: { handle: string; name: string } | null }).store;
              const canReview = o.status === "paid" || o.status === "fulfilled";
              return (
                <li key={o.id} className="overflow-hidden rounded-2xl border bg-card">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-5 py-3 text-sm">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(o.status)}`}>
                        {o.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div className="text-sm font-semibold">{formatPrice(o.total_cents, o.currency?.toUpperCase() ?? "USD")}</div>
                  </div>

                  <div className="grid gap-4 px-5 py-4 sm:grid-cols-[1fr_auto]">
                    <ul className="space-y-3">
                      {items.map((i, idx) => {
                        const existing = reviewByListing.get(i.listing_id);
                        return (
                          <li key={idx} className="flex items-center gap-3">
                            {i.image_url ? (
                              <img src={i.image_url} alt="" className="h-14 w-14 rounded-md object-cover" />
                            ) : (
                              <div className="grid h-14 w-14 place-items-center rounded-md bg-muted text-muted-foreground">
                                <Package size={18} />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium">{i.title}</div>
                              <div className="text-xs text-muted-foreground">
                                Qty {i.quantity} · {formatPrice(i.unit_price_cents, o.currency?.toUpperCase() ?? "USD")}
                              </div>
                            </div>
                            {canReview && (
                              <Button
                                size="sm"
                                variant={existing ? "ghost" : "outline"}
                                onClick={() =>
                                  setReviewing({
                                    orderId: o.id,
                                    listingId: i.listing_id,
                                    title: i.title,
                                    rating: existing?.rating,
                                  })
                                }
                              >
                                <Star size={14} className={existing ? "fill-current" : ""} />
                                {existing ? "Edit review" : "Review"}
                              </Button>
                            )}
                          </li>
                        );
                      })}
                    </ul>



                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      {store && (
                        <Button asChild variant="ghost" size="sm">
                          <Link to="/store/$handle" params={{ handle: store.handle }}>{store.name}</Link>
                        </Button>
                      )}
                      <ShippingBlock
                        carrier={o.carrier}
                        service={o.service}
                        status={o.shipping_status}
                        tracking_code={o.tracking_code}
                        tracking_url={o.tracking_url}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
      {reviewing && (
        <ReviewDialog
          open
          onOpenChange={(v) => !v && setReviewing(null)}
          orderId={reviewing.orderId}
          listingId={reviewing.listingId}
          itemTitle={reviewing.title}
          initialRating={reviewing.rating ?? 0}
        />
      )}
    </div>
  );
}

function ShippingBlock({
  carrier,
  service,
  status,
  tracking_code,
  tracking_url,
}: {
  carrier: string | null;
  service: string | null;
  status: string | null;
  tracking_code: string | null;
  tracking_url: string | null;
}) {
  if (!carrier && !tracking_code) {
    return <p className="text-xs text-muted-foreground">Awaiting shipment</p>;
  }
  return (
    <div className="text-right text-xs">
      {carrier && (
        <div className="font-medium">
          {carrier} {service}
        </div>
      )}
      {status && <div className="capitalize text-muted-foreground">{status.replace(/_/g, " ")}</div>}
      {tracking_code &&
        (tracking_url ? (
          <a
            href={tracking_url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 underline"
          >
            {tracking_code} <ExternalLink size={12} />
          </a>
        ) : (
          <div className="mt-1 font-mono">{tracking_code}</div>
        ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed bg-card p-12 text-center">
      <Package className="mx-auto text-muted-foreground" size={32} />
      <h2 className="mt-3 font-display text-lg font-semibold">No orders yet</h2>
      <p className="mt-1 text-sm text-muted-foreground">When you buy something, it'll show up here.</p>
      <Button asChild className="mt-4">
        <Link to="/browse">Start browsing</Link>
      </Button>
    </div>
  );
}
