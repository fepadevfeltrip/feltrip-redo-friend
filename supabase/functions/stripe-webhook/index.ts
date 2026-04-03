import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200 });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    if (!sig) throw new Error("No stripe-signature header");

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET not set");

    const event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    logStep("Event received", { type: event.type, id: event.id });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const priceKey = session.metadata?.price_key;
      const partnerId = session.metadata?.partner_id || null;

      if (!userId || !priceKey) {
        logStep("Missing metadata", { userId, priceKey });
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      logStep("Processing payment", { userId, priceKey, partnerId, paymentStatus: session.payment_status });

      // Accept both "paid" and "no_payment_required" (100% coupon)
      if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
        logStep("Payment not completed yet", { paymentStatus: session.payment_status });
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      // Helper: grant chat access window
      const grantChatAccess = async (planType: string, hours: number) => {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + hours * 60 * 60 * 1000);
        await supabase.from("chat_access").insert({
          user_id: userId,
          plan_type: planType,
          expires_at: expiresAt.toISOString(),
        });
        logStep("Chat access granted", { planType, hours, expiresAt: expiresAt.toISOString() });
      };

      // Helper: set 30-day access pass
      const set30DayAccess = async (tierName: string) => {
        const now = new Date();
        const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await supabase
          .from("profiles")
          .update({
            user_tier: tierName,
            stripe_customer_id: session.customer as string || undefined,
            subscription_end_date: endDate.toISOString(),
            cancel_at_period_end: false,
          })
          .eq("user_id", userId);
        logStep("30-day access set", { tier: tierName, endDate: endDate.toISOString() });
      };

      // Helper: record map purchase
      const recordMapPurchase = async (purchaseType: string, city?: string) => {
        await supabase.from("map_purchases").insert({
          user_id: userId,
          purchase_type: purchaseType,
          city: city || null,
          stripe_payment_id: session.payment_intent as string || session.id,
        });
        logStep("Map purchase recorded", { purchaseType, city });
      };

      switch (priceKey) {
        // ═══════════════════════════════════════════════
        // R$ 9,90 — Gem Extra: +1 gem session + 24h chat
        // ═══════════════════════════════════════════════
        case "gem_single": {
          await grantChatAccess("gem_single", 24);
          logStep("Gem Extra activated: +1 gem + 24h chat");
          break;
        }

        // ═══════════════════════════════════════════════
        // R$ 29,90 — Roteiro Cult / Mapa Pessoal
        // 7 days: full itinerary + unlimited chat
        // ═══════════════════════════════════════════════
        case "personal_map": {
          const city = session.metadata?.city || null;
          await recordMapPurchase("personal_map", city);

          // Grant 7-day chat access
          await grantChatAccess("personal_map", 7 * 24);

          // Set 7-day access pass
          const now7 = new Date();
          const endDate7 = new Date(now7.getTime() + 7 * 24 * 60 * 60 * 1000);
          const { error: profileUpdateError } = await supabase
            .from("profiles")
            .update({
              user_tier: "personal_map",
              stripe_customer_id: (session.customer as string) || undefined,
              subscription_end_date: endDate7.toISOString(),
              cancel_at_period_end: false,
            })
            .eq("user_id", userId);

          if (profileUpdateError) {
            logStep("ERROR updating profile for personal_map", {
              userId,
              error: profileUpdateError.message,
            });
          } else {
            logStep("Profile upgraded for personal_map (7 days)", {
              userId,
              userTier: "personal_map",
              endDate: endDate7.toISOString(),
            });
          }

          logStep("Personal map purchased — 7-day access granted", { userId, city });
          break;
        }

        // ═══════════════════════════════════════════════
        // R$ 129,90 — Explorer / Imersão Completa
        // 30 days: Mapão + Housing + Language Studio + unlimited
        // ═══════════════════════════════════════════════
        case "explorer": {
          await set30DayAccess("premium_company");

          // 4 map credits
          for (let i = 0; i < 4; i++) {
            await recordMapPurchase("explorer_credit");
          }

          // Language Studio: 30 days, 4h total
          const now2 = new Date();
          const expiresAt2 = new Date(now2);
          expiresAt2.setDate(expiresAt2.getDate() + 30);
          await supabase.from("language_studio_subscriptions").insert({
            user_id: userId,
            expires_at: expiresAt2.toISOString(),
            weekly_minutes_limit: 240,
            stripe_payment_id: session.payment_intent as string || session.id,
          });

          await grantChatAccess("explorer", 30 * 24);
          logStep("Explorer activated: 4 maps + Language Studio + unlimited chat");
          break;
        }

        default:
          logStep("Unknown price key", { priceKey });
      }

      // Record sale with affiliate tracking
      await supabase.from("sales").insert({
        user_id: userId,
        amount: session.amount_total || 0,
        currency: session.currency || "brl",
        status: "paid",
        stripe_invoice_id: session.payment_intent as string || session.id,
        affiliate_slug: partnerId,
        metadata: { price_key: priceKey },
      });
      logStep("Sale recorded", { userId, partnerId, amount: session.amount_total });
    }

    // Handle subscription deleted (legacy)
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Subscription deleted/expired", { subscriptionId: subscription.id });

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, user_tier")
        .eq("stripe_subscription_id", subscription.id)
        .maybeSingle();

      if (profile) {
        await supabase
          .from("profiles")
          .update({
            user_tier: "free",
            stripe_subscription_id: null,
            subscription_end_date: null,
            cancel_at_period_end: false,
          })
          .eq("user_id", profile.user_id);
        logStep("User downgraded to free", { userId: profile.user_id });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), { status: 400 });
  }
});
