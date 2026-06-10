import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { PriceTag } from "@/components/marketplace/PriceTag";
import { RatingStars } from "@/components/marketplace/RatingStars";
import { SellerBadge } from "@/components/marketplace/SellerBadge";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { getProduct, getReviews, getSeller, products } from "@/lib/mock/data";
import { useCart } from "@/lib/store/cart";
import { useFavorites } from "@/lib/store/favorites";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$id")({
  loader: ({ params }) => {
    const product = getProduct(params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    if (!p) return { meta: [{ title: "Product — NoBS Market" }] };
    return {
      meta: [
        { title: `${p.title} — NoBS Market` },
        { name: "description", content: p.description.slice(0, 155) },
        { property: "og:title", content: p.title },
        { property: "og:description", content: p.description.slice(0, 155) },
        { property: "og:image", content: p.images[0] },
        { name: "twitter:image", content: p.images[0] },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Item not found</h1>
        <p className="mt-2 text-muted-foreground">It may have sold or been taken down.</p>
        <Link to="/browse" className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Keep browsing</Link>
      </div>
    </SiteShell>
  ),
  errorComponent: ({ reset }) => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Something broke</h1>
        <button onClick={reset} className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Try again</button>
      </div>
    </SiteShell>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const seller = getSeller(product.sellerId);
  const reviews = getReviews(product.id);
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const { add } = useCart();
  const { has, toggle } = useFavorites();
  const favored = has(product.id);

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/browse" search={{ category: product.category }} className="capitalize hover:text-foreground">{product.category}</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.title}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="overflow-hidden rounded-3xl bg-muted">
              <img src={product.images[activeImage]} alt={product.title} className="aspect-square w-full object-cover" />
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 flex gap-3">
                {product.images.map((src, i) => (
                  <button key={src} onClick={() => setActiveImage(i)} className={cn("overflow-hidden rounded-xl border-2 transition", i === activeImage ? "border-primary" : "border-transparent opacity-70 hover:opacity-100")}>
                    <img src={src} alt="" className="h-20 w-20 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{product.condition}</span>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{product.title}</h1>
            <div className="mt-3 flex items-center gap-4">
              <PriceTag price={product.price} original={product.originalPrice} className="text-2xl" />
              <RatingStars rating={product.rating} count={product.reviewCount} />
            </div>

            <p className="mt-6 text-base leading-relaxed text-muted-foreground">{product.description}</p>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center rounded-full border bg-card">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-10 w-10 place-items-center text-lg hover:bg-muted rounded-l-full">−</button>
                <span className="w-10 text-center text-sm font-medium">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="grid h-10 w-10 place-items-center text-lg hover:bg-muted rounded-r-full">+</button>
              </div>
              <button
                onClick={() => add(product.id, qty)}
                className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Add to cart
              </button>
              <button
                onClick={() => toggle(product.id)}
                aria-label="Favorite"
                className={cn("grid h-12 w-12 place-items-center rounded-full border bg-card transition hover:bg-muted", favored && "text-[var(--color-sale)]")}
              >
                <Heart size={18} className={favored ? "fill-current" : ""} />
              </button>
            </div>

            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Truck size={16} /> Ships from {product.shippingFrom} · ${product.shippingPrice} shipping</li>
              <li className="flex items-center gap-2"><RotateCcw size={16} /> 30-day returns, no questions</li>
              <li className="flex items-center gap-2"><ShieldCheck size={16} /> NoBS buyer protection on every order</li>
            </ul>

            {seller && (
              <div className="mt-8">
                <SellerBadge seller={seller} />
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold">Reviews</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.author}</span>
                    <RatingStars rating={r.rating} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{r.date}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold">You might also like</h2>
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </SiteShell>
  );
}
