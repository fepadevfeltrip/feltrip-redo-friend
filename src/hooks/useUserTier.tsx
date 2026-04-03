import { useProfile } from "./useProfile";

export type UserTier =
  | "free"
  | "personal_map"
  | "premium_individual"
  | "premium_company"
  | "premium_company_plus_language"
  | "explorer";

export function useUserTier() {
  const { profile, isLoading } = useProfile();
  const rawTier = profile?.user_tier || "free";

  const isExpired = (() => {
    if (!profile?.subscription_end_date) return false;
    return new Date(profile.subscription_end_date).getTime() < Date.now();
  })();

  const effectiveTier: UserTier = isExpired
    ? "free"
    : ((rawTier === "explorer"
        ? "explorer"
        : rawTier === "personal_map"
          ? "personal_map"
          : rawTier === "premium_company_plus_language"
            ? "premium_company_plus_language"
            : rawTier === "premium_company"
              ? "premium_company"
              : rawTier === "premium_individual"
                ? "premium_individual"
                : "free") as UserTier);

  const isExplorer =
    effectiveTier === "explorer" ||
    effectiveTier === "premium_company" ||
    effectiveTier === "premium_company_plus_language";
  const isPersonalMap = effectiveTier === "personal_map" || effectiveTier === "premium_individual";
  const isPremium = isExplorer || isPersonalMap;
  const hasLangAccess = isExplorer || rawTier === "premium_company_plus_language";

  return {
    tier: effectiveTier,
    isLoading,
    isFree: effectiveTier === "free",
    isPremium,
    isExplorer,
    isPersonalMap,
    isExpired,
    subscriptionEndDate: profile?.subscription_end_date || null,

    // --- ESSAS 3 LINHAS ABAIXO RESOLVEM OS SEUS 4 ERROS ---
    hasLanguageStudioIncluded: hasLangAccess, // Erro no CreditsDisplay e ExpatApp
    hasFullItinerary: isPremium, // Erro no CultChat
    previousTier: isExpired ? rawTier : null, // Erro no ExpatApp

    // Permissões de funcionalidade
    canAccessFullItinerary: isPremium,
    canAccessLanguageStudio: hasLangAccess,
    canAccessHousing: true,
    canAccessChat: true,
    hasUnlimitedChat: isPremium,
    canAccessConcierge: true,
    includesFullMap: isPremium,
    freeGemsLimit: 1,
    gemsPerPayment: 1,
  };
}
