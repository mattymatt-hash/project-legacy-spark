import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestHost } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { stripeRequest } from "@/lib/stripe.server";

const PLATFORM_FEE_BPS = 1000; // 10%

function originFromHost(): string {
  const host = getRequestHost();
  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

// ---------------- Connect onboarding ----------------

export const getConnectStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: store } = await supabase
      .from("stores")
      .select("id, stripe_account_id, stripe_charges_enabled")
      .eq("owner_id", userId)
      .maybeSingle();
    if (!store) return { hasStore: false as const };

    // Refresh capability status from Stripe if we have an account
    if (store.stripe_account_id) {
      try {
        const acct = await stripeRequest<{ charges_enabled: boolean; payouts_enabled: boolean; details_submitted: boolean }>(
          `/accounts/${store.stripe_account_id}`,
          { method: "GET" },
        );
        if (acct.charges_enabled !== store.stripe_charges_enabled) {
          await supabase.from("stores").update({ stripe_charges_enabled: acct.charges_enabled }).eq("id", store.id);
        }
        return {
          hasStore: true as const,
          hasAccount: true as const,
          chargesEnabled: acct.charges_enabled,
          payoutsEnabled: acct.payouts_enabled,
          detailsSubmitted: acct.details_submitted,
        };
      } catch {
        return { hasStore: true as const, hasAccount: true as const, chargesEnabled: false, payoutsEnabled: false, detailsSubmitted: false };
      }
    }
    return { hasStore: true as const, hasAccount: false as const };
  });

export const createConnectOnboardingLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: store, error } = await supabase
      .from("stores")
      .select("id, stripe_account_id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!store) throw new Error("Open a store first.");

    let accountId = store.stripe_account_id;
    if (!accountId) {
      const acct = await stripeRequest<{ id: string }>("/accounts", {
        body: {
          type: "express",
          capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
          metadata: { store_id: store.id },
        },
      });
      accountId = acct.id;
      await supabase.from("stores").update({ stripe_account_id: accountId }).eq("id", store.id);
    }

    const origin = originFromHost();
    const link = await stripeRequest<{ url: string }>("/account_links", {
      body: {
        account: accountId,
        refresh_url: `${origin}/seller?connect=refresh`,
        return_url: `${origin}/seller?connect=done`,
        type: "account_onboarding",
      },
    });
    return { url: link.url };
  });

// ---------------- Checkout ----------------

const addressSchema = z.object({
  name: z.string().trim().min(1).max(120).optional().nullable(),
  street1: z.string().trim().min(1).max(200),
  street2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(2).max(40),
  zip: z.string().trim().min(3).max(20),
  country: z.string().trim().length(2),
  phone: z.string().trim().max(40).optional().nullable(),
});

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        listing_id: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(20),
  to_address: addressSchema,
  shipping: z.object({
    easypost_shipment_id: z.string().min(4).max(80),
    easypost_rate_id: z.string().min(4).max(80),
    amount_cents: z.number().int().min(0).max(1_000_000),
    carrier: z.string().min(1).max(60),
    service: z.string().min(1).max(60),
  }),
});

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => checkoutSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: userRes } = await supabase.auth.getUser();
    const buyerEmail = userRes.user?.email ?? null;

    const ids = data.items.map((i) => i.listing_id);
    const { data: listings, error: lErr } = await supabaseAdmin
      .from("listings")
      .select("id, title, price_cents, stock, status, image_urls, store_id, currency, store:stores!inner(id, handle, name, stripe_account_id, stripe_charges_enabled)")
      .in("id", ids)
      .eq("status", "active");
    if (lErr) throw new Error(lErr.message);
    if (!listings || listings.length !== ids.length) throw new Error("One or more items are unavailable.");

    const stores = new Set(listings.map((l) => l.store_id));
    if (stores.size > 1) throw new Error("Checkout supports one seller at a time. Split your cart by store.");

    type ListingRow = (typeof listings)[number] & { store: { id: string; handle: string; name: string; stripe_account_id: string | null; stripe_charges_enabled: boolean } };
    const first = listings[0] as ListingRow;
    const store = first.store;
    if (!store.stripe_account_id || !store.stripe_charges_enabled) {
      throw new Error(`${store.name} isn't ready to accept payments yet.`);
    }

    let subtotal = 0;
    const lineItems: Array<Record<string, unknown>> = [];
    for (const item of data.items) {
      const l = listings.find((x) => x.id === item.listing_id) as ListingRow | undefined;
      if (!l) throw new Error("Item missing");
      if (l.stock < item.quantity) throw new Error(`Only ${l.stock} of "${l.title}" left.`);
      subtotal += l.price_cents * item.quantity;
      lineItems.push({
        quantity: item.quantity,
        price_data: {
          currency: l.currency || "usd",
          unit_amount: l.price_cents,
          product_data: {
            name: l.title,
            images: l.image_urls?.slice(0, 1) ?? [],
            metadata: { listing_id: l.id },
          },
        },
      });
    }
    const shippingTotal = data.shipping.amount_cents;
    const total = subtotal + shippingTotal;
    const platformFee = Math.round(subtotal * (PLATFORM_FEE_BPS / 10000));
    const sellerPayout = total - platformFee;

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        buyer_id: userId,
        store_id: store.id,
        subtotal_cents: subtotal,
        shipping_cents: shippingTotal,
        total_cents: total,
        platform_fee_cents: platformFee,
        seller_payout_cents: sellerPayout,
        currency: first.currency || "usd",
        buyer_email: buyerEmail,
        status: "pending",
        to_address: data.to_address,
        easypost_shipment_id: data.shipping.easypost_shipment_id,
        easypost_rate_id: data.shipping.easypost_rate_id,
        carrier: data.shipping.carrier,
        service: data.shipping.service,
        shipping_status: "rate_selected",
      } as never)
      .select("id")
      .single();
    if (oErr) throw new Error(oErr.message);

    const itemRows = data.items.map((it) => {
      const l = listings.find((x) => x.id === it.listing_id) as ListingRow;
      return {
        order_id: order.id,
        listing_id: l.id,
        title: l.title,
        unit_price_cents: l.price_cents,
        quantity: it.quantity,
        image_url: l.image_urls?.[0] ?? null,
      };
    });
    const { error: iErr } = await supabaseAdmin.from("order_items").insert(itemRows);
    if (iErr) throw new Error(iErr.message);

    const origin = originFromHost();
    const session = await stripeRequest<{ id: string; url: string }>("/checkout/sessions", {
      body: {
        mode: "payment",
        ui_mode: "hosted",
        line_items: lineItems,
        customer_email: buyerEmail ?? undefined,
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              display_name: `${data.shipping.carrier} ${data.shipping.service}`.slice(0, 100),
              fixed_amount: { amount: shippingTotal, currency: first.currency || "usd" },
            },
          },
        ],
        payment_intent_data: {
          application_fee_amount: platformFee,
          transfer_data: { destination: store.stripe_account_id },
          metadata: { order_id: order.id, store_id: store.id },
        },
        metadata: { order_id: order.id, store_id: store.id, buyer_id: userId },
        success_url: `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/cart`,
      },
    });

    await supabaseAdmin
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.id);

    return { url: session.url, sessionId: session.id };
  });

// ---------------- Buyer/seller order views ----------------

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, total_cents, status, currency, created_at, store:stores!inner(handle, name), order_items(title, quantity, image_url)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getOrderBySession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string }) => ({
    sessionId: z.string().min(8).max(200).parse(input.sessionId),
  }))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("orders")
      .select("id, total_cents, status, currency, store:stores!inner(handle, name), order_items(title, quantity, unit_price_cents, image_url)")
      .eq("stripe_checkout_session_id", data.sessionId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const getStoreOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: store } = await context.supabase
      .from("stores").select("id").eq("owner_id", context.userId).maybeSingle();
    if (!store) return [];
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, total_cents, seller_payout_cents, status, buyer_email, shipping_name, created_at, carrier, service, shipping_status, tracking_code, tracking_url, label_url, to_address, order_items(title, quantity)")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
