import { supabase } from "@/integrations/supabase/client";
import type { MapContentStructured, PillarSection } from "../types/mapContent";

const MAX_RETRIES = 2;
const FREE_COMPLETION_STATUS = "completed_free";
const PREMIUM_COMPLETION_STATUS = "completed";

type GenerationPartStatus =
  | "generating_part_1"
  | "generating_part_2"
  | "generating_part_3"
  | "generating_part_4"
  | "generating_part_5"
  | "generating_part_6";

type GenerationStatus = GenerationPartStatus | typeof FREE_COMPLETION_STATUS | typeof PREMIUM_COMPLETION_STATUS;

interface CityQuestionnaireRow {
  id: string;
  city: string;
  stay_duration: string;
  purchasing_power: string;
  generation?: string | null;
  gender?: string | null;
  journey_identities?: string[] | null;
  map_status?: string | null;
  map_content?: string | null;
  body_q1: number;
  body_q2: number;
  body_q3: number;
  body_q4: number;
  space_q1: number;
  space_q2: number;
  space_q3: number;
  space_q4: number;
  territory_q1: number;
  territory_q2: number;
  territory_q3: number;
  territory_q4: number;
  identity_q1: number;
  identity_q2: number;
  identity_q3: number;
  identity_q4: number;
  other_q1: number;
  other_q2: number;
  other_q3: number;
  other_q4: number;
}

export type GenerationProgress = {
  currentPart: number;
  totalParts: number;
  status: string;
  isDone?: boolean;
};

function buildScores(q: CityQuestionnaireRow) {
  return {
    body: Math.round(((q.body_q1 + q.body_q2 + q.body_q3 + q.body_q4) / 20) * 100),
    space: Math.round(((q.space_q1 + q.space_q2 + q.space_q3 + q.space_q4) / 20) * 100),
    territory: Math.round(((q.territory_q1 + q.territory_q2 + q.territory_q3 + q.territory_q4) / 20) * 100),
    identity: Math.round(((q.identity_q1 + q.identity_q2 + q.identity_q3 + q.identity_q4) / 20) * 100),
    other: Math.round(((q.other_q1 + q.other_q2 + q.other_q3 + q.other_q4) / 20) * 100),
  };
}

const LANG_INSTRUCTIONS: Record<string, string> = {
  pt: "Responda EXCLUSIVAMENTE em Português brasileiro.",
  en: "Respond EXCLUSIVELY in English.",
  es: "Responde EXCLUSIVAMENTE en Español.",
  fr: "Répondez EXCLUSIVEMENT en Français.",
  zh: "请仅使用中文回复。",
};

function contextBlock(
  q: CityQuestionnaireRow,
  scores: ReturnType<typeof buildScores>,
  userName: string,
  lang: string,
): string {
  const langInstruction = LANG_INSTRUCTIONS[lang] || LANG_INSTRUCTIONS.en;
  const personalization = [
    q.generation ? `Geração: ${q.generation}` : "",
    q.gender ? `Gênero: ${q.gender}` : "",
    q.journey_identities?.length ? `Jornada: ${q.journey_identities.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(". ");

  return `${langInstruction} Método Feltrip™ (Mapa da Presença Relacional). Usuário: ${userName}. Cidade: ${q.city}. Estadia: ${q.stay_duration}. Poder aquisitivo: ${q.purchasing_power}. ${personalization ? `Personalização: ${personalization}.` : ""} Respostas detalhadas: Corpo(q1=${q.body_q1},q2=${q.body_q2},q3=${q.body_q3},q4=${q.body_q4}), Espaço(q1=${q.space_q1},q2=${q.space_q2},q3=${q.space_q3},q4=${q.space_q4}), Território(q1=${q.territory_q1},q2=${q.territory_q2},q3=${q.territory_q3},q4=${q.territory_q4}), Identidade(q1=${q.identity_q1},q2=${q.identity_q2},q3=${q.identity_q3},q4=${q.identity_q4}), O Outro(q1=${q.other_q1},q2=${q.other_q2},q3=${q.other_q3},q4=${q.other_q4}). Scores: Corpo=${scores.body}%, Espaço=${scores.space}%, Território=${scores.territory}%, Identidade=${scores.identity}%, O Outro=${scores.other}%.`;
}

function promptPart1(q: CityQuestionnaireRow, scores: ReturnType<typeof buildScores>, userName: string, lang: string) {
  return `${contextBlock(q, scores, userName, lang)}

Gere APENAS a Parte 1: Título, Subtítulo e Introdução do mapa profundo.
- title: título poético do mapa (1 frase)
- subtitle: subtítulo personalizado para ${userName} (1 frase)
- introduction: parágrafo denso de 8 frases conectando o perfil do usuário à cidade ${q.city}, usando linguagem fenomenológica e sensorial.

Responda SOMENTE com JSON válido. Sem markdown, sem texto antes ou depois.
{"title":"...","subtitle":"...","introduction":"..."}`;
}

function promptPart2(q: CityQuestionnaireRow, scores: ReturnType<typeof buildScores>, userName: string, lang: string) {
  return `${contextBlock(q, scores, userName, lang)}

Gere APENAS o pilar CORPO do mapa profundo de ${q.city}.
- title: "Corpo" (ou tradução adequada)
- summary: 3 frases
- deep_analysis: análise fenomenológica DENSA de 8 frases
- recommendations: 4 recomendações práticas e personalizadas
- places: 3 lugares reais de ${q.city} com name, description (2 frases), why, neighborhood

Responda SOMENTE com JSON válido.
{"title":"...","summary":"...","deep_analysis":"...","recommendations":["..."],"places":[{"name":"...","description":"...","why":"...","neighborhood":"..."}]}`;
}

function promptPart3(q: CityQuestionnaireRow, scores: ReturnType<typeof buildScores>, userName: string, lang: string) {
  return `${contextBlock(q, scores, userName, lang)}

Gere APENAS o pilar ESPAÇO do mapa profundo de ${q.city}.
- title: "Espaço" (ou tradução adequada)
- summary: 3 frases
- deep_analysis: análise fenomenológica DENSA de 8 frases
- recommendations: 4 recomendações práticas e personalizadas
- places: 3 lugares reais de ${q.city} com name, description (2 frases), why, neighborhood

Responda SOMENTE com JSON válido.
{"title":"...","summary":"...","deep_analysis":"...","recommendations":["..."],"places":[{"name":"...","description":"...","why":"...","neighborhood":"..."}]}`;
}

function promptPart4(q: CityQuestionnaireRow, scores: ReturnType<typeof buildScores>, userName: string, lang: string) {
  return `${contextBlock(q, scores, userName, lang)}

Gere APENAS o pilar TERRITÓRIO do mapa profundo de ${q.city}.
- title: "Território" (ou tradução adequada)
- summary: 3 frases
- deep_analysis: análise fenomenológica DENSA de 8 frases
- recommendations: 4 recomendações práticas e personalizadas
- places: 3 lugares reais de ${q.city} com name, description (2 frases), why, neighborhood

Responda SOMENTE com JSON válido.
{"title":"...","summary":"...","deep_analysis":"...","recommendations":["..."],"places":[{"name":"...","description":"...","why":"...","neighborhood":"..."}]}`;
}

function promptPart5(q: CityQuestionnaireRow, scores: ReturnType<typeof buildScores>, userName: string, lang: string) {
  return `${contextBlock(q, scores, userName, lang)}

Gere APENAS os pilares IDENTIDADE e O OUTRO do mapa profundo de ${q.city}.
Para cada pilar:
- title: nome do pilar
- summary: 3 frases
- deep_analysis: análise fenomenológica DENSA de 8 frases
- recommendations: 4 recomendações práticas
- places: 3 lugares reais de ${q.city} com name, description, why, neighborhood

Responda SOMENTE com JSON válido.
{"identity":{"title":"...","summary":"...","deep_analysis":"...","recommendations":["..."],"places":[...]},"other":{"title":"...","summary":"...","deep_analysis":"...","recommendations":["..."],"places":[...]}}`;
}

function promptPart6(q: CityQuestionnaireRow, scores: ReturnType<typeof buildScores>, userName: string, lang: string) {
  return `${contextBlock(q, scores, userName, lang)}

Gere APENAS a Parte Final do mapa profundo de ${q.city}:
- purchasing_power_insights: 4 frases práticas sobre custo de vida
- conclusion: conclusão poética e profunda de 4 frases
- poetic_proposition: instrução contemplativa inspirada em Yoko Ono (3 frases)

Responda SOMENTE com JSON válido.
{"purchasing_power_insights":"...","conclusion":"...","poetic_proposition":"..."}`;
}

function extractJson(raw: string): any | null {
  if (!raw) return null;
  let cleaned = raw.trim();
  const answerMatch = cleaned.match(/<answer>([\s\S]*?)<\/answer>/);
  if (answerMatch) cleaned = answerMatch[1].trim();
  cleaned = cleaned.replace(/```json\s*/gi, "").replace(/```\s*/gi, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.substring(start, end + 1));
  } catch {
    return null;
  }
}

function parseSavedMapContent(mapContent?: string | null): Partial<MapContentStructured> {
  if (!mapContent) return {};
  try {
    return JSON.parse(mapContent);
  } catch {
    return {};
  }
}

function emptyPillar(title: string): PillarSection {
  return { title, summary: "", deep_analysis: "", recommendations: [], places: [] };
}

function buildBasePartialMap(userName: string, saved: Partial<MapContentStructured>): MapContentStructured {
  return {
    title: saved.title || "",
    subtitle: saved.subtitle || `Para ${userName}`,
    introduction: saved.introduction || "",
    sections: {
      body: saved.sections?.body || emptyPillar("Corpo"),
      space: saved.sections?.space || emptyPillar("Espaço"),
      territory: saved.sections?.territory || emptyPillar("Território"),
      identity: saved.sections?.identity || emptyPillar("Identidade"),
      other: saved.sections?.other || emptyPillar("O Outro"),
    },
    purchasing_power_insights: saved.purchasing_power_insights || "",
    conclusion: saved.conclusion || "",
    poetic_proposition: saved.poetic_proposition || "",
  };
}

async function callAgent(prompt: string, sessionId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("city-map-agent", {
    body: { message: prompt, sessionId },
  });

  if (error) throw new Error(`Edge function error: ${error.message}`);
  if (!data?.text || data.text.trim().length === 0) throw new Error("Agent returned empty response");
  return data.text;
}

async function callWithRetry(prompt: string, sessionId: string, validator: (parsed: any) => boolean): Promise<any> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const raw = await callAgent(prompt, `${sessionId}-a${attempt}`);
    const parsed = extractJson(raw);
    if (parsed && validator(parsed)) return parsed;
    console.warn(`[CityMap] Attempt ${attempt} failed validation, retrying...`);
  }
  throw new Error("Failed after retries");
}

async function updateQuestionnaire(id: string, payload: { map_status: string; map_content?: string }) {
  const { error } = await supabase.from("city_questionnaires").update(payload).eq("id", id);
  if (error) throw error;
}

function getNextPart(mapStatus: string | null | undefined, isPremium: boolean): { part: number; status: GenerationPartStatus } | null {
  if (!mapStatus || mapStatus === "pending" || mapStatus === "failed") return { part: 1, status: "generating_part_1" };
  if (mapStatus === "generating_part_1") return { part: 1, status: "generating_part_1" };
  if (mapStatus === FREE_COMPLETION_STATUS) return isPremium ? { part: 2, status: "generating_part_2" } : null;
  if (mapStatus === "generating_part_2") return { part: 2, status: "generating_part_2" };
  if (mapStatus === "generating_part_3") return { part: 3, status: "generating_part_3" };
  if (mapStatus === "generating_part_4") return { part: 4, status: "generating_part_4" };
  if (mapStatus === "generating_part_5") return { part: 5, status: "generating_part_5" };
  if (mapStatus === "generating_part_6") return { part: 6, status: "generating_part_6" };
  return null;
}

export async function generateCityMap(
  questionnaire: CityQuestionnaireRow,
  userName: string,
  language: string = "pt",
  isPremium: boolean = false,
  onProgress?: (progress: GenerationProgress) => void,
): Promise<{ success: boolean; error?: string; done?: boolean; nextStatus?: string }> {
  const lang = language.substring(0, 2);
  const scores = buildScores(questionnaire);
  const sessionBase = `citymap-${questionnaire.id}-${Date.now()}`;
  const totalParts = isPremium ? 6 : 1;
  const next = getNextPart(questionnaire.map_status, isPremium);

  if (!next) {
    return { success: true, done: questionnaire.map_status === PREMIUM_COMPLETION_STATUS || questionnaire.map_status === FREE_COMPLETION_STATUS };
  }

  const saved = parseSavedMapContent(questionnaire.map_content);
  const partial = buildBasePartialMap(userName, saved);

  try {
    onProgress?.({ currentPart: next.part, totalParts, status: next.status });
    await updateQuestionnaire(questionnaire.id, {
      map_status: next.status,
      map_content: JSON.stringify(partial),
    });

    if (next.part === 1) {
      const part1 = await callWithRetry(
        promptPart1(questionnaire, scores, userName, lang),
        `${sessionBase}-p1`,
        (p) => !!p?.title && !!p?.introduction,
      );

      const updated: MapContentStructured = {
        ...partial,
        title: part1.title,
        subtitle: part1.subtitle || partial.subtitle,
        introduction: part1.introduction,
      };

      const finalStatus: GenerationStatus = isPremium ? "generating_part_2" : FREE_COMPLETION_STATUS;
      await updateQuestionnaire(questionnaire.id, {
        map_status: finalStatus,
        map_content: JSON.stringify(updated),
      });

      return { success: true, done: !isPremium, nextStatus: finalStatus };
    }

    if (next.part === 2) {
      const body = await callWithRetry(
        promptPart2(questionnaire, scores, userName, lang),
        `${sessionBase}-p2`,
        (p) => !!p?.title && !!p?.deep_analysis,
      );

      partial.sections.body = body;
      await updateQuestionnaire(questionnaire.id, {
        map_status: "generating_part_3",
        map_content: JSON.stringify(partial),
      });
      return { success: true, done: false, nextStatus: "generating_part_3" };
    }

    if (next.part === 3) {
      const space = await callWithRetry(
        promptPart3(questionnaire, scores, userName, lang),
        `${sessionBase}-p3`,
        (p) => !!p?.title && !!p?.deep_analysis,
      );

      partial.sections.space = space;
      await updateQuestionnaire(questionnaire.id, {
        map_status: "generating_part_4",
        map_content: JSON.stringify(partial),
      });
      return { success: true, done: false, nextStatus: "generating_part_4" };
    }

    if (next.part === 4) {
      const territory = await callWithRetry(
        promptPart4(questionnaire, scores, userName, lang),
        `${sessionBase}-p4`,
        (p) => !!p?.title && !!p?.deep_analysis,
      );

      partial.sections.territory = territory;
      await updateQuestionnaire(questionnaire.id, {
        map_status: "generating_part_5",
        map_content: JSON.stringify(partial),
      });
      return { success: true, done: false, nextStatus: "generating_part_5" };
    }

    if (next.part === 5) {
      const result = await callWithRetry(
        promptPart5(questionnaire, scores, userName, lang),
        `${sessionBase}-p5`,
        (p) => !!p?.identity?.title && !!p?.other?.title,
      );

      partial.sections.identity = result.identity;
      partial.sections.other = result.other;
      await updateQuestionnaire(questionnaire.id, {
        map_status: "generating_part_6",
        map_content: JSON.stringify(partial),
      });
      return { success: true, done: false, nextStatus: "generating_part_6" };
    }

    if (next.part === 6) {
      const result = await callWithRetry(
        promptPart6(questionnaire, scores, userName, lang),
        `${sessionBase}-p6`,
        (p) => !!p?.conclusion && !!p?.poetic_proposition,
      );

      partial.purchasing_power_insights = result.purchasing_power_insights || "";
      partial.conclusion = result.conclusion || "";
      partial.poetic_proposition = result.poetic_proposition || "";

      JSON.parse(JSON.stringify(partial));

      await updateQuestionnaire(questionnaire.id, {
        map_status: PREMIUM_COMPLETION_STATUS,
        map_content: JSON.stringify(partial),
      });
      return { success: true, done: true, nextStatus: PREMIUM_COMPLETION_STATUS };
    }

    return { success: false, error: "No generation step matched" };
  } catch (err: any) {
    console.error("[CityMap] Generation failed:", err.message);
    await updateQuestionnaire(questionnaire.id, {
      map_status: "failed",
      map_content: JSON.stringify(partial),
    });
    return { success: false, error: err.message };
  }
}
