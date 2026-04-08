import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Language, TRANSLATIONS, RefugeResult } from "@/types/housing";
import { generateChatResponse, generateFinalRefuge, resetHousingSession } from "@/services/housingAiService";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/app/components/AuthModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Home, Send, Loader2, MapPin, RotateCcw, MessageCircle, ArrowLeft, LogIn, Key } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { openApplePurchase as openCheckout } from "@/lib/appleIAP";

type City = "rio" | "florianopolis" | "sao-paulo";

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
  pillar?: string;
}

const CITIES: Record<City, { label: string; emoji: string }> = {
  rio: { label: "Rio de Janeiro", emoji: "🏖️" },
  florianopolis: { label: "Florianópolis", emoji: "🌊" },
  "sao-paulo": { label: "São Paulo", emoji: "🏙️" },
};

const LOGIN_TEXTS = {
  pt: {
    title: "Seu Dossiê de Moradia está pronto! 🔑",
    desc: "Entre para desbloquear os bairros recomendados e falar com nossos curadores imobiliários.",
    loginBtn: "Entrar com E-mail",
  },
  en: {
    title: "Your Housing Dossier is ready! 🔑",
    desc: "Sign in to unlock recommended neighborhoods and talk to our real estate curators.",
    loginBtn: "Sign in with Email",
  },
  es: {
    title: "¡Tu Dosier de Vivienda está listo! 🔑",
    desc: "Inicia sesión para desbloquear los barrios recomendados y hablar con nuestros curadores inmobiliarios.",
    loginBtn: "Iniciar sesión con E-mail",
  },
};

const HOUSING_STORAGE_KEY = "feltrip_housing_result";

const saveHousingResult = (data: { result: RefugeResult; city: City }) => {
  try {
    localStorage.setItem(HOUSING_STORAGE_KEY, JSON.stringify(data));
  } catch { }
};

const loadHousingResult = (): { result: RefugeResult; city: City } | null => {
  try {
    const raw = localStorage.getItem(HOUSING_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const clearHousingResult = () => {
  try {
    localStorage.removeItem(HOUSING_STORAGE_KEY);
  } catch { }
};

const trackHousingCompletion = async (result: RefugeResult, city: City, answers: Record<string, string>) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).single();

    const clientName = profile?.full_name || "Visitante Curioso";
    const cityLabel = CITIES[city]?.label || city;

    const { error: hrError } = await supabase.from("housing_responses").insert([
      {
        user_id: user.id,
        client_name: clientName,
        city: cityLabel,
        answer_territorio: answers.territorio || null,
        answer_espaco: answers.espaco || null,
        answer_corpo: answers.corpo || null,
        answer_outro: answers.outro || null,
        answer_identidade: answers.identidade || null,
        analise_poetica: result.analisePoetica || null,
        perfil_resumido: result.perfilResumido || null,
        pilar_corpo: result.pilares?.corpo || null,
        pilar_territorio: result.pilares?.territorio || null,
        pilar_outro: result.pilares?.outro || null,
        pilar_espaco: result.pilares?.espaco || null,
        pilar_identidade: result.pilares?.identidade || null,
        bairros_sugeridos: JSON.parse(JSON.stringify(result.sugestoes || [])),
        fechamento: result.fechamento || null,
      },
    ]);

    if (hrError) {
      console.error("Error saving housing response:", hrError);
    }

    await supabase.from("engagement_tracking").insert({
      user_id: user.id,
      activity_type: "housing_complete",
      metadata: {
        city: cityLabel,
        neighborhoods: result.sugestoes?.map((s) => s.bairro).join(", ") || "",
        profile_summary: result.perfilResumido || "",
        poetic_analysis: result.analisePoetica || "",
      },
    });
  } catch (err) {
    console.error("Error tracking housing:", err);
  }
};

const HousingTab = () => {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language?.substring(0, 2) || "pt") as Language;
  const localT = TRANSLATIONS[lang] || TRANSLATIONS.pt;
  const lt = LOGIN_TEXTS[lang as keyof typeof LOGIN_TEXTS] || LOGIN_TEXTS.pt;
  const QUESTIONS = localT.questions;

  const { user } = useAuth();
  const isAnonymous = !user || (user as any).is_anonymous === true || !user.email;

  const [hasUsedFreeHousing, setHasUsedFreeHousing] = useState(false);
  const [checkingUsage, setCheckingUsage] = useState(true);

  useEffect(() => {
    const checkUsage = async () => {
      if (!user || isAnonymous) {
        setCheckingUsage(false);
        return;
      }
      const { data } = await supabase
        .from("housing_responses")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
      setHasUsedFreeHousing(!!(data && data.length > 0));
      setCheckingUsage(false);
    };
    checkUsage();
  }, [user, isAnonymous]);

  const [isPremiumHousing, setIsPremiumHousing] = useState(false);
  useEffect(() => {
    const checkTier = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("user_tier")
        .eq("user_id", user.id)
        .single();
      if (data) {
        const tier = data.user_tier;
        setIsPremiumHousing(tier === "explorer" || tier === "premium_company" || tier === "premium_company_plus_language");
      }
    };
    checkTier();
  }, [user]);

  const housingBlocked = !isPremiumHousing && hasUsedFreeHousing && !checkingUsage;

  const [phase, setPhase] = useState<"welcome" | "city" | "chat" | "loading" | "result">(() => {
    const saved = loadHousingResult();
    return saved ? "result" : "welcome";
  });
  const [selectedCity, setSelectedCity] = useState<City | null>(() => {
    const saved = loadHousingResult();
    return saved ? saved.city : null;
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [result, setResult] = useState<RefugeResult | null>(() => {
    const saved = loadHousingResult();
    return saved ? saved.result : null;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);

  const citySelectLabel = lang === "en" ? "Choose your city" : lang === "es" ? "Elige tu ciudad" : "Escolha sua cidade";

  const handleStart = () => {
    setPhase("city");
  };

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    const currentQuestion = QUESTIONS[0];
    setMessages([
      {
        role: "assistant",
        content: currentQuestion.question,
        pillar: currentQuestion.pillar,
      },
    ]);
    setPhase("chat");
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const currentQuestion = QUESTIONS[currentQuestionIndex];
    const userMessage = inputValue.trim();

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInputValue("");
    setIsTyping(true);

    const newAnswers = { ...answers, [currentQuestion.id]: userMessage };
    setAnswers(newAnswers);

    const acknowledgment = await generateChatResponse(
      currentQuestion.pillar,
      userMessage,
      lang,
      selectedCity || undefined,
    );

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      const nextQuestion = QUESTIONS[currentQuestionIndex + 1];
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: acknowledgment },
        { role: "assistant", content: nextQuestion.question, pillar: nextQuestion.pillar },
      ]);
      setCurrentQuestionIndex((i) => i + 1);
      setIsTyping(false);
    } else {
      setMessages((prev) => [...prev, { role: "assistant", content: acknowledgment }]);
      setIsTyping(false);
      setPhase("loading");

      const generatedResult = await generateFinalRefuge(newAnswers, lang, selectedCity || undefined);
      setResult(generatedResult);
      if (selectedCity) {
        saveHousingResult({ result: generatedResult, city: selectedCity });
        trackHousingCompletion(generatedResult, selectedCity, newAnswers);
      }
      setPhase("result");
    }
  };

  const handleReset = () => {
    setPhase("welcome");
    setSelectedCity(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setMessages([]);
    setInputValue("");
    setResult(null);
    clearHousingResult();
    resetHousingSession();
  };

  const getWaLink = (bairro: string) => {
    const cityName = selectedCity ? CITIES[selectedCity].label : "";
    const text =
      lang === "en"
        ? `Hi! I mapped my profile with Cult AI and I am a '${result?.perfilResumido}'. I would like to explore properties in the ${bairro} neighborhood, ${cityName}.`
        : lang === "es"
          ? `¡Hola! Mapeé mi perfil con Cult AI y soy un '${result?.perfilResumido}'. Me gustaría explorar propiedades en el barrio ${bairro}, ${cityName}.`
          : `Olá! Fiz o mapeamento da Cult AI e meu perfil é '${result?.perfilResumido}'. Gostaria de explorar imóveis no bairro ${bairro} em ${cityName}.`;
    return `https://wa.me/message/BG24GCPKNF6KG1?text=${encodeURIComponent(text)}`;
  };

  const progress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100;

  const BackButton = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      className="absolute top-4 left-4 p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground z-10"
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
  );

  const handleBackFromChat = () => {
    setPhase("city");
    setCurrentQuestionIndex(0);
    setAnswers({});
    setMessages([]);
    setInputValue("");
  };

  if (checkingUsage) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (housingBlocked) {
    return (
      <div className="relative flex flex-col items-center justify-center h-full px-6 py-12 text-center gap-8 bg-background">
        <BackButton onClick={() => window.dispatchEvent(new CustomEvent("navigate-tab", { detail: "presence" }))} />
        <div className="w-24 h-24 rounded-3xl bg-muted/30 border border-border flex items-center justify-center shadow-inner">
          <Home className="w-12 h-12 text-muted-foreground" />
        </div>
        <div className="space-y-4 max-w-md">
          <h2 className="text-2xl font-bold text-foreground font-serif leading-tight">
            {t('housing.alreadyUsedTitle')}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('housing.upgradeDesc')}
          </p>
        </div>
        <Button
          onClick={() => openCheckout("explorer")}
          className="rounded-full px-10 py-6 text-sm font-bold tracking-widest uppercase shadow-xl hover:scale-105 transition-all"
        >
          {t('housing.unlockImmersion')}
        </Button>
      </div>
    );
  }

  if (phase === "welcome") {
    return (
      <div className="relative flex flex-col items-center justify-center h-full px-6 py-12 text-center gap-8 bg-background">
        <BackButton onClick={() => window.dispatchEvent(new CustomEvent("navigate-tab", { detail: "presence" }))} />
        <div className="w-24 h-24 rounded-3xl bg-primary/5 border border-primary/20 flex items-center justify-center shadow-inner">
          <Key className="w-12 h-12 text-primary/80" />
        </div>
        <div className="space-y-4 max-w-md">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-serif leading-tight">
            {t('housing.title')}
            <br />
            <span className="text-primary italic">{t('housing.subtitle')}</span>
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('housing.description')}
          </p>
        </div>
        <Button
          onClick={handleStart}
          className="rounded-full px-10 py-6 text-sm font-bold tracking-widest uppercase shadow-xl hover:scale-105 transition-all"
        >
          {t('housing.startButton')}
        </Button>
      </div>
    );
  }

  if (phase === "city") {
    return (
      <div className="relative flex flex-col items-center justify-center h-full px-6 py-12 text-center gap-8 bg-background">
        <BackButton onClick={() => setPhase("welcome")} />
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <MapPin className="w-8 h-8 text-primary/60" />
        </div>
        <h3 className="text-2xl font-bold text-foreground font-serif">{citySelectLabel}</h3>
        <div className="grid gap-3 w-full max-w-xs">
          {(Object.entries(CITIES) as [City, { label: string; emoji: string }][]).map(([key, { label, emoji }]) => (
            <Button
              key={key}
              variant="outline"
              className="h-16 text-lg gap-4 rounded-xl transition-all hover:border-primary/50 hover:bg-primary/5 shadow-sm"
              onClick={() => handleCitySelect(key)}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="font-semibold tracking-wide">{label}</span>
            </Button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 gap-6 bg-background">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-base text-primary font-serif italic animate-pulse">
          {t('housing.loadingDossier')}
        </p>
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <ScrollArea className="h-full bg-muted/10">
        <div className="px-4 sm:px-6 py-10 space-y-10 max-w-3xl mx-auto relative">
          <BackButton onClick={handleReset} />

          <div className="text-center space-y-4 pt-4">
            <div className="inline-block bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] mb-2">
              {t('housing.dossierBadge')}
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold font-serif text-foreground leading-tight">
              {result.perfilResumido}
            </h2>
            {selectedCity && (
              <p className="text-base text-muted-foreground font-medium flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4" /> {CITIES[selectedCity].label}
              </p>
            )}
          </div>

          <div className="bg-card border-l-4 border-primary p-6 sm:p-8 rounded-r-2xl shadow-sm">
            <p className="text-base sm:text-lg text-foreground/80 leading-relaxed font-serif italic">
              "{result.analisePoetica}"
            </p>
          </div>

          <Separator className="bg-primary/10" />

          <div className="relative">
            <div
              className={isAnonymous ? "blur-[10px] select-none pointer-events-none transition-all duration-500" : ""}
            >
              <div className="space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-center text-muted-foreground">
                  {t('housing.idealRefuges')}
                </h3>

                <div className="grid gap-6">
                  {result.sugestoes.map((s, i) => (
                    <div
                      key={i}
                      className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                    >
                      <div className="p-6 sm:p-8 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <h4 className="font-bold text-foreground font-serif text-2xl sm:text-3xl">{s.bairro}</h4>
                          <span className="text-[10px] uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full font-bold w-fit">
                            {s.vibe}
                          </span>
                        </div>
                        <p className="text-base text-muted-foreground leading-relaxed">{s.descricaoVibe}</p>

                        <div className="pt-4 border-t border-border/40 mt-4">
                          <Button
                            className="w-full bg-foreground hover:bg-foreground/90 text-background font-bold uppercase tracking-widest text-[10px] sm:text-xs rounded-xl py-6 shadow-md transition-all"
                            onClick={() => window.open(getWaLink(s.bairro), "_blank")}
                          >
                            <Home className="w-4 h-4 mr-2" />
                            {t('housing.talkToCurator')} {s.bairro}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-12 text-center">
                <p className="text-sm text-muted-foreground italic font-serif">"{result.fechamento}"</p>
              </div>
            </div>

            {isAnonymous && (
              <div className="absolute inset-0 flex items-start justify-center pt-10 z-20">
                <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl text-center max-w-sm mx-4 w-full space-y-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Key className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-serif font-bold text-foreground leading-tight">{lt.title}</h3>
                    <p className="text-sm text-muted-foreground">{lt.desc}</p>
                  </div>
                  <div className="space-y-3 pt-4">
                    <Button
                      onClick={() => setShowAuthModal(true)}
                      variant="outline"
                      className="w-full gap-2 py-6 rounded-xl font-bold uppercase tracking-widest text-xs"
                    >
                      <LogIn className="h-4 w-4" />
                      {lt.loginBtn}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isAnonymous && (
            <div className="text-center pb-8 pt-4">
              <Button
                variant="ghost"
                onClick={handleReset}
                className="gap-2 text-muted-foreground hover:text-foreground uppercase tracking-widest text-[10px] font-bold"
              >
                <RotateCcw className="w-4 h-4" />
                {t('housing.redo')}
              </Button>
            </div>
          )}
        </div>

        <AuthModal
          isOpen={showAuthModal}
          lang={(lang as "pt" | "en" | "es") || "pt"}
          onClose={() => setShowAuthModal(false)}
        />
      </ScrollArea>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-4 pt-4 pb-2 space-y-3 bg-background border-b border-border/50 shadow-sm">
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
          <button
            onClick={handleBackFromChat}
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="flex-1">
            {t('cultChat.pillar')} {currentQuestionIndex + 1} {t('cultChat.of')} {QUESTIONS.length}
          </span>
          <span className="text-primary bg-primary/10 px-3 py-1 rounded-full">
            {QUESTIONS[currentQuestionIndex]?.pillar}
          </span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 bg-muted/5">
        <div className="space-y-6 py-6 max-w-2xl mx-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm sm:text-base leading-relaxed shadow-sm ${msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-card border border-border text-foreground rounded-bl-none"
                  }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl rounded-bl-none px-5 py-4 shadow-sm">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-background shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-safe">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-3 max-w-2xl mx-auto relative"
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={localT.inputPlaceholder}
            disabled={isTyping}
            className="flex-1 rounded-full h-14 px-6 text-sm bg-muted/50 border-border focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || isTyping}
            className="rounded-full h-14 w-14 shrink-0 shadow-md hover:scale-105 transition-transform"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default HousingTab;