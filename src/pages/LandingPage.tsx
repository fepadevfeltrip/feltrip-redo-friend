import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthModal } from "@/components/app/components/AuthModal";
import { getPendingCheckout, openApplePurchase as openCheckout, PriceKey } from "@/lib/appleIAP";
import { getDisplayPrices } from "@/hooks/useDisplayCurrency";
import type { Language } from "@/components/app/types";
import { LEGAL_TEXT_PT, LEGAL_TEXT_EN, LEGAL_TEXT_ES } from "@/components/app/constants/legalTexts";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import awsLogo from "@/assets/aws-logo.png";
import koinzLogo from "@/assets/koinz-logo.png";
import {
  Sparkles,
  Users,
  Eye,
  ArrowRight,
  Check,
  GraduationCap,
  Globe,
  Home,
  Laptop,
  MapPin,
  Map,
  Key,
  MessageCircle,
  Radar,
  Gem,
} from "lucide-react";

const CULT_URL = "/app";

const LandingPage = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const rawLang = i18n.language?.substring(0, 2) || "pt";
  const lang: Language = ["pt", "en", "es", "fr", "zh"].includes(rawLang) ? (rawLang as Language) : "pt";
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authRedirectPath, setAuthRedirectPath] = useState("/app");
  const [pendingCheckout, setPendingCheckout] = useState<PriceKey | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [showLegalDialog, setShowLegalDialog] = useState(false);

  const resumePendingCheckout = useCallback(async () => {
    const pending = getPendingCheckout();
    if (!pending) return false;

    await openCheckout(pending);
    return true;
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      navigate("/reset-password" + hash, { replace: true });
      return;
    }

    let isMounted = true;

    const handleSignedInUser = async () => {
      const resumedCheckout = await resumePendingCheckout();
      if (!isMounted || resumedCheckout) return;

      const pendingAction = localStorage.getItem("pending_action");
      if (pendingAction === "presence_map" || pendingAction === "cult_gems") {
        localStorage.removeItem("pending_action");
        navigate("/app", { replace: true });
      } else {
        navigate("/app", { replace: true });
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !session.user.is_anonymous) {
        void handleSignedInUser();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user && !session.user.is_anonymous) {
        void handleSignedInUser();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, resumePendingCheckout]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible((v) => ({ ...v, [e.target.id]: true }));
          }
        });
      },
      { threshold: 0.15 },
    );
    document.querySelectorAll("[data-animate]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const prices = getDisplayPrices(lang);
  const baseT = translations[lang as keyof typeof translations] || translations.pt;
  const t = {
    ...baseT,
    pricingCards: baseT.pricingCards.map((c: any, i: number) => ({
      ...c,
      price: i === 0 ? c.price : i === 1 ? prices.roteiro : prices.imersao,
    })),
  };

  const handleLaunchApp = () => {
    navigate("/app");
  };

  const handleHousingClick = () => {
    navigate("/app?tab=housing");
  };

  // Nova Lógica de Checkout Unificada (Integração Apple + Auth)
  const handlePricingCta = useCallback(async (cardIndex: number) => {
    if (cardIndex === 0) {
      navigate("/app");
      return;
    }

    const priceKey: PriceKey = cardIndex === 1 ? "personal_map" : "explorer";
    setCheckoutLoading(cardIndex);
    try {
      const result = await openCheckout(priceKey);
      if (result === "auth_required") {
        setAuthRedirectPath(cardIndex === 2 ? "/app?tab=housing" : "/app");
        setIsAuthModalOpen(true);
      }
    } catch (error) {
      console.error("Erro ao iniciar checkout:", error);
    } finally {
      setCheckoutLoading(null);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <span className="font-display text-lg font-bold text-primary">Cult AI</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">by Feltrip</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://feltrip.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] opacity-50 hover:opacity-80 transition-opacity leading-none hidden sm:inline"
            >
              feltrip.com
            </a>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleLaunchApp}>
              {t.cta}
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

        <div className="max-w-5xl mx-auto px-4 py-16 md:py-24 relative z-10 text-center">
          <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6 text-foreground whitespace-pre-wrap">
            {t.heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.heroSub}
          </p>

          <div className="flex flex-col items-center gap-4 mb-6 px-2">
            <Badge
              variant="secondary"
              className="mb-2 text-xs tracking-wide uppercase px-4 py-1.5 border border-primary/20"
            >
              📍 {t.trustBadge}
            </Badge>
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm sm:text-base px-8 sm:px-12 py-6 sm:py-7 rounded-full shadow-xl font-bold tracking-wide transition-all hover:scale-105"
              onClick={handleLaunchApp}
            >
              {t.ctaMain}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground mt-2">{t.ctaMainMicro}</p>
          </div>
        </div>
      </section>

      {/* PREVIEW: What you'll discover */}
      <section
        id="preview"
        data-animate
        className={`py-16 md:py-20 bg-muted/30 transition-all duration-700 ${visible["preview"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-display text-center text-3xl md:text-4xl font-bold mb-12">{t.previewTitle}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Radar, title: t.previewArchetype, desc: t.previewArchetypeDesc },
              { icon: Gem, title: t.previewGems, desc: t.previewGemsDesc },
              { icon: MessageCircle, title: t.previewChat, desc: t.previewChatDesc },
            ].map((item, i) => (
              <div
                key={i}
                className="relative group p-6 rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-10 py-6 font-bold shadow-lg transition-all hover:scale-105"
              onClick={handleLaunchApp}
            >
              {t.ctaMain}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        data-animate
        className={`py-16 md:py-24 bg-background transition-all duration-700 ${visible["how-it-works"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{t.howItWorksTitle}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {t.howItWorksSteps.map((step: any, i: number) => {
              const icons = [MapPin, Eye, Map];
              const Icon = icons[i];
              const stepLabel = lang === "en" ? "Step" : lang === "es" ? "Paso" : "Passo";
              return (
                <Card
                  key={i}
                  className="border-border/40 bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="pt-8 pb-6 px-5 text-center flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">
                      {stepLabel} {i + 1}: {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* PERSONAS */}
      <section
        id="personas"
        data-animate
        className={`py-16 md:py-24 bg-muted/30 transition-all duration-700 ${visible["personas"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-display text-center mb-12">{t.forWhomTitle}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.personas.map((p: any, i: number) => {
              const icons = [GraduationCap, Globe, Home, Laptop];
              const Icon = icons[i];
              return (
                <div key={i} className="text-center p-6 bg-card/80 rounded-2xl border border-border/30">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-semibold mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOUSING BRIDGE */}
      <section
        id="housing-bridge"
        data-animate
        className={`py-16 bg-primary/5 border-y border-primary/10 transition-all duration-700 ${visible["housing-bridge"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Key className="h-10 w-10 text-primary mx-auto mb-4 opacity-80" />
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">{t.housingBridgeTitle}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed text-lg">{t.housingBridgeSub}</p>
          <Button
            size="lg"
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10 rounded-xl px-8"
            onClick={handleHousingClick}
          >
            {t.housingCta}
          </Button>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        data-animate
        className={`py-16 md:py-24 bg-background transition-all duration-700 ${visible["pricing"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-display text-center mb-12 text-3xl">{t.pricingTitle2}</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {t.pricingCards.map((card: any, i: number) => (
              <Card
                key={i}
                className={`relative border-border/40 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow flex flex-col ${card.highlight ? "ring-2 ring-primary shadow-xl scale-105" : ""}`}
              >
                {card.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-xs px-4 py-1 uppercase tracking-widest font-bold">
                      {card.badge}
                    </Badge>
                  </div>
                )}
                <CardContent className="pt-10 pb-8 px-6 sm:px-8 flex flex-col flex-1 text-center">
                  <h3 className="text-2xl font-bold mb-1">{card.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{card.subtitle}</p>

                  <div className="mb-6 mt-2">
                    <span className="text-4xl font-extrabold text-foreground">{card.price}</span>
                  </div>

                  <ul className="space-y-4 mb-8 text-left mt-2 border-t border-border/40 pt-6 flex-1">
                    {card.features.map((f: string, j: number) => (
                      <li key={j} className="flex items-start gap-3 text-sm text-foreground/90">
                        <Check className="h-5 w-5 text-primary shrink-0" />
                        <span className="leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full h-auto min-h-[3.5rem] whitespace-normal text-sm sm:text-base px-4 py-3 rounded-xl font-bold shadow-md flex-col flex items-center justify-center leading-snug transition-transform active:scale-95 ${
                      card.highlight
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-accent text-accent-foreground hover:bg-accent/90"
                    }`}
                    onClick={() => handlePricingCta(i)}
                    disabled={checkoutLoading !== null}
                  >
                    {checkoutLoading === i ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                        <span>Redirecionando...</span>
                      </span>
                    ) : (
                      <span>{card.cta}</span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST NETWORK */}
      <section
        id="trust-network"
        data-animate
        className={`py-16 md:py-24 bg-muted/30 transition-all duration-700 ${visible["trust-network"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 text-xs tracking-wide uppercase px-4 py-1.5">
              Cult AI + Feltrip Concierge
            </Badge>
            <h2 className="font-display text-3xl">{t.trustTitle}</h2>
            <p className="text-sm text-muted-foreground mt-3 max-w-2xl mx-auto">{t.trustSubtitle}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {t.trustSteps.map((step: any, i: number) => {
              const icons = [Sparkles, Users, Eye];
              const Icon = icons[i] || Sparkles;
              return (
                <Card
                  key={i}
                  className="border-border/40 bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="pt-8 pb-6 px-5 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-base font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{step.desc}</p>
                    <ul className="text-left space-y-1.5 text-xs text-muted-foreground">
                      {step.items.map((item: string, j: number) => (
                        <li key={j} className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMMUNITY */}
      <section
        id="join-community"
        data-animate
        className={`py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5 transition-all duration-700 ${visible["join-community"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4 text-xs tracking-wide uppercase px-4 py-1.5">
            <Users className="h-3 w-3 mr-1" />
            {t.communityBadge}
          </Badge>
          <h2 className="font-display text-2xl md:text-4xl font-bold mb-4">{t.communityTitle}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">{t.communitySubtitle}</p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 py-6 text-base"
            onClick={() => navigate("/community")}
          >
            <MapPin className="h-5 w-5 mr-2" />
            {t.communityCta}
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/40 bg-card/80 backdrop-blur-sm py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs text-muted-foreground/70 uppercase tracking-wider font-medium">
              {t.supportText}
            </span>
            <div className="flex items-center justify-center gap-8">
              <img src={koinzLogo} alt="Koinz Capital" className="h-6 object-contain opacity-90" />
              <img src={awsLogo} alt="AWS" className="h-6 object-contain opacity-80" />
            </div>
          </div>

          <div className="w-full h-px bg-border/30" />

          <div className="flex items-center gap-6">
            <a
              href="https://feltrip.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              feltrip.com
            </a>
            <button
              onClick={() => setShowLegalDialog(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              {t.termsAndPrivacy}
            </button>
          </div>
        </div>
      </footer>

      <Dialog open={showLegalDialog} onOpenChange={setShowLegalDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Feltrip Cultural AI — Cult AI</DialogTitle>
            <DialogDescription>{t.termsAndPrivacy}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[65vh] pr-4">
            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {lang === "en" ? LEGAL_TEXT_EN : lang === "es" ? LEGAL_TEXT_ES : LEGAL_TEXT_PT}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AuthModal
        isOpen={isAuthModalOpen}
        lang={lang}
        onClose={() => setIsAuthModalOpen(false)}
        redirectTo={authRedirectPath}
      />
    </div>
  );
};

const translations = {
  pt: {
    cta: "Começar Grátis",
    trustBadge: "Curado por residentes locais • Rio, SP e Floripa",
    heroTitle: "Que tipo de viajante\na cidade revela em você?",
    heroSub:
      "Responda 7 perguntas. Descubra seu arquétipo urbano. Receba um roteiro com os segredos que só moradores locais conhecem — desenhado exclusivamente para você.",
    ctaMain: "Descobrir meu Arquétipo",
    ctaMainMicro: "Grátis • 1 minuto • Sem cadastro",

    previewTitle: "O que você vai descobrir",
    previewArchetype: "Seu Arquétipo Urbano",
    previewArchetypeDesc: "A IA revela como seu corpo e mente se conectam com a cidade — num radar único que só você tem.",
    previewGems: "Gemas Secretas do Dia",
    previewGemsDesc: "3 lugares curados por moradores locais que combinam com o seu perfil. Nada de lista genérica.",
    previewChat: "Chat com a Cult AI",
    previewChatDesc: "Pergunte qualquer coisa sobre a cidade. A IA responde com a sabedoria de quem vive lá.",

    howItWorksTitle: "Como a mágica acontece",
    howItWorksSteps: [
      {
        title: "O Mapeamento",
        desc: "Você responde a 7 perguntas rápidas e intuitivas sobre como o seu corpo e mente se relacionam com o espaço urbano hoje.",
      },
      {
        title: "O Arquétipo",
        desc: "Nossa IA revela o seu perfil urbano único (Ex: 'Corpo Inquieto na Cidade Viva') e cruza com a curadoria local.",
      },
      {
        title: "O Roteiro Cult",
        desc: "Você recebe um roteiro dia a dia perfeito, mesclando segredos de natureza, gastronomia e cultura.",
      },
    ],

    pricingTitle2: "Escolha a sua experiência",
    pricingCards: [
      {
        name: "Free — Degustação",
        subtitle: "Descubra seu arquétipo sem pagar nada.",
        price: "Grátis",
        features: [
          "Arquétipo de Viajante (resultado completo)",
          "3 Gemas do Dia 1 (Manhã, Tarde, Noite)",
          "Lista de Profissionais Indicados",
          "1 pergunta no Chat com a Cult AI",
          "Identificação do Bairro Ideal",
        ],
        cta: "Começar Grátis",
        highlight: false,
        isFree: true,
      },
      {
        name: "Roteiro Cult Unificado",
        subtitle: "Para quem quer viver a cidade hoje.",
        price: "",
        features: [
          "Tudo do plano Free",
          "Roteiro Completo (até 7 dias)",
          "Suporte Concierge via Chat Ilimitado durante toda a jornada (até 7 dias)",
        ],
        cta: "Gerar meu Roteiro",
        highlight: false,
      },
      {
        name: "A Imersão Completa",
        subtitle: "Mapão Fenomenológico + Idioma",
        price: "",
        features: [
          "25 perguntas profundas do Mapão",
          "Dossiê de Aterrissagem e Moradia (Análise de ruas, custo e segurança)",
          "4h de Tutoria de Idioma com IA",
          "Consultoria biográfica completa",
        ],
        cta: "Desbloquear Experiência Premium",
        highlight: true,
        badge: "Recomendado para Expats",
      },
    ],

    housingBridgeTitle: "Veio para passear e decidiu ficar?",
    housingBridgeSub:
      "Descubra o bairro ideal para o seu estilo de vida com o nosso mapeamento profundo voltado exclusivamente para moradia.",
    housingCta: "Explorar Moradia (Housing)",

    forWhomTitle: "Para quem é",
    personas: [
      { title: "Viajante Autêntico", desc: "Foge das filas e quer descobrir os segredos da cidade." },
      { title: "Nômade digital", desc: "Quer viver a cidade, não apenas trabalhar nela." },
      { title: "Expatriado", desc: "Precisa se adaptar de verdade ao território local." },
      { title: "Brasileiro em transição", desc: "Mudou de estado e quer criar raízes no bairro certo." },
    ],

    termsAndPrivacy: "Termos de Uso e Política de Privacidade",
    supportText: "A Cult tem apoio",
    trustTitle: "Nossa Rede de Confiança",
    trustSubtitle:
      "Cada expert do Feltrip Concierge passa por um processo rigoroso de validação. Expertise verificada por confiança.",
    communityBadge: "Entre na Comunidade",
    communityTitle: "Entre na nossa Comunidade",
    communitySubtitle:
      "Conecte-se com outros membros, compartilhe experiências e descubra dicas exclusivas da comunidade Feltrip.",
    communityCta: "Entrar na Comunidade — Grátis",
    trustSteps: [
      {
        title: "Indicação",
        desc: "Experts são indicados pela rede Feltrip.",
        items: ["Precisam de 2 referências verificadas", "Sistema de confiança bilateral"],
      },
      {
        title: "Validação Cult",
        desc: "Cult AI analisa o perfil do expert.",
        items: ["Entrevista personalizada", "Match com a comunidade"],
      },
      {
        title: "Monitoramento",
        desc: "Qualidade garantida continuamente.",
        items: ["Feedback contínuo dos clientes", "Reviews verificados"],
      },
    ],
  },
  en: {
    cta: "Start Free",
    trustBadge: "Curated by local residents • Rio, SP & Floripa",
    heroTitle: "What kind of traveler\ndoes the city reveal in you?",
    heroSub:
      "Answer 7 questions. Discover your urban archetype. Get an itinerary with secrets only locals know — designed exclusively for you.",
    ctaMain: "Discover my Archetype",
    ctaMainMicro: "Free • 1 minute • No sign-up needed",

    previewTitle: "What you'll discover",
    previewArchetype: "Your Urban Archetype",
    previewArchetypeDesc: "AI reveals how your body and mind connect with the city — in a unique radar that only you have.",
    previewGems: "Today's Secret Gems",
    previewGemsDesc: "3 places curated by locals that match your profile. No generic lists.",
    previewChat: "Chat with Cult AI",
    previewChatDesc: "Ask anything about the city. AI answers with the wisdom of those who live there.",

    howItWorksTitle: "How the magic happens",
    howItWorksSteps: [
      {
        title: "The Mapping",
        desc: "Answer 7 quick, intuitive questions about how your body and mind relate to urban space today.",
      },
      {
        title: "The Archetype",
        desc: "Our AI reveals your unique urban profile (e.g., 'Restless Body in a Vivid City') and matches it with local curation.",
      },
      {
        title: "The Cult Itinerary",
        desc: "Receive a perfect day-by-day guide blending nature, gastronomy, and cultural secrets.",
      },
    ],

    pricingTitle2: "Choose your experience",
    pricingCards: [
      {
        name: "Free — Tasting",
        subtitle: "Discover your archetype for free.",
        price: "Free",
        features: [
          "Traveler Archetype (full result)",
          "3 Gems from Day 1 (Morning, Afternoon, Night)",
          "Recommended Professionals List",
          "1 question in Chat with Cult AI",
          "Ideal Neighborhood Identification",
        ],
        cta: "Start Free",
        highlight: false,
        isFree: true,
      },
      {
        name: "Unified Cult Itinerary",
        subtitle: "For those who want to live the city today.",
        price: "",
        features: [
          "Everything in the Free plan",
          "Full Itinerary (up to 7 days)",
          "Unlimited Concierge Chat Support throughout the journey (up to 7 days)",
        ],
        cta: "Generate my Itinerary",
        highlight: false,
      },
      {
        name: "The Full Immersion",
        subtitle: "Full Map + Language Studio",
        price: "",
        features: [
          "25 deep phenomenological questions",
          "Landing & Housing Dossier (Street analysis, cost & safety)",
          "4h of AI Language Tutoring",
          "Complete biographical consulting",
        ],
        cta: "Unlock Premium Experience",
        highlight: true,
        badge: "Recommended for Expats",
      },
    ],

    housingBridgeTitle: "Came to visit and decided to stay?",
    housingBridgeSub:
      "Discover the ideal neighborhood for your lifestyle with our deep mapping designed exclusively for housing.",
    housingCta: "Explore Housing",

    forWhomTitle: "Who is it for",
    personas: [
      { title: "Authentic Traveler", desc: "Avoids tourist traps and wants to discover local secrets." },
      { title: "Digital Nomad", desc: "Wants to live the city, not just work in it." },
      { title: "Expatriate", desc: "Needs to truly adapt to the local territory." },
      { title: "Brazilian in transition", desc: "Moved states and wants to set roots in the right neighborhood." },
    ],

    termsAndPrivacy: "Terms of Use and Privacy Policy",
    supportText: "Cult is supported by",
    trustTitle: "Our Trust Network",
    trustSubtitle:
      "Every Feltrip Concierge expert goes through a rigorous validation process. Expertise verified by trust.",
    communityBadge: "Join Our Community",
    communityTitle: "Join Our Community",
    communitySubtitle: "Connect with other members, share experiences, and discover exclusive Feltrip community tips.",
    communityCta: "Join the Community — Free",
    trustSteps: [
      {
        title: "Referral",
        desc: "Experts are referred by the Feltrip network.",
        items: ["Need 2 verified references", "Bilateral trust system"],
      },
      {
        title: "Cult Validation",
        desc: "Cult AI analyzes the expert's profile.",
        items: ["Personalized interview", "Community matching"],
      },
      {
        title: "Monitoring",
        desc: "Quality guaranteed continuously.",
        items: ["Continuous client feedback", "Verified reviews"],
      },
    ],
  },
  es: {
    cta: "Comenzar Gratis",
    trustBadge: "Curado por residentes locales • Río, SP y Floripa",
    heroTitle: "¿Qué tipo de viajero\nrevela la ciudad en ti?",
    heroSub:
      "Responde 7 preguntas. Descubre tu arquetipo urbano. Recibe un itinerario con los secretos que solo los locales conocen — diseñado exclusivamente para ti.",
    ctaMain: "Descubrir mi Arquetipo",
    ctaMainMicro: "Gratis • 1 minuto • Sin registro",

    previewTitle: "Lo que vas a descubrir",
    previewArchetype: "Tu Arquetipo Urbano",
    previewArchetypeDesc: "La IA revela cómo tu cuerpo y mente se conectan con la ciudad — en un radar único que solo tú tienes.",
    previewGems: "Gemas Secretas del Día",
    previewGemsDesc: "3 lugares curados por locales que coinciden con tu perfil. Nada de listas genéricas.",
    previewChat: "Chat con Cult AI",
    previewChatDesc: "Pregunta lo que quieras sobre la ciudad. La IA responde con la sabiduría de quienes viven allí.",

    howItWorksTitle: "Cómo ocurre la magia",
    howItWorksSteps: [
      {
        title: "El Mapeo",
        desc: "Respondes a 7 preguntas rápidas e intuitivas sobre cómo tu cuerpo y mente se relacionan con el espacio hoy.",
      },
      {
        title: "El Arquetipo",
        desc: "Nuestra IA revela tu perfil urbano único (Ej: 'Cuerpo Inquieto en Ciudad Viva') y lo cruza con curaduría local.",
      },
      {
        title: "El Itinerario Cult",
        desc: "Recibes una guía día a día perfecta, mezclando secretos de naturaleza, gastronomía y cultura.",
      },
    ],

    pricingTitle2: "Elige tu experiencia",
    pricingCards: [
      {
        name: "Free — Degustación",
        subtitle: "Descubre tu arquetipo gratis.",
        price: "Gratis",
        features: [
          "Arquetipo de Viajero (resultado completo)",
          "3 Gemas del Día 1 (Mañana, Tarde, Noche)",
          "Lista de Profesionales Recomendados",
          "1 pregunta en el Chat con Cult AI",
          "Identificación del Barrio Ideal",
        ],
        cta: "Comenzar Gratis",
        highlight: false,
        isFree: true,
      },
      {
        name: "Itinerario Cult Unificado",
        subtitle: "Para quienes quieren vivir la ciudad hoy.",
        price: "",
        features: [
          "Todo del plan Free",
          "Itinerario Completo (hasta 7 días)",
          "Soporte Concierge via Chat Ilimitado durante todo el viaje (hasta 7 días)",
        ],
        cta: "Generar mi Itinerario",
        highlight: false,
      },
      {
        name: "La Inmersión Completa",
        subtitle: "Mapa Completo + Idioma",
        price: "",
        features: [
          "25 preguntas profundas del Mapa",
          "Dosier de Aterrizaje y Vivienda (Análisis de calles, costo y seguridad)",
          "4h de Tutoría de Idioma con IA",
          "Consultoría biográfica completa",
        ],
        cta: "Desbloquear Experiencia Premium",
        highlight: true,
        badge: "Recomendado para Expats",
      },
    ],

    housingBridgeTitle: "¿Viniste de visita y decidiste quedarte?",
    housingBridgeSub:
      "Descubre el barrio ideal para tu estilo de vida con nuestro mapeo profundo enfocado exclusivamente en vivienda.",
    housingCta: "Explorar Vivienda (Housing)",

    forWhomTitle: "¿Para quién es?",
    personas: [
      { title: "Viajero Auténtico", desc: "Huye de las filas y quiere descubrir los secretos de la ciudad." },
      { title: "Nómada digital", desc: "Quiere vivir la ciudad, no solo trabajar en ella." },
      { title: "Expatriado", desc: "Necesita adaptarse de verdad al territorio local." },
      { title: "Brasileño en transición", desc: "Se mudó de estado y quiere echar raíces en el barrio correcto." },
    ],

    termsAndPrivacy: "Términos de Uso y Política de Privacidad",
    supportText: "Cult cuenta con el apoyo de",
    trustTitle: "Nuestra Red de Confianza",
    trustSubtitle: "Cada expert del Feltrip Concierge pasa por un proceso riguroso de validación.",
    communityBadge: "Únete a la Comunidad",
    communityTitle: "Únete a Nuestra Comunidad",
    communitySubtitle: "Conecta con otros miembros, comparte experiencias y descubre consejos exclusivos.",
    communityCta: "Entrar a la Comunidad — Gratis",
    trustSteps: [
      {
        title: "Indicación",
        desc: "Experts son indicados por la red Feltrip.",
        items: ["Necesitan 2 referencias verificadas", "Sistema de confianza bilateral"],
      },
      {
        title: "Validación Cult",
        desc: "Cult AI analiza el perfil del expert.",
        items: ["Entrevista personalizada", "Match con la comunidad"],
      },
      {
        title: "Monitoreo",
        desc: "Calidad garantizada continuamente.",
        items: ["Feedback continuo de clientes", "Reviews verificados"],
      },
    ],
  },
};

export default LandingPage;
