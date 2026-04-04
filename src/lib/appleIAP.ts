import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Tipos base
export type PriceKey = "personal_map" | "explorer";
export type CheckoutResult = "purchased" | "auth_required" | "error" | "cancelled";

// Os IDs exatos que você criará no App Store Connect
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

let storeInitialized = false;

// AQUELA FUNÇÃO QUE FALTAVA ESTÁ AQUI! 👇
export function initAppleStore() {
  if (!window.CdvPurchase || storeInitialized) return;

  const { store, Platform, ProductType } = window.CdvPurchase;

  store.register([
    {
      id: APPLE_PRODUCTS.personal_map.productId,
      type: ProductType.CONSUMABLE,
      platform: Platform.APPLE_APPSTORE,
    },
    {
      id: APPLE_PRODUCTS.explorer.productId,
      type: ProductType.CONSUMABLE,
      platform: Platform.APPLE_APPSTORE,
    },
  ]);

  store.when().approved(async (transaction: any) => {
    toast.loading("Validando compra com a Apple...", { id: "iap-validation" });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não logado");

      const receipt = transaction.transactionReceipt;

      const { data, error } = await supabase.functions.invoke("verify-apple-receipt", {
        body: { receipt, userId: user.id }
      });

      if (error || !data.success) throw new Error("Recibo recusado");

      transaction.finish();
      toast.success("Compra confirmada! Bem-vindo.", { id: "iap-validation" });
      setTimeout(() => window.location.reload(), 1500);

    } catch (err) {
      console.error("Erro na validação:", err);
      toast.error("Aviso: Houve uma lentidão na liberação. O suporte ajudará.", { id: "iap-validation" });
    }
  });

  store.initialize([Platform.APPLE_APPSTORE]);
  storeInitialized = true;
}

export async function openApplePurchase(priceKey: PriceKey): Promise<CheckoutResult> {
  if (!window.CdvPurchase) {
    toast.error("O sistema de pagamentos requer que você esteja usando o app no iPhone.");
    return "error";
  }

  const productId = APPLE_PRODUCTS[priceKey].productId;
  const { store } = window.CdvPurchase;

  const product = store.get(productId);

  if (!product) {
    toast.error("Produto não configurado na Apple Store.");
    return "error";
  }

  try {
    store.order(product);
    return "cancelled";
  } catch (err: any) {
    console.error("IAP error:", err);
    toast.error("Erro ao iniciar Apple Pay.");
    return "error";
  }
}

export const getPendingCheckout = (): PriceKey | null => null;
export const clearPendingCheckout = () => { };