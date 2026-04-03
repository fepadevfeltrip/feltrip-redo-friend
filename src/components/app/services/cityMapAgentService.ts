import { supabase } from "@/integrations/supabase/client";
import type { MapContentStructured } from "../types/mapContent";

const MAX_RETRIES = 3;

interface CityQuestionnaireRow {
  id: string;
  city: string;
  stay_duration: string;
  purchasing_power: string;
  generation?: string | null;
  gender?: string | null;
  journey_identities?: string[] | null;
  body_q1: number; body_q2: number; body_q3: number; body_q4: number;
  space_q1: number; space_q2: number; space_q3: number; space_q4: number;
  territory_q1: number; territory_q2: number; territory_q3: number; territory_q4: number;
  identity_q1: number; identity_q2: number; identity_q3: number; identity_q4: number;
  other_q1: number; other_q2: number; other_q3: number; other_q4: number;
}

function buildScores(q: CityQuestionnaireRow) {
  return {
    body: Math.round(((q.body_q1 + q.body_q2 + q.body_q3 + q.body_q4) / 20) * 100),
    space: Math.round(((q.space_q1 + q.space_q2 + q.space_q3 + q.space_q4) / 20) * 100),
    territory: Math.round(((q.territory_q1 + q.territory_q2 + q.territory_q3 + q.territory_q4) / 20) * 100),
    identity: Math.round(((q.identity_q1 + q.identity_q2 + q.identity_q3 + q.identity_q4) / 20) * 100),
    other: Math.round(((q.other_q1 + q.other_q2 + q.other_q3 + q.other_q4) / 20) * 100),
  };
}

const CONTEXT_BLOCK = (q: CityQuestionnaireRow, scores: ReturnType<typeof buildScores>, userName: string) => {
  const personalization = [
    q.generation ? `Geração: ${q.generation}` : '',
    q.gender ? `Gênero: ${q.gender}` : '',
    q.journey_identities?.length ? `Jornada: ${q.journey_identities.join(', ')}` : '',
  ].filter(Boolean).join('. ');
  return `Método Feltrip™ (Mapa da Presença Relacional). Usuário: ${userName}. Cidade: ${q.city}. Estadia: ${q.stay_duration}. Poder aquisitivo: ${q.purchasing_power}. ${personalization ? `Personalização: ${personalization}.` : ''} Respostas detalhadas: Corpo(q1=${q.body_q1},q2=${q.body_q2},q3=${q.body_q3},q4=${q.body_q4}), Espaço(q1=${q.space_q1},q2=${q.space_q2},q3=${q.space_q3},q4=${q.space_q4}), Território(q1=${q.territory_q1},q2=${q.territory_q2},q3=${q.territory_q3},q4=${q.territory_q4}), Identidade(q1=${q.identity_q1},q2=${q.identity_q2},q3=${q.identity_q3},q4=${q.identity_q4}), O Outro(q1=${q.other_q1},q2=${q.other_q2},q3=${q.other_q3},q4=${q.other_q4}). Scores: Corpo=${scores.body}%, Espaço=${scores.space}%, Território=${scores.territory}%, Identidade=${scores.identity}%, O Outro=${scores.other}%.`;
};

function buildPromptPart1(q: CityQuestionnaireRow, scores: ReturnType<typeof buildScores>, userName: string): string {
  return `${CONTEXT_BLOCK(q, scores, userName)}

Gere a PARTE 1 do mapa profundo. Esta parte inclui SOMENTE: título, subtítulo, introdução poética, e os pilares CORPO e ESPAÇO.

Escreva com profundidade e sensibilidade. Cada pilar deve ter:
- summary: 2-3 frases resumindo a relação do usuário com esse pilar
- deep_analysis: parágrafo denso (5-8 frases) analisando como o perfil do usuário se relaciona com ${q.city}
- recommendations: 3-4 recomendações práticas e personalizadas
- places: 2-3 lugares reais de ${q.city} com descrição rica, motivo personalizado e bairro

Responda SOMENTE com JSON válido. Sem markdown, sem texto antes ou depois.

{"title":"...","subtitle":"...","introduction":"introdução poética de 3-4 frases sobre a jornada relacional em ${q.city}","sections":{"body":{"title":"Corpo","summary":"...","deep_analysis":"...","recommendations":["...","...","..."],"places":[{"name":"...","description":"...","why":"...","neighborhood":"..."}]},"space":{"title":"Espaço","summary":"...","deep_analysis":"...","recommendations":["...","...","..."],"places":[{"name":"...","description":"...","why":"...","neighborhood":"..."}]}}}`;
}

function buildPromptPart2(q: CityQuestionnaireRow, scores: ReturnType<typeof buildScores>, userName: string): string {
  return `${CONTEXT_BLOCK(q, scores, userName)}

Gere a PARTE 2 do mapa profundo. Esta parte inclui SOMENTE os pilares TERRITÓRIO e IDENTIDADE.

Escreva com profundidade e sensibilidade. Cada pilar deve ter:
- summary: 2-3 frases resumindo a relação do usuário com esse pilar
- deep_analysis: parágrafo denso (5-8 frases) analisando como o perfil do usuário se relaciona com ${q.city}
- recommendations: 3-4 recomendações práticas e personalizadas
- places: 2-3 lugares reais de ${q.city} com descrição rica, motivo personalizado e bairro

Responda SOMENTE com JSON válido. Sem markdown, sem texto antes ou depois.

{"sections":{"territory":{"title":"Território","summary":"...","deep_analysis":"...","recommendations":["...","...","..."],"places":[{"name":"...","description":"...","why":"...","neighborhood":"..."}]},"identity":{"title":"Identidade","summary":"...","deep_analysis":"...","recommendations":["...","...","..."],"places":[{"name":"...","description":"...","why":"...","neighborhood":"..."}]}}}`;
}

function buildPromptPart3(q: CityQuestionnaireRow, scores: ReturnType<typeof buildScores>, userName: string): string {
  return `${CONTEXT_BLOCK(q, scores, userName)}

Gere a PARTE 3 (final) do mapa profundo. Esta parte inclui SOMENTE: pilar O OUTRO, insights de poder aquisitivo, conclusão e proposição poética.

O pilar "O Outro" deve ter:
- summary: 2-3 frases resumindo a relação do usuário com esse pilar
- deep_analysis: parágrafo denso (5-8 frases) sobre relações interpessoais e interculturais em ${q.city}
- recommendations: 3-4 recomendações práticas e personalizadas
- places: 2-3 lugares reais de ${q.city} para conexões humanas

A conclusão deve ser poética e profunda (3-4 frases).
A proposição poética deve ser uma instrução contemplativa inspirada em Yoko Ono (2-3 frases).
Os insights de poder aquisitivo devem ser práticos sobre custo de vida em ${q.city} para o perfil ${q.purchasing_power} (3-4 frases).

Responda SOMENTE com JSON válido. Sem markdown, sem texto antes ou depois.

{"sections":{"other":{"title":"O Outro","summary":"...","deep_analysis":"...","recommendations":["...","...","..."],"places":[{"name":"...","description":"...","why":"...","neighborhood":"..."}]}},"purchasing_power_insights":"...","conclusion":"...","poetic_proposition":"..."}`;
}

function extractJson(raw: string): any | null {
  let cleaned = raw.trim();
  // Remove XML tags from Bedrock orchestration
  const answerMatch = cleaned.match(/<answer>([\s\S]*?)<\/answer>/);
  if (answerMatch) cleaned = answerMatch[1].trim();
  // Remove markdown code fences
  cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
  // Find JSON object
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    console.error('[CityMap] No JSON braces found in response');
    return null;
  }
  const jsonStr = cleaned.substring(start, end + 1);
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('[CityMap] JSON.parse failed:', (e as Error).message, 'Last 100 chars:', jsonStr.slice(-100));
    return null;
  }
}

async function callAgent(prompt: string, sessionId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('city-map-agent', {
    body: { message: prompt, sessionId },
  });
  if (error) throw new Error(`Edge function error: ${error.message}`);
  return data?.text || '';
}

function validateMergedContent(merged: MapContentStructured): boolean {
  try {
    const str = JSON.stringify(merged);
    const parsed = JSON.parse(str);
    if (!parsed.sections) return false;
    const pillars = ['body', 'space', 'territory', 'identity', 'other'] as const;
    for (const p of pillars) {
      if (!parsed.sections[p]?.title || !parsed.sections[p]?.summary) {
        console.error(`[CityMap] Validation: missing ${p}.title or ${p}.summary`);
        return false;
      }
    }
    if (typeof parsed.introduction !== 'string' || !parsed.introduction) {
      console.error('[CityMap] Validation: missing introduction');
      return false;
    }
    return true;
  } catch (e) {
    console.error('[CityMap] Validation roundtrip failed:', e);
    return false;
  }
}

export async function generateCityMap(
  questionnaire: CityQuestionnaireRow,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  const scores = buildScores(questionnaire);

  await supabase
    .from('city_questionnaires')
    .update({ map_status: 'generating' })
    .eq('id', questionnaire.id);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const sessionBase = `citymap-${questionnaire.id}-${Date.now()}`;

      // === PART 1: Intro + Body + Space ===
      console.log(`[CityMap] Attempt ${attempt}/${MAX_RETRIES}: Part 1 (intro+body+space)...`);
      const raw1 = await callAgent(buildPromptPart1(questionnaire, scores, userName), `${sessionBase}-p1`);
      console.log(`[CityMap] Part 1 raw: ${raw1.length} chars`);
      const part1 = extractJson(raw1);
      if (!part1?.sections?.body || !part1?.sections?.space || !part1?.introduction) {
        console.warn(`[CityMap] Part 1 incomplete. Found:`, part1 ? Object.keys(part1.sections || {}) : 'null');
        if (attempt < MAX_RETRIES) continue;
        throw new Error('Part 1 invalid after retries');
      }
      console.log(`[CityMap] Part 1 ✓`);

      // === PART 2: Territory + Identity ===
      console.log(`[CityMap] Attempt ${attempt}/${MAX_RETRIES}: Part 2 (territory+identity)...`);
      const raw2 = await callAgent(buildPromptPart2(questionnaire, scores, userName), `${sessionBase}-p2`);
      console.log(`[CityMap] Part 2 raw: ${raw2.length} chars`);
      const part2 = extractJson(raw2);
      if (!part2?.sections?.territory || !part2?.sections?.identity) {
        console.warn(`[CityMap] Part 2 incomplete. Found:`, part2 ? Object.keys(part2.sections || {}) : 'null');
        if (attempt < MAX_RETRIES) continue;
        throw new Error('Part 2 invalid after retries');
      }
      console.log(`[CityMap] Part 2 ✓`);

      // === PART 3: Other + Conclusion + Poetic ===
      console.log(`[CityMap] Attempt ${attempt}/${MAX_RETRIES}: Part 3 (other+conclusion+poetic)...`);
      const raw3 = await callAgent(buildPromptPart3(questionnaire, scores, userName), `${sessionBase}-p3`);
      console.log(`[CityMap] Part 3 raw: ${raw3.length} chars`);
      const part3 = extractJson(raw3);
      if (!part3?.sections?.other) {
        console.warn(`[CityMap] Part 3 incomplete. Found:`, part3 ? Object.keys(part3.sections || {}) : 'null');
        if (attempt < MAX_RETRIES) continue;
        throw new Error('Part 3 invalid after retries');
      }
      console.log(`[CityMap] Part 3 ✓`);

      // === MERGE ===
      const merged: MapContentStructured = {
        title: part1.title || `Mapa Profundo de ${questionnaire.city}`,
        subtitle: part1.subtitle || `Para ${userName}`,
        introduction: part1.introduction,
        sections: {
          body: part1.sections.body,
          space: part1.sections.space,
          territory: part2.sections.territory,
          identity: part2.sections.identity,
          other: part3.sections.other,
        },
        purchasing_power_insights: part3.purchasing_power_insights || '',
        conclusion: part3.conclusion || '',
        poetic_proposition: part3.poetic_proposition || '',
      };

      if (!validateMergedContent(merged)) {
        console.error(`[CityMap] Merged validation failed on attempt ${attempt}`);
        if (attempt < MAX_RETRIES) continue;
        throw new Error('Merged content validation failed');
      }

      const jsonString = JSON.stringify(merged);
      console.log(`[CityMap] Final JSON: ${jsonString.length} chars`);

      // Safety: parse what we're about to save
      try { JSON.parse(jsonString); } catch {
        throw new Error('Final JSON string is corrupt');
      }

      const { error: updateError } = await supabase
        .from('city_questionnaires')
        .update({ map_content: jsonString, map_status: 'completed' })
        .eq('id', questionnaire.id);

      if (updateError) throw updateError;

      console.log(`[CityMap] ✅ Map generated on attempt ${attempt} (${jsonString.length} chars)`);
      return { success: true };
    } catch (err: any) {
      console.error(`[CityMap] Attempt ${attempt} failed:`, err.message);
      if (attempt >= MAX_RETRIES) {
        await supabase
          .from('city_questionnaires')
          .update({ map_status: 'failed' })
          .eq('id', questionnaire.id);
        return { success: false, error: err.message };
      }
    }
  }

  return { success: false, error: 'Unknown error' };
}
