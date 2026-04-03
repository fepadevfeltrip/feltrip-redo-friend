import { useState, useEffect } from "react";
import { getPendingCheckout, openApplePurchase as openCheckout, PriceKey } from "@/lib/appleIAP";
import { TERMS_TEXT_PT, TERMS_TEXT_EN, TERMS_TEXT_ES, PRIVACY_TEXT_PT, PRIVACY_TEXT_EN, PRIVACY_TEXT_ES, APPLE_EULA_URL } from "@/components/app/constants/legalTexts";
import { isIOSDevice } from "@/lib/platform";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MobileFrame } from "@/components/MobileFrame";
import { MeuMapaTab } from "@/components/app/MeuMapaTab";
import CultChat from "@/components/app/CultChat";
import ConciergeHub from "@/components/app/ConciergeHub";
import ProfileHub from "@/components/app/ProfileHub";
import { BobaProfessoraChat } from "@/components/app/BobaProfessoraChat";
import CommunityTab from "@/components/app/CommunityTab";
import Annotations from "./Annotations";
import PricingTab from "@/components/app/PricingTab";
import HousingTab from "@/components/app/HousingTab";
import { AuthModal } from "@/components/app/components/AuthModal";
import PricingPaywall from "@/components/app/components/PricingPaywall";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  Map,
  User,
  X,
  LogOut,
  Loader2,
  Sparkles,
  Compass,
  BookOpen,
  Languages,
  Lock,
  CreditCard,
  FileText,
  Home,
  Briefcase,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUserTier } from "@/hooks/useUserTier";
import { RenewalPopup } from "@/components/app/components/ConversionNudges";
import { CreditsDisplay } from "@/components/app/CreditsDisplay";
import { NotificationBell } from "@/components/app/NotificationBell";
import { LanguageSelector } from "@/components/LanguageSelector";

interface ExpatAppProps {
  onBack?: () => void;
  initialTab?: TabType;
}

type TabType = "presence" | "map" | "cult" | "concierge" | "language" | "profile" | "logbook" | "pricing" | "housing" | "community";

const ExpatApp = ({ onBack, initialTab = "cult" }: ExpatAppProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { canAccessConcierge, hasLanguageStudioIncluded, canAccessHousing, isExpired, previousTier } = useUserTier();
  const [showLanguagePaywall, setShowLanguagePaywall] = useState(false);
  const [showRenewalPopup, setShowRenewalPopup] = useState(false);
  const [authRedirectPath, setAuthRedirectPath] = useState(`/app?tab=${initialTab}`);

  // Show renewal popup when user has an expired plan
  useEffect(() => {
    if (isExpired && previousTier && previousTier !== "free") {
      const dismissed = sessionStorage.getItem("renewal_popup_dismissed");
      if (!dismissed) {
        setShowRenewalPopup(true);
      }
    }
  }, [isExpired, previousTier]);

  const [showConciergePaywall, setShowConciergePaywall] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showLegalDialog, setShowLegalDialog] = useState(false);
  const [legalTab, setLegalTab] = useState<"terms" | "privacy">("terms");
  const currentLang = (i18n.language?.substring(0, 2) as "pt" | "en" | "es") || "pt";
  const isIOS = isIOSDevice();

  // Nova lógica de redirecionamento após pagamento (Roteiro vs Pacote Premium)
  const getCheckoutRedirectPath = (priceKey: string) => {
    if (priceKey === "gem_single" || priceKey === "personal_map") return "/app?tab=cult"; // Comprou o Roteiro B2C
    if (priceKey === "price_1TEHNdA1KiGIrxAcq0vPMV7s") return "/app?tab=presence"; // Comprou o Pacote Premium (Mapão + Idioma)
    return "/app?tab=pricing";
  };

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail) setActiveTab(e.detail as TabType);
    };
    window.addEventListener("navigate-tab", handler as EventListener);
    return () => window.removeEventListener("navigate-tab", handler as EventListener);
  }, []);

  // Resume pending checkout after OAuth redirect
  useEffect(() => {
    if (!user || user.is_anonymous || !user.email) return;
    const pending = getPendingCheckout();
    if (pending) {
      void openCheckout(pending);
    }
  }, [user]);

  useEffect(() => {
    const handleCheckoutAuthRequired = (event: Event) => {
      const customEvent = event as CustomEvent<{ priceKey?: PriceKey }>;
      const priceKey = customEvent.detail?.priceKey;
      setAuthRedirectPath(priceKey ? getCheckoutRedirectPath(priceKey) : `/app?tab=${activeTab}`);
      setIsAuthModalOpen(true);
    };

    window.addEventListener("auth-required-for-checkout", handleCheckoutAuthRequired as EventListener);
    return () => window.removeEventListener("auth-required-for-checkout", handleCheckoutAuthRequired as EventListener);
  }, [activeTab]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    const action = params.get("action");
    const hasAuthCode = params.has("code");

    if (tab === "presence" || tab === "map") {
      setActiveTab(tab as TabType);
      if (action === "start_map" || tab === "map") {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("start-presence-map"));
        }, 500);
      }
    } else if (tab === "housing") {
      setActiveTab("housing");
    } else if (tab === "community") {
      setActiveTab("community");
    } else if (tab === "cult") {
      setActiveTab("cult");
    } else if (!tab) {
      setActiveTab(initialTab);
    }

    if (tab && !hasAuthCode) {
      window.history.replaceState({}, "", window.location.pathname + `?tab=${tab}`);
    } else if (tab && hasAuthCode) {
      const cleanup = setTimeout(() => {
        window.history.replaceState({}, "", window.location.pathname + `?tab=${tab}`);
      }, 2000);
      return () => clearTimeout(cleanup);
    }
  }, []);

  const { profile, isLoading: profileLoading } = useProfile();

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const rawName = profile?.full_name;
  const displayName = (!rawName || rawName === "Anonymous" || rawName === "Anônimo")
    ? (currentLang === "en" ? "Curious Visitor" : "Visitante Curioso")
    : rawName;
  const displayCity = profile?.city || t("profile.locationNotSet");
  const initials = getInitials(displayName);

  const handleConciergeClick = () => {
    if (!user) {
      setAuthRedirectPath(`/app?tab=${activeTab}`);
      setIsAuthModalOpen(true);
      return;
    }
    if (canAccessConcierge) {
      setActiveTab("concierge");
    } else {
      setShowConciergePaywall(true);
    }
  };

  const handleLanguageClick = () => {
    if (!user) {
      setAuthRedirectPath(`/app?tab=${activeTab}`);
      setIsAuthModalOpen(true);
      return;
    }
    if (hasLanguageStudioIncluded) {
      setActiveTab("language");
    } else {
      setShowLanguagePaywall(true);
    }
  };

  const logbookLabel =
    currentLang === "en" ? "Saved Gems" : currentLang === "es" ? "Gemas Guardadas" : "Diário (Gemas)";
  const conciergeLabel =
    currentLang === "en" ? "Concierge Services" : currentLang === "es" ? "Servicios Concierge" : "Serviços Concierge";
  const languageLabel =
    currentLang === "en" ? "Language Studio" : currentLang === "es" ? "Estudio de Idiomas" : "Estúdio de Idiomas";

  return (
    <>
      <MobileFrame>
        <AuthModal
          isOpen={isAuthModalOpen}
          lang={currentLang}
          onClose={() => setIsAuthModalOpen(false)}
          redirectTo={authRedirectPath}
        />
        <div className="flex flex-col h-full bg-background">
          {/* HEADER */}
          <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="px-4 py-3 flex items-center justify-between">
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-foreground/70 hover:bg-muted">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0 bg-background border-border">
                  <div className="flex flex-col h-full">
                    {/* Sidebar header */}
                     <div className="p-6 relative border-b border-border bg-gradient-to-br from-muted/30 to-transparent">
                      <Button
                        variant="ghost"
                        size="icon"
                         className="absolute top-4 right-4 text-foreground/30"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-14 h-14 ring-2 ring-accent/20">
                          <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                          <AvatarFallback className="bg-muted text-foreground/70 text-lg font-display">
                            {profileLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : initials}
                          </AvatarFallback>
                        </Avatar>
                         <div>
                          <h3 className="font-display font-semibold text-foreground">
                            {profileLoading ? t("common.loading") : displayName}
                          </h3>
                          <p className="text-xs text-muted-foreground">{profileLoading ? "" : displayCity}</p>
                        </div>
                      </div>
                    </div>

                    <nav className="flex-1 p-4 space-y-1 overflow-auto">
                       <p className="text-[10px] font-bold text-accent uppercase tracking-[0.15em] px-3 pt-2 pb-2">
                        {currentLang === "en" ? "My Journey" : currentLang === "es" ? "Mi Viaje" : "Minha Jornada Cult"}
                      </p>

                      {[
                        {
                          tab: "cult" as TabType,
                          icon: Sparkles,
                          label:
                            currentLang === "en"
                              ? "Cult Itinerary (Daily)"
                              : currentLang === "es"
                                ? "Itinerario Cult"
                                : "Roteiro Cult",
                        },
                        {
                          tab: "housing" as TabType,
                          icon: Home,
                          label:
                            currentLang === "en"
                              ? "Housing Matching"
                              : currentLang === "es"
                                ? "Vivienda (Housing)"
                                : "Moradia (Housing)",
                        },
                        {
                          tab: "presence" as TabType,
                          icon: Compass,
                          label:
                            currentLang === "en"
                              ? "Deep Map"
                              : currentLang === "es"
                                ? "Mapa Profundo"
                                : "Mapão Fenomenológico",
                        },
                        { tab: "logbook" as TabType, icon: Map, label: logbookLabel },
                        {
                          tab: "profile" as TabType,
                          icon: User,
                          label: currentLang === "en" ? "My Profile" : currentLang === "es" ? "Mi Perfil" : "Meu Perfil",
                        },
                      ].map(({ tab, icon: Icon, label, locked }: { tab: TabType; icon: any; label: string; locked?: boolean }) => (
                        <Button
                          key={tab}
                          variant={activeTab === tab ? "secondary" : "ghost"}
                          className={`w-full justify-start gap-3 h-11 rounded-xl text-foreground/70 ${activeTab === tab ? "bg-muted border border-border text-foreground" : "hover:bg-muted/50"}`}
                          onClick={() => {
                            if (locked) {
                              setShowConciergePaywall(true);
                              setIsMenuOpen(false);
                              return;
                            }
                            setActiveTab(tab);
                            setIsMenuOpen(false);
                          }}
                        >
                          <Icon className={`h-4 w-4 ${activeTab === tab ? "text-accent" : ""}`} />
                          <div className="flex items-center gap-2">
                             <span className={activeTab === tab ? "font-semibold text-foreground text-sm" : "text-sm"}>{label}</span>
                             {locked && <Lock className="h-3 w-3 text-muted-foreground/40" />}
                           </div>
                        </Button>
                      ))}

                      <Separator className="my-3 bg-border" />
                      <p className="text-[10px] font-bold text-accent uppercase tracking-[0.15em] px-3 pt-2 pb-2">
                        {currentLang === "en"
                          ? "Premium Services"
                          : currentLang === "es"
                            ? "Servicios Premium"
                            : "Serviços Premium"}
                      </p>

                      <Button
                        variant={activeTab === "language" ? "secondary" : "ghost"}
                        className={`w-full justify-start gap-3 h-11 rounded-xl ${activeTab === "language" ? "bg-muted border border-border" : ""}`}
                        onClick={() => {
                          handleLanguageClick();
                          setIsMenuOpen(false);
                        }}
                      >
                        <Languages className={`h-4 w-4 ${activeTab === "language" ? "text-accent" : ""}`} />
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{languageLabel}</span>
                          {!hasLanguageStudioIncluded && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </div>
                      </Button>

                      <Button
                        variant={activeTab === "concierge" ? "secondary" : "ghost"}
                        className={`w-full justify-start gap-3 h-11 rounded-xl ${activeTab === "concierge" ? "bg-muted border border-border" : ""}`}
                        onClick={() => {
                          handleConciergeClick();
                          setIsMenuOpen(false);
                        }}
                      >
                        <Briefcase className={`h-4 w-4 ${activeTab === "concierge" ? "text-accent" : ""}`} />
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{conciergeLabel}</span>
                          {!canAccessConcierge && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </div>
                      </Button>

                      <Separator className="my-3 bg-border" />

                      <Button
                        variant={activeTab === "pricing" ? "secondary" : "ghost"}
                        className="w-full justify-start gap-3 h-11 rounded-xl"
                        onClick={() => {
                          setActiveTab("pricing");
                          setIsMenuOpen(false);
                        }}
                      >
                        <CreditCard className="h-4 w-4" />
                        <span className="text-sm">
                          {currentLang === "en"
                            ? "Plans & Pricing"
                            : currentLang === "es"
                              ? "Planes y Precios"
                              : "Planos e Preços"}
                        </span>
                      </Button>

                      <Separator className="my-3 bg-border" />

                      <div className="px-2 py-2">
                        <LanguageSelector />
                      </div>

                      <Separator className="my-3 bg-border" />

                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11 rounded-xl"
                        onClick={() => {
                          setShowLegalDialog(true);
                          setIsMenuOpen(false);
                        }}
                      >
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">
                          {currentLang === "en"
                            ? "Terms & Privacy"
                            : currentLang === "es"
                              ? "Términos y Privacidad"
                              : "Termos e Privacidade"}
                        </span>
                      </Button>

                      <Separator className="my-3 bg-border" />
                       <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11 rounded-xl text-destructive hover:text-destructive"
                        onClick={async () => {
                          await signOut();
                          navigate("/", { replace: true });
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="text-sm">{t("nav.signOut")}</span>
                      </Button>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg font-bold text-foreground">Cult AI</h1>
                <span className="text-[10px] text-muted-foreground hidden sm:inline">by Feltrip</span>
                <CreditsDisplay />
              </div>

              <div className="flex items-center gap-1">
                <LanguageSelector />
                {user ? (
                  <>
                    <NotificationBell />
                    <Avatar className="w-9 h-9 ring-1 ring-border">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                      <AvatarFallback className="bg-muted text-foreground/70 font-display text-sm">
                        {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : initials}
                      </AvatarFallback>
                    </Avatar>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="bg-accent text-accent-foreground hover:bg-accent/80 text-xs font-bold uppercase tracking-wider rounded-lg"
                    onClick={() => {
                      setAuthRedirectPath(`/app?tab=${activeTab}`);
                      setIsAuthModalOpen(true);
                    }}
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {(activeTab === "presence" || activeTab === "map") && <MeuMapaTab />}
            {activeTab === "cult" && <CultChat embedded />}
            {activeTab === "concierge" && <ConciergeHub />}
            {activeTab === "language" && <BobaProfessoraChat onClose={() => setActiveTab("cult")} />}
            {activeTab === "profile" && <ProfileHub />}
            {activeTab === "logbook" && <Annotations />}
            {activeTab === "pricing" && <PricingTab />}
            {activeTab === "housing" && <HousingTab />}
            {activeTab === "community" && <CommunityTab />}
          </div>

          {showConciergePaywall && (
            <PricingPaywall lang={currentLang as any} onClose={() => setShowConciergePaywall(false)} />
          )}
          {showLanguagePaywall && (
            <PricingPaywall
              lang={currentLang as any}
              highlightIndex={2}
              onClose={() => setShowLanguagePaywall(false)}
            />
          )}

          {/* BARRA INFERIOR DE NAVEGAÇÃO */}
          <div className="border-t border-foreground/10 bg-background/90 backdrop-blur-md shrink-0">
            <div className="flex justify-around items-center h-14 px-1">
              {[
                { tab: "cult" as TabType, icon: Sparkles, label: currentLang === "en" ? "Archetype" : "Arquétipo", activeColor: "text-accent" },
                {
                  tab: "housing" as TabType,
                  icon: Home,
                  label: currentLang === "en" ? "Itinerary" : "Roteiro",
                  onClick: () => setActiveTab("housing"),
                  activeColor: "text-primary",
                },
                { tab: "presence" as TabType, icon: Compass, label: currentLang === "en" ? "Deep Map" : "Mapão", activeColor: "text-secondary" },
                {
                  tab: "community" as TabType,
                  icon: Users,
                  label: currentLang === "en" ? "Community" : "Comunidade",
                  onClick: () => setActiveTab("community"),
                  activeColor: "text-primary",
                },
                { tab: "profile" as TabType, icon: User, label: currentLang === "en" ? "Profile" : "Perfil", activeColor: "text-foreground" },
              ].map(({ tab, icon: Icon, label, onClick, activeColor }: { tab: TabType; icon: any; label: string; onClick?: () => void; activeColor: string }) => {
                const isActive = activeTab === tab || (activeTab === "map" && tab === "presence");
                return (
                  <button
                    key={tab}
                    onClick={() => (onClick ? onClick() : setActiveTab(tab))}
                    className={`flex flex-col items-center justify-center gap-0.5 py-1.5 transition-all duration-200 flex-1 min-w-0 ${
                      isActive
                        ? activeColor
                        : "text-foreground/30 hover:text-foreground/50"
                    }`}
                  >
                    <div
                      className={`relative p-1.5 rounded-xl transition-all duration-200 ${isActive ? "bg-current/10" : ""}`}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                    </div>
                    <span className={`text-[9px] truncate max-w-[56px] tracking-wide ${isActive ? "font-bold" : "font-medium"}`}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </MobileFrame>

      {showRenewalPopup && (
        <RenewalPopup
          lang={(currentLang || "pt") as any}
          planKey={previousTier === "premium_company" ? "explorer" : "personal_map"}
          onClose={() => {
            setShowRenewalPopup(false);
            sessionStorage.setItem("renewal_popup_dismissed", "true");
          }}
        />
      )}

      <Dialog open={showLegalDialog} onOpenChange={setShowLegalDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Feltrip Cultural AI — Cult AI</DialogTitle>
            <DialogDescription className="sr-only">Documentos legais</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setLegalTab?.("terms")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${(!legalTab || legalTab === "terms") ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {currentLang === "en" ? "Terms of Use" : currentLang === "es" ? "Términos de Uso" : "Termos de Uso"}
            </button>
            <button
              onClick={() => setLegalTab?.("privacy")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${legalTab === "privacy" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {currentLang === "en" ? "Privacy Policy" : currentLang === "es" ? "Política de Privacidad" : "Política de Privacidade"}
            </button>
          </div>
          <ScrollArea className="h-[60vh] pr-4">
            {(!legalTab || legalTab === "terms") ? (
              isIOS ? (
                <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>{currentLang === "en" ? "Our Terms of Use follow Apple's Standard EULA." : currentLang === "es" ? "Nuestros Términos de Uso siguen el EULA Estándar de Apple." : "Nossos Termos de Uso seguem o EULA Padrão da Apple."}</p>
                  <a
                    href={APPLE_EULA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-primary underline font-semibold"
                  >
                    {currentLang === "en" ? "View Apple Standard EULA" : currentLang === "es" ? "Ver EULA Estándar de Apple" : "Ver EULA Padrão da Apple"}
                  </a>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {currentLang === "en" ? TERMS_TEXT_EN : currentLang === "es" ? TERMS_TEXT_ES : TERMS_TEXT_PT}
                </div>
              )
            ) : (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {currentLang === "en" ? PRIVACY_TEXT_EN : currentLang === "es" ? PRIVACY_TEXT_ES : PRIVACY_TEXT_PT}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExpatApp;
