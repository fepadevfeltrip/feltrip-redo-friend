import { PRIVACY_TEXT_PT, PRIVACY_TEXT_EN, PRIVACY_TEXT_ES } from "@/components/app/constants/legalTexts";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPage = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = (i18n.language?.substring(0, 2) as "pt" | "en" | "es") || "pt";
  const text = lang === "en" ? PRIVACY_TEXT_EN : lang === "es" ? PRIVACY_TEXT_ES : PRIVACY_TEXT_PT;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Cult AI
        </button>
        <LanguageSelector />
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <pre className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans">{text}</pre>
      </main>
    </div>
  );
};

export default PrivacyPage;
