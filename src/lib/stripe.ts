import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PriceKey = "gem_single" | "personal_map" | "explorer";

export type CheckoutResult = "redirected" | "auth_required" | "error";

type CheckoutAuthRequiredDetail = {
  priceKey: PriceKey;
};

export const STRIPE_PRODUCTS = {
  gem_single: {
    price_id: "price_1T4nUVA1KiGIrxAcNT3ZEd12",
    label: "Gem Extra — 1 sessão + 24h chat",
    amount: "R$ 9,90",
  },
  personal_map: {
    price_id: "price_1TH95IA1KiGIrxAcYoBq401o",
    label: "Roteiro Cult Unificado",
    amount: "R$ 29,90",
  },
  explorer: {
    price_id: "price_1TEHNdA1KiGIrxAc0vPMV7s",
    label: "A Imersão Completa (Mapão + Housing + Idioma)",
    amount: "R$ 129,00",
  },
} as const;

const setPendingCheckout = (priceKey: PriceKey) => {
  localStorage.setItem("pending_checkout", priceKey);
};

const clearPendingCheckout = () => {
  localStorage.removeItem("pending_checkout");
};

export const getPendingCheckout = (): PriceKey | null => {
  const pending = localStorage.getItem("pending_checkout");
  return pending === "gem_single" || pending === "personal_map" || pending === "explorer"
    ? (pending as PriceKey)
    : null;
};

const requestCheckoutAuthentication = (priceKey: PriceKey) => {
  setPendingCheckout(priceKey);
  window.dispatchEvent(
    new CustomEvent<CheckoutAuthRequiredDetail>("auth-required-for-checkout", {
      detail: { priceKey },
    }),
  );
};

export async function openCheckout(priceKey: PriceKey, useSquadDiscount = false): Promise<CheckoutResult> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      requestCheckoutAuthentication(priceKey);
      return "auth_required";
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || user.is_anonymous || !user.email) {
      requestCheckoutAuthentication(priceKey);
      return "auth_required";
    }

    const affiliateSlug = localStorage.getItem("active_affiliate") || null;
    console.log("[CHECKOUT] Sending to create-checkout:", { priceKey, useSquadDiscount, affiliateSlug });

    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceKey, useSquadDiscount, affiliateSlug },
    });

    if (error) {
      console.error("Supabase function error:", error);
      throw error;
    }

    if (!data?.url) throw new Error("No checkout URL returned");

    clearPendingCheckout();

    window.location.href = data.url;
    return "redirected";
  } catch (err: any) {
    console.error("Checkout error:", err);
    toast.error("Erro ao iniciar pagamento. Tente novamente.");
    return "error";
  }
}
