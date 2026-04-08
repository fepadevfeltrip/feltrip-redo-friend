import { useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Star, MapPin, Sparkles, Heart, Compass, Users, Brain, Gem, MessageCircle, FileText } from "lucide-react";
import { openApplePurchase as openCheckout } from "@/lib/appleIAP";
import CultSquadModal from "./components/CultSquadModal";
import { useTranslation } from "react-i18next";
import type { MapContentStructured } from "./types/mapContent";

interface PresenceMapPreviewProps {
  scores: {
    body: number;
    space: number;
    territory: number;
    identity: number;
    other: number;
  };
  city: string;
  content: MapContentStructured;
  userName: string;
  onUnlocked: () => void;
  onBack: () => void;
}

const PILLAR_CONFIG = {
  body: {
    label: "Corpo",
    icon: Heart,
    color: "hsl(6, 100%, 71%)",
    bgClass: "bg-accent/10",
    borderClass: "border-accent/30",
    textClass: "text-accent",
    badgeClass: "bg-accent/20 text-accent border-accent/30",
  },
  space: {
    label: "Espaço",
    icon: Compass,
    color: "hsl(38, 80%, 53%)",
    bgClass: "bg-secondary/10",
    borderClass: "border-secondary/30",
    textClass: "text-secondary",
    badgeClass: "bg-secondary/20 text-secondary border-secondary/30",
  },
  territory: {
    label: "Território",
    icon: MapPin,
    color: "hsl(193, 65%, 29%)",
    bgClass: "bg-primary/10",
    borderClass: "border-primary/30",
    textClass: "text-primary",
    badgeClass: "bg-primary/20 text-primary border-primary/30",
  },
  identity: {
    label: "Identidade",
    icon: Brain,
    color: "hsl(330, 100%, 56%)",
    bgClass: "bg-[hsl(330,100%,56%)]/10",
    borderClass: "border-[hsl(330,100%,56%)]/30",
    textClass: "text-[hsl(330,100%,56%)]",
    badgeClass: "bg-[hsl(330,100%,56%)]/20 text-[hsl(330,100%,56%)] border-[hsl(330,100%,56%)]/30",
  },
  other: {
    label: "O Outro",
    icon: Users,
    color: "hsl(140, 15%, 50%)",
    bgClass: "bg-muted",
    borderClass: "border-muted-foreground/30",
    textClass: "text-muted-foreground",
    badgeClass: "bg-muted text-muted-foreground border-muted-foreground/30",
  },
} as const;

const PILLAR_ORDER: (keyof typeof PILLAR_CONFIG)[] = ["body", "space", "territory", "identity", "other"];

const TEXTS = {
  pt: {
    title: "SEU MAPA DE PRESENÇA ESTÁ PRONTO!",
    unlockTitle: "DESBLOQUEIE SUA ANÁLISE COMPLETA:",
    features: [
      "Análise profunda dos 5 pilares",
      "Lugares curados + recomendações",
      "Proposição poética personalizada",
      "Acesso permanente a esta cidade",
    ],
    price: "R$ 29,90",
    priceSquad: "ou R$ 14,95 com desconto Squad (5+ pessoas)",
    cta: "Desbloquear Agora",
    social: "280 pessoas transformaram sua experiência urbana",
    rating: "4.9/5 taxa de satisfação",
    locked: "Bloqueado — Desbloqueie para ver",
    squad: "🎯 Grupo de 5+? Desbloqueie 50% OFF com Cult Squad!",
    squadCta: "Saiba mais",
  },
  en: {
    title: "YOUR PRESENCE MAP IS READY!",
    unlockTitle: "UNLOCK YOUR FULL ANALYSIS:",
    features: [
      "Deep analysis of all 5 pillars",
      "Curated places + recommendations",
      "Personalized poetic proposition",
      "Permanent access to this city",
    ],
    price: "US$9,00",
    priceSquad: "or R$ 14.95 with Squad discount (5+ people)",
    cta: "Unlock Now",
    social: "280 people transformed their urban experience",
    rating: "4.9/5 satisfaction rate",
    locked: "Locked — Unlock to reveal",
    squad: "🎯 Group of 5+? Unlock 50% OFF with Cult Squad!",
    squadCta: "Learn more",
  },
  es: {
    title: "¡TU MAPA DE PRESENCIA ESTÁ LISTO!",
    unlockTitle: "DESBLOQUEA TU ANÁLISIS COMPLETO:",
    features: [
      "Análisis profundo de los 5 pilares",
      "Lugares curados + recomendaciones",
      "Proposición poética personalizada",
      "Acceso permanente a esta ciudad",
    ],
    price: "US$9,00",
    priceSquad: "o con descuento Squad (5+ personas)",
    cta: "Desbloquear Ahora",
    social: "280 personas transformaron su experiencia urbana",
    rating: "4.9/5 tasa de satisfacción",
    locked: "Bloqueado — Desbloquea para ver",
    squad: "🎯 ¿Grupo de 5+? ¡Desbloquea 50% OFF con Cult Squad!",
    squadCta: "Saber más",
  },
  fr: {
    title: "VOTRE CARTE DE PRÉSENCE EST PRÊTE !",
    unlockTitle: "DÉBLOQUEZ VOTRE ANALYSE COMPLÈTE :",
    features: [
      "Analyse profonde des 5 piliers",
      "Lieux curés + recommandations",
      "Proposition poétique personnalisée",
      "Accès permanent à cette ville",
    ],
    price: "R$ 29,90",
    priceSquad: "ou R$ 14,95 avec remise Squad (5+ personnes)",
    cta: "Débloquer",
    social: "280 personnes ont transformé leur expérience",
    rating: "4.9/5 satisfaction",
    locked: "Verrouillé — Débloquez pour voir",
    squad: "🎯 Groupe de 5+ ? 50% OFF avec Cult Squad !",
    squadCta: "En savoir plus",
  },
  zh: {
    title: "您的存在地图已准备好！",
    unlockTitle: "解锁完整分析：",
    features: ["5大支柱深度分析", "精选地点+推荐", "个性化诗意命题", "永久访问此城市"],
    price: "R$ 29.90",
    priceSquad: "或 R$ 14.95 Squad折扣 (5+人)",
    cta: "立即解锁",
    social: "280人改变了体验",
    rating: "4.9/5 满意度",
    locked: "已锁定 — 解锁查看",
    squad: "🎯 5+人？50%折扣！",
    squadCta: "了解更多",
  },
};

export const PresenceMapPreview = ({ scores, city, content, userName, onUnlocked, onBack }: PresenceMapPreviewProps) => {
  const { i18n } = useTranslation();
  const lang = (i18n.language?.substring(0, 2) || "pt") as keyof typeof TEXTS;
  const t = TEXTS[lang] || TEXTS.pt;
  const [showSquad, setShowSquad] = useState(false);

  const radarData = PILLAR_ORDER.map((key) => ({
    pillar: PILLAR_CONFIG[key].label,
    score: scores[key],
    fullMark: 100,
  }));

  const bodySection = content.sections.body;

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 text-center space-y-2">
        <div className="text-3xl">✨</div>
        <h1 className="text-2xl font-bold">{content.title}</h1>
        <p className="text-primary-foreground/70 text-sm">{content.subtitle}</p>
        <div className="flex items-center justify-center gap-2 text-xs text-primary-foreground/50">
          <span>{userName}</span>
          <span>•</span>
          <span>{city}</span>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto w-full">
        {/* Introduction */}
        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
              {content.introduction}
            </p>
          </CardContent>
        </Card>

        {/* Radar Chart — fully visible */}
        <Card>
          <CardContent className="p-5">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="pillar"
                    tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <Radar
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {/* Score badges — all visible */}
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              {PILLAR_ORDER.map((key) => (
                <Badge key={key} variant="outline" className={PILLAR_CONFIG[key].badgeClass}>
                  {PILLAR_CONFIG[key].label}: {scores[key]}%
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All 5 pillars — BLURRED */}
        <div className="relative">
          <div className="space-y-3 filter blur-[6px] pointer-events-none select-none">
            {PILLAR_ORDER.map((pillarKey) => {
              const section = content.sections[pillarKey];
              if (!section) return null;
              const cfg = PILLAR_CONFIG[pillarKey];
              const Icon = cfg.icon;
              return (
                <div key={pillarKey} className={`border rounded-xl overflow-hidden ${cfg.borderClass}`}>
                  <div className={`px-4 py-3 ${cfg.bgClass}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: cfg.color + "22" }}>
                        <Icon className="h-5 w-5" style={{ color: cfg.color }} />
                      </div>
                      <div className="text-left">
                        <span className="font-bold text-base" style={{ color: cfg.color }}>
                          {section.title || cfg.label}
                        </span>
                        <span className="block text-xs text-muted-foreground">Score: {scores[pillarKey]}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-4 pt-2 space-y-3">
                    <div className="border-l-4 pl-3 py-1 italic text-sm text-foreground/80" style={{ borderColor: cfg.color }}>
                      {section.summary}
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                      {section.deep_analysis?.substring(0, 200)}...
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Lock overlay — sexy sales message */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-gradient-to-br from-primary/95 to-primary/80 backdrop-blur-md rounded-2xl px-8 py-6 shadow-2xl border border-primary-foreground/20 text-center max-w-xs space-y-3">
              <div className="text-4xl">🔮</div>
              <h3 className="text-primary-foreground font-bold text-lg leading-tight">
                {lang === "pt" ? "Seu mapa interior está quase revelado..." :
                  lang === "es" ? "Tu mapa interior está casi revelado..." :
                    lang === "fr" ? "Votre carte intérieure est presque révélée..." :
                      "Your inner map is almost revealed..."}
              </h3>
              <p className="text-primary-foreground/80 text-sm leading-relaxed">
                {lang === "pt" ? "Cada pilar guarda segredos sobre como você habita o mundo. Desbloqueie a análise completa e descubra padrões que você nem sabia que existiam." :
                  lang === "es" ? "Cada pilar guarda secretos sobre cómo habitas el mundo. Desbloquea el análisis completo y descubre patrones que no sabías que existían." :
                    lang === "fr" ? "Chaque pilier cache des secrets sur votre façon d'habiter le monde. Débloquez l'analyse complète." :
                      "Each pillar holds secrets about how you inhabit the world. Unlock the full analysis and discover patterns you didn't know existed."}
              </p>
              <Button
                onClick={() => openCheckout("personal_map")}
                className="w-full h-12 text-base font-bold bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg"
              >
                ✨ {t.cta} — R$ 29,90
              </Button>
            </div>
          </div>
        </div>

        {/* Unlock CTA */}
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary" />
          <CardContent className="p-6 space-y-5 text-center">
            <div className="text-3xl">💎</div>
            <h3 className="font-bold text-primary text-lg">
              {lang === "pt" ? "Transforme curiosidade em autoconhecimento" :
                lang === "es" ? "Transforma curiosidad en autoconocimiento" :
                  lang === "fr" ? "Transformez la curiosité en connaissance de soi" :
                    "Transform curiosity into self-knowledge"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {lang === "pt" ? "Mais de 280 pessoas já desbloquearam seus mapas e mudaram a forma como vivem suas cidades. Sua vez." :
                lang === "es" ? "Más de 280 personas ya desbloquearon sus mapas y cambiaron la forma en que viven sus ciudades. Tu turno." :
                  lang === "fr" ? "Plus de 280 personnes ont déjà débloqué leurs cartes. À votre tour." :
                    "Over 280 people have already unlocked their maps and changed how they experience their cities. Your turn."}
            </p>
            <div className="text-left space-y-2 px-2">
              {t.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <Gem className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="font-medium">{feat}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => openCheckout("personal_map")}
              className="w-full h-14 text-lg font-bold shadow-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              size="lg"
            >
              🔓 {t.cta} — R$ 29,90
            </Button>

            <div className="flex items-center justify-center gap-3 pt-2">
              <div className="flex -space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <span className="text-xs font-bold text-foreground">{t.rating}</span>
            </div>
          </CardContent>
        </Card>

        {/* Squad banner */}
        <button
          onClick={() => setShowSquad(true)}
          className="w-full rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 text-center space-y-1 hover:bg-primary/10 transition-colors"
        >
          <p className="text-sm font-semibold text-foreground">{t.squad}</p>
          <p className="text-xs font-bold text-primary underline">{t.squadCta}</p>
        </button>

        {/* Back button */}
        <Button variant="outline" onClick={onBack} className="w-full">
          ← Back
        </Button>
      </div>

      <CultSquadModal open={showSquad} onOpenChange={setShowSquad} />
    </div>
  );
};
