import React, { useState } from "react";
import { X, Check, Sparkles, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { openCheckout } from "@/lib/stripe";
import CultSquadModal from "./CultSquadModal";
import { getDisplayPrices } from "@/hooks/useDisplayCurrency";

interface PricingPaywallProps {
  onClose: () => void;
  lang: "pt" | "en" | "es" | "fr" | "zh";
  highlightIndex?: number;
}

const PLAN_ICONS = [Sparkles, Map];

const TEXTS = {
  pt: {
    title: "Acesso Restrito",
    subtitle: "Escolha o seu nível de profundidade para continuar.",
    plans: [
      {
        name: "Roteiro Cult Unificado",
        note: "Pay per use • Desbloqueio Imediato",
        features: [
          "Tudo do plano Free",
          "Roteiro Completo (até 7 dias)",
          "Suporte Concierge via Chat Ilimitado durante toda a jornada (até 7 dias)",
        ],
        cta: "Gerar meu Roteiro",
      },
      {
        name: "A Imersão Completa",
        note: "Pay per use • Mapão + Idioma",
        features: [
          "25 perguntas profundas do Mapão Fenomenológico",
          "Dossiê de Aterrissagem e Moradia (Análise de ruas, custo e segurança)",
          "4h de Tutoria de Idioma com IA",
          "Consultoria biográfica completa",
        ],
        cta: "Desbloquear Experiência Premium",
        highlight: true,
        badge: "Recomendado para Expats",
      },
    ],
  },
  en: {
    title: "Restricted Access",
    subtitle: "Choose your depth level to continue.",
    plans: [
      {
        name: "Unified Cult Itinerary",
        note: "Pay per use • Instant Unlock",
        features: [
          "Everything in the Free plan",
          "Full Itinerary (up to 7 days)",
          "Unlimited Concierge Chat Support throughout the journey (up to 7 days)",
        ],
        cta: "Generate my Itinerary",
      },
      {
        name: "The Full Immersion",
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
  },
  es: {
    title: "Acceso Restringido",
    subtitle: "Elige tu nivel de profundidad para continuar.",
    plans: [
      {
        name: "Itinerario Cult Unificado",
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
  },
};

const PricingPaywall: React.FC<PricingPaywallProps> = ({ onClose, lang }) => {
  const t = TEXTS[lang as keyof typeof TEXTS] || TEXTS.pt;
  const [showSquad, setShowSquad] = useState(false);
  const prices = getDisplayPrices(lang);

  const handlePlanClick = async (index: number) => {
    if (index === 0) {
      const result = await openCheckout("personal_map");
      if (result === "auth_required") return;
      onClose();
    }
    if (index === 1) {
      const result = await openCheckout("explorer");
      if (result === "auth_required") return;
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-card rounded-[2rem] w-full max-w-lg max-h-[90vh] shadow-2xl border border-border relative flex flex-col overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-foreground" />
        </button>

        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2 mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-serif font-bold text-foreground">{t.title}</h2>
            <p className="text-sm text-muted-foreground">{t.subtitle}</p>
          </div>

          <div className="space-y-4">
            {t.plans.map((plan: any, i: number) => {
              const Icon = PLAN_ICONS[i];
              const isHighlight = !!plan.highlight;
              const price = i === 0 ? prices.roteiro : prices.imersao;

              return (
                <Card
                  key={i}
                  className={`relative overflow-hidden transition-all ${isHighlight ? "border-primary ring-1 ring-primary shadow-lg bg-primary/5" : "border-border/40"}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {Icon && (
                          <Icon className={`h-5 w-5 ${isHighlight ? "text-primary" : "text-muted-foreground"}`} />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold">{plan.name}</h3>
                            {plan.badge && (
                              <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0">{plan.badge}</Badge>
                            )}
                          </div>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{plan.note}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-foreground">{price}</span>
                      </div>
                    </div>

                    <ul className="space-y-2 mb-4 pt-3 border-t border-border/30">
                      {plan.features.map((f: string, j: number) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-foreground/80">
                          <Check
                            className={`h-3.5 w-3.5 ${isHighlight ? "text-primary" : "text-muted-foreground"} shrink-0 mt-0.5`}
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full text-xs font-bold uppercase tracking-widest h-10 rounded-xl shadow-sm"
                      variant={isHighlight ? "default" : "outline"}
                      onClick={() => handlePlanClick(i)}
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="pt-2 text-center">
            <button onClick={() => setShowSquad(true)} className="text-xs text-muted-foreground underline">
              Cult Squad (50% OFF para grupos)
            </button>
          </div>
        </div>
      </div>
      <CultSquadModal open={showSquad} onOpenChange={setShowSquad} />
    </div>
  );
};

export default PricingPaywall;
