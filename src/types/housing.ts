export type Language = 'pt' | 'en' | 'es';

export interface TerritorySuggestion {
  bairro: string;
  vibe: string;
  descricaoVibe: string;
}

export interface RefugeResult {
  analisePoetica: string;
  perfilResumido: string;
  pilares: {
    corpo: string;
    territorio: string;
    outro: string;
    espaco: string;
    identidade: string;
  };
  sugestoes: TerritorySuggestion[];
  fechamento: string;
}

export interface HousingQuestion {
  id: string;
  pillar: string;
  question: string;
}

export interface HousingTranslation {
  welcomeTitle: string;
  welcomeSubtitle: string;
  welcomeDesc: string;
  btnStart: string;
  btnReset: string;
  pilarLabel: string;
  loadingMsg: string;
  resultTitle: string;
  suggestedNeighborhoods: string;
  waButton: string;
  inputPlaceholder: string;
  questions: HousingQuestion[];
}

export const TRANSLATIONS: Record<Language, HousingTranslation> = {
  pt: {
    welcomeTitle: "Cult AI",
    welcomeSubtitle: "Investigação de Estilo de Vida",
    welcomeDesc: "Onde a arquitetura encontra a alma. Vamos mapear seu ritmo para encontrar seu próximo refúgio no Rio.",
    btnStart: "Iniciar Investigação",
    btnReset: "Recomeçar",
    pilarLabel: "Pilar",
    loadingMsg: "Mapeando ritmos e vizinhanças...",
    resultTitle: "Seu Refúgio",
    suggestedNeighborhoods: "Bairros Sugeridos",
    waButton: "Quero anunciar imóveis aqui",
    inputPlaceholder: "Sua resposta...",
    questions: [
      { id: 'territorio', pillar: 'O RITMO', question: 'No seu dia a dia, o que te irrita mais no ambiente onde você vive?' },
      { id: 'espaco', pillar: 'A FRONTEIRA', question: 'Como você visualiza a divisão da sua casa? Integrada ou delimitada?' },
      { id: 'corpo', pillar: 'A LUZ', question: 'Como a luz natural influencia seu bem-estar em casa?' },
      { id: 'outro', pillar: 'A DINÂMICA', question: 'Sua casa é um bunker para solitude ou um palco para encontros?' },
      { id: 'identidade', pillar: 'VALOR', question: 'O que define valor para você: endereço icônico ou alma e história?' }
    ]
  },
  en: {
    welcomeTitle: "Cult AI",
    welcomeSubtitle: "Lifestyle Investigation",
    welcomeDesc: "Where architecture meets the soul. Let's map your rhythm to find your next refuge in Rio.",
    btnStart: "Start Investigation",
    btnReset: "Start Over",
    pilarLabel: "Pillar",
    loadingMsg: "Mapping rhythms and neighborhoods...",
    resultTitle: "Your Refuge",
    suggestedNeighborhoods: "Suggested Neighborhoods",
    waButton: "I want to list properties here",
    inputPlaceholder: "Your answer...",
    questions: [
      { id: 'territorio', pillar: 'RHYTHM', question: 'In your daily life, what annoys you most about your living environment?' },
      { id: 'espaco', pillar: 'BOUNDARY', question: 'How do you visualize your home layout? Open concept or clearly defined spaces?' },
      { id: 'corpo', pillar: 'LIGHT', question: 'How does natural light influence your well-being at home?' },
      { id: 'outro', pillar: 'DYNAMICS', question: 'Is your home a bunker for solitude or a stage for gatherings?' },
      { id: 'identidade', pillar: 'VALUE', question: 'What defines value for you: an iconic address or soul and history?' }
    ]
  },
  es: {
    welcomeTitle: "Cult AI",
    welcomeSubtitle: "Investigación de Estilo de Vida",
    welcomeDesc: "Donde la arquitectura se encuentra con el alma. Mapeemos tu ritmo para encontrar tu próximo refugio en Río.",
    btnStart: "Iniciar Investigación",
    btnReset: "Reiniciar",
    pilarLabel: "Pilar",
    loadingMsg: "Mapeando ritmos y vecindarios...",
    resultTitle: "Tu Refugio",
    suggestedNeighborhoods: "Barrios Sugeridos",
    waButton: "Quiero anunciar inmuebles aquí",
    inputPlaceholder: "Tu respuesta...",
    questions: [
      { id: 'territorio', pillar: 'EL RITMO', question: 'En tu día a día, ¿qué es lo que más te irrita del entorno donde vives?' },
      { id: 'espaco', pillar: 'LA FRONTERA', question: '¿Cómo visualizas la división de tu casa? ¿Integrada o delimitada?' },
      { id: 'corpo', pillar: 'LA LUZ', question: '¿Cómo influye la luz natural en tu bienestar en casa?' },
      { id: 'outro', pillar: 'LA DINÁMICA', question: '¿Tu casa es un búnker para la soledad o un escenario para encuentros?' },
      { id: 'identidade', pillar: 'VALOR', question: '¿Qué define el valor para ti: una dirección icónica o alma e historia?' }
    ]
  }
};
