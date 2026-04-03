import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICE_IDS: Record<string, string> = {
  gem_single: "price_1T4nUVA1KiGIrxAcNT3ZEd12",
  personal_map: "price_1TH95IA1KiGIrxAcYoBq401o",
  explorer: "price_1TEHNdA1KiGIrxAc0vPMV7s",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const body = await req.json();
    const priceKey = body.priceKey;
    const useSquadDiscount = body.useSquadDiscount || false;
    const affiliateSlug = body.affiliateSlug || null;

    logStep("Request body received", { priceKey, useSquadDiscount, affiliateSlug });

    const priceId = PRICE_IDS[priceKey];
    if (!priceId) throw new Error(`Invalid price key: ${priceKey}`);

    logStep("Price resolved", { priceKey, priceId });

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { data: profileData } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle();
    const fullName = profileData?.full_name || user.email;
    logStep("User authenticated", { email: user.email, fullName });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        name: fullName,
        metadata: { supabase_user_id: user.id },
      });
      customerId = newCustomer.id;
      logStep("New customer created", { customerId });
    }

    // --- Affiliate split lookup ---
    let affiliateStripeAccount: string | null = null;
    let affiliateComission: number = 0;

    if (affiliateSlug) {
      try {
        const { data: affData, error: affError } = await supabaseClient
          .from("affiliates")
          .select("stripe_account_id, comission")
          .eq("slug", affiliateSlug)
          .maybeSingle();

        const affiliateCommission = Number(affData?.comission ?? 0);

        if (affError) {
          console.error(`[CREATE-CHECKOUT] Affiliate lookup FAILED for slug "${affiliateSlug}": ${affError.message}`);
        } else if (affData?.stripe_account_id && affiliateCommission > 0) {
          affiliateStripeAccount = affData.stripe_account_id;
          affiliateComission = affiliateCommission;
          logStep("Affiliate found", {
            slug: affiliateSlug,
            stripe_account_id: affiliateStripeAccount,
            comission: affiliateComission,
          });
        } else {
          console.error(`[CREATE-CHECKOUT] Affiliate "${affiliateSlug}" found but missing stripe_account_id or comission`, affData);
        }
      } catch (e) {
        console.error(`[CREATE-CHECKOUT] Exception during affiliate lookup: ${e}`);
      }
    }

    const origin = req.headers.get("origin") || "https://feltrip-supa-mirror.lovable.app";

    // Fetch price to know the unit_amount for split calculation
    const priceObj = await stripe.prices.retrieve(priceId);
    const totalAmountInCents = priceObj.unit_amount || 0;
    logStep("Price amount fetched", { totalAmountInCents });

    const sessionParams: any = {
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      allow_promotion_codes: true,
      success_url: `${origin}/?payment=success&plan=${priceKey}`,
      cancel_url: `${origin}/?payment=canceled`,
      metadata: {
        user_id: user.id,
        price_key: priceKey,
        partner_id: affiliateSlug || "",
      },
    };

    if (useSquadDiscount) {
      sessionParams.allow_promotion_codes = false;
      sessionParams.discounts = [{ coupon: "50co" }];
      logStep("Squad discount applied", { coupon: "50co" });
    }

    // --- Destination Charge (split) ---
    if (
      affiliateStripeAccount &&
      affiliateComission > 0 &&
      totalAmountInCents > 0
    ) {
      const transferAmount = Math.round(
        (totalAmountInCents * affiliateComission) / 100
      );
      sessionParams.payment_intent_data = {
        transfer_data: {
          destination: affiliateStripeAccount,
          amount: transferAmount,
        },
      };
      logStep("SPLIT APPLIED", {
        destination: affiliateStripeAccount,
        comission: affiliateComission,
        totalAmountInCents,
        transferAmount,
      });
    } else {
      logStep("SPLIT SKIPPED", {
        hasAccount: !!affiliateStripeAccount,
        comission: affiliateComission,
        totalAmountInCents,
      });
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
