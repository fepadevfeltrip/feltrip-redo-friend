import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageCircle, RefreshCw, Share2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useUserTier } from "@/hooks/useUserTier";
import { useMapPurchase } from "@/hooks/useMapPurchase";
import { openApplePurchase as openCheckout } from "@/lib/appleIAP";
import type { PillarScores } from "./PresenceQuestionnaire";
import cultAnalystImage from "@/assets/cult-character-analyst.png";
import { NotificationOptInBanner } from "./components/NotificationOptInBanner";

interface PresenceMapResultsProps {
  scores: PillarScores;
  poeticResponse: string;
  onReset: () => void;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--energy))",
  "hsl(var(--muted-foreground))",
];

const PILLAR_LABELS: Record<keyof PillarScores, string> = {
  body: "Body",
  space: "Space",
  territory: "Territory",
  other: "The Other",
  identity: "Identity",
};

export const PresenceMapResults = ({ scores, poeticResponse, onReset }: PresenceMapResultsProps) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isFree, isPremium } = useUserTier();
  const { hasPurchasedMap } = useMapPurchase(user?.id);
  const [showPillarChat, setShowPillarChat] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState<keyof PillarScores | null>(null);
  const [freePrompt, setFreePrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Analysis is unlocked if: user bought a personal_map, has explorer credits, or is premium
  const isAnalysisLocked = !hasPurchasedMap && !isPremium;

  const UNLOCK_CTA: Record<string, string> = {
    pt: 'Ver análise completa → R$ 129,90',
    en: 'See full analysis → $ 29.90',
    es: 'Ver análisis completo → $ 29,90',
    fr: 'Voir l\'analyse complète → $ 29,90',
    zh: '查看完整分析 → $ 29.90',
  };

  const chartData = Object.entries(scores).map(([pillar, value]) => ({
    name: PILLAR_LABELS[pillar as keyof PillarScores],
    value,
    pillar,
  }));

  const handlePillarClick = (pillar: keyof PillarScores) => {
    setSelectedPillar(pillar);
    setShowPillarChat(true);
    setAiResponse("");
    setFreePrompt("");
  };

  const handlePillarChat = async () => {
    if (!freePrompt.trim() || !selectedPillar) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("presence-ai", {
        body: {
          freePrompt: freePrompt.trim(),
          pillarFocus: selectedPillar,
          language: i18n.language,
        },
      });

      if (error) throw error;
      setAiResponse(data?.poeticResponse || "");
    } catch (error) {
      console.error("AI chat error:", error);
      toast({
        title: "Error",
        description: "Could not get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Poetic Response Card — blurred for free users */}
      <Card className="border-primary/20 bg-gradient-to-b from-background to-muted/20 relative overflow-hidden">
        <CardHeader className="text-center">
          <img src={cultAnalystImage} alt="Cult AI" className="w-20 h-20 mx-auto object-contain mb-2" />
          <CardTitle className="text-primary">{t("presenceResults.mapTitle")}</CardTitle>
          <CardDescription>{t("presenceResults.activationSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className={isAnalysisLocked ? 'blur-md select-none pointer-events-none' : ''}>
            <p className="text-muted-foreground italic leading-relaxed whitespace-pre-line">{poeticResponse}</p>
          </div>
          {isAnalysisLocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-background/40 via-primary/10 to-background/80 backdrop-blur-[3px] rounded-lg p-6 text-center">
              <div className="text-4xl mb-3">🔮</div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {i18n.language?.startsWith('pt') ? 'Sua análise profunda está pronta' :
                  i18n.language?.startsWith('es') ? 'Tu análisis profundo está listo' :
                    'Your deep analysis is ready'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs leading-relaxed">
                {i18n.language?.startsWith('pt') ? 'Descubra como você realmente habita o mundo. 5 pilares, 1 revelação.' :
                  i18n.language?.startsWith('es') ? 'Descubre cómo realmente habitas el mundo. 5 pilares, 1 revelación.' :
                    'Discover how you truly inhabit the world. 5 pillars, 1 revelation.'}
              </p>
              <Button
                onClick={() => openCheckout('personal_map')}
                className="bg-primary text-primary-foreground font-bold shadow-lg h-12 px-8 text-base"
              >
                ✨ {UNLOCK_CTA[i18n.language?.substring(0, 2)] || UNLOCK_CTA.en}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t("presenceResults.pillarsTitle")}</CardTitle>
          <CardDescription>{t("presenceResults.pillarsDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-56 sm:h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  outerRadius="70%"
                  innerRadius="30%"
                  dataKey="value"
                  onClick={(data) => handlePillarClick(data.pillar as keyof PillarScores)}
                  style={{ cursor: "pointer" }}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value}%`, name]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }}
                  formatter={(value, entry: any) => (
                    <span className="text-[10px] sm:text-xs">
                      {value}: {entry.payload.value}%
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Pillar Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 mt-4">
            {Object.entries(PILLAR_LABELS).map(([key, label]) => (
              <Button
                key={key}
                variant={selectedPillar === key ? "default" : "outline"}
                size="sm"
                onClick={() => handlePillarClick(key as keyof PillarScores)}
                className="text-[10px] sm:text-xs px-2 py-1 h-auto min-h-[32px]"
              >
                <MessageCircle className="h-3 w-3 mr-1 shrink-0" />
                <span className="truncate">
                  {label}: {scores[key as keyof PillarScores]}%
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Free Pillar Chat */}
      {showPillarChat && selectedPillar && (
        <Card className="border-accent/30">
          <CardHeader>
            <CardTitle className="text-lg">
              {t("presenceResults.talkToCultAi", { pillar: t(`presenceQuestions.pillars.${selectedPillar}`) })}
            </CardTitle>
            <CardDescription>{t("presenceResults.shareMind")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={t("presenceResults.tellCultAi", {
                pillar: t(`presenceQuestions.pillars.${selectedPillar}`),
              })}
              value={freePrompt}
              onChange={(e) => setFreePrompt(e.target.value)}
              rows={3}
            />
            <Button onClick={handlePillarChat} disabled={isLoading || !freePrompt.trim()} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("presenceResults.cultAiReflecting")}
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {t("presenceResults.askCultAi")}
                </>
              )}
            </Button>

            {aiResponse && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-muted-foreground italic whitespace-pre-line">{aiResponse}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notification Opt-In */}
      <NotificationOptInBanner lang={i18n.language} />

      {/* Share Button - Bem visível */}
      <button
        onClick={() => {
          // Dispara evento para abrir o modal de compartilhamento
          window.dispatchEvent(new CustomEvent('openArchetypeShare', {
            detail: { scores, poeticResponse }
          }));
        }}
        className="w-full py-4 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl text-sm uppercase tracking-wider hover:brightness-105 transition-all flex items-center justify-center gap-2 shadow-lg"
      >
        <Share2 className="h-5 w-5" />
        {i18n.language === 'pt' ? '✦ Compartilhar meu Arquétipo' :
          i18n.language === 'es' ? '✦ Compartir mi Arquetipo' :
            i18n.language === 'fr' ? '✦ Partager mon Archétype' :
              '✦ Share my Archetype'}
      </button>

      {/* Reset Button */}
      <Button variant="outline" onClick={onReset} className="w-full">
        <RefreshCw className="h-4 w-4 mr-2" />
        {t("presenceResults.takeAnother")}
      </Button>
    </div>
  );
};
