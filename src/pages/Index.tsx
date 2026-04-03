import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LEGAL_TEXT_PT, LEGAL_TEXT_EN, LEGAL_TEXT_ES } from "@/components/app/constants/legalTexts";
import CultChat from "@/components/app/CultChat";
import { FeltripLogo } from "@/components/FeltripLogo";
import { CookieConsent } from "@/components/CookieConsent";
import { NewsPreferencesModal } from "@/components/app/components/NewsPreferencesModal";
import { LanguageSelector } from "@/components/LanguageSelector";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CONTENT } from "@/components/app/constants";
import { useTranslation } from "react-i18next";

const Index = () => {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading, refreshProfile } = useProfile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [devLoading, setDevLoading] = useState(false);
  const [showLegalDialog, setShowLegalDialog] = useState(false);
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const lang = (i18n.language?.substring(0, 2) || "pt") as keyof typeof CONTENT;
  const t = CONTENT[lang] || CONTENT.pt;

  // Handle payment success/cancel query params
  useEffect(() => {
    const payment = searchParams.get("payment");
    const plan = searchParams.get("plan");

    if (payment === "success") {
      toast({
        title: (t as any).paymentConfirmed || "Pagamento confirmado! 🎉",
        description: plan === "gem_single"
          ? ((t as any).paymentNewSession || "Sua nova sessão já está disponível.")
          : ((t as any).paymentActivating || "Seu acesso está sendo ativado. Aguarde alguns segundos..."),
      });
      searchParams.delete("payment");
      searchParams.delete("plan");
      setSearchParams(searchParams, { replace: true });

      // Poll for webhook to process the payment
      if (user?.id) {
        const pollInterval = setInterval(async () => {
          let processed = false;

          if (plan === "personal_map") {
            // Personal map: check map_purchases table
            const { data } = await supabase
              .from("map_purchases")
              .select("id")
              .eq("user_id", user.id)
              .limit(1) as any;
            processed = !!(data && data.length > 0);
          } else {
            // All other plans: check chat_access
            const { data: chatData } = await supabase
              .from("chat_access")
              .select("id")
              .eq("user_id", user.id)
              .gt("expires_at", new Date().toISOString())
              .limit(1);
            processed = !!(chatData && chatData.length > 0);
          }

          if (processed) {
            clearInterval(pollInterval);
            await refreshProfile();
            
            if (plan === "explorer") {
              navigate("/app", { replace: true });
            }
            // personal_map / gem_single — stay, data is fresh
          }
        }, 2000);
        setTimeout(() => clearInterval(pollInterval), 30000);
      }
    } else if (payment === "canceled") {
      toast({
        title: (t as any).paymentCanceled || "Pagamento cancelado",
        description: (t as any).paymentTryAgain || "Você pode tentar novamente quando quiser.",
        variant: "destructive",
      });
      searchParams.delete("payment");
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  useEffect(() => {
    if (!profileLoading && user && (profile?.user_tier === 'premium_company' || profile?.user_tier === 'premium_company_plus_language')) {
      navigate('/premium', { replace: true });
    }
  }, [user, profile, profileLoading, navigate]);

  const handleDevLogin = async () => {
    setDevLoading(true);
    const pwd = prompt("Senha do talkawaylanguage@gmail.com:");
    if (!pwd) {setDevLoading(false);return;}
    const { error } = await supabase.auth.signInWithPassword({
      email: "talkawaylanguage@gmail.com",
      password: pwd
    });
    if (error) alert("Erro: " + error.message);
    setDevLoading(false);
  };

  if (user && profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 overflow-auto">
        <CultChat />
      </main>
      <footer className="border-t border-border/50 bg-card/80 backdrop-blur-sm py-3 flex flex-col items-center gap-1 shrink-0">
        <FeltripLogo className="h-7" />
        <button
          onClick={() => setShowLegalDialog(true)}
          className="text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors underline underline-offset-2"
        >
          {lang === "en" ? "Terms of Use and Privacy Policy" : lang === "es" ? "Términos de Uso y Política de Privacidad" : "Termos de Uso e Política de Privacidade"}
        </button>
      </footer>

      <Dialog open={showLegalDialog} onOpenChange={setShowLegalDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Feltrip Cultural AI — Cult AI</DialogTitle>
            <DialogDescription>
              {lang === "en" ? "Terms of Use and Privacy Policy" : lang === "es" ? "Términos de Uso y Política de Privacidad" : "Termos de Uso e Política de Privacidade"}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[65vh] pr-4">
            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {lang === "en" ? LEGAL_TEXT_EN : lang === "es" ? LEGAL_TEXT_ES : LEGAL_TEXT_PT}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      <CookieConsent />
      {user && <NewsPreferencesModal userId={user.id} />}
    </div>);
};

export default Index;
