import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { easypostRequest, type EPAddress, type EPShipment } from "@/lib/easypost.server";

const addressSchema = z.object({
  name: z.string().trim().min(1).max(120).optional().nullable(),
  street1: z.string().trim().min(1).max(200),
  street2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(2).max(40),
  zip: z.string().trim().min(3).max(20),
  country: z.string().trim().length(2).default("US"),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().email().max(200).optional().nullable(),
});

export type ShippingAddress = z.infer<typeof addressSchema>;

// ---- Save seller from_address on stores ----

export const updateStoreFromAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => addressSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: store } = await supabase.from("stores").select("id").eq("owner_id", userId).maybeSingle();
    if (!store) throw new Error("Open your store first.");
    const { error } = await supabase
      .from("stores")
      .update({ from_address: data } as never)
      .eq("id", store.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Compute parcel for cart from listing dims ----

function parcelForItems(
  items: Array<{ weight_oz: number | null; length_in: number | null; width_in: number | null; height_in: number | null; quantity: number }>,
) {
  // Sum weight; for box size, take max of each dim. Crude but workable for live rates.
  let weight = 0;
  let L = 6, W = 4, H = 2; // sensible default ~ small box
  for (const it of items) {
    const w = (Number(it.weight_oz) || 8) * it.quantity;
    weight += w;
    L = Math.max(L, Number(it.length_in) || 6);
    W = Math.max(W, Number(it.width_in) || 4);
    H = Math.max(H, Number(it.height_in) || 2);
  }
  return {
    length: L,
    width: W,
    height: H,
    weight: Math.max(1, Math.round(weight * 10) / 10), // oz, EasyPost expects ounces
  };
}

// ---- Get shipping rates for a cart ----

const ratesInput = z.object({
  items: z.array(z.object({ listing_id: z.string().uuid(), quantity: z.number().int().min(1).max(20) })).min(1).max(20),
  to_address: addressSchema,
});

export const getShippingRates = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ratesInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ids = data.items.map((i) => i.listing_id);
    const { data: listings, error } = await supabaseAdmin
      .from("listings")
      .select("id, store_id, weight_oz, length_in, width_in, height_in, store:stores!inner(id, name, from_address)")
      .in("id", ids)
      .eq("status", "active");
    if (error) throw new Error(error.message);
    if (!listings || listings.length !== ids.length) throw new Error("One or more items are unavailable.");

    const storeIds = new Set(listings.map((l) => l.store_id));
    if (storeIds.size > 1) throw new Error("Get rates one seller at a time.");

    type L = (typeof listings)[number] & { store: { id: string; name: string; from_address: EPAddress | null } };
    const first = listings[0] as L;
    const fromAddress = first.store.from_address;
    if (!fromAddress) throw new Error(`${first.store.name} hasn't set a ship-from address yet.`);

    const cartItems = data.items.map((it) => {
      const l = listings.find((x) => x.id === it.listing_id) as L;
      return {
        weight_oz: l.weight_oz, length_in: l.length_in, width_in: l.width_in, height_in: l.height_in,
        quantity: it.quantity,
      };
    });
    const parcel = parcelForItems(cartItems);

    const shipment = await easypostRequest<EPShipment>("/shipments", {
      body: {
        shipment: {
          to_address: data.to_address,
          from_address: fromAddress,
          parcel,
        },
      },
    });

    const rates = (shipment.rates ?? [])
      .map((r) => ({
        id: r.id,
        carrier: r.carrier,
        service: r.service,
        amount_cents: Math.round(parseFloat(r.rate) * 100),
        currency: r.currency,
        delivery_days: r.delivery_days ?? r.est_delivery_days ?? null,
      }))
      .sort((a, b) => a.amount_cents - b.amount_cents);

    if (rates.length === 0) throw new Error("No shipping rates available for that address.");
    return { shipment_id: shipment.id, rates };
  });

// ---- Buy a label for an order (seller-only) ----

export const buyShippingLabel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { order_id: string }) => ({
    order_id: z.string().uuid().parse(input.order_id),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Verify seller owns the order's store
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, store_id, status, easypost_shipment_id, easypost_rate_id, label_url, store:stores!inner(owner_id)")
      .eq("id", data.order_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("Order not found.");
    type O = typeof order & { store: { owner_id: string } };
    const o = order as O;
    if (o.store.owner_id !== userId) throw new Error("Not your order.");
    if (o.label_url) return { label_url: o.label_url };
    if (!o.easypost_shipment_id || !o.easypost_rate_id) throw new Error("Order has no shipment to buy.");
    if (o.status !== "paid") throw new Error("Order must be paid before buying a label.");

    const bought = await easypostRequest<EPShipment>(`/shipments/${o.easypost_shipment_id}/buy`, {
      body: { rate: { id: o.easypost_rate_id } },
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("orders")
      .update({
        label_url: bought.postage_label?.label_url ?? null,
        tracking_code: bought.tracking_code ?? null,
        tracking_url: bought.tracker?.public_url ?? null,
        easypost_tracker_id: bought.tracker?.id ?? null,
        shipping_status: "label_purchased",
        status: "fulfilled",
      } as never)
      .eq("id", o.id);

    return {
      label_url: bought.postage_label?.label_url ?? null,
      tracking_code: bought.tracking_code ?? null,
      tracking_url: bought.tracker?.public_url ?? null,
    };
  });
