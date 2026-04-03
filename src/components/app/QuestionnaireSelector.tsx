import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plane, Home, Luggage, Building2, ArrowLeft, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

type QuestionnaireType = "before_arrival" | "during_stay" | "departure" | "workplace";

interface QuestionnaireSelectorProps {
  onSelect: (type: QuestionnaireType) => void;
  onBack: () => void;
  canTakeDuringStay: boolean;
  lastDuringStayDate?: string;
}

export const QuestionnaireSelector = ({ 
  onSelect, 
  onBack, 
  canTakeDuringStay,
  lastDuringStayDate 
}: QuestionnaireSelectorProps) => {
  const { t } = useTranslation();

  const personalOptions = [
    {
      type: "before_arrival" as QuestionnaireType,
      title: t("questionnaire.beforeArrival"),
      description: t("questionnaire.beforeArrivalDesc"),
      icon: Plane,
      available: true
    },
    {
      type: "during_stay" as QuestionnaireType,
      title: t("questionnaire.duringStay"),
      description: t("questionnaire.duringStayDesc"),
      icon: Home,
      available: canTakeDuringStay,
      unavailableReason: lastDuringStayDate 
        ? t("questionnaire.availableNextMonth", { date: new Date(lastDuringStayDate).toLocaleDateString() })
        : undefined
    },
    {
      type: "departure" as QuestionnaireType,
      title: t("questionnaire.departure"),
      description: t("questionnaire.departureDesc"),
      icon: Luggage,
      available: true
    }
  ];

  const workplaceOption = {
    type: "workplace" as QuestionnaireType,
    title: t("questionnaire.workplace"),
    description: t("questionnaire.workplaceDesc"),
    icon: Building2,
    available: true
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("common.back")}
        </Button>
      </div>

      <h2 className="text-xl font-bold text-primary text-center mb-2">
        {t("questionnaire.chooseYourMoment")}
      </h2>
      <p className="text-muted-foreground text-center text-sm mb-6">
        {t("questionnaire.selectMatches")}
      </p>

      {/* Personal Journey Questionnaires */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground px-1">
          {t("questionnaire.personalJourney")}
        </h3>
        {personalOptions.map(({ type, title, description, icon: Icon, available, unavailableReason }) => (
          <Card 
            key={type}
            className={`cursor-pointer transition-all ${
              available 
                ? "hover:border-primary hover:shadow-md" 
                : "opacity-60 cursor-not-allowed"
            }`}
            onClick={() => available && onSelect(type)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${available ? "bg-primary/10" : "bg-muted"}`}>
                  <Icon className={`h-5 w-5 ${available ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            {!available && unavailableReason && (
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">{unavailableReason}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Workplace Questionnaire */}
      <div className="space-y-3 mt-6">
        <h3 className="text-sm font-medium text-muted-foreground px-1">
          {t("questionnaire.workplaceSection")}
        </h3>
        
        <Card 
          className="cursor-pointer transition-all hover:border-primary hover:shadow-md border-amber-500/30"
          onClick={() => onSelect(workplaceOption.type)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-500/10">
                <Building2 className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{workplaceOption.title}</CardTitle>
                <CardDescription>{workplaceOption.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Alert className="border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 py-2">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                {t("questionnaire.workplaceHRNotice")}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
