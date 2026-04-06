import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';

// Tipos base
export type PriceKey = "personal_map" | "explorer";
export type CheckoutResult = "purchased" | "auth_required" | "error" | "cancelled";

// Os IDs exatos que você criou no RevenueCat e App Store Connect
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

export async function initAppleStore() {
  if (storeInitialized) return;

  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

    // Certifique-se de que esta variável está no seu arquivo .env
    const apiKey = import.meta.env.VITE_REVENUECAT_APPLE_KEY;

    if (!apiKey) {
      console.error("Chave do RevenueCat não encontrada no .env");
      return;
    }

    await Purchases.configure({ apiKey });

    // Associa a compra da Apple ao ID do usuário logado no Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await Purchases.logIn({ appUserID: user.id });
    }

    storeInitialized = true;
  } catch (error) {
    console.error("Erro ao inicializar RevenueCat:", error);
  }
}

export async function openApplePurchase(priceKey: PriceKey): Promise<CheckoutResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você precisa estar logado para comprar.");
      return "auth_required";
    }

    toast.loading("Conectando à loja da Apple...", { id: "iap-loading" });

    const offerings = await Purchases.getOfferings();
    const packageId = APPLE_PRODUCTS[priceKey].productId;

    const packageToBuy = offerings.current?.packages.find(
      (pkg) => pkg.identifier === packageId
    );

    if (!packageToBuy) {
      toast.dismiss("iap-loading");
      toast.error("Produto não disponível no momento.");
      return "error";
    }

    toast.dismiss("iap-loading");
    toast.loading("Aguardando confirmação...", { id: "iap-processing" });

    // O RevenueCat abre o Apple Pay e já valida o recibo
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: packageToBuy });

    toast.dismiss("iap-processing");

    if (customerInfo) {
      toast.success("Compra confirmada! Bem-vindo.", { id: "iap-success" });
      setTimeout(() => window.location.reload(), 1500);
      return "purchased";
    }

    return "error";
  } catch (err: any) {
    toast.dismiss("iap-loading");
    toast.dismiss("iap-processing");

    if (err.userCancelled) {
      console.log("Usuário cancelou a compra.");
      return "cancelled";
    }

    console.error("Erro na transação Apple:", err);
    toast.error("Erro ao processar o pagamento com a Apple.");
    return "error";
  }
}

export const getPendingCheckout = (): PriceKey | null => null;
export const clearPendingCheckout = () => { };