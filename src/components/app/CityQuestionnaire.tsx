import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, MapPin, Clock, Loader2, Wallet, User, Search, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CityQuestionnaireProps {
  onComplete: (questionnaireId: string) => void;
  onBack: () => void;
}

type StayDuration = "up_to_15_days" | "up_to_1_month" | "up_to_3_months";
type PurchasingPower = "economic" | "moderate" | "comfortable" | "premium";
type Generation = "gen_z" | "millennial" | "gen_x" | "boomer";
type Gender = "feminine" | "masculine" | "other";

// Popular Brazilian cities for quick selection
const POPULAR_CITIES = [
  "Rio de Janeiro", "São Paulo", "Florianópolis",
  "Brasília", "Salvador", "Belo Horizonte",
  "Curitiba", "Porto Alegre", "Recife",
  "Fortaleza", "Belém", "Manaus",
  "Goiânia", "Vitória", "Natal",
  "João Pessoa", "Maceió", "Campo Grande",
  "Cuiabá", "São Luís", "Teresina",
  "Campinas", "Santos", "Niterói",
  "Ouro Preto", "Paraty", "Gramado",
];

const JOURNEY_OPTIONS = [
  { value: "acolhimento", emoji: "🌈", labelKey: "cityQ.journey_acolhimento" },
  { value: "estrangeiro", emoji: "🌍", labelKey: "cityQ.journey_estrangeiro" },
  { value: "passagem", emoji: "🎒", labelKey: "cityQ.journey_passagem" },
  { value: "raizes", emoji: "🏠", labelKey: "cityQ.journey_raizes" },
  { value: "nomade", emoji: "💻", labelKey: "cityQ.journey_nomade" },
  { value: "estudar", emoji: "🎓", labelKey: "cityQ.journey_estudar" },
] as const;

const GENERATION_OPTIONS: { value: Generation; labelKey: string; age: string }[] = [
  { value: "gen_z", labelKey: "cityQ.genZ", age: "(18–28)" },
  { value: "millennial", labelKey: "cityQ.millennial", age: "(29–44)" },
  { value: "gen_x", labelKey: "cityQ.genX", age: "(45–60)" },
  { value: "boomer", labelKey: "cityQ.boomer", age: "(60+)" },
];

interface Portal {
  id: string;
  name: string;
  nameKey: string;
  questions: {
    key: string;
    textKey: string;
    minLabelKey: string;
    maxLabelKey: string;
  }[];
}

const PORTALS: Portal[] = [
  {
    id: "other",
    name: "O Outro",
    nameKey: "cityQ.portalOther",
    questions: [
      { key: "other_q1", textKey: "cityQ.other_q1", minLabelKey: "cityQ.other_q1_min", maxLabelKey: "cityQ.other_q1_max" },
      { key: "other_q2", textKey: "cityQ.other_q2", minLabelKey: "cityQ.other_q2_min", maxLabelKey: "cityQ.other_q2_max" },
      { key: "other_q3", textKey: "cityQ.other_q3", minLabelKey: "cityQ.other_q3_min", maxLabelKey: "cityQ.other_q3_max" },
      { key: "other_q4", textKey: "cityQ.other_q4", minLabelKey: "cityQ.other_q4_min", maxLabelKey: "cityQ.other_q4_max" },
    ],
  },
  {
    id: "space",
    name: "Espaço",
    nameKey: "cityQ.portalSpace",
    questions: [
      { key: "space_q1", textKey: "cityQ.space_q1", minLabelKey: "cityQ.space_q1_min", maxLabelKey: "cityQ.space_q1_max" },
      { key: "space_q2", textKey: "cityQ.space_q2", minLabelKey: "cityQ.space_q2_min", maxLabelKey: "cityQ.space_q2_max" },
      { key: "space_q3", textKey: "cityQ.space_q3", minLabelKey: "cityQ.space_q3_min", maxLabelKey: "cityQ.space_q3_max" },
      { key: "space_q4", textKey: "cityQ.space_q4", minLabelKey: "cityQ.space_q4_min", maxLabelKey: "cityQ.space_q4_max" },
    ],
  },
  {
    id: "territory",
    name: "Território",
    nameKey: "cityQ.portalTerritory",
    questions: [
      { key: "territory_q1", textKey: "cityQ.territory_q1", minLabelKey: "cityQ.territory_q1_min", maxLabelKey: "cityQ.territory_q1_max" },
      { key: "territory_q2", textKey: "cityQ.territory_q2", minLabelKey: "cityQ.territory_q2_min", maxLabelKey: "cityQ.territory_q2_max" },
      { key: "territory_q3", textKey: "cityQ.territory_q3", minLabelKey: "cityQ.territory_q3_min", maxLabelKey: "cityQ.territory_q3_max" },
      { key: "territory_q4", textKey: "cityQ.territory_q4", minLabelKey: "cityQ.territory_q4_min", maxLabelKey: "cityQ.territory_q4_max" },
    ],
  },
  {
    id: "identity",
    name: "Identidade",
    nameKey: "cityQ.portalIdentity",
    questions: [
      { key: "identity_q1", textKey: "cityQ.identity_q1", minLabelKey: "cityQ.identity_q1_min", maxLabelKey: "cityQ.identity_q1_max" },
      { key: "identity_q2", textKey: "cityQ.identity_q2", minLabelKey: "cityQ.identity_q2_min", maxLabelKey: "cityQ.identity_q2_max" },
      { key: "identity_q3", textKey: "cityQ.identity_q3", minLabelKey: "cityQ.identity_q3_min", maxLabelKey: "cityQ.identity_q3_max" },
      { key: "identity_q4", textKey: "cityQ.identity_q4", minLabelKey: "cityQ.identity_q4_min", maxLabelKey: "cityQ.identity_q4_max" },
    ],
  },
  {
    id: "body",
    name: "Corpo",
    nameKey: "cityQ.portalBody",
    questions: [
      { key: "body_q1", textKey: "cityQ.body_q1", minLabelKey: "cityQ.body_q1_min", maxLabelKey: "cityQ.body_q1_max" },
      { key: "body_q2", textKey: "cityQ.body_q2", minLabelKey: "cityQ.body_q2_min", maxLabelKey: "cityQ.body_q2_max" },
      { key: "body_q3", textKey: "cityQ.body_q3", minLabelKey: "cityQ.body_q3_min", maxLabelKey: "cityQ.body_q3_max" },
      { key: "body_q4", textKey: "cityQ.body_q4", minLabelKey: "cityQ.body_q4_min", maxLabelKey: "cityQ.body_q4_max" },
    ],
  },
];

// Steps: 0=city, 1=personalization, 2-6=portals, 7=purchasing power, 8=stay duration
const TOTAL_STEPS = 9;

const CITY_TEXTS = {
  pt: {
    title: "Qual cidade do Brasil combina com você?",
    subtitle: "Digite o nome de uma cidade brasileira ou escolha uma das populares",
    searchPlaceholder: "Ex: Salvador, Curitiba, Belém...",
    popular: "Cidades Populares",
    customCity: "Ou digite outra cidade:",
  },
  en: {
    title: "Which Brazilian city matches you?",
    subtitle: "Type a Brazilian city name or pick from the popular ones",
    searchPlaceholder: "Ex: Salvador, Curitiba, Belém...",
    popular: "Popular Cities",
    customCity: "Or type another city:",
  },
  es: {
    title: "¿Qué ciudad de Brasil combina contigo?",
    subtitle: "Escribe el nombre de una ciudad brasileña o elige una de las populares",
    searchPlaceholder: "Ej: Salvador, Curitiba, Belém...",
    popular: "Ciudades Populares",
    customCity: "O escribe otra ciudad:",
  },
};

export const CityQuestionnaire = ({ onComplete, onBack }: CityQuestionnaireProps) => {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language?.substring(0, 2) || "pt") as "pt" | "en" | "es";
  const cityTexts = CITY_TEXTS[lang] || CITY_TEXTS.pt;
  
  const [step, setStep] = useState(0);
  const [city, setCity] = useState<string>("");
  const [citySearch, setCitySearch] = useState("");
  const [stayDuration, setStayDuration] = useState<StayDuration | null>(null);
  const [purchasingPower, setPurchasingPower] = useState<PurchasingPower | null>(null);
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [journeyIdentities, setJourneyIdentities] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleJourney = (value: string) => {
    setJourneyIdentities(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const handleAnswer = (key: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const filteredCities = citySearch.trim()
    ? POPULAR_CITIES.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()))
    : POPULAR_CITIES;

  const canProceed = () => {
    if (step === 0) return city.trim().length > 0;
    if (step === 1) return generation !== null && gender !== null && journeyIdentities.length > 0;
    if (step >= 2 && step <= 6) {
      const portal = PORTALS[step - 2];
      return portal.questions.every((q) => answers[q.key] !== undefined);
    }
    if (step === 7) return purchasingPower !== null;
    if (step === 8) return stayDuration !== null;
    return false;
  };

  const handleSubmit = async () => {
    if (!city || !stayDuration || !purchasingPower) return;
    setIsSubmitting(true);

    try {
      let { data: { user } } = await supabase.auth.getUser();
      
      // Auto sign-in anonymously if no session (same as gems flow)
      if (!user) {
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
        if (anonError) {
          console.error('Anonymous sign-in error:', anonError);
          toast.error("Erro de autenticação. Tente novamente.");
          setIsSubmitting(false);
          return;
        }
        user = anonData.user;
      }
      
      if (!user) {
        toast.error("Não foi possível autenticar. Tente novamente.");
        setIsSubmitting(false);
        return;
      }

      const insertData: any = {
        user_id: user.id,
        city,
        stay_duration: stayDuration,
        generation,
        gender,
        journey_identities: journeyIdentities,
        other_q1: answers.other_q1 || 3,
        other_q2: answers.other_q2 || 3,
        other_q3: answers.other_q3 || 3,
        other_q4: answers.other_q4 || 3,
        space_q1: answers.space_q1 || 3,
        space_q2: answers.space_q2 || 3,
        space_q3: answers.space_q3 || 3,
        space_q4: answers.space_q4 || 3,
        territory_q1: answers.territory_q1 || 3,
        territory_q2: answers.territory_q2 || 3,
        territory_q3: answers.territory_q3 || 3,
        territory_q4: answers.territory_q4 || 3,
        identity_q1: answers.identity_q1 || 3,
        identity_q2: answers.identity_q2 || 3,
        identity_q3: answers.identity_q3 || 3,
        identity_q4: answers.identity_q4 || 3,
        body_q1: answers.body_q1 || 3,
        body_q2: answers.body_q2 || 3,
        body_q3: answers.body_q3 || 3,
        body_q4: answers.body_q4 || 3,
        purchasing_power: purchasingPower,
      };

      const { data, error } = await supabase
        .from("city_questionnaires")
        .insert(insertData)
        .select("id")
        .single();

      if (error) throw error;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("engagement_tracking").insert({
            user_id: user.id,
            activity_type: "city_questionnaire",
          });
        }
      } catch {}

      toast.success(t("cityQ.submitted"));
      onComplete(data.id);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error submitting questionnaire");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercent = Math.round((step / (TOTAL_STEPS - 1)) * 100);

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto p-6 space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{t("cityQ.step")} {step + 1}/{TOTAL_STEPS}</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Step 0: City Selection — worldwide */}
      {step === 0 && (
        <div className="space-y-5">
          <div className="text-center space-y-2">
            <Globe className="h-10 w-10 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-primary">{cityTexts.title}</h2>
            <p className="text-muted-foreground text-sm">{cityTexts.subtitle}</p>
          </div>

          {/* Custom city input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={cityTexts.searchPlaceholder}
              value={city || citySearch}
              onChange={(e) => {
                const val = e.target.value;
                setCity(val);
                setCitySearch(val);
              }}
              className="pl-10 py-5 text-base"
            />
          </div>

          {/* Popular cities grid */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{cityTexts.popular}</p>
            <div className="flex flex-wrap gap-2 max-h-[280px] overflow-y-auto">
              {filteredCities.map((c) => (
                <button
                  key={c}
                  onClick={() => { setCity(c); setCitySearch(""); }}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    city === c
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-card border-border hover:border-primary/50 text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {city && !POPULAR_CITIES.includes(city) && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
              <p className="text-sm text-primary font-medium">🌍 {city}</p>
            </div>
          )}
        </div>
      )}

      {/* Step 1: Personalization */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <User className="h-10 w-10 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-primary">{t("cityQ.personalization")}</h2>
            <p className="text-muted-foreground">{t("cityQ.personalizationDesc")}</p>
          </div>

          {/* Generation */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">{t("cityQ.generationLabel")}</h3>
            <RadioGroup value={generation || ""} onValueChange={(v) => setGeneration(v as Generation)} className="space-y-2">
              {GENERATION_OPTIONS.map((opt) => (
                <Card
                  key={opt.value}
                  className={`cursor-pointer transition-all ${generation === opt.value ? "border-primary bg-primary/5" : "hover:border-primary/30"}`}
                  onClick={() => setGeneration(opt.value)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <RadioGroupItem value={opt.value} id={`gen-${opt.value}`} />
                    <Label htmlFor={`gen-${opt.value}`} className="cursor-pointer font-medium">
                      {t(opt.labelKey)} <span className="text-muted-foreground text-sm">{opt.age}</span>
                    </Label>
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
          </div>

          {/* Gender */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">{t("cityQ.genderLabel")}</h3>
            <RadioGroup value={gender || ""} onValueChange={(v) => setGender(v as Gender)} className="space-y-2">
              {[
                { value: "feminine" as Gender, labelKey: "cityQ.genderFeminine" },
                { value: "masculine" as Gender, labelKey: "cityQ.genderMasculine" },
                { value: "other" as Gender, labelKey: "cityQ.genderOther" },
              ].map((opt) => (
                <Card
                  key={opt.value}
                  className={`cursor-pointer transition-all ${gender === opt.value ? "border-primary bg-primary/5" : "hover:border-primary/30"}`}
                  onClick={() => setGender(opt.value)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <RadioGroupItem value={opt.value} id={`gender-${opt.value}`} />
                    <Label htmlFor={`gender-${opt.value}`} className="cursor-pointer font-medium">
                      {t(opt.labelKey)}
                    </Label>
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
          </div>

          {/* Journey Identity (multi-select) */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">{t("cityQ.journeyLabel")}</h3>
            <p className="text-sm text-muted-foreground">{t("cityQ.journeyMultiSelect")}</p>
            <div className="space-y-2">
              {JOURNEY_OPTIONS.map((opt) => (
                <Card
                  key={opt.value}
                  className={`cursor-pointer transition-all ${journeyIdentities.includes(opt.value) ? "border-primary bg-primary/5" : "hover:border-primary/30"}`}
                  onClick={() => toggleJourney(opt.value)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <Checkbox
                      checked={journeyIdentities.includes(opt.value)}
                      onCheckedChange={() => toggleJourney(opt.value)}
                    />
                    <span className="text-lg">{opt.emoji}</span>
                    <span className="font-medium text-sm">{t(opt.labelKey)}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Steps 2-6: Portal Questions */}
      {step >= 2 && step <= 6 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium uppercase tracking-widest text-primary/80">
              {t("cityQ.portal")} {step - 1}/5
            </p>
            <h2 className="text-2xl font-bold text-primary">
              {t(PORTALS[step - 2].nameKey)}
            </h2>
          </div>
          <div className="space-y-8">
            {PORTALS[step - 2].questions.map((q, idx) => (
              <div key={q.key} className="flex flex-col items-center space-y-4 animate-fade-in">
                <p className="text-center font-medium text-foreground text-lg leading-snug">
                  {((step - 2) * 4) + idx + 1}. {t(q.textKey)}
                </p>
                <div className="w-full max-w-sm">
                  <div className="flex justify-between items-center mb-3 px-1">
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider max-w-[40%]">{t(q.minLabelKey)}</span>
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider max-w-[40%] text-right">{t(q.maxLabelKey)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleAnswer(q.key, num)}
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 transition-all duration-300 font-serif text-xl font-bold
                          focus:outline-none focus:ring-4 focus:ring-primary/30
                          ${answers[q.key] === num
                            ? "bg-primary border-primary text-primary-foreground scale-110 shadow-lg"
                            : "border-muted-foreground/20 text-muted-foreground hover:bg-primary/10 hover:border-primary/50"
                          }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 7: Purchasing Power */}
      {step === 7 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <Wallet className="h-10 w-10 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-primary">{t("cityQ.purchasingPower")}</h2>
            <p className="text-muted-foreground">{t("cityQ.purchasingPowerDesc")}</p>
          </div>
          <RadioGroup
            value={purchasingPower || ""}
            onValueChange={(v) => setPurchasingPower(v as PurchasingPower)}
            className="space-y-3"
          >
            {[
              { value: "economic" as PurchasingPower, labelKey: "cityQ.powerEconomic" },
              { value: "moderate" as PurchasingPower, labelKey: "cityQ.powerModerate" },
              { value: "comfortable" as PurchasingPower, labelKey: "cityQ.powerComfortable" },
              { value: "premium" as PurchasingPower, labelKey: "cityQ.powerPremium" },
            ].map((opt) => (
              <Card
                key={opt.value}
                className={`cursor-pointer transition-all ${purchasingPower === opt.value ? "border-primary bg-primary/5" : "hover:border-primary/30"}`}
                onClick={() => setPurchasingPower(opt.value)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <RadioGroupItem value={opt.value} id={`pp-${opt.value}`} />
                  <Label htmlFor={`pp-${opt.value}`} className="cursor-pointer font-medium text-base">
                    {t(opt.labelKey)}
                  </Label>
                </CardContent>
              </Card>
            ))}
          </RadioGroup>
        </div>
      )}

      {/* Step 8: Stay Duration */}
      {step === 8 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <Clock className="h-10 w-10 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-primary">{t("cityQ.stayDuration")}</h2>
            <p className="text-muted-foreground">{t("cityQ.stayDurationDesc")}</p>
          </div>
          <RadioGroup
            value={stayDuration || ""}
            onValueChange={(v) => setStayDuration(v as StayDuration)}
            className="space-y-3"
          >
            {[
              { value: "up_to_15_days" as StayDuration, labelKey: "cityQ.stay15days" },
              { value: "up_to_1_month" as StayDuration, labelKey: "cityQ.stay1month" },
              { value: "up_to_3_months" as StayDuration, labelKey: "cityQ.stay3months" },
            ].map((opt) => (
              <Card
                key={opt.value}
                className={`cursor-pointer transition-all ${stayDuration === opt.value ? "border-primary bg-primary/5" : "hover:border-primary/30"}`}
                onClick={() => setStayDuration(opt.value)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <RadioGroupItem value={opt.value} id={opt.value} />
                  <Label htmlFor={opt.value} className="cursor-pointer font-medium text-base">
                    {t(opt.labelKey)}
                  </Label>
                </CardContent>
              </Card>
            ))}
          </RadioGroup>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={() => (step === 0 ? onBack() : setStep(step - 1))}
          className="flex-1"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("common.back")}
        </Button>

        {step < TOTAL_STEPS - 1 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="flex-1"
          >
            {t("common.next")}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed() || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t("cityQ.generateMap")}
          </Button>
        )}
      </div>
    </div>
  );
};
