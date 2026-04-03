import React from "react";
import { CultCharacter } from "./CultCharacter";
import { useTranslation } from "react-i18next";

interface HookScreenProps {
  onStart: () => void;
}

const COPY = {
  pt: {
    title: "A cidade sabe quem você é.",
    subtitle: "Você sabe?",
    cta: "Começar Mapeamento",
    tagline: "Descubra seu arquétipo urbano em 1 minuto. Grátis.",
  },
  en: {
    title: "The city knows who you are.",
    subtitle: "Do you?",
    cta: "Start Mapping",
    tagline: "Discover your urban archetype in 1 minute. Free.",
  },
  es: {
    title: "La ciudad sabe quién eres.",
    subtitle: "¿Y tú?",
    cta: "Comenzar Mapeo",
    tagline: "Descubre tu arquetipo urbano en 1 minuto. Gratis.",
  },
};

export const HookScreen: React.FC<HookScreenProps> = ({ onStart }) => {
  const { i18n } = useTranslation();
  const lang = (i18n.language?.substring(0, 2) as "pt" | "en" | "es") || "pt";
  const t = COPY[lang] || COPY.pt;

  return (
    <div
      className="flex flex-col items-center justify-center h-full w-full px-6 select-none bg-background"
    >
      <CultCharacter variant="explorer" size="lg" animate />

      <h2
        className="mt-8 font-serif font-bold text-foreground text-center leading-tight"
        style={{ fontSize: "clamp(1.6rem, 6vw, 2.4rem)" }}
      >
        {t.title}
      </h2>
      <h2
        className="font-serif font-bold text-accent text-center leading-tight"
        style={{ fontSize: "clamp(1.6rem, 6vw, 2.4rem)" }}
      >
        {t.subtitle}
      </h2>

      <p className="mt-4 text-sm text-muted-foreground text-center max-w-xs">
        {t.tagline}
      </p>

      <button
        onClick={onStart}
        className="mt-10 px-10 py-4 rounded-2xl font-bold text-sm uppercase tracking-[0.15em]
          bg-accent text-accent-foreground
          shadow-[0_4px_20px_rgba(255,125,107,0.3)] hover:shadow-[0_4px_28px_rgba(255,125,107,0.45)]
          hover:scale-[1.03] active:scale-95 transition-all duration-300"
      >
        {t.cta}
      </button>

      <p className="mt-16 text-[9px] tracking-[0.2em] uppercase text-muted-foreground/50 font-bold">
        ✦ Cult AI — by Feltrip
      </p>
    </div>
  );
};
