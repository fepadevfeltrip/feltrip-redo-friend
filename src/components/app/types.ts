// Types for CultChat - fill in manually with real types
export type Language = "pt" | "en" | "es" | "fr" | "zh";
export type PortalType = string;
export type FlowState = string;
export type City = string;

export interface Message {
  role: string;
  text: string;
  [key: string]: any;
}

export interface MRPScores {
  body: number;
  territory: number;
  identity: number;
  other: number;
  space: number;
  [key: string]: number;
}

export interface MRPData {
  profile?: string;
  scores: MRPScores;
  [key: string]: any;
}

export interface SavedSession {
  id?: string;
  [key: string]: any;
}

export interface Gem {
  [key: string]: any;
}

export interface DiagnosisQuestion {
  id: string;
  category: string;
  label: string;
  question: string;
  lowLabel: string;
  highLabel: string;
}
