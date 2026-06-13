import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Plus, ExternalLink, Pencil } from "lucide-react";
import { getMyStore } from "@/lib/stores.functions";
import { getMyListings } from "@/lib/listings.functions";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ConnectPayouts } from "@/components/seller/ConnectPayouts";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/seller/")({
  head: () => ({ meta: [{ title: "Seller dashboard — NoBS Market" }] }),
  component: SellerDashboard,
});

function SellerDashboard() {
  const loadStore = useServerFn(getMyStore);
  const loadListings = useServerFn(getMyListings);

  const storeQ = useQuery({ queryKey: ["my-store"], queryFn: () => loadStore() });
  const listingsQ = useQuery({
    queryKey: ["my-listings"],
    queryFn: () => loadListings(),
    enabled: !!storeQ.data,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10">
        {storeQ.isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !storeQ.data ? (
          <div className="rounded-2xl border bg-card p-10 text-center">
            <h1 className="font-display text-2xl font-bold">Open a store first</h1>
            <p className="mt-2 text-muted-foreground">You need a store before you can list items.</p>
            <Button asChild className="mt-6"><Link to="/sell">Open my store</Link></Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-bold">{storeQ.data.name}</h1>
                <p className="text-sm text-muted-foreground">
                  <Link to="/store/$handle" params={{ handle: storeQ.data.handle }} className="hover:underline">
                    /store/{storeQ.data.handle} <ExternalLink size={12} className="inline" />
                  </Link>
                </p>
              </div>
              <Button asChild>
                <Link to="/seller/listings/new"><Plus size={16} /> New listing</Link>
              </Button>
            </div>

            <div className="mt-6"><ConnectPayouts /></div>

            <section className="mt-8">
              <h2 className="font-display text-xl font-semibold">Your listings</h2>
              {listingsQ.isLoading ? (
                <p className="mt-4 text-muted-foreground">Loading…</p>
              ) : !listingsQ.data?.length ? (
                <div className="mt-4 rounded-2xl border border-dashed bg-card p-10 text-center text-muted-foreground">
                  No listings yet. Add your first item.
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-2xl border bg-card">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {listingsQ.data.map((l) => (
                        <tr key={l.id} className="border-t">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {l.image_urls[0] && (
                                <img src={l.image_urls[0]} alt="" className="h-10 w-10 rounded object-cover" />
                              )}
                              <span className="font-medium">{l.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">{formatPrice(l.price_cents)}</td>
                          <td className="px-4 py-3">{l.stock}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{l.status}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button asChild size="sm" variant="ghost">
                              <Link to="/seller/listings/$id/edit" params={{ id: l.id }}>
                                <Pencil size={14} /> Edit
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
