import { TERMS_TEXT_PT, TERMS_TEXT_EN, TERMS_TEXT_ES, APPLE_EULA_URL } from "@/components/app/constants/legalTexts";
import { isIOSDevice } from "@/lib/platform";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsPage = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = (i18n.language?.substring(0, 2) as "pt" | "en" | "es") || "pt";
  const isIOS = isIOSDevice();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Cult AI
        </button>
        <LanguageSelector />
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        {isIOS ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {lang === "en" ? "Our Terms of Use follow Apple's Standard EULA." : lang === "es" ? "Nuestros Términos de Uso siguen el EULA Estándar de Apple." : "Nossos Termos de Uso seguem o EULA Padrão da Apple."}
            </p>
            <a href={APPLE_EULA_URL} target="_blank" rel="noopener noreferrer" className="inline-block text-primary underline font-semibold">
              {lang === "en" ? "View Apple Standard EULA" : lang === "es" ? "Ver EULA Estándar de Apple" : "Ver EULA Padrão da Apple"}
            </a>
          </div>
        ) : (
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans">
            {lang === "en" ? TERMS_TEXT_EN : lang === "es" ? TERMS_TEXT_ES : TERMS_TEXT_PT}
          </pre>
        )}
      </main>
    </div>
  );
};

export default TermsPage;
