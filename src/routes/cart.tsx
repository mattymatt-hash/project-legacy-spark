import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/layout/SiteShell";
import { useCart } from "@/lib/store/cart";
import { getListingsByIds } from "@/lib/listings.functions";
import { createCheckoutSession } from "@/lib/checkout.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — NoBS Market" },
      { name: "description", content: "Review your cart and head to checkout on NoBS Market." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const navigate = useNavigate();
  const { items, setQty, remove, count } = useCart();
  const ids = items.map((i) => i.listingId);
  const checkout = useServerFn(createCheckoutSession);
  const [checkingOut, setCheckingOut] = useState(false);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["cart-listings", ids.slice().sort().join(",")],
    queryFn: () => getListingsByIds({ data: { ids } }),
    enabled: ids.length > 0,
  });

  async function onCheckout() {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) {
      toast.info("Sign in to check out");
      navigate({ to: "/auth" });
      return;
    }
    setCheckingOut(true);
    try {
      const { url } = await checkout({
        data: { items: items.map((i) => ({ listing_id: i.listingId, quantity: i.qty })) },
      });
      if (url) window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
      setCheckingOut(false);
    }
  }

  if (items.length === 0) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="font-display text-4xl font-bold">Your cart's empty.</h1>
          <p className="mt-3 text-muted-foreground">Probably for the best. Or fix it:</p>
          <Link to="/browse" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
            Browse stuff
          </Link>
        </div>
      </SiteShell>
    );
  }

  const byId = new Map(listings.map((l) => [l.id, l]));
  let subtotal = 0;
  let shipping = 0;
  const storeIds = new Set<string>();
  for (const it of items) {
    const l = byId.get(it.listingId);
    if (!l) continue;
    subtotal += l.price_cents * it.qty;
    shipping += l.shipping_cents;
    storeIds.add(l.store_id);
  }
  const total = subtotal + shipping;
  const multiSeller = storeIds.size > 1;

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Your cart</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {count} {count === 1 ? "item" : "items"}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <ul className="space-y-4">
            {items.map((it) => {
              const l = byId.get(it.listingId);
              if (!l) {
                return (
                  <li key={it.listingId} className="flex items-center justify-between rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
                    <span>{isLoading ? "Loading…" : "This item is no longer available."}</span>
                    {!isLoading && (
                      <button onClick={() => remove(it.listingId)} className="text-xs text-muted-foreground hover:text-destructive">
                        Remove
                      </button>
                    )}
                  </li>
                );
              }
              return (
                <li key={it.listingId} className="flex gap-4 rounded-2xl border bg-card p-4">
                  <Link to="/product/$id" params={{ id: l.id }} className="shrink-0">
                    <img
                      src={l.image_urls[0] ?? "https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=400&q=70"}
                      alt={l.title}
                      className="h-28 w-28 rounded-xl object-cover sm:h-32 sm:w-32"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to="/product/$id" params={{ id: l.id }} className="line-clamp-2 font-medium hover:underline">
                          {l.title}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">by {l.store.name}</p>
                      </div>
                      <span className="font-display text-lg font-semibold whitespace-nowrap">
                        {formatPrice(l.price_cents * it.qty)}
                      </span>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <div className="flex items-center rounded-full border">
                        <button onClick={() => setQty(l.id, it.qty - 1)} className="grid h-9 w-9 place-items-center rounded-l-full hover:bg-muted">−</button>
                        <span className="w-8 text-center text-sm">{it.qty}</span>
                        <button onClick={() => setQty(l.id, it.qty + 1)} className="grid h-9 w-9 place-items-center rounded-r-full hover:bg-muted">+</button>
                      </div>
                      <button onClick={() => remove(l.id)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="h-fit rounded-2xl border bg-card p-6 lg:sticky lg:top-24">
            <h2 className="font-display text-xl font-semibold">Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Subtotal" value={formatPrice(subtotal)} />
              <Row label="Shipping" value={formatPrice(shipping)} />
              <Row label="Estimated tax" value="Calculated at checkout" muted />
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t pt-4">
              <span className="font-display text-lg font-semibold">Total</span>
              <span className="font-display text-2xl font-bold">{formatPrice(total)}</span>
            </div>
            <button
              onClick={onCheckout}
              disabled={checkingOut || isLoading || multiSeller}
              className="mt-5 w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {checkingOut ? "Redirecting…" : "Checkout"}
            </button>
            {multiSeller ? (
              <p className="mt-3 text-center text-xs text-destructive">
                Your cart has items from multiple sellers. Remove items so only one seller remains, then check out.
              </p>
            ) : (
              <p className="mt-3 text-center text-xs text-muted-foreground">Secure checkout powered by Stripe.</p>
            )}
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={muted ? "text-muted-foreground" : ""}>{value}</dd>
    </div>
  );
}
