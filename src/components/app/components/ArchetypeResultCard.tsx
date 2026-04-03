import React, { useState } from "react";
import { Share2, Lock } from "lucide-react";
import type { MRPData, Language } from "../types";

interface ArchetypeResultCardProps {
  data: MRPData;
  lang?: Language;
  city?: string;
  onShare: () => void;
  onUnlock: () => void;
  isUnlocked: boolean;
}

const SUBTITLES: Record<string, Record<string, string>> = {
  pt: {
    share: "Compartilhar",
    unlock: "Desbloquear minha Gema Anti-Cilada de Hoje",
    tagline: "Meu arquétipo hoje em",
  },
  en: {
    share: "Share",
    unlock: "Unlock my Anti-Trap Gem for Today",
    tagline: "My archetype today in",
  },
  es: {
    share: "Compartir",
    unlock: "Desbloquear mi Gema Anti-Trampa de Hoy",
    tagline: "Mi arquetipo hoy en",
  },
};

export const ArchetypeResultCard: React.FC<ArchetypeResultCardProps> = ({
  data,
  lang = "pt",
  city = "",
  onShare,
  onUnlock,
  isUnlocked,
}) => {
  const { emotionalStatus, poeticProposition } = data;
  const t = SUBTITLES[lang] || SUBTITLES.pt;

  const handleShareClick = () => {
    onShare();
  };

  return (
    <div className="w-full flex flex-col items-center animate-fade-in-up">
      {/* ARCHETYPE CARD — Dark, minimal, typographic */}
      <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
        <div
          className="relative px-8 py-14 flex flex-col items-center justify-center text-center"
          style={{
            background: "linear-gradient(160deg, #0D1F1A 0%, #1A1A2E 60%, #0D1F1A 100%)",
            minHeight: "360px",
          }}
        >
          {/* Subtle grain texture via CSS */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Top branding */}
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#E8896A] mb-2">
            ✦ CULT AI
          </p>
          {city && (
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#C4B8A0] mb-8">
              {city.toUpperCase()}
            </p>
          )}

          {/* ARCHETYPE NAME — GIANT serif */}
          <h2
            className="font-serif font-bold text-[#F5EFE0] leading-[1.05] tracking-tight mb-4"
            style={{ fontSize: "clamp(2rem, 8vw, 3.5rem)" }}
          >
            {emotionalStatus}
          </h2>

          {/* Subtitle / ironic tagline */}
          {poeticProposition && (
            <p className="font-serif italic text-[#C4B8A0] text-sm sm:text-base max-w-xs leading-relaxed">
              "{poeticProposition}"
            </p>
          )}

          {/* Tagline */}
          <p className="mt-6 text-[10px] tracking-[0.2em] uppercase text-[#C4B8A0]/60">
            {t.tagline} {city || "—"}
          </p>
        </div>
      </div>

      {/* SHARE BUTTON — native share */}
      <button
        onClick={handleShareClick}
        className="mt-6 flex items-center gap-2.5 px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest
          bg-[#E8896A] text-white shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-95 transition-all duration-200"
      >
        <Share2 className="h-4 w-4" />
        {t.share}
      </button>

      {/* UNLOCK BUTTON */}
      {!isUnlocked && (
        <button
          onClick={onUnlock}
          className="mt-4 w-full max-w-md flex items-center justify-center gap-2.5 px-6 py-5 rounded-2xl font-bold text-base
            bg-gradient-to-r from-[#EAA823] to-[#E8896A] text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-200
            animate-pulse hover:animate-none"
        >
          <Lock className="h-5 w-5" />
          {t.unlock}
        </button>
      )}

      {/* Branding footer */}
      <p className="mt-8 text-[10px] tracking-[0.15em] uppercase text-muted-foreground/50">
        cult.feltrip.com
      </p>
    </div>
  );
};
