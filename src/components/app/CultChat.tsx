import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { City, Message, PortalType, FlowState, MRPData, Language, SavedSession, Gem, DiagnosisQuestion } from "./types";
import {
  CONTENT,
  getSystemInstruction,
  getGemContextInstruction,
  PORTAL_QUESTIONS,
  LOADING_PHRASES,
} from "./constants";
import { startChatSession, sendMessageToGemini } from "./services/geminiService";
import { parseCultRoteiro } from "./services/parseCultRoteiro";
import { saveMRPSession, saveGem, getUserHistory } from "./services/supabaseClient";
import { Bubble } from "./components/Bubble";
import { CityButton } from "./components/CityButton";
import { ScaleQuestion } from "./components/ScaleQuestion";
import { ArchetypeResultCard } from "./components/ArchetypeResultCard";
import { AuthModal } from "./components/AuthModal";
import PricingPaywall from "./components/PricingPaywall";
import { ArchetypeShareCard } from "./components/ArchetypeShareCard";
import { openApplePurchase as openCheckout } from "@/lib/appleIAP";
import { useAuth } from "@/hooks/useAuth";
import { useUserTier } from "@/hooks/useUserTier";
import { useTranslation } from "react-i18next";
import { Send, Share2, MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CultCharacter } from "./CultCharacter";
import { HookScreen } from "./HookScreen";
import { SplashScreen } from "./SplashScreen";

const parseCoord = (val: any) => {
  if (val === undefined || val === null || val === "") return 0;
  const num = parseFloat(
    String(val)
      .replace(",", ".")
      .replace(/[^\d.-]/g, ""),
  );
  return isNaN(num) ? 0 : num;
};

const normalizeGems = (rawGems: any[]): Gem[] => {
  if (!Array.isArray(rawGems)) return [];
  return rawGems
    .filter((raw: any) => {
      // Filtra gemas sem nome real — evita cards "Nova Descoberta" vazios
      const g: any = {};
      for (const key in raw) {
        if (raw.hasOwnProperty(key)) g[key.toLowerCase()] = raw[key];
      }
      const name = g.name || g.nome_local || g.nome || g.title || g.local || "";
      return String(name).trim().length > 0;
    })
    .map((raw: any) => {
      const g: any = {};
      for (const key in raw) {
        if (raw.hasOwnProperty(key)) {
          g[key.toLowerCase()] = raw[key];
        }
      }

      const rawDay = Number(g.day || g.dia || 1);
      const rawShift = String(g.shift || g.turno || g.periodo || "")
        .trim()
        .toLowerCase();

      return {
        ...raw,
        day: Number.isFinite(rawDay) && rawDay > 0 ? rawDay : 1,
        shift:
          rawShift === "manha" || rawShift === "manhã"
            ? "morning"
            : rawShift === "tarde"
              ? "afternoon"
              : rawShift === "noite"
                ? "night"
                : rawShift,
        name: String(g.name || g.nome_local || g.nome || g.title || g.local),
        description: String(g.description || g.vibe_curta || g.descricao || g.desc || g.vibe || ""),
        address: String(g.address || g.endereco || g.localizacao || ""),
        dia: String(g.dia || g.data_evento || g.data || ""),
        horario: String(g.horario || g.hora || ""),
        lat: parseCoord(g.lat || g.latitude),
        lng: parseCoord(g.lng || g.longitude || g.lon),
        pin_color: g.pin_color || "teal",
        is_gem: true,
      };
    });
};

const FREE_DAYS_LIMIT = 1;
const PRO_DAYS_LIMIT = 7;

const getDaysLimit = (isFree: boolean) => (isFree ? FREE_DAYS_LIMIT : PRO_DAYS_LIMIT);

const extractRequestedDays = (value: string, fallback: number) => {
  const match = value.match(/\d+/);
  const parsed = match ? parseInt(match[0], 10) : fallback;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getEffectiveRequestedDays = (value: string, isFree: boolean) => {
  const limit = getDaysLimit(isFree);
  return Math.min(extractRequestedDays(value, limit), limit);
};

const groupGemsByDay = (gems: Gem[], fallbackStartDay = 1) => {
  const grouped: Record<number, Gem[]> = {};

  (Array.isArray(gems) ? gems : []).forEach((gem, index) => {
    const rawDay = Number((gem as any)?.day);
    const day = Number.isFinite(rawDay) && rawDay > 0 ? rawDay : fallbackStartDay + Math.floor(index / 3);
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(gem);
  });

  return Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b)
    .map((day) => ({ day, gems: grouped[day] }));
};

const createPremiumLockMessage = (id: string, title: string, timestamp: number): Message => ({
  id,
  role: "model",
  text: "",
  isPremiumLock: true,
  lockTitle: title,
  lockDescription: "Exclusivo Pro: Descubra a cilada a evitar e a viagem curta ideal. Assine agora.",
  timestamp,
});

interface CultChatProps {
  embedded?: boolean;
  initialFlow?: FlowState;
}

export default function App({ embedded = false, initialFlow = "city_selection" }: CultChatProps) {
  const { user } = useAuth();
  const { isPremium, isFree } = useUserTier();
  const { t, i18n } = useTranslation();

  const mapI18nLang = (lng: string): Language => {
    const mapped = lng?.substring(0, 2) as Language;
    return ["pt", "en", "es", "fr", "zh"].includes(mapped) ? mapped : "pt";
  };
  const [language, setLanguage] = useState<Language>(mapI18nLang(i18n.language));

  // Splash + Hook state
  const [showSplash, setShowSplash] = useState(!embedded && !sessionStorage.getItem("cult_splash_shown"));
  const [showHook, setShowHook] = useState(false);

  const [flowState, setFlowState] = useState<FlowState | "unified_quiz">(initialFlow as any);
  const [quizIndex, setQuizIndex] = useState(0);
  const [daysText, setDaysText] = useState("");
  const [needsText, setNeedsText] = useState("");
  const [rawScores, setRawScores] = useState<Record<string, number>>({});

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState(
    LOADING_PHRASES[language] ? LOADING_PHRASES[language][0] : "Carregando...",
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [freeAlreadyUsed, setFreeAlreadyUsed] = useState(false);
  const [daysLimitMessage, setDaysLimitMessage] = useState<string | null>(null);

  // Ciclos de 7 dias
  const [currentCycle, setCurrentCycle] = useState(1); // ciclo atual (1 = dias 1-7, 2 = dias 8-14, etc.)
  const [allCycleGems, setAllCycleGems] = useState<Gem[][]>([]); // gemas agrupadas por ciclo
  const [cycleLoading, setCycleLoading] = useState(false);

  const [calculatedMRP, setCalculatedMRP] = useState<MRPData | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [showArchetypeShare, setShowArchetypeShare] = useState(false);
  const [gemsUnlocked, setGemsUnlocked] = useState(false);

  const isAnonymous = !!user && ((user as any).is_anonymous === true || !user.email);

  // FREE: Verifica se o usuário já usou seu roteiro gratuito (lifetime)
  useEffect(() => {
    if (!user || !isFree) return;
    const checkExistingSession = async () => {
      const { count } = await supabase
        .from("mrp_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (count && count > 0) {
        setFreeAlreadyUsed(true);
      }
    };
    checkExistingSession();
  }, [user, isFree]);

  // Escuta o evento de compartilhar disparado pelo componente MRPChart
  useEffect(() => {
    const handleOpenShare = () => setShowArchetypeShare(true);
    window.addEventListener("open-share-modal", handleOpenShare);
    return () => window.removeEventListener("open-share-modal", handleOpenShare);
  }, []);

  // POST-LOGIN: When user transitions from anonymous to authenticated, reveal the gems
  useEffect(() => {
    if (!isAnonymous && user?.email && allCycleGems.length > 0 && calculatedMRP && flowState === "diagnosis_result") {
      const hasLoginGate = messages.some((m) => m.isLoginGate);
      if (!hasLoginGate) return;

      const archetypeMessages = messages.filter((m) => !m.isLoginGate);
      const allGems = allCycleGems.flat();
      const groupedDays = groupGemsByDay(allGems);

      let ts = Date.now() + 10;
      const gemMessages: Message[] = [];
      for (const { day, gems } of groupedDays) {
        gemMessages.push({ id: `day-header-${day}-${ts}`, role: "model", text: `### 🗓️ Dia ${day}`, timestamp: ts++ });
        gemMessages.push({ id: `gems-day-${day}-${ts}`, role: "model", text: "", isGem: true, gems, timestamp: ts++ });
      }

      if (isFree) {
        gemMessages.push(createPremiumLockMessage(`cilada-lock-${ts}`, "⚠️ A Cilada — Evite Isso", ts++));
        gemMessages.push(createPremiumLockMessage(`daytrip-lock-${ts}`, "🎒 Viagem Curta", ts++));
      }

      setMessages([...archetypeMessages, ...gemMessages]);
      setFreeAlreadyUsed(true);

      // Persist to backend
      (async () => {
        try {
          const savedSession = await saveMRPSession({
            scores: calculatedMRP.scores,
            emotionalStatus: calculatedMRP.emotionalStatus,
            poeticProposition: calculatedMRP.poeticProposition,
            city: selectedCity,
            language,
          });
          if (savedSession?.id) {
            for (const gem of allGems) {
              await saveGem({
                session_id: savedSession.id,
                name: gem.name,
                description: gem.description,
                address: gem.address,
                lat: gem.lat,
                lng: gem.lng,
                pin_color: gem.pin_color,
                cidade: selectedCity,
                categoria_principal: (gem as any).categoria_principal || "",
              });
            }
          }
        } catch (err) {
          console.error("Erro ao persistir sessão pós-login:", err);
        }
      })();
    }
  }, [isAnonymous, user?.email]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLoading) {
      let i = 0;
      const phrases = LOADING_PHRASES[language] || LOADING_PHRASES.pt;
      setLoadingText(phrases[0]);
      interval = setInterval(() => {
        i = (i + 1) % phrases.length;
        setLoadingText(phrases[i]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading, language]);

  const handleCitySelect = (city: City) => {
    // RESET COMPLETO do estado antes de nova geração
    setMessages([]);
    setCalculatedMRP(null);
    setShowArchetypeShare(false);
    setGemsUnlocked(false);
    setInputValue("");
    setCurrentCycle(1);
    setAllCycleGems([]);
    setCycleLoading(false);
    setDaysLimitMessage(null);

    setSelectedCity(city);
    setFlowState("unified_quiz");
    setQuizIndex(0);
    setDaysText("");
    setNeedsText("");
    setRawScores({});
  };

  const handleBack = () => {
    if (flowState === "unified_quiz") {
      if (quizIndex > 0) setQuizIndex(quizIndex - 1);
      else setFlowState("city_selection");
    } else {
      setFlowState("city_selection");
    }
  };

  const handleTextStepSubmit = () => {
    if (quizIndex === 0) {
      if (!daysText.trim()) return;

      const requestedDays = extractRequestedDays(daysText, getDaysLimit(isFree));
      const daysLimit = getDaysLimit(isFree);

      if (requestedDays > daysLimit && !daysLimitMessage) {
        setDaysLimitMessage(
          isFree
            ? "No plano gratuito, geramos apenas o Roteiro de 1 Dia. Faça upgrade para planejar a semana toda!"
            : "Neste fluxo, o roteiro Pro gera até 7 dias por vez.",
        );
        return;
      }

      setDaysLimitMessage(null);
    }

    if (quizIndex === 1 && !needsText.trim()) return;
    setQuizIndex(quizIndex + 1);
  };

  const handleScoreSelect = (score: number) => {
    const categories = ["body", "territory", "identity", "other", "space"];
    const currentCategory = categories[quizIndex - 2];
    const newScores = { ...rawScores, [currentCategory]: score };
    setRawScores(newScores);

    setTimeout(() => {
      if (quizIndex < 6) {
        setQuizIndex(quizIndex + 1);
      } else {
        // Reset messages ANTES de iniciar nova análise
        setMessages([]);
        setCalculatedMRP(null);
        setFlowState("analyzing");
        submitUnifiedDiagnosis(newScores);
      }
    }, 600);
  };

  // Ao montar, tenta carregar sessão existente do backend
  // Pagantes: sempre restaura a última sessão (não precisa refazer o quiz)
  // Free: só restaura após pagamento bem-sucedido
  useEffect(() => {
    if (!user || flowState !== "city_selection") return;
    const loadSavedSession = async () => {
      try {
        const { data: sessions } = await supabase
          .from("mrp_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (!sessions || sessions.length === 0) return;
        const session = sessions[0];

        // Carrega gemas associadas
        const { data: gems } = await supabase
          .from("mrp_gems")
          .select("*")
          .eq("session_id", session.id)
          .order("created_at", { ascending: true });

        if (!gems || gems.length === 0) return;

        const scores = (
          typeof session.scores === "string" ? JSON.parse(session.scores) : session.scores
        ) as MRPData["scores"];
        const restoredMRP: MRPData = {
          scores,
          emotionalStatus: session.emotional_status || "O Explorador Cult",
          poeticProposition: session.poetic_proposition || "",
          rawAnswers: {},
        };

        const restoredGems: Gem[] = gems
          .filter((g: any) => g.name && g.name.trim().length > 0)
          .map((g: any, idx: number) => ({
            name: g.name,
            description: g.description || "",
            address: g.address || "",
            dia: "",
            horario: "",
            day: Math.floor(idx / 3) + 1,
            shift: ["morning", "afternoon", "night"][idx % 3],
            lat: g.lat || 0,
            lng: g.lng || 0,
            pin_color: g.pin_color || "teal",
            is_gem: true,
            categoria_principal: g.categoria_principal || "",
          }));

        // Inicializa sessão de chat para que o pagante possa conversar direto
        await startChatSession(
          `CIDADE: ${session.city || ""}. IDIOMA: ${session.language || language}. SESSÃO RESTAURADA — o usuário já tem um roteiro gerado.`,
        );

        setCalculatedMRP(restoredMRP);
        setSelectedCity((session.city || "") as City);
        setGemsUnlocked(true); // Restored sessions are always unlocked

        const groupedDays = groupGemsByDay(restoredGems);

        const restoredMessages: Message[] = [
          {
            id: `diag-r`,
            role: "model",
            text: `*${session.poetic_proposition || ""}*`,
            timestamp: Date.now() + 5,
          },
        ];
        let ts = Date.now() + 10;
        for (const { day, gems } of groupedDays) {
          restoredMessages.push({ id: `day-r-${day}`, role: "model", text: `### 🗓️ Dia ${day}`, timestamp: ts++ });
          restoredMessages.push({ id: `gems-r-${day}`, role: "model", text: "", isGem: true, gems, timestamp: ts++ });
        }

        setMessages(restoredMessages);
        setFlowState("diagnosis_result");
      } catch (err) {
        console.error("Erro ao restaurar sessão:", err);
      }
    };

    // Pagantes: sempre restaura automaticamente
    // Free: só restaura se veio de um pagamento bem-sucedido
    const params = new URLSearchParams(window.location.search);
    if (isPremium) {
      loadSavedSession();
    } else if (params.get("payment") === "success" || params.get("tab") === "cult") {
      loadSavedSession();
    }
  }, [user, isPremium]);

  const submitUnifiedDiagnosis = async (finalRawScores: Record<string, number>) => {
    setIsLoading(true);
    try {
      const averagedScores: Partial<MRPData["scores"]> = {
        body: finalRawScores.body || 3,
        territory: finalRawScores.territory || 3,
        identity: finalRawScores.identity || 3,
        other: finalRawScores.other || 3,
        space: finalRawScores.space || 3,
      };

      const requestedDays = extractRequestedDays(daysText, getDaysLimit(isFree));
      const cycleDays = getEffectiveRequestedDays(daysText, isFree);

      // APENAS DADOS — sem regras de formato, persona ou instruções de conteúdo.
      const prompt = `CIDADE: ${selectedCity}
DIAS: ${cycleDays} (ciclo 1 de ${Math.ceil(requestedDays / 7)})
DESEJOS: ${needsText}
SCORES: corpo=${averagedScores.body}, territorio=${averagedScores.territory}, identidade=${averagedScores.identity}, outro=${averagedScores.other}, espaco=${averagedScores.space}
IDIOMA: ${language}`;

      await startChatSession(
        `CIDADE: ${selectedCity}. IDIOMA: ${language}. PERFIL VIBE: corpo=${averagedScores.body}, territorio=${averagedScores.territory}, identidade=${averagedScores.identity}, outro=${averagedScores.other}, espaco=${averagedScores.space}.`,
      );
      const result = await sendMessageToGemini(prompt);
      const responseText = typeof result === "string" ? result : (result as any)?.text || "";

      const parsedRoteiro = parseCultRoteiro(responseText);
      const aiData = parsedRoteiro.success ? parsedRoteiro.data : null;
      const followUpText = parsedRoteiro.followUpText || "";

      if (!aiData || !Array.isArray(aiData.gems) || aiData.gems.length === 0) {
        // FALLBACK: A AWS retornou texto puro em vez de JSON estruturado.
        // Exibe o texto da IA como mensagem normal + aviso para tentar de novo.
        const fallbackText = responseText.trim();
        const fallbackMessages: Message[] = [];

        if (fallbackText && fallbackText.length > 20) {
          // Mostra o que a IA mandou (texto corrido) para não perder o conteúdo
          fallbackMessages.push({
            id: `ai-text-${Date.now()}`,
            role: "model",
            text: fallbackText,
            timestamp: Date.now(),
          });
        }

        fallbackMessages.push({
          id: "retry-hint",
          role: "model",
          text: "### 🔄 Roteiro em texto livre\n\n*A IA respondeu sem a estrutura de gemas. Envie uma nova mensagem (ex: \"gere o roteiro em JSON\") ou tente novamente.*",
          timestamp: Date.now() + 1,
        });

        setMessages(fallbackMessages);
        setFlowState("diagnosis_result");
        return;
      }

      const finalData: MRPData = {
        scores: averagedScores as MRPData["scores"],
        emotionalStatus: aiData.emotional_status || "O Explorador Cult",
        poeticProposition: aiData.poetic_proposition || "Aproveite a jornada.",
        rawAnswers: finalRawScores,
      };

      const finalGems = normalizeGems(aiData.gems);
      if (finalGems.length === 0) {
        setMessages([{ id: "error-empty-gems", role: "model", text: "### Ops, algo deu errado\n\n*Não foi possível exibir o roteiro com segurança. Tente novamente.*", timestamp: Date.now() }]);
        setFlowState("diagnosis_result");
        return;
      }

      setCalculatedMRP(finalData);
      setAllCycleGems([[...finalGems]]);
      setCurrentCycle(1);
      setGemsUnlocked(false); // Start locked

      const groupedDays = groupGemsByDay(finalGems);

      // Messages: only the diagnostic text (NO graph/radar). The ArchetypeResultCard is rendered separately.
      const newMessages: Message[] = [
        {
          id: `diag-${Date.now()}`,
          role: "model",
          text: `*${aiData.diagnostic_text || "Seu roteiro começou a se formar."}*`,
          timestamp: Date.now() + 5,
        },
      ];

      // GATE DE LOGIN: se o usuário é anônimo, mostra o arquétipo mas bloqueia as gemas
      if (isAnonymous) {
        const loginGateText = language === "en"
          ? "### ✨ Your itinerary is ready!\n\nWe mapped your unique profile and curated secret gems just for you. **Sign in to reveal your full itinerary and save it to your profile** — it takes 5 seconds."
          : language === "es"
            ? "### ✨ ¡Tu itinerario está listo!\n\nMapeamos tu perfil único y curamos gemas secretas solo para ti. **Inicia sesión para revelar tu itinerario completo y guardarlo en tu perfil** — toma 5 segundos."
            : "### ✨ Seu roteiro está pronto!\n\nMapeamos seu perfil único e curamos gemas secretas só para você. **Faça login para revelar seu roteiro completo e salvar no seu perfil** — leva 5 segundos.";

        newMessages.push({
          id: `login-gate-${Date.now()}`,
          role: "model",
          text: loginGateText,
          isLoginGate: true,
          timestamp: Date.now() + 8,
        });

        setMessages(newMessages);
        setFlowState("diagnosis_result");
        // Persist gems in memory so they appear after login
        return;
      }

      // Gemas agrupadas por dia (usuários logados)
      let ts = Date.now() + 10;
      for (const { day, gems } of groupedDays) {
        newMessages.push({
          id: `day-header-${day}-${ts}`,
          role: "model",
          text: `### 🗓️ Dia ${day}`,
          timestamp: ts++,
        });
        newMessages.push({
          id: `gems-day-${day}-${ts}`,
          role: "model",
          text: "",
          isGem: true,
          gems,
          timestamp: ts++,
        });
      }

      if (isFree) {
        newMessages.push({
          ...createPremiumLockMessage(`cilada-lock-${Date.now()}`, "⚠️ A Cilada — Evite Isso", ts++),
        });
        newMessages.push({
          ...createPremiumLockMessage(`daytrip-lock-${Date.now()}`, "🎒 Viagem Curta", ts++),
        });
      } else {
        newMessages.push({
          id: `cilada-${Date.now()}`,
          role: "model",
          text: `### ⚠️ A Cilada — Evite Isso\n\n${aiData.cilada_logistica || "Sem alertas logísticos por enquanto."}`,
          timestamp: ts++,
        });
        newMessages.push({
          id: `daytrip-${Date.now()}`,
          role: "model",
          text: `### 🎒 Viagem Curta\n\n${aiData.day_trip || "Sem viagem curta sugerida por enquanto."}`,
          timestamp: ts++,
        });
      }

      // Texto pós-JSON do agente (ex: "Quer ajustar algum detalhe do roteiro?")
      if (followUpText) {
        newMessages.push({
          id: `followup-${Date.now()}`,
          role: "model",
          text: followUpText,
          timestamp: ts++,
        });
      }

      setMessages(newMessages);
      setFlowState("diagnosis_result");
      if (isFree) setFreeAlreadyUsed(true);

      // PERSISTIR no backend para recuperação pós-pagamento
      if (user) {
        try {
          const savedSession = await saveMRPSession({
            scores: finalData.scores,
            emotionalStatus: finalData.emotionalStatus,
            poeticProposition: finalData.poeticProposition,
            city: selectedCity,
            language,
          });
          if (savedSession?.id) {
            for (const gem of finalGems) {
              await saveGem({
                session_id: savedSession.id,
                name: gem.name,
                description: gem.description,
                address: gem.address,
                lat: gem.lat,
                lng: gem.lng,
                pin_color: gem.pin_color,
                cidade: selectedCity,
                categoria_principal: (gem as any).categoria_principal || "",
              });
            }
          }
        } catch (saveErr) {
          console.error("Erro ao persistir sessão:", saveErr);
        }
      }
    } catch (e) {
      console.error("Erro na síntese:", e);
      setMessages([
        {
          id: "error",
          role: "model",
          text: "### Erro de conexão\n\n*Não foi possível gerar o roteiro. Verifique sua conexão e tente novamente.*",
          timestamp: Date.now(),
        },
      ]);
      setFlowState("diagnosis_result");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // TRAVA PLANO FREE: Limite de 1 mensagem no chat
    const userMessageCount = messages.filter((m) => m.role === "user").length;
    if (isFree && userMessageCount >= 1) {
      setShowPaywall(true);
      return;
    }

    const userMsg = inputValue;
    setInputValue("");
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", text: userMsg, timestamp: Date.now() }]);

    setIsLoading(true);
    try {
      const response = await sendMessageToGemini(userMsg);
      const botMsg = typeof response === "string" ? response : (response as any)?.text || "";
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "model", text: botMsg, timestamp: Date.now() },
      ]);
    } catch (e) {
      console.error("Erro no chat:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // GERAÇÃO POR CICLOS: solicita próximos 7 dias ao agente
  const handleNextCycle = async () => {
    if (cycleLoading || isFree) return;
    const nextCycleNum = currentCycle + 1;
    const startDay = (nextCycleNum - 1) * 7 + 1;
    const endDay = startDay + 6;

    setCycleLoading(true);
    setIsLoading(true);
    try {
      const previousGemNames = allCycleGems
        .flat()
        .map((g) => g.name)
        .join(", ");
      const cyclePrompt = `CONTINUAÇÃO DO ROTEIRO — CICLO ${nextCycleNum}
CIDADE: ${selectedCity}
DIAS: do dia ${startDay} ao dia ${endDay}
CONTEXTO: Os dias anteriores já foram gerados com as seguintes gemas: ${previousGemNames}. Agora gere gemas NOVAS e diferentes para os próximos 7 dias, mantendo a mesma cidade e vibe.
IDIOMA: ${language}`;

      const result = await sendMessageToGemini(cyclePrompt);
      const responseText = typeof result === "string" ? result : (result as any)?.text || "";

      const parsedRoteiro = parseCultRoteiro(responseText);
      const aiData = parsedRoteiro.success ? parsedRoteiro.data : null;

      if (aiData?.gems && Array.isArray(aiData.gems) && aiData.gems.length > 0) {
        const newGems = normalizeGems(aiData.gems);
        if (newGems.length === 0) {
          throw new Error("Ciclo sem gemas válidas");
        }
        setAllCycleGems((prev) => [...prev, newGems]);
        setCurrentCycle(nextCycleNum);

        const groupedDays = groupGemsByDay(newGems, startDay);

        const cycleMessages: Message[] = [
          {
            id: `cycle-header-${Date.now()}`,
            role: "model",
            text: `### 🗓️ Ciclo ${nextCycleNum} — Dias ${startDay} a ${endDay}`,
            timestamp: Date.now(),
          },
        ];
        let ts = Date.now() + 5;
        for (const { day, gems } of groupedDays) {
          cycleMessages.push({
            id: `day-header-c${nextCycleNum}-${day}-${ts}`,
            role: "model",
            text: `### 🗓️ Dia ${day}`,
            timestamp: ts++,
          });
          cycleMessages.push({
            id: `gems-c${nextCycleNum}-day-${day}-${ts}`,
            role: "model",
            text: "",
            isGem: true,
            gems,
            timestamp: ts++,
          });
        }

        if (isFree) {
          cycleMessages.push(createPremiumLockMessage(`cilada-c${nextCycleNum}-${ts}`, "⚠️ A Cilada — Evite Isso", ts++));
          cycleMessages.push(createPremiumLockMessage(`daytrip-c${nextCycleNum}-${ts}`, "🎒 Viagem Curta", ts++));
        } else {
          cycleMessages.push({
            id: `cilada-c${nextCycleNum}-${ts}`,
            role: "model",
            text: `### ⚠️ A Cilada — Evite Isso\n\n${aiData.cilada_logistica || "Sem alertas logísticos por enquanto."}`,
            timestamp: ts++,
          });
          cycleMessages.push({
            id: `daytrip-c${nextCycleNum}-${ts}`,
            role: "model",
            text: `### 🎒 Viagem Curta\n\n${aiData.day_trip || "Sem viagem curta sugerida por mientras."}`,
            timestamp: ts++,
          });
        }

        setMessages((prev) => [...prev, ...cycleMessages]);

        // Persistir novas gemas
        if (user) {
          try {
            const { data: sessions } = await supabase
              .from("mrp_sessions")
              .select("id")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
              .limit(1);
            if (sessions?.[0]?.id) {
              for (const gem of newGems) {
                await saveGem({
                  session_id: sessions[0].id,
                  name: gem.name,
                  description: gem.description,
                  address: gem.address,
                  lat: gem.lat,
                  lng: gem.lng,
                  pin_color: gem.pin_color,
                  cidade: selectedCity,
                  categoria_principal: (gem as any).categoria_principal || "",
                });
              }
            }
          } catch (e) {
            console.error("Erro ao salvar ciclo:", e);
          }
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `cycle-error-${Date.now()}`,
            role: "model",
            text: "### Ops\n\n*Não foi possível gerar o próximo ciclo. Tente novamente.*",
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (e) {
      console.error("Erro no próximo ciclo:", e);
    } finally {
      setCycleLoading(false);
      setIsLoading(false);
    }
  };

  const getQuestionLabel = (index: number) => {
    switch (index) {
      case 2:
        return { label: t('cultChat.chaos_q'), min: t('cultChat.chaos_min'), max: t('cultChat.chaos_max') };
      case 3:
        return { label: t('cultChat.territory_q'), min: t('cultChat.territory_min'), max: t('cultChat.territory_max') };
      case 4:
        return { label: t('cultChat.identity_q'), min: t('cultChat.identity_min'), max: t('cultChat.identity_max') };
      case 5:
        return { label: t('cultChat.other_q'), min: t('cultChat.other_min'), max: t('cultChat.other_max') };
      case 6:
        return { label: t('cultChat.space_q'), min: t('cultChat.space_min'), max: t('cultChat.space_max') };
      default:
        return { label: "", min: "", max: "" };
    }
  };

  return (
    <div className="flex flex-col h-full text-foreground font-sans overflow-x-hidden relative bg-background">
      <AuthModal isOpen={isAuthModalOpen} lang={language} onClose={() => setIsAuthModalOpen(false)} />

      {showSplash && (
        <SplashScreen onComplete={() => {
          setShowSplash(false);
          sessionStorage.setItem("cult_splash_shown", "true");
          // If user has no existing session, show hook
          if (flowState === "city_selection" && !freeAlreadyUsed) {
            setShowHook(true);
          }
        }} />
      )}

      {showArchetypeShare && calculatedMRP && (
        <ArchetypeShareCard
          mrpData={calculatedMRP}
          city={selectedCity || ""}
          language={language}
          onClose={() => setShowArchetypeShare(false)}
        />
      )}

      {showPaywall && <PricingPaywall lang={language} onClose={() => setShowPaywall(false)} />}

      <main className="flex-grow flex flex-col relative overflow-hidden">
        {/* HOOK SCREEN — full screen, no scroll */}
        {showHook && flowState === "city_selection" && !freeAlreadyUsed && (
          <HookScreen onStart={() => setShowHook(false)} />
        )}

        {/* CITY SELECTION — dark, clean */}
        {flowState === "city_selection" && !showHook && (
          <div className="flex flex-col items-center justify-center flex-grow p-4 sm:p-6 w-full max-w-3xl mx-auto space-y-8 animate-fade-in">
            {isFree && freeAlreadyUsed ? (
              <div className="text-center space-y-6 max-w-sm">
                <CultCharacter variant="guide" size="lg" />
                <h3 className="font-serif text-xl font-bold text-foreground">{t('cultChat.freeLimitTitle')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('cultChat.freeLimitDesc')}
                </p>
                <Button
                  type="button"
                  onClick={() => openCheckout("personal_map")}
                  className="w-full h-12 bg-gradient-to-r from-accent to-secondary text-accent-foreground rounded-xl font-bold uppercase"
                >
                  {t('cultChat.itineraryPriceButton')}
                </Button>
              </div>
            ) : (
              <>
                <CultCharacter variant="explorer" size="lg" />
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-foreground text-center">
                  {t('cultChat.territoryQuestion')}
                </h3>
                <div className="grid gap-3 w-full max-w-xs">
                  {["Rio de Janeiro", "São Paulo", "Florianópolis"].map((city) => (
                    <button
                      key={city}
                      onClick={() => handleCitySelect(city as City)}
                      className="w-full py-4 rounded-2xl border border-primary/20 bg-card
                        text-primary font-bold text-sm uppercase tracking-widest
                        hover:bg-primary hover:text-primary-foreground hover:border-primary
                        active:scale-95 transition-all duration-200 shadow-sm"
                    >
                      {city}
                    </button>
                  ))}
                </div>

                {isPremium && (
                  <button
                    onClick={async () => {
                      await startChatSession(
                        `IDIOMA: ${language}. O usuário é assinante premium e quer conversar livremente. Responda como Boba, a IA cultural da Feltrip.`,
                      );
                      setMessages([
                        {
                          id: `welcome-chat-${Date.now()}`,
                          role: "model",
                          text: language === "en"
                            ? "### 💬 Direct Chat\n\n*Ask me anything — about cities, culture, relocation, or your journey.*"
                            : language === "es"
                              ? "### 💬 Chat Directo\n\n*Pregúntame lo que quieras — sobre ciudades, cultura, mudanza o tu viaje.*"
                              : "### 💬 Chat Direto\n\n*Pergunte o que quiser — sobre cidades, cultura, mudança ou sua jornada.*",
                          timestamp: Date.now(),
                        },
                      ]);
                      setFlowState("diagnosis_result");
                    }}
                    className="mt-4 text-sm font-bold text-accent underline underline-offset-4 hover:text-foreground transition-colors flex items-center gap-2"
                  >
                    <MessageCircle size={16} />
                    {t('cultChat.skipQuiz')}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {flowState === "unified_quiz" && (
          <div className="flex flex-col items-center justify-center flex-grow p-4 sm:p-6 w-full max-w-2xl mx-auto animate-fade-in">
            <button
              onClick={handleBack}
              className="self-start mb-6 text-muted-foreground font-bold uppercase text-xs flex items-center gap-1 hover:text-foreground/70 transition-colors"
            >
              <ArrowLeft size={14} /> {t('cultChat.backButton')}
            </button>

            {/* Character reacting in corner */}
            <div className="absolute top-4 right-4 opacity-60">
              <CultCharacter
                variant={quizIndex <= 1 ? "explorer" : "analyst"}
                size="sm"
                animate
              />
            </div>

            {quizIndex === 0 && (
              <div className="w-full max-w-md space-y-6">
                <h3 className="font-serif text-xl font-bold text-center text-foreground">{t('cultChat.stayQuestion')}</h3>
                <input
                  type="text"
                  value={daysText}
                  onChange={(e) => {
                    setDaysText(e.target.value);
                    setDaysLimitMessage(null);
                  }}
                  placeholder={t('cultChat.stayPlaceholder')}
                  className="w-full p-4 rounded-xl border border-border bg-muted/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent text-center text-foreground placeholder:text-muted-foreground/60"
                />
                <p className="text-xs text-center text-muted-foreground/60">
                  {isFree ? "Plano gratuito: 1 dia por roteiro." : "Plano Pro: até 7 dias por roteiro."}
                </p>
                {daysLimitMessage && <p className="text-sm text-center text-accent font-bold">{daysLimitMessage}</p>}
                <Button
                  type="button"
                  onClick={handleTextStepSubmit}
                  disabled={!daysText.trim()}
                  className="w-full h-12 bg-gradient-to-r from-accent to-secondary text-accent-foreground rounded-xl font-bold uppercase tracking-widest"
                >
                  {t('cultChat.nextButton')}
                </Button>
              </div>
            )}

            {quizIndex === 1 && (
              <div className="w-full max-w-md space-y-6">
                <h3 className="font-serif text-xl font-bold text-center text-foreground">{t('cultChat.restrictionsQuestion')}</h3>
                <input
                  type="text"
                  value={needsText}
                  onChange={(e) => setNeedsText(e.target.value)}
                  placeholder={t('cultChat.restrictionsPlaceholder')}
                  className="w-full p-4 rounded-xl border border-border bg-muted/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent text-center text-foreground placeholder:text-muted-foreground/60"
                />
                <Button
                  type="button"
                  onClick={handleTextStepSubmit}
                  disabled={!needsText.trim()}
                  className="w-full h-12 bg-gradient-to-r from-accent to-secondary text-accent-foreground rounded-xl font-bold uppercase tracking-widest"
                >
                  {t('cultChat.nextButton')}
                </Button>
              </div>
            )}

            {quizIndex >= 2 && quizIndex <= 6 && (
              <div className="w-full max-w-md space-y-8">
                <h3 className="font-serif text-xl font-bold text-center text-foreground">{getQuestionLabel(quizIndex).label}</h3>
                <div className="flex gap-3 justify-center">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleScoreSelect(v)}
                      className="w-14 h-14 rounded-full border-2 border-border text-foreground/80 font-bold text-lg
                        hover:bg-accent hover:border-accent hover:text-foreground hover:shadow-lg
                        active:scale-90 transition-all duration-200"
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between px-2 text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">
                  <span>{getQuestionLabel(quizIndex).min}</span>
                  <span>{getQuestionLabel(quizIndex).max}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {flowState === "analyzing" && (
          <div className="flex flex-col items-center justify-center flex-grow space-y-6">
            <CultCharacter variant="analyst" size="lg" animate />
            <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="font-serif text-lg animate-pulse text-foreground/60">{loadingText}</p>
          </div>
        )}

        {flowState === "diagnosis_result" && (
          <div className="flex flex-col h-full w-full overflow-hidden animate-fade-in">
            {/* ÁREA DE MENSAGENS E RESULTADOS */}
            <div className="flex-grow overflow-y-auto px-4 py-6 scrollbar-hide">
              <div className="max-w-2xl mx-auto space-y-6 pb-24">
                {/* Botão para gerar novo roteiro (pagantes) */}
                {isPremium && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setMessages([]);
                        setCalculatedMRP(null);
                        setCurrentCycle(1);
                        setAllCycleGems([]);
                        setGemsUnlocked(false);
                        setFlowState("city_selection");
                      }}
                      className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"
                    >
                      <ArrowLeft size={12} /> {t('cultChat.newItinerary')}
                    </button>
                  </div>
                )}

                {/* 1. ARCHETYPE CARD — always visible */}
                {calculatedMRP && (
                  <ArchetypeResultCard
                    data={calculatedMRP}
                    lang={language}
                    city={selectedCity || ""}
                    onShare={() => setShowArchetypeShare(true)}
                    onUnlock={() => {
                      setGemsUnlocked(true);
                      // If anonymous, trigger login
                      if (isAnonymous) {
                        setIsAuthModalOpen(true);
                      }
                    }}
                    isUnlocked={gemsUnlocked}
                  />
                )}

                {/* 2. GATED CONTENT — only visible after unlock */}
                {gemsUnlocked && (
                  <>
                    {messages.map((m) => (
                      <div key={m.id}>
                        <Bubble message={m} lang={language} />
                        {m.isLoginGate && (
                          <div className="mt-6 space-y-4">
                            <Button
                              type="button"
                              onClick={() => setIsAuthModalOpen(true)}
                              className="w-full h-14 rounded-2xl font-bold text-base shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02]"
                            >
                              {language === "en" ? "🔓 Reveal my Itinerary" : language === "es" ? "🔓 Revelar mi Itinerario" : "🔓 Revelar meu Roteiro"}
                            </Button>
                            <p className="text-center text-xs text-muted-foreground">
                              {language === "en" ? "Google or email • 5 seconds • Your data stays safe" : language === "es" ? "Google o email • 5 segundos • Tus datos están seguros" : "Google ou email • 5 segundos • Seus dados ficam seguros"}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* BOTÃO "LIBERAR PRÓXIMO CICLO" */}
                    {!isFree &&
                      (() => {
                        const requestedDays = getEffectiveRequestedDays(daysText, isFree);
                        const maxCycles = Math.ceil(requestedDays / 7);
                        return currentCycle < maxCycles;
                      })() && (
                        <div className="mt-8 p-6 border-2 border-dashed border-primary/40 rounded-2xl text-center space-y-3 bg-primary/5">
                          <h4 className="font-serif font-bold text-lg text-foreground">
                            🗓️ Ciclo {currentCycle} de {Math.ceil(getEffectiveRequestedDays(daysText, isFree) / 7)} concluído
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Para manter a densidade da curadoria, entregamos sua imersão em ciclos semanais.
                          </p>
                          <Button
                            type="button"
                            onClick={handleNextCycle}
                            disabled={cycleLoading}
                            className="w-full h-auto min-h-[56px] px-4 py-4 sm:px-8 sm:py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs whitespace-normal break-words shadow-lg leading-relaxed"
                          >
                            {cycleLoading ? (
                              <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Gerando próximo ciclo...
                              </span>
                            ) : (
                              `Liberar Próximo Ciclo (Dias ${currentCycle * 7 + 1} a ${Math.min((currentCycle + 1) * 7, getEffectiveRequestedDays(daysText, isFree))})`
                            )}
                          </Button>
                        </div>
                      )}

                    {/* BOTÃO DE UPSELL EXPLORER */}
                    <div className="mt-12 p-8 bg-white/[0.03] border border-border rounded-2xl text-center space-y-4">
                      <h4 className="font-serif font-bold text-2xl text-accent">Quer mergulhar fundo?</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Desbloqueie o seu <strong className="text-foreground/70">bairro ideal (Housing)</strong>, o Roteiro de até 30 dias e ganhe o
                        Estúdio de Idiomas com IA.
                      </p>
                      <Button
                        type="button"
                        onClick={() => openCheckout("explorer")}
                        className="w-full sm:w-auto px-10 py-6 bg-gradient-to-r from-accent to-secondary text-accent-foreground rounded-xl font-bold uppercase tracking-widest shadow-xl"
                      >
                        Combo Imersão — até 30 dias — R$ 129,90
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* INPUT DO ORÁCULO (FIXO NO RODAPÉ) — only when unlocked */}
            {gemsUnlocked && (
              <div className="p-4 border-t border-border bg-background/90 backdrop-blur-md">
                <div className="max-w-2xl mx-auto">
                  {isLoading && (
                    <div className="flex items-center gap-3 mb-3 px-2">
                      <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0" />
                      <p className="text-sm text-foreground/50 font-serif animate-pulse">{loadingText}</p>
                    </div>
                  )}
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={
                        isFree && messages.filter((m) => m.role === "user").length >= 1
                          ? "Limite do plano grátis atingido..."
                          : "Pergunte ao Oráculo..."
                      }
                      disabled={isLoading || (isFree && messages.filter((m) => m.role === "user").length >= 1)}
                      className="flex-1 p-3 rounded-2xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-40"
                    />
                    <Button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={
                        isLoading ||
                        !inputValue.trim() ||
                        (isFree && messages.filter((m) => m.role === "user").length >= 1)
                      }
                      className="h-11 w-11 rounded-full p-0 bg-accent flex items-center justify-center hover:bg-accent/80"
                    >
                      <Send className="h-5 w-5 text-accent-foreground" />
                    </Button>
                  </div>
                  {isFree && messages.filter((m) => m.role === "user").length >= 1 && (
                    <p className="text-[10px] text-center mt-2 text-accent font-bold uppercase tracking-tighter">
                      Libere chat ilimitado 24h + roteiro até 7 dias por R$ 29,90!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}