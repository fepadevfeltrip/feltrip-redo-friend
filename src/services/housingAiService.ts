import { supabase } from "@/integrations/supabase/client";
import { Language, RefugeResult } from '../types/housing';

let housingSessionId: string | null = null;

function getSessionId() {
  if (!housingSessionId) {
    housingSessionId = `housing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  return housingSessionId;
}

export function resetHousingSession() {
  housingSessionId = null;
}

export async function generateChatResponse(pillar: string, answer: string, lang: Language, city?: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('housing-agent', {
      body: {
        message: answer,
        sessionId: getSessionId(),
        city: city || 'rio',
        lang,
        mode: pillar,
      },
    });

    if (error) throw error;
    return data?.text || getFallbackAck(pillar, lang);
  } catch (err) {
    console.error('Housing chat error:', err);
    return getFallbackAck(pillar, lang);
  }
}

export async function generateFinalRefuge(answers: Record<string, string>, lang: Language, city?: string): Promise<RefugeResult> {
  try {
    const formattedAnswers = Object.entries(answers)
      .map(([key, val]) => `${key}: ${val}`)
      .join('\n');

    const { data, error } = await supabase.functions.invoke('housing-agent', {
      body: {
        message: formattedAnswers,
        sessionId: getSessionId(),
        city: city || 'rio',
        lang,
        mode: 'final',
      },
    });

    if (error) throw error;

    const text = data?.text || '';
    
    // Try to parse JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed as RefugeResult;
    }

    throw new Error('No JSON found in response');
  } catch (err) {
    console.error('Housing final error:', err);
    return getFallbackResult(lang);
  }
}

function getFallbackAck(pillar: string, lang: Language): string {
  const responses: Record<Language, string> = {
    pt: `Entendo sua visão sobre ${pillar}. Vamos continuar.`,
    en: `I understand your perspective on ${pillar}. Let's continue.`,
    es: `Entiendo tu visión sobre ${pillar}. Continuemos.`,
  };
  return responses[lang];
}

function getFallbackResult(lang: Language): RefugeResult {
  const fallbacks: Record<Language, RefugeResult> = {
    pt: {
      analisePoetica: "Sua alma busca o equilíbrio entre o caos criativo e o silêncio necessário.",
      perfilResumido: "Explorador Urbano",
      pilares: {
        corpo: "Você busca luz e ritmo no cotidiano.",
        territorio: "Valoriza a vida de bairro e o pulso local.",
        outro: "Precisa de um santuário pessoal.",
        espaco: "Busca fluidez entre interior e exterior.",
        identidade: "Carrega história e memória nos seus espaços."
      },
      sugestoes: [
        { bairro: "Santa Teresa", vibe: "Artesanal", descricaoVibe: "Onde o tempo corre devagar entre ateliês e ladeiras." },
        { bairro: "Botafogo", vibe: "Vibrante", descricaoVibe: "O pulso jovem da zona sul com alma de bairro." },
        { bairro: "Laranjeiras", vibe: "Refúgio Verde", descricaoVibe: "Silêncio e natureza a poucos passos do centro." }
      ],
      fechamento: "Este é o início do seu mapa de pertencimento."
    },
    en: {
      analisePoetica: "Your soul seeks balance between creative chaos and necessary silence.",
      perfilResumido: "Urban Explorer",
      pilares: {
        corpo: "You seek light and rhythm in daily life.",
        territorio: "You value neighborhood life and local pulse.",
        outro: "You need a personal sanctuary.",
        espaco: "You seek fluidity between interior and exterior.",
        identidade: "You carry history and memory in your spaces."
      },
      sugestoes: [
        { bairro: "Santa Teresa", vibe: "Artisanal", descricaoVibe: "Where time flows slowly between ateliers and hillsides." },
        { bairro: "Botafogo", vibe: "Vibrant", descricaoVibe: "The young pulse of the south zone with neighborhood soul." },
        { bairro: "Laranjeiras", vibe: "Green Refuge", descricaoVibe: "Silence and nature just steps from the center." }
      ],
      fechamento: "This is the beginning of your belonging map."
    },
    es: {
      analisePoetica: "Tu alma busca el equilibrio entre el caos creativo y el silencio necesario.",
      perfilResumido: "Explorador Urbano",
      pilares: {
        corpo: "Buscas luz y ritmo en lo cotidiano.",
        territorio: "Valoras la vida de barrio y el pulso local.",
        outro: "Necesitas un santuario personal.",
        espaco: "Buscas fluidez entre interior y exterior.",
        identidade: "Cargas historia y memoria en tus espacios."
      },
      sugestoes: [
        { bairro: "Santa Teresa", vibe: "Artesanal", descricaoVibe: "Donde el tiempo corre despacio entre talleres y laderas." },
        { bairro: "Leblon", vibe: "Lujo Silencioso", descricaoVibe: "Donde la elegancia es natural." },
        { bairro: "Laranjeiras", vibe: "Refugio Verde", descricaoVibe: "Silencio y naturaleza a pocos pasos del centro." }
      ],
      fechamento: "Este es el inicio de tu mapa de pertenencia."
    }
  };
  return fallbacks[lang];
}