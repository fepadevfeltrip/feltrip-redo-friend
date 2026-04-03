export interface CultRoteiroResult {
  data: any;
  followUpText: string;
  success: boolean;
  error?: string;
}

function sanitizeJsonString(raw: string): string {
  let s = raw.trim();
  s = s.replace(/,\s*([\]}])/g, "$1");
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return s;
}

function safeParse(jsonStr: string): any | null {
  try {
    const parsed = JSON.parse(sanitizeJsonString(jsonStr));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (e) {
    console.error("parseCultRoteiro — safeParse error:", e);
    return null;
  }
}

function extractJsonBlocks(text: string): string[] {
  const blocks: string[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth == 0) start = i;
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        blocks.push(text.substring(start, i + 1));
        start = -1;
      }
    }
  }

  return blocks;
}

function mergeRoteiroObjects(jsonA: any, jsonB: any): any {
  const merged = { ...jsonA };

  if (jsonB.roteiro && typeof jsonB.roteiro === "object") {
    merged.roteiro = { ...(merged.roteiro || {}), ...jsonB.roteiro };
  }

  if (Array.isArray(jsonB.gems) && jsonB.gems.length > 0) {
    merged.gems = [...(merged.gems || []), ...jsonB.gems];
  }

  const specialFields = [
    "emotional_status",
    "diagnostic_text",
    "poetic_proposition",
    
    "cilada_logistica",
    "cilada",
    "day_trip",
    "viagem_curta",
    "short_trip",
    "a_cilada",
    "bonus",
  ];

  for (const field of specialFields) {
    if (jsonB[field] !== undefined && merged[field] === undefined) {
      merged[field] = jsonB[field];
    }
  }

  for (const key of Object.keys(jsonB)) {
    if (key === "gems" || key === "roteiro") continue;
    if (merged[key] === undefined) {
      merged[key] = jsonB[key];
    }
  }

  return merged;
}

function extractFollowUpText(rawResponse: string, consumedChunk: string): string {
  const idx = rawResponse.lastIndexOf(consumedChunk);
  if (idx === -1) return "";
  return rawResponse.substring(idx + consumedChunk.length).trim();
}

export function parseCultRoteiro(rawResponse: string): CultRoteiroResult {
  if (!rawResponse || typeof rawResponse !== "string") {
    return { data: null, followUpText: "", success: false, error: "Resposta vazia" };
  }

  let followUpText = "";

  // Tenta o parse direto (se a IA mandar só o JSON)
  const directParse = safeParse(rawResponse);
  if (directParse) {
    return { data: directParse, followUpText: "", success: true };
  }

  // Tenta extrair blocos de JSON (o coração do sistema)
  const jsonBlocks = extractJsonBlocks(rawResponse)
    .map((block) => ({ raw: block, parsed: safeParse(block) }))
    .filter((item) => item.parsed);

  if (jsonBlocks.length > 0) {
    let merged;
    if (jsonBlocks.length === 1) {
      merged = jsonBlocks[0].parsed;
    } else {
      merged = jsonBlocks.map((item) => item.parsed).reduce((acc, item) => mergeRoteiroObjects(acc, item));
    }

    // Puxa o texto humano que sobrou fora do código
    followUpText = extractFollowUpText(rawResponse, jsonBlocks[jsonBlocks.length - 1].raw);
    return { data: merged, followUpText, success: true };
  }

  // --- O SEGURO ANTI-ERRO: SE NÃO TIVER JSON, É CONVERSA PURA ---
  if (rawResponse.trim().length > 0) {
    return {
      data: null,
      followUpText: rawResponse.trim(),
      success: true, // Marcamos como sucesso para o chat exibir o balão de fala
    };
  }

  return {
    data: null,
    followUpText: "",
    success: false,
    error: "Não foi possível extrair conteúdo da resposta.",
  };
}
