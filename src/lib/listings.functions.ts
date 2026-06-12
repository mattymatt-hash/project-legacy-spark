import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CATEGORY_VALUES = ["vintage", "handmade", "home", "fashion", "art", "collectibles"] as const;
const CONDITION_VALUES = ["new", "like_new", "good", "vintage"] as const;
const STATUS_VALUES = ["draft", "active", "sold", "archived"] as const;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";

const inputBase = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(4000).default(""),
  price_cents: z.number().int().min(0).max(10_000_000),
  original_price_cents: z.number().int().min(0).max(10_000_000).nullable().optional(),
  shipping_cents: z.number().int().min(0).max(1_000_000).default(0),
  weight_oz: z.number().min(0).max(10_000).default(8),
  stock: z.number().int().min(0).max(10_000).default(1),
  condition: z.enum(CONDITION_VALUES).default("new"),
  category: z.enum(CATEGORY_VALUES),
  status: z.enum(STATUS_VALUES).default("active"),
  image_urls: z.array(z.string().url().max(2048)).max(8).default([]),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
});

const LISTING_SELECT =
  "id, store_id, title, slug, description, price_cents, currency, condition, category, stock, weight_oz, shipping_cents, status, image_urls, original_price_cents, tags, created_at, store:stores!inner(id, handle, name, logo_url)";

const PUBLIC_FILTER = "status.eq.active";

// ---------- PUBLIC (admin-elevated, safe columns) ----------

export const getActiveListings = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        category: z.enum(CATEGORY_VALUES).optional(),
        q: z.string().trim().max(80).optional(),
        sort: z.enum(["new", "low", "high"]).default("new"),
        limit: z.number().int().min(1).max(60).default(24),
        offset: z.number().int().min(0).max(1000).default(0),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("listings").select(LISTING_SELECT).eq("status", "active");
    if (data.category) q = q.eq("category", data.category);
    if (data.q) q = q.ilike("title", `%${data.q}%`);
    if (data.sort === "low") q = q.order("price_cents", { ascending: true });
    else if (data.sort === "high") q = q.order("price_cents", { ascending: false });
    else q = q.order("created_at", { ascending: false });
    const { data: rows, error } = await q.range(data.offset, data.offset + data.limit - 1);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getListingById = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => ({ id: z.string().uuid().parse(input.id) }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("listings")
      .select(LISTING_SELECT)
      .eq("id", data.id)
      .or(PUBLIC_FILTER)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const getListingsByStore = createServerFn({ method: "GET" })
  .inputValidator((input: { handle: string }) => ({
    handle: z.string().trim().toLowerCase().min(3).max(32).parse(input.handle),
  }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: store, error: sErr } = await supabaseAdmin
      .from("stores")
      .select("id")
      .eq("handle", data.handle)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!store) return [];
    const { data: rows, error } = await supabaseAdmin
      .from("listings")
      .select(LISTING_SELECT)
      .eq("store_id", store.id)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getListingsByIds = createServerFn({ method: "POST" })
  .inputValidator((input: { ids: string[] }) => ({
    ids: z.array(z.string().uuid()).max(50).parse(input.ids),
  }))
  .handler(async ({ data }) => {
    if (!data.ids.length) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("listings")
      .select(LISTING_SELECT)
      .in("id", data.ids)
      .eq("status", "active");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ---------- AUTHED (owner-scoped, via RLS) ----------

export const getMyListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: store, error: sErr } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!store) return [];
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyListing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: z.string().uuid().parse(input.id) }))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("listings")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const createListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputBase.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: store, error: sErr } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!store) throw new Error("Open your store before listing items.");

    const baseSlug = slugify(data.title);
    let slug = baseSlug;
    let attempt = 0;
    // Find unique slug per store
    while (attempt < 5) {
      const { data: clash } = await supabase
        .from("listings")
        .select("id")
        .eq("store_id", store.id)
        .eq("slug", slug)
        .maybeSingle();
      if (!clash) break;
      attempt += 1;
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const { data: row, error } = await supabase
      .from("listings")
      .insert({ ...data, slug, store_id: store.id })
      .select("id, slug")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    inputBase.partial().extend({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { data: row, error } = await context.supabase
      .from("listings")
      .update(patch)
      .eq("id", id)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: z.string().uuid().parse(input.id) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("listings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type PublicListing = {
  id: string;
  store_id: string;
  title: string;
  slug: string;
  description: string;
  price_cents: number;
  currency: string;
  condition: (typeof CONDITION_VALUES)[number];
  category: (typeof CATEGORY_VALUES)[number];
  stock: number;
  weight_oz: number;
  shipping_cents: number;
  status: (typeof STATUS_VALUES)[number];
  image_urls: string[];
  original_price_cents: number | null;
  tags: string[];
  created_at: string;
  store: { id: string; handle: string; name: string; logo_url: string | null };
};
