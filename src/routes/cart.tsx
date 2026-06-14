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
import { getShippingRates } from "@/lib/shipping.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — NoBS Market" },
      { name: "description", content: "Review your cart and head to checkout on NoBS Market." },
    ],
  }),
  component: CartPage,
});

type Addr = {
  name?: string | null;
  street1: string;
  street2?: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string | null;
};

type Rate = {
  id: string;
  carrier: string;
  service: string;
  amount_cents: number;
  delivery_days: number | null;
};

function CartPage() {
  const navigate = useNavigate();
  const { items, setQty, remove, count } = useCart();
  const ids = items.map((i) => i.listingId);
  const checkout = useServerFn(createCheckoutSession);
  const fetchRates = useServerFn(getShippingRates);

  const [addr, setAddr] = useState<Addr>({
    name: "", street1: "", street2: "", city: "", state: "", zip: "", country: "US", phone: "",
  });
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [rates, setRates] = useState<Rate[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["cart-listings", ids.slice().sort().join(",")],
    queryFn: () => getListingsByIds({ data: { ids } }),
    enabled: ids.length > 0,
  });

  async function onGetRates(e: React.FormEvent) {
    e.preventDefault();
    setLoadingRates(true);
    setRates([]);
    setSelectedRateId(null);
    try {
      const res = await fetchRates({
        data: {
          items: items.map((i) => ({ listing_id: i.listingId, quantity: i.qty })),
          to_address: addr,
        },
      });
      setShipmentId(res.shipment_id);
      setRates(res.rates);
      if (res.rates[0]) setSelectedRateId(res.rates[0].id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not get rates");
    } finally {
      setLoadingRates(false);
    }
  }

  async function onCheckout() {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) {
      toast.info("Sign in to check out");
      navigate({ to: "/auth" });
      return;
    }
    const chosen = rates.find((r) => r.id === selectedRateId);
    if (!chosen || !shipmentId) {
      toast.error("Pick a shipping option first.");
      return;
    }
    setCheckingOut(true);
    try {
      const { url } = await checkout({
        data: {
          items: items.map((i) => ({ listing_id: i.listingId, quantity: i.qty })),
          to_address: addr,
          shipping: {
            easypost_shipment_id: shipmentId,
            easypost_rate_id: chosen.id,
            amount_cents: chosen.amount_cents,
            carrier: chosen.carrier,
            service: chosen.service,
          },
        },
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
  const storeIds = new Set<string>();
  for (const it of items) {
    const l = byId.get(it.listingId);
    if (!l) continue;
    subtotal += l.price_cents * it.qty;
    storeIds.add(l.store_id);
  }
  const multiSeller = storeIds.size > 1;
  const chosenRate = rates.find((r) => r.id === selectedRateId);
  const shippingCents = chosenRate?.amount_cents ?? 0;
  const total = subtotal + shippingCents;

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Your cart</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {count} {count === 1 ? "item" : "items"}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <ul className="space-y-4">
              {items.map((it) => {
                const l = byId.get(it.listingId);
                if (!l) {
                  return (
                    <li key={it.listingId} className="flex items-center justify-between rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
                      <span>{isLoading ? "Loading…" : "This item is no longer available."}</span>
                      {!isLoading && (
                        <button onClick={() => remove(it.listingId)} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                      )}
                    </li>
                  );
                }
                return (
                  <li key={it.listingId} className="flex gap-4 rounded-2xl border bg-card p-4">
                    <Link to="/product/$id" params={{ id: l.id }} className="shrink-0">
                      <img src={l.image_urls[0] ?? "https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=400&q=70"} alt={l.title} className="h-28 w-28 rounded-xl object-cover sm:h-32 sm:w-32" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link to="/product/$id" params={{ id: l.id }} className="line-clamp-2 font-medium hover:underline">{l.title}</Link>
                          <p className="mt-1 text-xs text-muted-foreground">by {l.store.name}</p>
                        </div>
                        <span className="font-display text-lg font-semibold whitespace-nowrap">{formatPrice(l.price_cents * it.qty)}</span>
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

            {!multiSeller && (
              <form onSubmit={onGetRates} className="rounded-2xl border bg-card p-5">
                <h2 className="font-display text-lg font-semibold">Shipping address</h2>
                <p className="mt-1 text-xs text-muted-foreground">Enter where this should ship to get live rates.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label="Full name"><Input value={addr.name ?? ""} onChange={(e) => setAddr({ ...addr, name: e.target.value })} /></Field>
                  <Field label="Phone"><Input value={addr.phone ?? ""} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} /></Field>
                  <div className="sm:col-span-2"><Field label="Street"><Input required value={addr.street1} onChange={(e) => setAddr({ ...addr, street1: e.target.value })} /></Field></div>
                  <div className="sm:col-span-2"><Field label="Street 2"><Input value={addr.street2 ?? ""} onChange={(e) => setAddr({ ...addr, street2: e.target.value })} /></Field></div>
                  <Field label="City"><Input required value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} /></Field>
                  <Field label="State"><Input required maxLength={2} value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value.toUpperCase() })} /></Field>
                  <Field label="ZIP"><Input required value={addr.zip} onChange={(e) => setAddr({ ...addr, zip: e.target.value })} /></Field>
                  <Field label="Country"><Input required maxLength={2} value={addr.country} onChange={(e) => setAddr({ ...addr, country: e.target.value.toUpperCase() })} /></Field>
                </div>
                <Button type="submit" disabled={loadingRates} className="mt-4">
                  {loadingRates ? "Fetching rates…" : "Get shipping rates"}
                </Button>

                {rates.length > 0 && (
                  <div className="mt-5">
                    <h3 className="text-sm font-semibold">Choose a shipping option</h3>
                    <div className="mt-2 space-y-2">
                      {rates.map((r) => (
                        <label key={r.id} className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-sm ${selectedRateId === r.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}>
                          <span className="flex items-center gap-3">
                            <input type="radio" name="rate" checked={selectedRateId === r.id} onChange={() => setSelectedRateId(r.id)} />
                            <span>
                              <span className="font-medium">{r.carrier} {r.service}</span>
                              {r.delivery_days != null && <span className="ml-2 text-xs text-muted-foreground">~{r.delivery_days}d</span>}
                            </span>
                          </span>
                          <span className="font-semibold">{formatPrice(r.amount_cents)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>

          <aside className="h-fit rounded-2xl border bg-card p-6 lg:sticky lg:top-24">
            <h2 className="font-display text-xl font-semibold">Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Subtotal" value={formatPrice(subtotal)} />
              <Row label="Shipping" value={chosenRate ? formatPrice(shippingCents) : "Get rates above"} muted={!chosenRate} />
              <Row label="Estimated tax" value="Calculated at checkout" muted />
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t pt-4">
              <span className="font-display text-lg font-semibold">Total</span>
              <span className="font-display text-2xl font-bold">{formatPrice(total)}</span>
            </div>
            <button
              onClick={onCheckout}
              disabled={checkingOut || isLoading || multiSeller || !chosenRate}
              className="mt-5 w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {checkingOut ? "Redirecting…" : "Checkout"}
            </button>
            {multiSeller ? (
              <p className="mt-3 text-center text-xs text-destructive">
                Your cart has items from multiple sellers. Remove items so only one seller remains, then check out.
              </p>
            ) : !chosenRate ? (
              <p className="mt-3 text-center text-xs text-muted-foreground">Fetch rates and pick a shipping option to continue.</p>
            ) : (
              <p className="mt-3 text-center text-xs text-muted-foreground">Secure checkout powered by Stripe.</p>
            )}
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      {children}
    </div>
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
