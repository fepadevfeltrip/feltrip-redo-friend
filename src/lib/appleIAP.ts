/**
 * Apple In-App Purchase (IAP) stub for Capacitor.
 * Product IDs registered in App Store Connect.
 * 
 * This module replaces src/lib/stripe.ts for the Apple App Store build.
 * Actual IAP integration requires @capgo/capacitor-purchases or
 * cordova-plugin-purchase — this stub prepares the interface.
 */

import { toast } from "sonner";

export type PriceKey = "personal_map" | "explorer";

export type CheckoutResult = "purchased" | "auth_required" | "error" | "cancelled";

/** Apple IAP Product IDs (must match App Store Connect) */
export const APPLE_PRODUCTS = {
  personal_map: {
    productId: "com.feltrip.cult.roteiro",
    label: "Roteiro Cult Unificado",
  },
  explorer: {
    productId: "com.feltrip.cult.imersao",
    label: "A Imersão Completa",
  },
} as const;

/**
 * Opens the Apple IAP purchase flow.
 * Currently a stub — will be wired to the Capacitor IAP plugin.
 */
export async function openApplePurchase(priceKey: PriceKey): Promise<CheckoutResult> {
  try {
    const product = APPLE_PRODUCTS[priceKey];
    if (!product) {
      toast.error("Produto não encontrado.");
      return "error";
    }

    // TODO: Integrate with @capgo/capacitor-purchases or cordova-plugin-purchase
    // 1. Fetch product details from App Store
    // 2. Present native purchase sheet
    // 3. On success, validate receipt server-side
    // 4. Update user tier in Supabase

    toast.info("Compra via Apple em breve! (Em desenvolvimento)");
    console.log(`[IAP] Would purchase: ${product.productId} (${product.label})`);
    return "cancelled";
  } catch (err: any) {
    console.error("IAP error:", err);
    toast.error("Erro ao iniciar compra. Tente novamente.");
    return "error";
  }
}

/** Compatibility shim — no pending checkout logic needed for IAP */
export const getPendingCheckout = (): PriceKey | null => null;
export const clearPendingCheckout = () => {};
