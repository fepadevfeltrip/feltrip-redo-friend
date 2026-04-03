import { pdf } from "@react-pdf/renderer";
import { MapPDFDocument } from "./MapPDFDocument";
import type { MapPDFData, MapContentStructured } from "../types/mapContent";

/**
 * Generate and download the map PDF on-demand.
 */
export const downloadMapPDF = async (data: MapPDFData) => {
  const blob = await pdf(<MapPDFDocument data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `feltrip-mapa-${data.city.toLowerCase().replace(/\s+/g, "-")}-${data.userName.toLowerCase().replace(/\s+/g, "-")}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Parse the AI response (map_content) into the structured format.
 * The agent MUST return valid JSON matching MapContentStructured.
 */
export const parseMapContent = (raw: string | object): MapContentStructured | null => {
  const validate = (obj: any): MapContentStructured | null => {
    if (obj && obj.sections && typeof obj.introduction === 'string') {
      return obj as MapContentStructured;
    }
    return null;
  };

  // If already an object, validate directly
  if (typeof raw === 'object' && raw !== null) {
    return validate(raw);
  }

  if (typeof raw !== 'string') {
    console.error('[parseMapContent] unexpected type:', typeof raw);
    return null;
  }

  const tryParse = (s: string): MapContentStructured | null => {
    try {
      return validate(JSON.parse(s));
    } catch {
      return null;
    }
  };

  // 1. Try direct parse
  let result = tryParse(raw);
  if (result) return result;

  // 2. Try extracting from markdown code blocks
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    result = tryParse(jsonMatch[1].trim());
    if (result) return result;
  }

  // 3. Try finding JSON object in the string
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    result = tryParse(raw.substring(firstBrace, lastBrace + 1));
    if (result) return result;
  }

  console.error('[parseMapContent] Failed to parse:', raw.substring(0, 200));
  return null;
};

/**
 * Build MapPDFData from questionnaire data + AI response.
 */
export const buildMapPDFData = (params: {
  mapContent: string;
  scores: { body: number; space: number; territory: number; identity: number; other: number };
  city: string;
  stayDuration: string;
  purchasingPower: string;
  userName: string;
}): MapPDFData | null => {
  const content = parseMapContent(params.mapContent);
  if (!content) return null;

  return {
    content,
    scores: params.scores,
    city: params.city,
    stayDuration: params.stayDuration,
    purchasingPower: params.purchasingPower,
    userName: params.userName,
    generatedAt: new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
  };
};
