import React, { useRef, useEffect, useState, useCallback } from "react";
import { X, Download, Share2 } from "lucide-react";
import type { MRPData, Language } from "../types";

interface ArchetypeShareCardProps {
  mrpData: MRPData;
  city: string;
  language: Language;
  onClose: () => void;
}

const ARCHETYPE_CONFIGS: Record<string, { accent: string; quotes: Record<string, string> }> = {
  HUNGRY_EXPLORER: { accent: "#E8896A", quotes: { pt: "Você não escolhe lugares. Você coleciona experiências.", en: "You don't choose places. You collect experiences.", es: "No eliges lugares. Coleccionas experiencias." } },
  NIGHT_OWL: { accent: "#7B5EA7", quotes: { pt: "A cidade que você habita começa quando as outras adormecem.", en: "The city you inhabit begins when others fall asleep.", es: "La ciudad que habitas comienza cuando las demás se duermen." } },
  ROOTED_WANDERER: { accent: "#4A9E7A", quotes: { pt: "Suas raízes não estão no chão. Estão em você.", en: "Your roots aren't in the ground. They're in you.", es: "Tus raíces no están en el suelo. Están en ti." } },
  SILENT_OBSERVER: { accent: "#5B8FA8", quotes: { pt: "Você vê o que os outros não param para olhar.", en: "You see what others don't stop to notice.", es: "Ves lo que otros no se detienen a mirar." } },
  URBAN_MYSTIC: { accent: "#C4A35A", quotes: { pt: "A cidade é seu templo. Cada esquina, um altar.", en: "The city is your temple. Every corner, an altar.", es: "La ciudad es tu templo. Cada esquina, un altar." } },
};

const DEFAULT_CONFIG = { accent: "#E8896A", quotes: { pt: "Sua cidade ainda está por dentro de você. Vai fundo.", en: "Your city is still inside you. Go deep.", es: "Tu ciudad aún está dentro de ti. Ve a fondo." } };

const SHARE_BTN: Record<string, { download: string; share: string; curiosity: string; command: string; web: string }> = {
  pt: { download: "Baixar imagem", share: "Compartilhar", curiosity: "Qual é o seu arquétipo urbano?", command: "Baixe Cult AI grátis nas lojas", web: "ou acesse cult.feltrip.com" },
  en: { download: "Download image", share: "Share", curiosity: "What's your urban archetype?", command: "Download Cult AI free on app stores", web: "or visit cult.feltrip.com" },
  es: { download: "Descargar imagen", share: "Compartir", curiosity: "¿Cuál es tu arquetipo urbano?", command: "Descarga Cult AI gratis en las tiendas", web: "o accede a cult.feltrip.com" },
};

const NUDGE_TEXT: Record<string, string> = {
  pt: "Curioso sobre suas Gems? Elas estão esperando por você. →",
  en: "Curious about your Gems? They're waiting for you. →",
  es: "¿Curioso sobre tus Gems? Te están esperando. →",
};

export const ArchetypeShareCard: React.FC<ArchetypeShareCardProps> = ({ mrpData, city, language, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showNudge, setShowNudge] = useState(false);
  const lang = ["pt", "en", "es"].includes(language) ? language : "pt";

  const archetype = mrpData.emotionalStatus || "EXPLORER";
  const archetypeKey = Object.keys(ARCHETYPE_CONFIGS).find((k) => archetype.toUpperCase().includes(k));
  const config = archetypeKey ? ARCHETYPE_CONFIGS[archetypeKey] : DEFAULT_CONFIG;
  const btnText = SHARE_BTN[lang] || SHARE_BTN.pt;

  const drawCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 1080, H = 1920;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#0D1F1A"); grad.addColorStop(1, "#1A1A2E");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    // Grain
    for (let i = 0; i < W * H * 0.03; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
      ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }

    // TOP: Logo + City
    ctx.font = "bold 28px Georgia, serif"; ctx.fillStyle = "#E8DCC8"; ctx.textAlign = "left";
    ctx.fillText("✦ CULT AI", 60, 200);
    ctx.font = "600 24px Georgia, serif"; ctx.fillStyle = config.accent; ctx.textAlign = "right";
    ctx.fillText((city || "").toUpperCase(), W - 60, 200);

    // CENTER: Archetype name — GIANT, no radar
    const nameLines = archetype.toUpperCase().split(/[\s_]+/);
    ctx.textAlign = "center"; ctx.fillStyle = "#F5EFE0";
    const maxWidth = W - 160;
    let fontSize = nameLines.length > 1 ? 110 : 130;
    for (const line of nameLines) {
      ctx.font = `bold ${fontSize}px Georgia, serif`;
      while (ctx.measureText(line).width > maxWidth && fontSize > 40) { fontSize -= 4; ctx.font = `bold ${fontSize}px Georgia, serif`; }
    }
    ctx.font = `bold ${fontSize}px Georgia, serif`;
    const centerY = H * 0.35;
    nameLines.forEach((line, i) => ctx.fillText(line, W / 2, centerY + i * (fontSize + 10)));

    // Subtitle
    const subtitleY = centerY + nameLines.length * (fontSize + 10) + 30;
    const subtitleTexts: Record<string, string> = {
      pt: `Meu arquétipo hoje em ${city || "minha cidade"}`,
      en: `My archetype today in ${city || "my city"}`,
      es: `Mi arquetipo hoy en ${city || "mi ciudad"}`,
    };
    ctx.font = "italic 32px Georgia, serif"; ctx.fillStyle = config.accent; ctx.textAlign = "center";
    ctx.fillText(subtitleTexts[lang] || subtitleTexts.pt, W / 2, subtitleY);

    // Poetic proposition
    if (mrpData.poeticProposition) {
      const poeticY = subtitleY + 80;
      ctx.font = "italic 26px Georgia, serif"; ctx.fillStyle = "#C4B8A0"; ctx.textAlign = "center";
      const words = mrpData.poeticProposition.split(" ");
      let line = ""; const lines: string[] = [];
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > W - 200) { lines.push(line); line = word; } else { line = test; }
      }
      if (line) lines.push(line);
      lines.forEach((l, i) => ctx.fillText(`"${i === 0 ? "" : ""}${l}${i === lines.length - 1 ? "" : ""}`, W / 2, poeticY + i * 36));
    }

    // BOTTOM — 3-line CTA for Stories
    const bottomY = H - 180;
    ctx.font = "24px sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.textAlign = "center";
    ctx.fillText(btnText.curiosity, W / 2, bottomY);
    ctx.font = "bold 34px sans-serif"; ctx.fillStyle = config.accent;
    ctx.fillText(btnText.command, W / 2, bottomY + 60);
    ctx.font = "18px sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillText(btnText.web, W / 2, bottomY + 105);

    setImageUrl(canvas.toDataURL("image/png"));
  }, [mrpData, city, language, archetype, config, btnText, lang]);

  useEffect(() => { drawCard(); }, [drawCard]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.download = `cult-ai-archetype-${archetype.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = imageUrl; link.click();
    setShowNudge(true);
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await new Promise<Blob>((resolve) => canvasRef.current!.toBlob((b) => resolve(b!), "image/png"));
      const file = new File([blob], "cult-ai-archetype.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else if (navigator.share) {
        await navigator.share({ title: "Cult AI", text: `${archetype} — cult.feltrip.com` });
      } else { handleDownload(); }
    } catch (e) { console.error("Share failed", e); }
    setShowNudge(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-[#0D1F1A] rounded-3xl overflow-hidden shadow-2xl">
        <button onClick={onClose} className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
          {imageUrl ? <img src={imageUrl} alt="Archetype Card" className="w-full max-h-[60vh] object-contain rounded-2xl" /> : <div className="w-full aspect-[9/16] bg-black/30 rounded-2xl animate-pulse" />}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <div className="p-4 space-y-3 border-t border-white/10">
          <div className="flex gap-3">
            <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-all">
              <Download className="h-4 w-4" /> {btnText.download}
            </button>
            <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#E8896A] hover:bg-[#d47a5e] text-white rounded-xl font-bold text-sm transition-all">
              <Share2 className="h-4 w-4" /> {btnText.share}
            </button>
          </div>
          <p className="text-center text-[10px] text-white/40">Feito com Cult AI · cult.feltrip.com</p>
          {showNudge && <button onClick={onClose} className="block w-full text-center text-sm text-[#E8896A] hover:text-white transition-colors py-2 font-medium">{NUDGE_TEXT[lang] || NUDGE_TEXT.pt}</button>}
        </div>
      </div>
    </div>
  );
};
