import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------------- Public reads ----------------

export const getListingReviews = createServerFn({ method: "GET" })
  .inputValidator((input: { listing_id: string }) =>
    z.object({ listing_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("reviews")
      .select("id, rating, body, created_at, buyer_id")
      .eq("listing_id", data.listing_id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    const ids = Array.from(new Set((rows ?? []).map((r) => r.buyer_id)));
    let profiles: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
    if (ids.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", ids);
      profiles = Object.fromEntries((profs ?? []).map((p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }]));
    }
    return (rows ?? []).map((r) => ({ ...r, buyer: profiles[r.buyer_id] ?? null }));
  });

export const getStoreReviews = createServerFn({ method: "GET" })
  .inputValidator((input: { handle: string }) =>
    z.object({ handle: z.string().min(1).max(64) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: store } = await supabaseAdmin
      .from("stores").select("id").eq("handle", data.handle).maybeSingle();
    if (!store) return [];
    const { data: rows, error } = await supabaseAdmin
      .from("reviews")
      .select("id, rating, body, created_at, listing:listings!inner(id, title, slug, image_urls)")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ---------------- Buyer actions ----------------

export const getReviewableItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Paid orders by buyer, with items + any existing review
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, created_at, store:stores!inner(handle, name), order_items(listing_id, title, image_url), reviews(id, listing_id, rating, body)")
      .eq("buyer_id", context.userId)
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const submitSchema = z.object({
  order_id: z.string().uuid(),
  listing_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().max(2000).optional().nullable(),
});

export const submitReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => submitSchema.parse(input))
  .handler(async ({ data, context }) => {
    // Verify buyer's paid order contains the listing
    const { data: order, error: oErr } = await context.supabase
      .from("orders")
      .select("id, store_id, status, order_items!inner(listing_id)")
      .eq("id", data.order_id)
      .eq("buyer_id", context.userId)
      .eq("status", "paid")
      .eq("order_items.listing_id", data.listing_id)
      .maybeSingle();
    if (oErr) throw new Error(oErr.message);
    if (!order) throw new Error("You can only review items from your paid orders.");

    const { error } = await context.supabase
      .from("reviews")
      .upsert(
        {
          order_id: data.order_id,
          listing_id: data.listing_id,
          store_id: order.store_id,
          buyer_id: context.userId,
          rating: data.rating,
          body: data.body ?? null,
        },
        { onConflict: "order_id,listing_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMyReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("reviews").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
