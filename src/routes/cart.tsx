import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { useCart } from "@/lib/store/cart";
import { getProduct, getSeller } from "@/lib/mock/data";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — NoBS Market" },
      { name: "description", content: "Review your cart and head to checkout on NoBS Market." },
      { property: "og:title", content: "Your cart — NoBS Market" },
      { property: "og:description", content: "Review your cart and head to checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotal, shipping, total, count } = useCart();

  if (items.length === 0) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="font-display text-4xl font-bold">Your cart's empty.</h1>
          <p className="mt-3 text-muted-foreground">Probably for the best. Or fix it:</p>
          <Link to="/browse" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Browse stuff</Link>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Your cart</h1>
        <p className="mt-1 text-sm text-muted-foreground">{count} {count === 1 ? "item" : "items"}</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <ul className="space-y-4">
            {items.map((it) => {
              const p = getProduct(it.productId);
              if (!p) return null;
              const seller = getSeller(p.sellerId);
              return (
                <li key={it.productId} className="flex gap-4 rounded-2xl border bg-card p-4">
                  <Link to="/product/$id" params={{ id: p.id }} className="shrink-0">
                    <img src={p.images[0]} alt={p.title} className="h-28 w-28 rounded-xl object-cover sm:h-32 sm:w-32" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to="/product/$id" params={{ id: p.id }} className="line-clamp-2 font-medium hover:underline">{p.title}</Link>
                        {seller && <p className="mt-1 text-xs text-muted-foreground">by {seller.name}</p>}
                        <p className="mt-1 text-xs text-muted-foreground">{p.condition} · ships from {p.shippingFrom}</p>
                      </div>
                      <span className="font-display text-lg font-semibold whitespace-nowrap">{formatPrice(p.price * it.qty)}</span>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <div className="flex items-center rounded-full border">
                        <button onClick={() => setQty(p.id, it.qty - 1)} className="grid h-9 w-9 place-items-center rounded-l-full hover:bg-muted">−</button>
                        <span className="w-8 text-center text-sm">{it.qty}</span>
                        <button onClick={() => setQty(p.id, it.qty + 1)} className="grid h-9 w-9 place-items-center rounded-r-full hover:bg-muted">+</button>
                      </div>
                      <button onClick={() => remove(p.id)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
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
            <button className="mt-5 w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
              Checkout
            </button>
            <p className="mt-3 text-center text-xs text-muted-foreground">Buyer protection on every order. Easy returns.</p>
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
