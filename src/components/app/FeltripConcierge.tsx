import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ArrowLeft, Bot, Sparkles, Target, Star, Shield, Users, ChevronRight, Search, Globe, Phone, ExternalLink, AlertCircle, Calculator, LogIn, Newspaper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "./components/AuthModal";
import conciergePhoto from "@/assets/concierge-photo.jpg";
import AccountingGuide from "@/components/partners/AccountingGuide";

interface FeltripConciergeProps {
  onBack: () => void;
}

interface Expert {
  id: string;
  full_name: string;
  specialty: string;
  bio: string | null;
  bio_en: string | null;
  bio_es: string | null;
  avatar_url: string | null;
  city: string;
  categories: string[];
  is_cult_approved: boolean;
  is_feltrip_indicated: boolean;
  is_community_verified: boolean;
  total_reviews: number;
  avg_rating: number;
  website: string | null;
  phone: string | null;
  email: string | null;
  languages: string[] | null;
}

const EXPERT_CATEGORIES = ["Health", "Culture, Language & Translation", "Legal", "Accounting"] as const;

const TEXTS = {
  pt: {
    title: "Feltrip Concierge",
    subtitle: "Expertise verificada por confiança",
    tabs: { ai: "Cult AI Match 🤖", trust: "Trust Network ✨", search: "Por Expertise 🎯" },
    aiDesc: "Experts recomendados com base no seu perfil comportamental",
    trustDesc: "Indicados e validados pela comunidade Feltrip",
    searchDesc: "Busque por categoria ou especialidade",
    trustBadges: { cult: "Customer/Partner Indicated", feltrip: "Feltrip Indicated", community: "Community Indicated" },
    noExperts: "Em breve novos experts serão adicionados",
    howTitle: "Como funciona nossa rede de confiança",
    steps: [
      { icon: "🤖", title: "Cult AI Matching", desc: "Analisamos seu perfil comportamental para encontrar o expert ideal." },
      { icon: "✨", title: "Trust Network", desc: "Experts indicados por 2+ membros e validados pela equipe Feltrip." },
      { icon: "🛡️", title: "Monitoramento", desc: "Reviews constantes, feedback dos clientes e métricas de satisfação." },
    ],
    forExperts: "Para Experts",
    forExpertsDesc: "Zero taxa/comissão • Clientes qualificados • Tech support • Rede premium",
    whatsapp: "Falar no WhatsApp",
    back: "Voltar",
    categories: { "Health": "Saúde", "Culture, Language & Translation": "Cultura, Idioma e Tradução", "Legal": "Jurídico", "Accounting": "Contabilidade", "All": "Todos" },
    contact: "Contato",
    visitSite: "Visitar site",
    disclaimerTitle: "Disclaimer – Curadoria de Serviços Feltrip",
    curatorshipCriteria: "Critérios de Curadoria e Responsabilidade",
    badgeExplanations: [
      { badge: "Indicado Feltrip", desc: "Pessoas que já prestaram serviços para a Feltrip ou para algum de seus membros internos. Avaliamos os seguintes critérios:", criteria: ["Percepção de coerência entre preço praticado e valores médios de mercado na cidade ou território local", "Histórico de atuação no contexto específico de adaptação cultural, relocation ou acolhimento", "Qualidade do serviço prestado"] },
      { badge: "Indicado Comunidade", desc: "Pessoas indicadas mais de uma vez em comunidades de expatriados e/ou em nossa comunidade no WhatsApp." },
      { badge: "Indicado por Cliente/Parceiro", desc: "Pessoas indicadas por algum cliente ou prestador de serviço da Feltrip." },
    ],
    noIntermediationNote: "A Feltrip não intermedeia serviços, não recebe comissões, não participa de negociações e não se responsabiliza por contratos, valores, prazos ou resultados decorrentes da contratação de terceiros. As experiências variam de acordo com o perfil, necessidades e contexto de cada pessoa.",
    verificationNote: "Sugerimos verificar também das seguintes maneiras:",
    verificationCriteria: [
      "Informações disponíveis em plataformas abertas (como Google e Google Reviews)",
      "Recomendações públicas ou recorrentes no ecossistema de estrangeiros e pessoas em processo de adaptação no Brasil",
    ],
    accountingGuide: "Guia Contábil para Estrangeiros",
    accountingGuideDesc: "Entenda a realidade fiscal brasileira",
    bomdia: "Rio pelos olhos de um estrangeiro",
    bomdiaDesc: "BomDia Brazil — dicas, lugares e histórias sobre o Rio escritas por quem chegou e se apaixonou.",
    loginGateTitle: "Faça login para acessar",
    loginGateDesc: "A lista completa de profissionais verificados está disponível para usuários logados.",
    loginGateBtn: "Fazer login",
  },
  en: {
    title: "Feltrip Concierge",
    subtitle: "Expertise verified by trust",
    tabs: { ai: "Cult AI Match 🤖", trust: "Trust Network ✨", search: "By Expertise 🎯" },
    aiDesc: "Experts recommended based on your behavioral profile",
    trustDesc: "Referred and validated by the Feltrip community",
    searchDesc: "Search by category or specialty",
    trustBadges: { cult: "Customer/Partner Indicated", feltrip: "Feltrip Indicated", community: "Community Indicated" },
    noExperts: "New experts will be added soon",
    howTitle: "How our trust network works",
    steps: [
      { icon: "🤖", title: "Cult AI Matching", desc: "We analyze your behavioral profile to find the ideal expert." },
      { icon: "✨", title: "Trust Network", desc: "Experts referred by 2+ members and validated by the Feltrip team." },
      { icon: "🛡️", title: "Monitoring", desc: "Constant reviews, client feedback and satisfaction metrics." },
    ],
    forExperts: "For Experts",
    forExpertsDesc: "Zero fees/commission • Qualified clients • Tech support • Premium network",
    whatsapp: "Chat on WhatsApp",
    back: "Back",
    categories: { "Health": "Health", "Culture, Language & Translation": "Culture, Language & Translation", "Legal": "Legal", "Accounting": "Accounting", "All": "All" },
    contact: "Contact",
    visitSite: "Visit website",
    disclaimerTitle: "Disclaimer – Feltrip Service Curation",
    curatorshipCriteria: "Curation Criteria and Responsibility",
    badgeExplanations: [
      { badge: "Feltrip Indicated", desc: "People who have already provided services to Feltrip or to any of its internal members. We evaluate the following criteria:", criteria: ["Perception of coherence between the price charged and average market values in the city or local territory", "Track record of working in the specific context of cultural adaptation, relocation or welcoming", "Quality of service provided"] },
      { badge: "Community Indicated", desc: "People recommended more than once in expatriate communities and/or in our WhatsApp community." },
      { badge: "Customer/Partner Indicated", desc: "People recommended by a Feltrip client or service provider." },
    ],
    noIntermediationNote: "Feltrip does not intermediate services, does not receive commissions, does not participate in negotiations and is not responsible for contracts, values, deadlines or results arising from the hiring of third parties. Experiences vary according to the profile, needs and context of each person.",
    verificationNote: "We also suggest verifying in the following ways:",
    verificationCriteria: [
      "Information available on open platforms (such as Google and Google Reviews)",
      "Public or recurring recommendations in the ecosystem of foreigners and people in the process of adapting in Brazil",
    ],
    accountingGuide: "Accounting Guide for Foreigners",
    accountingGuideDesc: "Understand the Brazilian tax reality",
    bomdia: "Rio through a foreigner's eyes",
    bomdiaDesc: "BomDia Brazil — tips, places and stories about Rio written by someone who arrived and fell in love.",
    loginGateTitle: "Sign in to access",
    loginGateDesc: "The full list of verified professionals is available for logged-in users.",
    loginGateBtn: "Sign in",
  },
  es: {
    title: "Feltrip Concierge",
    subtitle: "Expertise verificada por confianza",
    tabs: { ai: "Cult AI Match 🤖", trust: "Trust Network ✨", search: "Por Expertise 🎯" },
    aiDesc: "Experts recomendados basados en tu perfil comportamental",
    trustDesc: "Indicados y validados por la comunidad Feltrip",
    searchDesc: "Busca por categoría o especialidad",
    trustBadges: { cult: "Customer/Partner Indicated", feltrip: "Feltrip Indicated", community: "Community Indicated" },
    noExperts: "Pronto se agregarán nuevos experts",
    howTitle: "Cómo funciona nuestra red de confianza",
    steps: [
      { icon: "🤖", title: "Cult AI Matching", desc: "Analizamos tu perfil comportamental para encontrar el expert ideal." },
      { icon: "✨", title: "Trust Network", desc: "Experts indicados por 2+ miembros y validados por el equipo Feltrip." },
      { icon: "🛡️", title: "Monitoreo", desc: "Reviews constantes, feedback de clientes y métricas de satisfacción." },
    ],
    forExperts: "Para Experts",
    forExpertsDesc: "Cero comisión • Clientes calificados • Tech support • Red premium",
    whatsapp: "Hablar por WhatsApp",
    back: "Volver",
    categories: { "Health": "Salud", "Culture, Language & Translation": "Cultura, Idioma y Traducción", "Legal": "Legal", "Accounting": "Contabilidad", "All": "Todos" },
    contact: "Contacto",
    visitSite: "Visitar sitio web",
    disclaimerTitle: "Disclaimer – Curación de Servicios Feltrip",
    curatorshipCriteria: "Criterios de Curación y Responsabilidad",
    badgeExplanations: [
      { badge: "Indicado Feltrip", desc: "Personas que ya prestaron servicios para Feltrip o para alguno de sus miembros internos. Evaluamos los siguientes criterios:", criteria: ["Percepción de coherencia entre el precio practicado y los valores medios de mercado en la ciudad o territorio local", "Historial de actuación en el contexto específico de adaptación cultural, reubicación o acogida", "Calidad del servicio prestado"] },
      { badge: "Indicado Comunidad", desc: "Personas indicadas más de una vez en comunidades de expatriados y/o en nuestra comunidad de WhatsApp." },
      { badge: "Indicado por Cliente/Socio", desc: "Personas indicadas por algún cliente o prestador de servicio de Feltrip." },
    ],
    noIntermediationNote: "Feltrip no intermedia servicios, no recibe comisiones, no participa en negociaciones y no se responsabiliza por contratos, valores, plazos o resultados derivados de la contratación de terceros. Las experiencias varían según el perfil, necesidades y contexto de cada persona.",
    verificationNote: "Sugerimos verificar también de las siguientes maneras:",
    verificationCriteria: [
      "Información disponible en plataformas abiertas (como Google y Google Reviews)",
      "Recomendaciones públicas o recurrentes en el ecosistema de extranjeros y personas en proceso de adaptación en Brasil",
    ],
    accountingGuide: "Guía Contable para Extranjeros",
    accountingGuideDesc: "Entiende la realidad fiscal brasileña",
    bomdia: "Río a través de los ojos de un extranjero",
    bomdiaDesc: "BomDia Brazil — consejos, lugares e historias sobre Río escritas por alguien que llegó y se enamoró.",
    loginGateTitle: "Inicia sesión para acceder",
    loginGateDesc: "La lista completa de profesionales verificados está disponible para usuarios registrados.",
    loginGateBtn: "Iniciar sesión",
  },
};

type TabMode = "ai" | "trust" | "search";

export const FeltripConcierge = ({ onBack }: FeltripConciergeProps) => {
  const { i18n } = useTranslation();
  const lang = (i18n.language?.substring(0, 2) || "pt") as keyof typeof TEXTS;
  const t = TEXTS[lang] || TEXTS.pt;
  const { user } = useAuth();
  const isAnonymous = !user || user.is_anonymous;
  const [tab, setTab] = useState<TabMode>("trust");
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [showAccountingGuide, setShowAccountingGuide] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const authLang = lang === "pt" ? "pt" : lang === "es" ? "es" : "en";

  useEffect(() => {
    const fetchExperts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("concierge_experts_safe" as any)
        .select("id, full_name, specialty, bio, bio_en, bio_es, avatar_url, city, categories, is_cult_approved, is_feltrip_indicated, is_community_verified, total_reviews, avg_rating, website, phone, email, languages")
        .order("avg_rating", { ascending: false });
      setExperts((data as unknown as Expert[]) || []);
      setLoading(false);
    };
    fetchExperts();
  }, []);

  const getTranslatedBio = (expert: Expert) => {
    if (lang === "en" && expert.bio_en) return expert.bio_en;
    if (lang === "es" && expert.bio_es) return expert.bio_es;
    return expert.bio;
  };

  const categoryMapping: Record<string, string[]> = {
    "Health": ["Mental Health", "Health", "Saúde", "Saúde Mental"],
    "Culture, Language & Translation": ["Local Culture", "Language", "Culture", "Cultura", "Idioma", "Tradução", "Translation", "Culture, Language & Translation"],
    "Legal": ["Legal", "Jurídico"],
    "Accounting": ["Accounting", "Contabilidade"],
  };

  const filteredExperts = experts.filter((e) => {
    if (tab === "ai") return e.is_cult_approved;
    if (tab === "trust") return e.is_feltrip_indicated || e.is_community_verified;
    if (tab === "search") {
      let match = true;
      if (categoryFilter !== "All") {
        const mappedCats = categoryMapping[categoryFilter] || [categoryFilter];
        match = e.categories?.some((c) => mappedCats.some(mc => c.toLowerCase() === mc.toLowerCase())) ?? false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        match = match && (e.specialty.toLowerCase().includes(q) || e.full_name.toLowerCase().includes(q) || e.categories?.some((c) => c.toLowerCase().includes(q)));
      }
      return match;
    }
    return true;
  });

  const handleWhatsApp = () => {
    const message = encodeURIComponent("Olá! Gostaria de saber mais sobre o Feltrip Concierge — concierge intercultural e poliglota.");
    window.open(`https://wa.me/5521976100692?text=${message}`, "_blank");
  };

  if (showAccountingGuide) {
    return (
      <div className="flex flex-col min-h-full bg-background overflow-y-auto">
        <div className="p-4">
          <Button variant="ghost" size="sm" onClick={() => setShowAccountingGuide(false)} className="gap-1 mb-4">
            <ArrowLeft className="h-4 w-4" /> {t.back}
          </Button>
          <AccountingGuide />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-background overflow-y-auto">
      <AuthModal isOpen={showAuthModal} lang={authLang} onClose={() => setShowAuthModal(false)} />
      <div className="p-4 space-y-5 max-w-2xl mx-auto w-full">
        {/* Hero */}
        <div className="rounded-xl overflow-hidden relative">
          <img src={conciergePhoto} alt="Feltrip Concierge" className="w-full h-40 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/80">{t.title}</p>
            <h1 className="text-lg font-bold text-foreground">{t.subtitle}</h1>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1">
          {(["ai", "trust", "search"] as TabMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setTab(m)}
              className={`flex-1 py-2 px-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${
                tab === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t.tabs[m]}
            </button>
          ))}
        </div>

        {/* Search input for search tab */}
        {tab === "search" && (
          <div className="space-y-3">
            {/* Category chips */}
            <div className="flex flex-wrap gap-1.5">
              {["All", ...EXPERT_CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-[10px] font-semibold rounded-full transition-colors ${
                    categoryFilter === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {(t.categories as any)[cat] || cat}
                </button>
              ))}
            </div>
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchDesc}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        )}

        {/* Tab description */}
        <p className="text-xs text-muted-foreground">
          {tab === "ai" ? t.aiDesc : tab === "trust" ? t.trustDesc : t.searchDesc}
        </p>

        {/* Expert cards */}
        <div className="relative">
          {/* Blur overlay for anonymous users */}
          {isAnonymous && !loading && filteredExperts.length > 0 && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-xl text-center max-w-xs mx-auto">
                <LogIn className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-bold text-foreground text-sm mb-1">{t.loginGateTitle}</h3>
                <p className="text-xs text-muted-foreground mb-4">{t.loginGateDesc}</p>
                <Button onClick={() => setShowAuthModal(true)} className="w-full gap-2" size="sm">
                  <LogIn className="h-4 w-4" />
                  {t.loginGateBtn}
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-10 text-sm text-muted-foreground">Loading...</div>
          ) : filteredExperts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-muted-foreground mb-4">{t.noExperts}</p>
              <Button onClick={handleWhatsApp} className="gap-2">
                <MessageCircle className="h-4 w-4" />
                {t.whatsapp}
              </Button>
            </div>
          ) : (
            <div className={`space-y-3 ${isAnonymous ? 'blur-[3px] select-none pointer-events-none' : ''}`}>
              {filteredExperts.map((expert) => (
                <Card key={expert.id} className="border-border/40 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {expert.avatar_url ? (
                          <img src={expert.avatar_url} alt={expert.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-primary font-bold text-lg">{expert.full_name[0]}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm text-foreground truncate">{expert.full_name}</h3>
                          {expert.avg_rating > 0 && (
                            <div className="flex items-center gap-0.5 shrink-0">
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              <span className="text-xs font-bold">{expert.avg_rating}</span>
                              <span className="text-[10px] text-muted-foreground">({expert.total_reviews})</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{expert.specialty} • {expert.city}</p>
                        {expert.languages && expert.languages.length > 0 && (
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                            🌐 {expert.languages.map(l => l.toUpperCase()).join(" · ")}
                          </p>
                        )}
                        {getTranslatedBio(expert) && <p className="text-xs text-foreground/80 mt-1">{getTranslatedBio(expert)}</p>}

                        {/* Trust Badges */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {expert.is_cult_approved && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1.5 gap-0.5 border-primary/30 text-primary">
                              <Bot className="h-2.5 w-2.5" /> {t.trustBadges.cult}
                            </Badge>
                          )}
                          {expert.is_feltrip_indicated && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1.5 gap-0.5 border-accent/30 text-accent">
                              <Sparkles className="h-2.5 w-2.5" /> {t.trustBadges.feltrip}
                            </Badge>
                          )}
                          {expert.is_community_verified && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1.5 gap-0.5 border-secondary/30 text-secondary">
                              <Users className="h-2.5 w-2.5" /> {t.trustBadges.community}
                            </Badge>
                          )}
                        </div>

                        {/* Contact buttons */}
                        {(expert.website || expert.phone || expert.email) && (
                          <div className="flex flex-wrap gap-2 mt-2.5">
                            {expert.website && (
                              <a href={expert.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline">
                                <Globe className="h-3 w-3" /> {t.visitSite}
                              </a>
                            )}
                            {expert.phone && (
                              <a href={`https://wa.me/${expert.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline">
                                <MessageCircle className="h-3 w-3" /> WhatsApp
                              </a>
                            )}
                            {expert.email && (
                              <a href={`mailto:${expert.email}`} className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline">
                                <ExternalLink className="h-3 w-3" /> Email
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Accounting Guide Card */}
        <Card
          className="p-4 cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group"
          onClick={() => setShowAccountingGuide(true)}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted/60 group-hover:bg-primary/10 transition-colors shrink-0">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">{t.accountingGuide}</h3>
              <p className="text-xs text-muted-foreground">{t.accountingGuideDesc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>

        {/* BomDia Brazil Card */}
        <Card
          className="p-4 cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group"
          onClick={() => window.open("https://bomdiabrazil.com", "_blank")}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted/60 group-hover:bg-primary/10 transition-colors shrink-0">
              <Newspaper className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">{t.bomdia}</h3>
              <p className="text-xs text-muted-foreground">{t.bomdiaDesc}</p>
              <span className="text-[10px] text-primary font-medium">→ bomdiabrazil.com</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>

        {/* Disclaimer */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                📌 {t.disclaimerTitle}
              </p>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="font-medium">{t.curatorshipCriteria}</p>
                {t.badgeExplanations.map((item, i) => (
                  <div key={i} className="space-y-1">
                    <p className="font-semibold text-xs text-foreground">{item.badge}:</p>
                    <p className="text-xs">{item.desc}</p>
                    {'criteria' in item && item.criteria && (
                      <ul className="list-disc pl-4 space-y-0.5 text-xs">
                        {(item.criteria as string[]).map((c, j) => (
                          <li key={j}>{c}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                <p className="text-xs">{t.noIntermediationNote}</p>
                <p className="text-xs font-medium">{t.verificationNote}</p>
                <ul className="list-disc pl-4 space-y-0.5 text-xs">
                  {t.verificationCriteria.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* How it works section */}
        <div className="pt-4 space-y-4">
          <h3 className="font-bold text-sm text-foreground text-center">{t.howTitle}</h3>
          <div className="space-y-3">
            {t.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3 bg-muted/30 rounded-xl p-3">
                <span className="text-xl shrink-0">{step.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-foreground">{step.title}</h4>
                  <p className="text-[11px] text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* For Experts */}
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 text-center space-y-2">
          <p className="font-bold text-xs text-foreground">{t.forExperts}</p>
          <p className="text-[11px] text-muted-foreground">{t.forExpertsDesc}</p>
          <Button onClick={handleWhatsApp} variant="outline" size="sm" className="gap-2">
            <MessageCircle className="h-3.5 w-3.5" />
            {t.whatsapp}
          </Button>
        </div>

        {/* WhatsApp CTA */}
        <Button onClick={handleWhatsApp} className="w-full h-12 text-sm font-semibold gap-2">
          <MessageCircle className="h-4 w-4" />
          {t.whatsapp}
        </Button>

        <Button onClick={onBack} variant="ghost" className="w-full gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Button>
      </div>
    </div>
  );
};