import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Copy, Gift, Loader2, PartyPopper, Share2, Sparkles } from "lucide-react";
import { openApplePurchase as openCheckout } from "@/lib/appleIAP";

const FREE_PROVIDERS = [
  "gmail.com", "googlemail.com",
  "hotmail.com", "hotmail.co.uk", "hotmail.fr",
  "outlook.com", "outlook.co",
  "yahoo.com", "yahoo.com.br", "yahoo.co.uk",
  "icloud.com", "me.com", "mac.com",
  "aol.com", "protonmail.com", "proton.me",
  "live.com", "msn.com", "uol.com.br",
  "bol.com.br", "terra.com.br", "ig.com.br",
  "mail.com", "zoho.com", "yandex.com",
];

interface CultSquadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "input" | "loading" | "tracker" | "unlocked";

const CultSquadModal = ({ open, onOpenChange }: CultSquadModalProps) => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const lang = i18n.language?.substring(0, 2) || "pt";

  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [domain, setDomain] = useState("");
  const [squadCount, setSquadCount] = useState(0);

  const t = labels[lang as keyof typeof labels] || labels.pt;

  const resetState = () => {
    setStep("input");
    setEmail("");
    setPosition("");
    setInstitutionName("");
    setDomain("");
    setSquadCount(0);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) resetState();
    onOpenChange(v);
  };

  const validateAndSubmit = async () => {
    if (!user) {
      toast.error(t.loginFirst);
      return;
    }

    const atIndex = email.indexOf("@");
    if (atIndex === -1) {
      toast.error(t.invalidEmail);
      return;
    }

    const extractedDomain = email.substring(atIndex + 1).toLowerCase().trim();
    if (!extractedDomain || !extractedDomain.includes(".")) {
      toast.error(t.invalidEmail);
      return;
    }

    if (FREE_PROVIDERS.includes(extractedDomain)) {
      toast.error(t.freeProvider);
      return;
    }

    setStep("loading");

    try {
      // Upsert squad entry
      const { error: insertError } = await supabase
        .from("institutional_squads" as any)
        .upsert(
          {
            user_id: user.id,
            institutional_email: email.toLowerCase().trim(),
            domain: extractedDomain,
            position: position.trim() || null,
            institution_name: institutionName.trim() || null,
          } as any,
          { onConflict: "user_id" }
        );

      if (insertError) {
        console.error("Squad insert error:", insertError);
        toast.error(t.errorGeneric);
        setStep("input");
        return;
      }

      // Get count for domain
      const { data: countData, error: countError } = await supabase.rpc(
        "get_squad_count" as any,
        { p_domain: extractedDomain }
      );

      const count = countError ? 1 : (countData as number) || 1;

      setDomain(extractedDomain);
      setSquadCount(count);
      setStep(count >= 5 ? "unlocked" : "tracker");
    } catch {
      toast.error(t.errorGeneric);
      setStep("input");
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/?squad=${domain}`;
    navigator.clipboard.writeText(link);
    toast.success(t.linkCopied);
  };

  const handleDiscountCheckout = async (priceKey: "gem_single" | "explorer") => {
    if (!user) {
      toast.error(t.loginFirst);
      return;
    }
    await openCheckout(priceKey);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-accent" />
            {t.title}
          </DialogTitle>
          {step === "input" && (
            <DialogDescription>{t.description}</DialogDescription>
          )}
        </DialogHeader>

        {/* Step 1: Email Input */}
        {step === "input" && (
          <div className="space-y-3 pt-2">
            <Input
              type="email"
              placeholder="voce@suaempresa.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="text"
              placeholder={t.institutionPlaceholder}
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
            />
            <Input
              type="text"
              placeholder={t.positionPlaceholder}
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && validateAndSubmit()}
            />
            <Button className="w-full" onClick={validateAndSubmit}>
              {t.verify}
            </Button>
          </div>
        )}

        {/* Step 2: Loading */}
        {step === "loading" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t.verifying}</p>
          </div>
        )}

        {/* Step 3: Tracker */}
        {step === "tracker" && (
          <div className="space-y-5 pt-2">
            <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-center">
              <p className="text-sm font-semibold text-primary">
                {t.domainDetected.replace("{domain}", `@${domain}`)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.progress}</span>
                <span className="font-bold text-primary">{squadCount}/5</span>
              </div>
              <Progress value={(squadCount / 5) * 100} className="h-3" />
            </div>

            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              {t.waitingMessage.replace("{remaining}", String(5 - squadCount))}
            </p>

            <Button
              variant="outline"
              className="w-full gap-2 border-dashed border-primary/40"
              onClick={copyInviteLink}
            >
              <Share2 className="h-4 w-4" />
              {t.copyLink}
            </Button>
          </div>
        )}

        {/* Step 4: Unlocked */}
        {step === "unlocked" && (
          <div className="space-y-5 pt-2 text-center">
            <div className="flex flex-col items-center gap-2">
              <PartyPopper className="h-10 w-10 text-accent" />
              <p className="text-lg font-bold text-foreground">{t.unlocked}</p>
              <p className="text-sm text-muted-foreground">{t.unlockedSub}</p>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => handleDiscountCheckout("gem_single")}
              >
                {t.buyExplorer}
              </Button>
              <Button
                className="w-full"
                onClick={() => handleDiscountCheckout("explorer")}
              >
                {t.buyImmersion}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const labels = {
  pt: {
    title: "Desbloqueie 50% OFF com o seu Squad",
    description:
      "Insira seu e-mail institucional ou corporativo. Se 5 pessoas da sua organização entrarem, todos ganham 50% de desconto vitalício em todos os planos.",
    verify: "Verificar Domínio",
    verifying: "Verificando domínio…",
    invalidEmail: "Por favor, insira um e-mail válido.",
    freeProvider: "Por favor, use um e-mail corporativo ou universitário válido.",
    loginFirst: "Faça login primeiro.",
    errorGeneric: "Ocorreu um erro. Tente novamente.",
    domainDetected: "Domínio {domain} detectado!",
    progress: "Colegas ativados",
    waitingMessage:
      "Você está na fila de espera VIP! Faltam apenas {remaining} colegas do seu domínio para liberar os 50% de desconto para todo mundo.",
    copyLink: "Copiar link de convite",
    linkCopied: "Link copiado! Envie para seus colegas.",
    unlocked: "Squad Desbloqueado! 🎉",
    unlockedSub: "Vocês conquistaram 50% de desconto vitalício.",
    buyExplorer: "Explorador com 50% OFF",
    buyImmersion: "Imersão com 50% OFF",
    institutionPlaceholder: "Nome da instituição (ex: USP, Google)",
    positionPlaceholder: "Sua posição (ex: estudante, gerente)",
  },
  en: {
    title: "Unlock 50% OFF with your Squad",
    description:
      "Enter your institutional or corporate email. If 5 people from your organization join, everyone gets a lifetime 50% discount on all plans.",
    verify: "Verify Domain",
    verifying: "Verifying domain…",
    invalidEmail: "Please enter a valid email.",
    freeProvider: "Please use a valid corporate or university email.",
    loginFirst: "Please sign in first.",
    errorGeneric: "An error occurred. Please try again.",
    domainDetected: "Domain {domain} detected!",
    progress: "Colleagues activated",
    waitingMessage:
      "You're on the VIP waitlist! Just {remaining} more colleagues from your domain to unlock 50% off for everyone.",
    copyLink: "Copy invite link",
    linkCopied: "Link copied! Send it to your colleagues.",
    unlocked: "Squad Unlocked! 🎉",
    unlockedSub: "You've earned a lifetime 50% discount.",
    buyExplorer: "Explorer at 50% OFF",
    buyImmersion: "Immersion at 50% OFF",
    institutionPlaceholder: "Institution name (e.g., MIT, Google)",
    positionPlaceholder: "Your position (e.g., student, manager)",
  },
  es: {
    title: "Desbloquea 50% OFF con tu Squad",
    description:
      "Ingresa tu email institucional o corporativo. Si 5 personas de tu organización se unen, todos obtienen 50% de descuento vitalicio en todos los planes.",
    verify: "Verificar Dominio",
    verifying: "Verificando dominio…",
    invalidEmail: "Por favor, ingresa un email válido.",
    freeProvider: "Por favor, usa un email corporativo o universitario válido.",
    loginFirst: "Inicia sesión primero.",
    errorGeneric: "Ocurrió un error. Intenta de nuevo.",
    domainDetected: "¡Dominio {domain} detectado!",
    progress: "Colegas activados",
    waitingMessage:
      "¡Estás en la lista de espera VIP! Faltan solo {remaining} colegas de tu dominio para desbloquear el 50% de descuento para todos.",
    copyLink: "Copiar enlace de invitación",
    linkCopied: "¡Enlace copiado! Envíalo a tus colegas.",
    unlocked: "¡Squad Desbloqueado! 🎉",
    unlockedSub: "Han conquistado 50% de descuento vitalicio.",
    buyExplorer: "Explorador con 50% OFF",
    buyImmersion: "Inmersión con 50% OFF",
    institutionPlaceholder: "Nombre de la institución (ej: UNAM, Google)",
    positionPlaceholder: "Tu posición (ej: estudiante, gerente)",
  },
};

export default CultSquadModal;
