import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

type QuestionnaireType = "before_arrival" | "during_stay" | "departure";

interface PresenceQuestionnaireProps {
  type: QuestionnaireType;
  onComplete: (scores: PillarScores, poeticResponse: string) => void;
  onBack: () => void;
}

export interface PillarScores {
  body: number;
  space: number;
  territory: number;
  other: number;
  identity: number;
}

const PILLAR_ORDER = ["body", "space", "territory", "other", "identity"];

export const PresenceQuestionnaire = ({ type, onComplete, onBack }: PresenceQuestionnaireProps) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [currentPillar, setCurrentPillar] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({
    body: [],
    space: [],
    territory: [],
    other: [],
    identity: [],
  });
  const [shareConsent, setShareConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  // Get translated content
  const questionnaireTitle = t(
    `presence.${type === "before_arrival" ? "beforeArrival" : type === "during_stay" ? "duringStay" : "departure"}`,
  );
  const pillarLabels: Record<string, string> = {
    body: t("presenceQuestions.pillars.body"),
    space: t("presenceQuestions.pillars.space"),
    territory: t("presenceQuestions.pillars.territory"),
    other: t("presenceQuestions.pillars.other"),
    identity: t("presenceQuestions.pillars.identity"),
  };

  const pillar = PILLAR_ORDER[currentPillar];
  const questions = t(`presenceQuestions.${type}.${pillar}`, { returnObjects: true }) as string[];
  const currentValue = answers[pillar][currentQuestion];

  const totalQuestions = 15;
  const currentQuestionIndex = currentPillar * 3 + currentQuestion;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers };
    newAnswers[pillar][currentQuestion] = parseInt(value);
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentValue === undefined) {
      toast({
        title: "Please select an answer",
        description: "Choose how much you agree with this statement.",
        variant: "destructive",
      });
      return;
    }

    if (currentQuestion < 2) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (currentPillar < 4) {
      setCurrentPillar(currentPillar + 1);
      setCurrentQuestion(0);
    } else {
      setShowConsent(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else if (currentPillar > 0) {
      setCurrentPillar(currentPillar - 1);
      setCurrentQuestion(2);
    }
  };

  const calculateScores = (): PillarScores => {
    const scores: PillarScores = { body: 0, space: 0, territory: 0, other: 0, identity: 0 };

    for (const pillar of PILLAR_ORDER) {
      const pillarAnswers = answers[pillar];
      const sum = pillarAnswers.reduce((a, b) => a + b, 0);
      // Convert from 1-5 scale (3 questions, max 15) to 0-100%
      scores[pillar as keyof PillarScores] = Math.round((sum / 15) * 100);
    }

    return scores;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const scores = calculateScores();

      // === INÍCIO DA MUDANÇA CIRÚRGICA ===
      if (!user) {
        // 1. Salva as respostas na "mochila" do navegador
        const pendingData = { answers, scores, type, shareConsent };
        localStorage.setItem("feltrip_pending_presence_scores", JSON.stringify(pendingData));

        // 2. Chama o componente Pai (Cult Tab) passando os scores, mas sem texto de IA.
        onComplete(scores, "");
        setIsSubmitting(false);
        return;
      }
      // === FIM DA MUDANÇA CIRÚRGICA ===

      // Get AI poetic response (Só roda se o usuário estiver logado)
      const { data: aiData, error: aiError } = await supabase.functions.invoke("presence-ai", {
        body: {
          pillarScores: scores,
          questionnaireType: type,
          language: i18n.language?.substring(0, 2) || "pt" // CONSERTO: Sinal de idioma limpo
        },
      });

      if (aiError) {
        console.error("AI error:", aiError);
        throw new Error("Failed to generate poetic response");
      }

      const poeticResponse = aiData?.poeticResponse || "";

      // Save to database
      const { data: insertedData, error: dbError } = await supabase
        .from("presence_questionnaires")
        .insert({
          user_id: user.id,
          questionnaire_type: type,
          body_q1: answers.body[0],
          body_q2: answers.body[1],
          body_q3: answers.body[2],
          space_q1: answers.space[0],
          space_q2: answers.space[1],
          space_q3: answers.space[2],
          territory_q1: answers.territory[0],
          territory_q2: answers.territory[1],
          territory_q3: answers.territory[2],
          other_q1: answers.other[0],
          other_q2: answers.other[1],
          other_q3: answers.other[2],
          identity_q1: answers.identity[0],
          identity_q2: answers.identity[1],
          identity_q3: answers.identity[2],
          poetic_response: poeticResponse,
          share_with_workplace: shareConsent,
        })
        .select()
        .single();

      if (dbError) {
        console.error("Database error:", dbError);
        throw new Error("Failed to save questionnaire");
      }

      // If user consented, share pillar percentages with HR (only percentages, no details)
      if (shareConsent && insertedData) {
        await supabase.from("hr_shared_data").insert({
          user_id: user.id,
          questionnaire_id: insertedData.id,
          body_score: scores.body,
          space_score: scores.space,
          territory_score: scores.territory,
          other_score: scores.other,
          identity_score: scores.identity,
          questionnaire_type: type,
        });
      }

      // Track engagement
      await supabase.from("engagement_tracking").insert({
        user_id: user.id,
        activity_type: "presence_questionnaire",
        metadata: { questionnaire_type: type },
      });

      onComplete(scores, poeticResponse);
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showConsent) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>{t("presence.beforeFinish")}</CardTitle>
          <CardDescription>{t("presence.yourResponsesHelp")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start space-x-3 p-4 bg-muted rounded-lg">
            <Checkbox
              id="consent"
              checked={shareConsent}
              onCheckedChange={(checked) => setShareConsent(checked as boolean)}
            />
            <div className="space-y-1">
              <Label htmlFor="consent" className="font-medium cursor-pointer">
                {t("presence.shareWithWorkplace")}
              </Label>
              <p className="text-sm text-muted-foreground">{t("presence.shareConsentDesc")}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowConsent(false)} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("presence.creatingYourMap")}
                </>
              ) : (
                t("presence.completeAndSeeMap")
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{questionnaireTitle}</span>
          <span className="text-sm font-medium text-primary">{pillarLabels[pillar]}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <CardDescription className="mt-4">
          {t("presence.questionOf", { current: currentQuestionIndex + 1, total: totalQuestions })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-lg font-medium">{questions[currentQuestion]}</p>

        <RadioGroup value={currentValue?.toString()} onValueChange={handleAnswer} className="space-y-3">
          {[1, 2, 3, 4, 5].map((value) => (
            <div key={value} className="flex items-center space-x-3">
              <RadioGroupItem value={value.toString()} id={`q-${value}`} />
              <Label htmlFor={`q-${value}`} className="cursor-pointer flex-1">
                {value === 1 && t("presence.stronglyDisagree")}
                {value === 2 && t("presence.disagree")}
                {value === 3 && t("presence.neutral")}
                {value === 4 && t("presence.agree")}
                {value === 5 && t("presence.stronglyAgree")}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={currentQuestionIndex === 0 ? onBack : handlePrevious} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentQuestionIndex === 0 ? t("common.cancel") : t("common.back")}
          </Button>
          <Button onClick={handleNext} className="flex-1">
            {currentPillar === 4 && currentQuestion === 2 ? t("common.review") : t("common.next")}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};