import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { getOrderBySession } from "@/lib/checkout.functions";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/store/cart";

export const Route = createFileRoute("/order-success")({
  head: () => ({ meta: [{ title: "Order confirmed — NoBS Market" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: typeof search.session_id === "string" ? search.session_id : "",
  }),
  component: OrderSuccess,
});

function OrderSuccess() {
  const { session_id } = Route.useSearch();
  const load = useServerFn(getOrderBySession);
  const { clear } = useCart();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["order-by-session", session_id],
    queryFn: () => load({ data: { sessionId: session_id } }),
    enabled: !!session_id,
    refetchInterval: (q) => (q.state.data?.status === "paid" ? false : 2000),
  });

  useEffect(() => {
    if (data?.status === "paid") clear();
  }, [data?.status, clear]);

  return (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <CheckCircle2 className="mx-auto text-emerald-500" size={56} />
        <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Order confirmed</h1>
        {!session_id ? (
          <p className="mt-3 text-muted-foreground">Missing session reference.</p>
        ) : isLoading || !data ? (
          <p className="mt-3 text-muted-foreground">Finalizing your order…</p>
        ) : data.status === "pending" ? (
          <>
            <p className="mt-3 text-muted-foreground">Payment received. Waiting for confirmation…</p>
            <button onClick={() => refetch()} className="mt-3 text-sm underline">Check again</button>
          </>
        ) : (
          <>
            <p className="mt-3 text-muted-foreground">Thanks for your purchase from <b>{data.store.name}</b>.</p>
            <ul className="mx-auto mt-8 max-w-md space-y-3 text-left">
              {data.order_items?.map((it, i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                  {it.image_url && <img src={it.image_url} alt="" className="h-12 w-12 rounded object-cover" />}
                  <div className="flex-1 text-sm">
                    <div className="font-medium">{it.title}</div>
                    <div className="text-xs text-muted-foreground">Qty {it.quantity} · {formatPrice(it.unit_price_cents)}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 text-lg font-semibold">Total {formatPrice(data.total_cents)}</div>
          </>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/browse" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
            Keep browsing
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
