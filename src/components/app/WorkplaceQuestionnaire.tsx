import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface WorkplaceQuestionnaireProps {
  onComplete: (scores: WorkplaceScores, poeticResponse: string) => void;
  onBack: () => void;
}

export interface WorkplaceScores {
  space: number;         // Espaço
  body: number;          // Corpo
  other: number;         // O Outro
  culture: number;       // Cultura da Empresa
  belonging: number;     // Pertencimento
  responsibility: number; // Auto-responsabilidade
}

// Block IDs for database storage - matching the new table structure
const BLOCK_IDS = ["space", "body", "other", "culture", "belonging", "responsibility"];

const TOTAL_QUESTIONS = 20; // 3+3+3+3+3+5

export const WorkplaceQuestionnaire = ({ onComplete, onBack }: WorkplaceQuestionnaireProps) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [currentBlock, setCurrentBlock] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({
    space: [],
    body: [],
    other: [],
    culture: [],
    belonging: [],
    responsibility: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Get translated questions
  const getQuestions = (blockId: string): string[] => {
    return t(`workplaceQuestions.${blockId}`, { returnObjects: true }) as string[];
  };

  // Block labels
  const blockLabels: Record<string, string> = {
    space: t("workplace.blocks.space"),
    body: t("workplace.blocks.body"),
    other: t("workplace.blocks.other"),
    culture: t("workplace.blocks.culture"),
    belonging: t("workplace.blocks.belonging"),
    responsibility: t("workplace.blocks.responsibility")
  };

  const blockId = BLOCK_IDS[currentBlock];
  const questions = getQuestions(blockId);
  const currentValue = answers[blockId][currentQuestion];
  
  // Calculate progress
  let questionsBefore = 0;
  const questionsPerBlock = [3, 3, 3, 3, 3, 5];
  for (let i = 0; i < currentBlock; i++) {
    questionsBefore += questionsPerBlock[i];
  }
  const currentQuestionIndex = questionsBefore + currentQuestion;
  const progress = ((currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100;

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers };
    newAnswers[blockId][currentQuestion] = parseInt(value);
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentValue === undefined) {
      toast({
        title: t("common.error"),
        description: t("workplace.selectAnswer"),
        variant: "destructive"
      });
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (currentBlock < BLOCK_IDS.length - 1) {
      setCurrentBlock(currentBlock + 1);
      setCurrentQuestion(0);
    } else {
      setShowConfirmation(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else if (currentBlock > 0) {
      const prevBlockQuestions = getQuestions(BLOCK_IDS[currentBlock - 1]);
      setCurrentBlock(currentBlock - 1);
      setCurrentQuestion(prevBlockQuestions.length - 1);
    }
  };

  const calculateScores = (): WorkplaceScores => {
    const scores: WorkplaceScores = { 
      space: 0, 
      body: 0, 
      other: 0, 
      culture: 0, 
      belonging: 0, 
      responsibility: 0 
    };
    
    const questionsPerBlock: Record<string, number> = {
      space: 3,
      body: 3,
      other: 3,
      culture: 3,
      belonging: 3,
      responsibility: 5
    };
    
    for (const id of BLOCK_IDS) {
      const blockAnswers = answers[id];
      const sum = blockAnswers.reduce((a, b) => a + b, 0);
      const maxScore = questionsPerBlock[id] * 5;
      scores[id as keyof WorkplaceScores] = Math.round((sum / maxScore) * 100);
    }
    
    return scores;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: t("common.error"),
          description: t("auth.requiredAuth"),
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const scores = calculateScores();

      // Get AI poetic response - don't block if it fails
      let poeticResponse = "";
      try {
        const { data: aiData, error: aiError } = await supabase.functions.invoke("presence-ai", {
          body: { pillarScores: scores, questionnaireType: "workplace", language: i18n.language }
        });

        if (aiError) {
          console.error("AI error (non-blocking):", aiError);
        } else {
          poeticResponse = aiData?.poeticResponse || "";
        }
      } catch (aiErr) {
        console.error("AI call failed (non-blocking):", aiErr);
      }

      // Save to new workplace_questionnaires table
      const { data: insertedData, error: dbError } = await (supabase as any).from("workplace_questionnaires").insert({
        user_id: user.id,
        // Space
        space_q1: answers.space[0],
        space_q2: answers.space[1],
        space_q3: answers.space[2],
        // Body
        body_q1: answers.body[0],
        body_q2: answers.body[1],
        body_q3: answers.body[2],
        // Other
        other_q1: answers.other[0],
        other_q2: answers.other[1],
        other_q3: answers.other[2],
        // Culture
        culture_q1: answers.culture[0],
        culture_q2: answers.culture[1],
        culture_q3: answers.culture[2],
        // Belonging
        belonging_q1: answers.belonging[0],
        belonging_q2: answers.belonging[1],
        belonging_q3: answers.belonging[2],
        // Responsibility
        responsibility_q1: answers.responsibility[0],
        responsibility_q2: answers.responsibility[1],
        responsibility_q3: answers.responsibility[2],
        responsibility_q4: answers.responsibility[3],
        responsibility_q5: answers.responsibility[4],
        // Scores
        space_score: scores.space,
        body_score: scores.body,
        other_score: scores.other,
        culture_score: scores.culture,
        belonging_score: scores.belonging,
        responsibility_score: scores.responsibility,
        // AI Response
        poetic_response: poeticResponse
      }).select().single();

      if (dbError) {
        console.error("Database error:", dbError);
        throw new Error(t("workplace.saveError"));
      }

      // ALWAYS share with HR for workplace questionnaire
      if (insertedData) {
        const { error: hrError } = await (supabase as any).from("workplace_hr_shared_data").insert({
          user_id: user.id,
          questionnaire_id: insertedData.id,
          space_score: scores.space,
          body_score: scores.body,
          other_score: scores.other,
          culture_score: scores.culture,
          belonging_score: scores.belonging,
          responsibility_score: scores.responsibility,
          poetic_response: poeticResponse
        });

        if (hrError) {
          console.error("HR data error:", hrError);
          toast({
            title: t("common.warning") || "Aviso",
            description: t("workplace.hrShareWarning") || "Questionário salvo, mas houve um problema ao compartilhar com o RH.",
            variant: "destructive"
          });
        }
      }

      // Track engagement
      try {
        await supabase.from("engagement_tracking").insert({
          user_id: user.id,
          activity_type: 'workplace_questionnaire',
          metadata: { questionnaire_type: "workplace" }
        });
      } catch (engErr) {
        console.error("Engagement tracking failed (non-blocking):", engErr);
      }

      onComplete(scores, poeticResponse);
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("common.errorGeneric"),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showConfirmation) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>{t("workplace.confirmTitle")}</CardTitle>
          <CardDescription>
            {t("workplace.confirmDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>{t("workplace.hrNotice")}</strong>
              <p className="mt-1 text-sm">
                {t("workplace.hrNoticeDescription")}
              </p>
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowConfirmation(false)} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("workplace.submitting")}
                </>
              ) : (
                t("workplace.submit")
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
          <span className="text-sm text-muted-foreground">
            MRP-WORKPLACE
          </span>
          <span className="text-sm font-medium text-primary">
            {blockLabels[blockId]}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        
        {/* HR Notice - Always visible during questionnaire */}
        <Alert className="mt-4 border-primary/50 bg-primary/5">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <strong>{t("workplace.hrNoticeShort")}</strong>
          </AlertDescription>
        </Alert>
        
        <CardDescription className="mt-4">
          {t("workplace.questionProgress", { current: currentQuestionIndex + 1, total: TOTAL_QUESTIONS })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-lg font-medium">{questions[currentQuestion]}</p>

        <RadioGroup
          value={currentValue?.toString()}
          onValueChange={handleAnswer}
          className="space-y-3"
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <div key={value} className="flex items-center space-x-3">
              <RadioGroupItem value={value.toString()} id={`q-${value}`} />
              <Label htmlFor={`q-${value}`} className="cursor-pointer flex-1">
                {value === 1 && t("workplace.scale.stronglyDisagree")}
                {value === 2 && t("workplace.scale.disagree")}
                {value === 3 && t("workplace.scale.neutral")}
                {value === 4 && t("workplace.scale.agree")}
                {value === 5 && t("workplace.scale.stronglyAgree")}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={currentQuestionIndex === 0 ? onBack : handlePrevious}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentQuestionIndex === 0 ? t("common.cancel") : t("common.back")}
          </Button>
          <Button onClick={handleNext} className="flex-1">
            {currentBlock === BLOCK_IDS.length - 1 && currentQuestion === questions.length - 1 
              ? t("workplace.review") 
              : t("common.next")}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};