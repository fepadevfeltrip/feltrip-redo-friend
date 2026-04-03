/**
 * Returns locale-aware price display.
 * If browser lang is EN or non-PT/ES/FR, show USD prices.
 * Otherwise show BRL prices.
 * Stripe Checkout handles actual currency via multi-currency price IDs.
 */
export function useDisplayCurrency() {
  const lang = navigator.language?.substring(0, 2) || "pt";
  const isInternational = lang === "en" || !["pt", "es", "fr"].includes(lang);

  return {
    isInternational,
    roteiro: isInternational ? "$9.00" : "R$ 29,90",
    imersao: isInternational ? "$29.00" : "R$ 129,00",
  };
}

export function getDisplayPrices(lang: string) {
  const isInternational = lang === "en" || !["pt", "es", "fr"].includes(lang);
  return {
    isInternational,
    roteiro: isInternational ? "$9.00" : "R$ 29,90",
    imersao: isInternational ? "$29.00" : "R$ 129,00",
  };
}
