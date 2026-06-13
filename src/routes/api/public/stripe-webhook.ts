import { createFileRoute } from "@tanstack/react-router";
import { verifyStripeWebhook } from "@/lib/stripe.server";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) return new Response("Webhook not configured", { status: 500 });

        const sig = request.headers.get("stripe-signature");
        if (!sig) return new Response("Missing signature", { status: 400 });

        const payload = await request.text();
        let event: { type: string; data: { object: Record<string, unknown> } };
        try {
          event = (await verifyStripeWebhook(payload, sig, secret)) as typeof event;
        } catch (err) {
          return new Response(`Invalid signature: ${(err as Error).message}`, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        try {
          if (event.type === "checkout.session.completed") {
            const session = event.data.object as {
              id: string;
              payment_intent?: string;
              payment_status?: string;
              customer_details?: { email?: string; name?: string };
              shipping_details?: { name?: string; address?: Record<string, string> };
              metadata?: { order_id?: string };
            };
            if (session.payment_status !== "paid") return new Response("ok");
            const orderId = session.metadata?.order_id;
            if (!orderId) return new Response("ok");

            const { data: order } = await supabaseAdmin
              .from("orders")
              .select("id, store_id, status")
              .eq("id", orderId)
              .maybeSingle();
            if (!order || order.status === "paid" || order.status === "fulfilled") {
              return new Response("ok");
            }

            await supabaseAdmin
              .from("orders")
              .update({
                status: "paid",
                stripe_payment_intent_id: session.payment_intent ?? null,
                buyer_email: session.customer_details?.email ?? null,
                shipping_name: session.shipping_details?.name ?? session.customer_details?.name ?? null,
                shipping_address: session.shipping_details?.address ?? null,
              })
              .eq("id", orderId);

            // Mark sold-out listings
            const { data: items } = await supabaseAdmin
              .from("order_items")
              .select("listing_id, quantity")
              .eq("order_id", orderId);
            for (const it of items ?? []) {
              const { data: listing } = await supabaseAdmin
                .from("listings")
                .select("stock")
                .eq("id", it.listing_id)
                .maybeSingle();
              if (!listing) continue;
              const newStock = Math.max(0, listing.stock - it.quantity);
              await supabaseAdmin
                .from("listings")
                .update({ stock: newStock, status: newStock === 0 ? "sold" : "active" })
                .eq("id", it.listing_id);
            }
          } else if (event.type === "account.updated") {
            const acct = event.data.object as { id: string; charges_enabled: boolean };
            await supabaseAdmin
              .from("stores")
              .update({ stripe_charges_enabled: acct.charges_enabled })
              .eq("stripe_account_id", acct.id);
          }
        } catch (err) {
          console.error("[stripe-webhook] handler error:", err);
          return new Response(`Handler error: ${(err as Error).message}`, { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
