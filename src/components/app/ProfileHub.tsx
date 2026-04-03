import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CircleDot, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Profile from "@/pages/Profile";
import CultChat from "./CultChat";

type SubView = "profile" | "cartography";

const TEXTS = {
  pt: { cartography: "Minhas Cartografias", cartographyDesc: "Histórico das suas descobertas com a Cult AI", back: "Voltar" },
  en: { cartography: "My Cartographies", cartographyDesc: "History of your discoveries with Cult AI", back: "Back" },
  es: { cartography: "Mis Cartografías", cartographyDesc: "Historial de tus descubrimientos con Cult AI", back: "Volver" },
};

export default function ProfileHub() {
  const { i18n } = useTranslation();
  const lang = (i18n.language?.substring(0, 2) || "pt") as keyof typeof TEXTS;
  const t = TEXTS[lang] || TEXTS.pt;
  const [subView, setSubView] = useState<SubView>("profile");

  if (subView === "cartography") {
    return (
      <div className="flex flex-col min-h-full">
        <div className="p-4 border-b border-border/50">
          <Button variant="ghost" size="sm" onClick={() => setSubView("profile")} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> {t.back}
          </Button>
        </div>
        <CultChat embedded initialFlow="history" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <Profile />
      <div className="px-6 pb-24">
        <Card
          className="p-4 cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group"
          onClick={() => setSubView("cartography")}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted/60 group-hover:bg-primary/10 transition-colors shrink-0">
              <CircleDot className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">{t.cartography}</h3>
              <p className="text-xs text-muted-foreground">{t.cartographyDesc}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
