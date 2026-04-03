import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Map, Compass, Gift } from "lucide-react";
import { openApplePurchase as openCheckout, PriceKey } from "@/lib/appleIAP";
import CultSquadModal from "./components/CultSquadModal";
import { useUserTier } from "@/hooks/useUserTier";
import { getDisplayPrices } from "@/hooks/useDisplayCurrency";

const PricingTab = () => {
  const { i18n } = useTranslation();
  const [squadOpen, setSquadOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<PriceKey | null>(null);
  const lang = i18n.language?.substring(0, 2) || "pt";
  const prices = getDisplayPrices(lang);
  const baseTexts = TEXTS[lang as keyof typeof TEXTS] || TEXTS.pt;
  const { isPremium, isExplorer, isFree } = useUserTier();

  // Inject dynamic prices
  const t = {
    ...baseTexts,
    plans: baseTexts.plans.map((p: any, i: number) => ({
      ...p,
      price: i === 0 ? p.price : i === 1 ? prices.roteiro : prices.imersao,
    })),
  };

  const handlePlanClick = async (key: PriceKey) => {
    setCheckoutLoading(key);
    try {
      await openCheckout(key);
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (isExplorer) {
    return (
      <div className="p-4 space-y-6 max-w-lg mx-auto pb-20">
        <div className="text-center pt-8">
          <span className="text-5xl mb-4 block">🎉</span>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">{t.activeTitle}</h2>
          <p className="text-sm text-muted-foreground">{t.activeSub}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-20">
      <div className="text-center pt-4">
        <h2 className="text-3xl font-serif font-bold text-foreground mb-2">{t.title}</h2>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="space-y-6">
        {t.plans.map((plan: any, i: number) => {
          const icons = [Gift, Map, Compass];
          const Icon = icons[i] || Compass;
          const isHighlight = !!(plan as any).highlight;
          const isFreeCard = !!(plan as any).isFree;
          const key: PriceKey = i === 1 ? "personal_map" : "explorer";

          return (
            <Card
              key={i}
              className={`relative overflow-hidden transition-all ${isHighlight ? "ring-2 ring-primary shadow-xl scale-[1.02]" : isFreeCard ? "border-border/30 shadow-sm opacity-80" : "border-border/40 shadow-md"}`}
            >
              {isHighlight && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] uppercase tracking-widest font-bold px-4 py-1.5 rounded-bl-xl">
                  {(plan as any).badge}
                </div>
              )}
              <CardContent className="pt-8 pb-6 px-6">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`h-6 w-6 ${isHighlight ? "text-primary" : "text-muted-foreground"}`} />
                  <h3 className="text-xl font-bold flex-1">{plan.name}</h3>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                </div>

                {plan.note && (
                  <p className="text-[10px] text-muted-foreground mb-4 uppercase tracking-widest">{plan.note}</p>
                )}

                <ul className="space-y-2.5 mb-6 border-t border-border/50 pt-4">
                  {plan.features.map((f: string, j: number) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-foreground/80">
                      <Check
                        className={`h-4 w-4 ${isHighlight ? "text-primary" : "text-muted-foreground"} shrink-0 mt-0.5`}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {!isFreeCard && (
                  <Button
                    className="w-full text-sm font-bold uppercase tracking-widest h-auto min-h-[3rem] py-3 rounded-xl shadow-md whitespace-normal text-wrap"
                    variant={isHighlight ? "default" : "secondary"}
                    onClick={() => handlePlanClick(key)}
                    disabled={checkoutLoading !== null}
                  >
                    {checkoutLoading === key ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Redirecionando...
                      </span>
                    ) : (
                      plan.cta
                    )}
                  </Button>
                )}
                {isFreeCard && isFree && (
                  <Badge variant="secondary" className="w-full justify-center py-2 text-xs uppercase tracking-widest">
                    ✓ {plan.cta}
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <button
        onClick={() => setSquadOpen(true)}
        className="w-full mt-8 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 text-center space-y-2 hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Gift className="h-6 w-6 text-primary" />
          <span className="text-sm font-bold text-foreground">{t.squadTitle}</span>
        </div>
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{t.squadCta}</p>
      </button>

      <CultSquadModal open={squadOpen} onOpenChange={setSquadOpen} />
    </div>
  );
};

const TEXTS = {
  pt: {
    title: "Escolha sua profundidade",
    subtitle: "O acesso à cidade calibrado para o seu momento.",
    activeTitle: "Plano Ativo",
    activeSub: "Você tem acesso completo à Imersão. Aproveite!",
    plans: [
      {
        name: "Free — Degustação",
        price: "Grátis",
        note: "Acesso limitado",
        features: [
          "Arquétipo de Viajante completo",
          "3 Gemas do Dia 1 (Manhã, Tarde, Noite)",
          "Lista de Profissionais Indicados",
          "1 pergunta no Chat com a Cult AI",
          "Identificação do Bairro Ideal",
        ],
        cta: "Seu plano atual",
        isFree: true,
      },
      {
        name: "Roteiro Cult Unificado",
        price: "",
        note: "Pay per use • Desbloqueio Imediato",
        features: [
          "Tudo do plano Free",
          "Roteiro Completo (até 7 dias)",
          "Suporte Concierge via Chat Ilimitado durante toda a jornada (até 7 dias)",
        ],
        cta: " Pagar com Apple",
      },
      {
        name: "A Imersão Completa",
        price: "",
        note: "Pay per use • Mapão + Idioma",
        features: [
          "25 perguntas profundas do Mapão Fenomenológico",
          "Dossiê de Aterrissagem e Moradia (Análise de ruas, custo e segurança)",
          "4h de Tutoria de Idioma com IA",
          "Consultoria biográfica completa",
        ],
        cta: " Desbloquear com Apple",
        highlight: true,
        badge: "Recomendado para Expats",
      },
    ],
    squadTitle: "Cult Squad — 50% OFF para grupos de 5+",
    squadCta: "Saiba mais",
  },
  en: {
    title: "Choose your depth",
    subtitle: "City access calibrated for your moment.",
    activeTitle: "Plan Active",
    activeSub: "You have full Immersion access. Enjoy!",
    plans: [
      {
        name: "Free — Tasting",
        price: "Free",
        note: "Limited access",
        features: [
          "Full Traveler Archetype",
          "3 Gems from Day 1 (Morning, Afternoon, Night)",
          "Recommended Professionals List",
          "1 question in Chat with Cult AI",
          "Ideal Neighborhood Identification",
        ],
        cta: "Your current plan",
        isFree: true,
      },
      {
        name: "Unified Cult Itinerary",
        price: "",
        note: "Pay per use • Instant Unlock",
        features: [
          "Everything in the Free plan",
          "Full Itinerary (up to 7 days)",
          "Unlimited Concierge Chat Support throughout the journey (up to 7 days)",
        ],
        cta: " Unlock with Apple",
      },
      {
        name: "The Full Immersion",
        price: "",
        note: "Pay per use • Full Map + Language",
        features: [
          "25 deep phenomenological questions",
          "Landing & Housing Dossier (Street analysis, cost & safety)",
          "4h of AI Language Tutoring",
          "Complete biographical consulting",
        ],
        cta: "Unlock Premium Experience",
        highlight: true,
        badge: "Recommended for Expats",
      },
    ],
    squadTitle: "Cult Squad — 50% OFF for groups of 5+",
    squadCta: "Learn more",
  },
  es: {
    title: "Elige tu profundidad",
    subtitle: "Acceso a la ciudad calibrado para tu momento.",
    activeTitle: "Plan Activo",
    activeSub: "Tienes acceso completo a la Inmersión. ¡Disfruta!",
    plans: [
      {
        name: "Free — Degustación",
        price: "Gratis",
        note: "Acceso limitado",
        features: [
          "Arquetipo de Viajero completo",
          "3 Gemas del Día 1 (Mañana, Tarde, Noche)",
          "Lista de Profesionales Recomendados",
          "1 pregunta en el Chat con Cult AI",
          "Identificación del Barrio Ideal",
        ],
        cta: "Tu plan actual",
        isFree: true,
      },
      {
        name: "Itinerario Cult Unificado",
        price: "",
        note: "Pay per use • Desbloqueo Inmediato",
        features: [
          "Todo del plan Free",
          "Itinerario Completo (hasta 7 días)",
          "Soporte Concierge via Chat Ilimitado durante todo el viaje (hasta 7 días)",
        ],
        cta: "Generar mi Itinerario",
      },
      {
        name: "La Inmersión Completa",
        price: "",
        note: "Pay per use • Mapa + Idioma",
        features: [
          "25 preguntas profundas del Mapeo Fenomenológico",
          "Dosier de Aterrizaje y Vivienda (Análisis de calles, costo y seguridad)",
          "4h de Tutoría de Idioma con IA",
          "Consultoría biográfica completa",
        ],
        cta: "Desbloquear Experiencia Premium",
        highlight: true,
        badge: "Recomendado para Expats",
      },
    ],
    squadTitle: "Cult Squad — 50% OFF para grupos de 5+",
    squadCta: "Saber más",
  },
};

export default PricingTab;
