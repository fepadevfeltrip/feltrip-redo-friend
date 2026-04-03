import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FeltripConcierge } from "./FeltripConcierge";
import { supabase } from "@/integrations/supabase/client";

type SubView = "hub" | "experts";

const TEXTS = {
  pt: {
    title: "Feltrip Concierge",
    subtitle: "Seu ecossistema de suporte na adaptação",
    experts: "Rede de Especialistas",
    expertsDesc: "Profissionais verificados por confiança",
    language: "Estúdio de Idiomas",
    languageDesc: "4h de conversa com IA Tutora de idioma de alta performance",
    back: "Voltar",
    referralTitle: "Você é usuário da nossa plataforma?",
    referralSubtitle: "Tem algum profissional para indicar?",
    referralName: "Seu nome",
    referralEmail: "Seu e-mail",
    referralMessage: "Conte-nos sobre o profissional que deseja indicar...",
    referralSend: "Enviar indicação",
    referralSending: "Enviando...",
    referralSuccess: "Indicação enviada com sucesso!",
    referralSuccessDesc: "Obrigado pela sua indicação. Entraremos em contato em breve.",
    referralError: "Erro ao enviar",
    referralErrorDesc: "Não foi possível enviar sua indicação. Tente novamente.",
    referralRequired: "Campos obrigatórios",
    referralRequiredDesc: "Preencha todos os campos.",
  },
  en: {
    title: "Feltrip Concierge",
    subtitle: "Your adaptation support ecosystem",
    experts: "Expert Network",
    expertsDesc: "Trust-verified professionals",
    language: "Language Studio",
    languageDesc: "4h conversation with high-performance AI Language Tutor",
    back: "Back",
    referralTitle: "Are you a user of our platform?",
    referralSubtitle: "Do you have a professional to recommend?",
    referralName: "Your name",
    referralEmail: "Your email",
    referralMessage: "Tell us about the professional you'd like to recommend...",
    referralSend: "Send referral",
    referralSending: "Sending...",
    referralSuccess: "Referral sent!",
    referralSuccessDesc: "Thank you for your referral. We'll be in touch soon.",
    referralError: "Error sending",
    referralErrorDesc: "Could not send your referral. Please try again.",
    referralRequired: "Required fields",
    referralRequiredDesc: "Please fill in all fields.",
  },
  es: {
    title: "Feltrip Concierge",
    subtitle: "Tu ecosistema de apoyo en la adaptación",
    experts: "Red de Especialistas",
    expertsDesc: "Profesionales verificados por confianza",
    language: "Estudio de Idiomas",
    languageDesc: "4h de conversación con IA Tutora de idioma de alto rendimiento",
    back: "Volver",
    referralTitle: "¿Eres usuario de nuestra plataforma?",
    referralSubtitle: "¿Tienes algún profesional para recomendar?",
    referralName: "Tu nombre",
    referralEmail: "Tu correo electrónico",
    referralMessage: "Cuéntanos sobre el profesional que deseas recomendar...",
    referralSend: "Enviar recomendación",
    referralSending: "Enviando...",
    referralSuccess: "¡Recomendación enviada!",
    referralSuccessDesc: "Gracias por tu recomendación. Nos pondremos en contacto pronto.",
    referralError: "Error al enviar",
    referralErrorDesc: "No se pudo enviar tu recomendación. Inténtalo de nuevo.",
    referralRequired: "Campos obligatorios",
    referralRequiredDesc: "Por favor, completa todos los campos.",
  },
};

export default function ConciergeHub() {
  const { i18n } = useTranslation();
  const lang = (i18n.language?.substring(0, 2) || "pt") as keyof typeof TEXTS;
  const t = TEXTS[lang] || TEXTS.pt;

  const [subView, setSubView] = useState<SubView>("hub");

  // Track concierge access
  const trackConciergeAccess = async (type: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("engagement_tracking").insert({
          user_id: user.id,
          activity_type: `concierge_${type}`,
        });
      }
    } catch {}
  };
  
  const [refName, setRefName] = useState("");
  const [refEmail, setRefEmail] = useState("");
  const [refMessage, setRefMessage] = useState("");
  const [refLoading, setRefLoading] = useState(false);
  const { toast } = useToast();

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refName.trim() || !refEmail.trim() || !refMessage.trim()) {
      toast({ title: t.referralRequired, description: t.referralRequiredDesc, variant: "destructive" });
      return;
    }
    setRefLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-suggestion', {
        body: { name: refName, email: refEmail, suggestion: `[INDICAÇÃO CONCIERGE] ${refMessage}` }
      });
      if (error) throw error;
      toast({ title: t.referralSuccess, description: t.referralSuccessDesc });
      setRefName(""); setRefEmail(""); setRefMessage("");
    } catch {
      toast({ title: t.referralError, description: t.referralErrorDesc, variant: "destructive" });
    } finally {
      setRefLoading(false);
    }
  };

  if (subView === "experts") {
    return <FeltripConcierge onBack={() => setSubView("hub")} />;
  }


  const cards = [
    {
      icon: BookOpen,
      title: t.experts,
      desc: t.expertsDesc,
      onClick: () => { trackConciergeAccess('experts'); setSubView("experts"); },
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="p-5 space-y-5 max-w-2xl mx-auto w-full">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/80">{t.title}</p>
          <h1 className="text-lg font-bold text-foreground mt-1">{t.subtitle}</h1>
        </div>

        <div className="space-y-3">
          {cards.map((card) => (
            <Card
              key={card.title}
              className="p-4 cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group"
              onClick={card.onClick}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-muted/60 group-hover:bg-primary/10 transition-colors shrink-0">
                  <card.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm">{card.title}</h3>
                  <p className="text-xs text-muted-foreground">{card.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Referral Form */}
        <Card className="p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground text-sm">{t.referralTitle}</h3>
            <p className="text-xs text-muted-foreground mt-1">{t.referralSubtitle}</p>
          </div>
          <form onSubmit={handleReferralSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ref-name" className="text-xs">{t.referralName}</Label>
              <Input id="ref-name" value={refName} onChange={(e) => setRefName(e.target.value)} disabled={refLoading} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ref-email" className="text-xs">{t.referralEmail}</Label>
              <Input id="ref-email" type="email" value={refEmail} onChange={(e) => setRefEmail(e.target.value)} disabled={refLoading} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ref-msg" className="text-xs">{t.referralMessage}</Label>
              <Textarea id="ref-msg" value={refMessage} onChange={(e) => setRefMessage(e.target.value)} className="min-h-[80px]" disabled={refLoading} />
            </div>
            <Button type="submit" className="w-full gap-2" size="sm" disabled={refLoading}>
              <Send className="h-4 w-4" />
              {refLoading ? t.referralSending : t.referralSend}
            </Button>
          </form>
        </Card>
      </div>

    </div>
  );
}