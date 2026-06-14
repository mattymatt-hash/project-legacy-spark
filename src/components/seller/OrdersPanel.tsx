import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getStoreOrders } from "@/lib/checkout.functions";
import { buyShippingLabel } from "@/lib/shipping.functions";
import { formatPrice } from "@/lib/format";

export function OrdersPanel() {
  const loadOrders = useServerFn(getStoreOrders);
  const buyLabel = useServerFn(buyShippingLabel);
  const ordersQ = useQuery({ queryKey: ["store-orders"], queryFn: () => loadOrders() });
  const [busy, setBusy] = useState<string | null>(null);

  async function onBuyLabel(orderId: string) {
    setBusy(orderId);
    try {
      const res = await buyLabel({ data: { order_id: orderId } });
      toast.success("Label purchased");
      if (res.label_url) window.open(res.label_url, "_blank", "noopener");
      ordersQ.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not buy label");
    } finally {
      setBusy(null);
    }
  }

  if (ordersQ.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!ordersQ.data?.length) {
    return <div className="rounded-2xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">No orders yet.</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Payout</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Shipping</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {ordersQ.data.map((o) => {
            const items = (o as { order_items?: { title: string; quantity: number }[] }).order_items ?? [];
            const canBuy = o.status === "paid" && !o.label_url;
            return (
              <tr key={o.id} className="border-t align-top">
                <td className="px-4 py-3">
                  <div className="text-xs font-mono text-muted-foreground">#{o.id.slice(0, 8)}</div>
                  <ul className="mt-1 text-xs">
                    {items.map((i, idx) => (
                      <li key={idx}>{i.quantity}× {i.title}</li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-3">{formatPrice(o.total_cents)}</td>
                <td className="px-4 py-3">{formatPrice(o.seller_payout_cents)}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{o.status}</span></td>
                <td className="px-4 py-3 text-xs">
                  {o.carrier ? <div>{o.carrier} {o.service}</div> : <div className="text-muted-foreground">—</div>}
                  {o.tracking_code && (
                    <div className="mt-1">
                      {o.tracking_url ? (
                        <a href={o.tracking_url} target="_blank" rel="noreferrer" className="underline">{o.tracking_code}</a>
                      ) : (
                        <span>{o.tracking_code}</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {canBuy ? (
                    <Button size="sm" disabled={busy === o.id} onClick={() => onBuyLabel(o.id)}>
                      {busy === o.id ? "Buying…" : "Buy label"}
                    </Button>
                  ) : o.label_url ? (
                    <a href={o.label_url} target="_blank" rel="noreferrer" className="text-sm underline">View label</a>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
