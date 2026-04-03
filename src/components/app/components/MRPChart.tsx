import React, { useState } from "react";
import { Share2 } from "lucide-react";
import { MRPData, Language } from "../types";
import { COLORS, CONTENT } from "../constants";
import { ArchetypeShareCard } from "./ArchetypeShareCard"; // Certifique-se que o caminho está correto

interface MRPChartProps {
  data: MRPData;
  lang?: Language;
  city?: string; // Adicionei city para o card de compartilhar
}

export const MRPChart: React.FC<MRPChartProps> = ({ data, lang = "pt", city = "São Paulo" }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { scores, emotionalStatus, poeticProposition } = data;
  const t = CONTENT[lang];

  const calculatePercentage = (val: number) => Math.round((val / 5) * 100);

  // Chart Configuration
  const viewBoxSize = 360;
  const center = viewBoxSize / 2;
  const radius = 90;
  const labelRadius = radius + 30;
  const angleSlice = (Math.PI * 2) / 5;

  const getCoordinates = (value: number, index: number, r: number = radius) => {
    const angle = index * angleSlice - Math.PI / 2;
    const normalizedValue = (value / 5) * r;
    const x = center + normalizedValue * Math.cos(angle);
    const y = center + normalizedValue * Math.sin(angle);
    return { x, y };
  };

  const points = [scores.body, scores.territory, scores.identity, scores.other, scores.space]
    .map((score, i) => {
      const { x, y } = getCoordinates(score, i);
      return `${x},${y}`;
    })
    .join(" ");

  const labels = [
    { text: t.pillars.body, val: scores.body },
    { text: t.pillars.territory, val: scores.territory },
    { text: t.pillars.identity, val: scores.identity },
    { text: t.pillars.other, val: scores.other },
    { text: t.pillars.space, val: scores.space },
  ];

  return (
    <div className="w-full flex flex-col items-center bg-white dark:bg-boba-darkCard rounded-2xl p-4 sm:p-6 my-4 shadow-lg border border-boba-teal/10 dark:border-boba-offWhite/10 animate-fade-in-up overflow-hidden">
      {/* CABEÇALHO DO RESULTADO */}
      <div className="text-center mb-2 w-full">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t.diagnosisTitle}</p>
        <h3 className="text-xl sm:text-2xl font-serif font-bold text-boba-teal dark:text-boba-mustard leading-tight px-2 break-words">
          {emotionalStatus}
        </h3>
      </div>

      {/* GRÁFICO DE RADAR */}
      <div className="relative w-full max-w-[340px] aspect-square mb-4">
        <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full overflow-visible">
          {[1, 2, 3, 4, 5].map((level) => (
            <circle
              key={level}
              cx={center}
              cy={center}
              r={(level / 5) * radius}
              fill="none"
              stroke="currentColor"
              className="text-gray-100 dark:text-gray-700"
              strokeWidth="1"
            />
          ))}

          {[0, 1, 2, 3, 4].map((i) => {
            const { x, y } = getCoordinates(5, i);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="currentColor"
                className="text-gray-200 dark:text-gray-600"
                strokeWidth="1"
              />
            );
          })}

          <polygon
            points={points}
            fill="rgba(234, 168, 35, 0.4)"
            stroke="#EAA823"
            strokeWidth="2.5"
            strokeLinejoin="round"
            className="drop-shadow-sm transition-all duration-500 ease-out"
          />

          {labels.map((item, i) => {
            const { x, y } = getCoordinates(5, i, labelRadius);
            let anchor: "middle" | "start" | "end" = "middle";
            let baseline: "auto" | "middle" | "hanging" = "middle";

            if (i === 0) baseline = "auto";
            if (i === 1) anchor = "start";
            if (i === 2) {
              anchor = "start";
              baseline = "hanging";
            }
            if (i === 3) {
              anchor = "end";
              baseline = "hanging";
            }
            if (i === 4) anchor = "end";

            return (
              <g key={i} transform={`translate(${x}, ${y})`}>
                <text
                  textAnchor={anchor}
                  dominantBaseline={baseline}
                  className="text-[11px] sm:text-[13px] uppercase font-bold tracking-widest fill-boba-teal dark:fill-boba-offWhite"
                >
                  {item.text}
                </text>
                <text
                  textAnchor={anchor}
                  dominantBaseline={baseline}
                  dy="1.3em"
                  className="text-[10px] sm:text-[12px] font-mono fill-boba-coral font-bold"
                >
                  {calculatePercentage(item.val)}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* PROPOSIÇÃO POÉTICA */}
      <div className="bg-boba-offWhite dark:bg-black/20 p-5 rounded-xl border-l-4 border-boba-coral w-full mb-6">
        <p className="text-xs font-bold text-boba-coral uppercase tracking-widest mb-2">{t.poeticTitle}</p>
        <p className="text-base font-serif italic text-gray-700 dark:text-gray-300 leading-relaxed text-justify">
          "{poeticProposition}"
        </p>
      </div>

      {/* BOTÃO DE COMPARTILHAR - SEMPRE VISÍVEL */}
      <button
        onClick={() => setIsShareModalOpen(true)}
        className="flex items-center gap-2 px-8 py-4 bg-boba-coral text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform active:scale-95"
      >
        <Share2 className="h-5 w-5" />
        Compartilhar Meu Arquétipo
      </button>

      {/* MODAL DE COMPARTILHAMENTO */}
      {isShareModalOpen && (
        <ArchetypeShareCard mrpData={data} city={city} language={lang} onClose={() => setIsShareModalOpen(false)} />
      )}
    </div>
  );
};
