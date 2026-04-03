/** 
 * Structure the Amazon Bedrock agent should return for the deep map.
 * This interface defines the JSON contract between the AI agent and the PDF generator.
 */
export interface MapContentStructured {
  title: string;
  subtitle: string;
  introduction: string;
  sections: {
    body: PillarSection;
    space: PillarSection;
    territory: PillarSection;
    identity: PillarSection;
    other: PillarSection;
  };
  purchasing_power_insights: string;
  conclusion: string;
  poetic_proposition: string;
}

export interface PillarSection {
  title: string;
  summary: string;
  deep_analysis: string;
  recommendations: string[];
  places: PlaceRecommendation[];
}

export interface PlaceRecommendation {
  name: string;
  description: string;
  why: string;
  neighborhood: string;
}

export interface MapPDFData {
  content: MapContentStructured;
  scores: {
    body: number;
    space: number;
    territory: number;
    identity: number;
    other: number;
  };
  city: string;
  stayDuration: string;
  purchasingPower: string;
  userName: string;
  generatedAt: string;
}
