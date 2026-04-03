import { useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Sparkles, Heart, Compass, Users, Brain, ChevronLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MapContentStructured } from "./types/mapContent";
import { NotificationOptInBanner } from "./components/NotificationOptInBanner";
import { supabase } from "./services/supabaseClient";

interface CityMapViewerProps {
  content: MapContentStructured;
  scores: { body: number; space: number; territory: number; identity: number; other: number };
  city: string;
  userName: string;
  onBack: () => void;
  isAnonymous?: boolean;
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

const PILLAR_ORDER: (keyof typeof PILLAR_CONFIG)[] = [
  "body",
  "space",
  "territory",
  "identity",
  "other",
];

export const CityMapViewer = ({
  content,
  scores,
  city,
  userName,
  onBack,
  isAnonymous = false,
}: CityMapViewerProps) => {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app?tab=map` }
    });
    if (error) console.error("Google auth error:", error);
  };

  const radarData = PILLAR_ORDER.map((key) => ({
    pillar: PILLAR_CONFIG[key].label,
    score: scores[key],
    fullMark: 100,
  }));

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-primary text-primary-foreground p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 mb-2 -ml-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">{content.title}</h1>
        <p className="text-primary-foreground/70 text-sm mt-1">
          {content.subtitle}
        </p>
        <div className="flex items-center gap-2 mt-2 text-xs text-primary-foreground/50">
          <span>{userName}</span>
          <span>•</span>
          <span>{city}</span>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-20">
        {/* Introduction */}
        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
              {content.introduction}
            </p>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-bold text-primary mb-4 text-center">
              Seu Radar de Presença
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="pillar"
                    tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  />
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
            {/* Score badges */}
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              {PILLAR_ORDER.map((key) => {
                const cfg = PILLAR_CONFIG[key];
                return (
                  <Badge
                    key={key}
                    variant="outline"
                    className={cfg.badgeClass}
                  >
                    {cfg.label}: {scores[key]}%
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>

      {/* Everything below intro + radar is blurred for anonymous users */}
        <div className="relative">
          <div className={isAnonymous ? "blur-[8px] select-none pointer-events-none" : ""}>
            <Accordion type="multiple" defaultValue={PILLAR_ORDER} className="space-y-3">
              {PILLAR_ORDER.map((pillarKey) => {
                const section = content.sections[pillarKey];
                if (!section) return null;
                const cfg = PILLAR_CONFIG[pillarKey];
                const Icon = cfg.icon;

                return (
                  <AccordionItem
                    key={pillarKey}
                    value={pillarKey}
                    className={`border rounded-xl overflow-hidden ${cfg.borderClass}`}
                  >
                    <AccordionTrigger
                      className={`px-4 py-3 hover:no-underline ${cfg.bgClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: cfg.color + "22" }}
                        >
                          <Icon className="h-5 w-5" style={{ color: cfg.color }} />
                        </div>
                        <div className="text-left">
                          <span className="font-bold text-base" style={{ color: cfg.color }}>
                            {section.title || cfg.label}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            Score: {scores[pillarKey]}%
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2 space-y-4">
                      <div
                        className={`border-l-4 pl-3 py-1 italic text-sm text-foreground/80`}
                        style={{ borderColor: cfg.color }}
                      >
                        {section.summary}
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                        {section.deep_analysis}
                      </p>
                      {section.recommendations && section.recommendations.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-primary mb-2">Recomendações</h4>
                          <ul className="space-y-1.5">
                            {section.recommendations.map((rec, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-foreground/85">
                                <span style={{ color: cfg.color }} className="font-bold mt-0.5">▸</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {section.places && section.places.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-primary mb-2">📍 Lugares para Você</h4>
                          <div className="space-y-2.5">
                            {section.places.map((place, i) => (
                              <div key={i} className="bg-muted/50 rounded-lg p-3 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-sm text-primary">{place.name}</span>
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{place.neighborhood}</Badge>
                                </div>
                                <p className="text-xs text-foreground/80">{place.description}</p>
                                <p className="text-xs italic" style={{ color: cfg.color }}>→ {place.why}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            {/* Purchasing Power Insights */}
            {content.purchasing_power_insights && (
              <Card className="mt-6">
                <CardContent className="p-5">
                  <h3 className="text-base font-bold text-primary mb-3">💰 Insights de Experiência</h3>
                  <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                    {content.purchasing_power_insights}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Conclusion */}
            {content.conclusion && (
              <Card className="mt-6">
                <CardContent className="p-5">
                  <h3 className="text-base font-bold text-primary mb-3">Conclusão</h3>
                  <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                    {content.conclusion}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Login overlay on top of blurred content */}
          {isAnonymous && (
            <div className="absolute inset-0 flex items-start justify-center pt-16 z-20">
              <div className="bg-white dark:bg-boba-darkCard p-6 sm:p-8 rounded-3xl shadow-2xl border-2 border-boba-coral/30 text-center space-y-4 mx-4 max-w-sm w-full">
                <div className="text-3xl">🗺️</div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-boba-coral">
                  Seu Mapa está Pronto!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Entre para ver a análise completa dos 5 pilares, recomendações personalizadas e lugares feitos para você.
                </p>
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 bg-boba-coral hover:bg-boba-coral/90 text-white font-bold py-4 rounded-2xl shadow-lg text-xs uppercase tracking-widest hover:-translate-y-0.5 transition-all"
                  >
                    <div className="bg-white p-1.5 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    </div>
                    Continuar com Google
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content below blurred section — only show if not anonymous */}
        {!isAnonymous && (
          <>
            {/* Poetic Proposition */}
            {content.poetic_proposition && (
              <Card className="border-secondary/40 bg-secondary/5">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-secondary" />
                    <span className="text-xs font-bold text-secondary tracking-widest uppercase">
                      Proposição Poética
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed italic text-primary font-medium">
                    {content.poetic_proposition}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Notification Opt-In */}
            <div className="pt-4">
              <NotificationOptInBanner lang="pt" />
            </div>

            {/* Share Button — direct WhatsApp */}
            <button
              onClick={() => {
                const shareText = `🗺️ Meu Mapa de Presença Relacional em ${city}!\n\n` +
                  `Corpo: ${scores.body}% | Espaço: ${scores.space}% | Território: ${scores.territory}%\n` +
                  `Identidade: ${scores.identity}% | O Outro: ${scores.other}%\n\n` +
                  `"${content.poetic_proposition || content.subtitle}"\n\n` +
                  `Descubra o seu em: https://cult.feltrip.com`;
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
                window.open(whatsappUrl, '_blank');
              }}
              className="w-full py-4 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl text-sm uppercase tracking-wider hover:brightness-105 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Share2 className="h-5 w-5" />
              ✦ Compartilhar meu Mapa
            </button>
          </>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 pb-8">
          <p>feltrip.com • Mapa de Presença Relacional</p>
        </div>
      </div>
    </div>
  );
};
