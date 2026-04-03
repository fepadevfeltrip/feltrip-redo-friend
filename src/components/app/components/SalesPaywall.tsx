import React, { useState } from 'react';
import { X, Check, MapPin, MessageCircle, Map, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { openCheckout } from '@/lib/stripe';
import CultSquadModal from './CultSquadModal';
import { getDisplayPrices } from '@/hooks/useDisplayCurrency';

interface SalesPaywallProps {
  onClose: () => void;
  lang: 'pt' | 'en' | 'es' | 'fr' | 'zh';
  showUpgradeOption?: boolean;
}

const buildTexts = (prices: { roteiro: string; imersao: string }) => ({
  pt: {
    heroTitle: 'Quase tudo é grátis! 🗺️',
    heroSubtitle: 'Pague só quando quiser ir além:',
    plans: [
      { icon: MessageCircle, name: 'Gem Extra', price: 'R$ 9,90', note: 'Pagamento único', items: ['1 sessão extra de gema', '24h de chat ilimitado'], cta: 'COMPRAR GEM EXTRA', key: 'gem_single' },
      { icon: Map, name: 'Roteiro Cult Unificado', price: prices.roteiro, note: 'Pay per use • Desbloqueio Imediato', items: ['Tudo do plano Free', 'Roteiro Completo (até 7 dias)', 'Suporte Concierge via Chat Ilimitado durante toda a jornada (até 7 dias)'], cta: 'GERAR MEU ROTEIRO', key: 'personal_map' },
      { icon: Compass, name: 'A Imersão Completa', price: prices.imersao, note: 'Pay per use • Mapão + Idioma', items: ['25 perguntas profundas do Mapão Fenomenológico', 'Dossiê de Aterrissagem e Moradia (Análise de ruas, custo e segurança)', '4h de Tutoria de Idioma com IA', 'Consultoria biográfica completa'], cta: 'DESBLOQUEAR TUDO', key: 'explorer', badge: 'Recomendado para Expats' },
    ],
  },
  en: {
    heroTitle: 'Almost everything is free! 🗺️',
    heroSubtitle: 'Pay only when you want more:',
    plans: [
      { icon: MessageCircle, name: 'Extra Gem', price: '$2.00', note: 'One-time', items: ['1 additional gem session', '24h unlimited chat'], cta: 'BUY EXTRA GEM', key: 'gem_single' },
      { icon: Map, name: 'Unified Cult Itinerary', price: prices.roteiro, note: 'Pay per use • Instant Unlock', items: ['Everything in the Free plan', 'Full Itinerary (up to 7 days)', 'Unlimited Concierge Chat Support throughout the journey (up to 7 days)'], cta: 'GENERATE MY ITINERARY', key: 'personal_map' },
      { icon: Compass, name: 'The Full Immersion', price: prices.imersao, note: 'Pay per use • Full Map + Language', items: ['25 deep phenomenological questions', 'Landing & Housing Dossier (Street analysis, cost & safety)', '4h of AI Language Tutoring', 'Complete biographical consulting'], cta: 'UNLOCK EVERYTHING', key: 'explorer', badge: 'Recommended for Expats' },
    ],
  },
  es: {
    heroTitle: '¡Casi todo es gratis! 🗺️',
    heroSubtitle: 'Paga solo cuando quieras más:',
    plans: [
      { icon: MessageCircle, name: 'Gema Extra', price: 'R$ 9,90', note: 'Pago único', items: ['1 sesión extra de gema', '24h de chat ilimitado'], cta: 'COMPRAR GEMA EXTRA', key: 'gem_single' },
      { icon: Map, name: 'Itinerario Cult Unificado', price: prices.roteiro, note: 'Pay per use • Desbloqueo Inmediato', items: ['Todo del plan Free', 'Itinerario Completo (hasta 7 días)', 'Soporte Concierge via Chat Ilimitado durante todo el viaje (hasta 7 días)'], cta: 'GENERAR MI ITINERARIO', key: 'personal_map' },
      { icon: Compass, name: 'La Inmersión Completa', price: prices.imersao, note: 'Pay per use • Mapa + Idioma', items: ['25 preguntas profundas del Mapeo Fenomenológico', 'Dosier de Aterrizaje y Vivienda (Análisis de calles, costo y seguridad)', '4h de Tutoría de Idioma con IA', 'Consultoría biográfica completa'], cta: 'DESBLOQUEAR TODO', key: 'explorer', badge: 'Recomendado para Expats' },
    ],
  },
  fr: {
    heroTitle: 'Presque tout est gratuit ! 🗺️',
    heroSubtitle: 'Payez uniquement quand vous voulez plus :',
    plans: [
      { icon: MessageCircle, name: 'Gemme Extra', price: prices.roteiro, note: 'Paiement unique', items: ['1 session extra', '24h de chat illimité'], cta: 'ACHETER GEMME EXTRA', key: 'gem_single' },
      { icon: Map, name: 'Itinéraire Cult Unifié', price: prices.roteiro, note: 'Pay per use • Déverrouillage Immédiat', items: ['Tout du plan Free', 'Itinéraire Complet (jusqu\'à 7 jours)', 'Support Concierge Chat Illimité pendant le voyage (jusqu\'à 7 jours)'], cta: 'GÉNÉRER MON ITINÉRAIRE', key: 'personal_map' },
      { icon: Compass, name: 'L\'Immersion Complète', price: prices.imersao, note: 'Pay per use • Carte + Langue', items: ['25 questions profondes du Mapeo', 'Dossier d\'Atterrissage et Logement (Analyse de rues, coûts et sécurité)', '4h Tuteur IA Langue', 'Consulting biographique complet'], cta: 'TOUT DÉBLOQUER', key: 'explorer', badge: 'Recommandé pour Expats' },
    ],
  },
  zh: {
    heroTitle: '几乎一切都是免费的！🗺️',
    heroSubtitle: '仅在需要更多时付费：',
    plans: [
      { icon: MessageCircle, name: '额外宝石', price: prices.roteiro, note: '一次性', items: ['1次额外宝石会话', '24小时无限聊天'], cta: '购买额外宝石', key: 'gem_single' },
      { icon: Map, name: 'Cult统一行程', price: prices.roteiro, note: 'Pay per use • 即时解锁', items: ['包含Free计划全部内容', '完整行程（最多7天）', '全程无限礼宾聊天支持（最多7天）'], cta: '生成我的行程', key: 'personal_map' },
      { icon: Compass, name: '完整沉浸', price: prices.imersao, note: 'Pay per use • 地图 + 语言', items: ['25个深度现象学问题', '着陆和住房档案（街道分析、成本和安全）', '4小时AI语言辅导', '完整传记咨询'], cta: '解锁一切', key: 'explorer', badge: '推荐给外籍人士' },
    ],
  },
});

const SQUAD_TEXTS: Record<string, { banner: string; cta: string }> = {
  pt: { banner: '🎯 Trabalha ou estuda em uma instituição? Desbloqueie 50% OFF com seu Squad!', cta: 'Saiba mais' },
  en: { banner: '🎯 Work or study at an institution? Unlock 50% OFF with your Squad!', cta: 'Learn more' },
  es: { banner: '🎯 ¿Trabajas o estudias en una institución? ¡Desbloquea 50% OFF con tu Squad!', cta: 'Saber más' },
  fr: { banner: '🎯 Vous travaillez ou étudiez ? Débloquez 50% OFF avec votre Squad !', cta: 'En savoir plus' },
  zh: { banner: '🎯 在机构工作或学习？与您的Squad解锁50%折扣！', cta: '了解更多' },
};

const SalesPaywall: React.FC<SalesPaywallProps> = ({ onClose, lang }) => {
  const prices = getDisplayPrices(lang);
  const allTexts = buildTexts(prices);
  const t = allTexts[lang as keyof typeof allTexts] || allTexts.pt;
  const sq = SQUAD_TEXTS[lang] || SQUAD_TEXTS.pt;
  const [showSquad, setShowSquad] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-card rounded-3xl w-full max-w-lg max-h-[90vh] shadow-2xl overflow-hidden border border-border relative flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors text-muted-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="overflow-y-auto p-5 space-y-4">
          <div className="text-center space-y-1 pt-2">
            <h2 className="text-2xl font-serif font-bold text-foreground leading-tight">{t.heroTitle}</h2>
            <p className="text-sm text-muted-foreground">{t.heroSubtitle}</p>
          </div>

          {t.plans.map((plan: any, i: number) => {
            const Icon = plan.icon;
            const isLast = i === t.plans.length - 1;
            return (
              <div key={i} className={`rounded-2xl p-4 space-y-3 ${isLast ? 'border-2 border-primary bg-primary/5' : i === 0 ? 'border-2 border-accent bg-accent/5' : 'border border-border bg-muted/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${i === 0 ? 'text-accent' : 'text-primary'}`} />
                    <h3 className="font-serif font-bold text-sm text-foreground">{plan.name}</h3>
                    {plan.badge && <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">{plan.badge}</Badge>}
                  </div>
                  <span className="text-base font-bold text-foreground">{plan.price}</span>
                </div>
                {plan.note && <p className="text-[10px] text-muted-foreground">{plan.note}</p>}
                <ul className="space-y-1.5">
                  {plan.items.map((item: string, j: number) => (
                    <li key={j} className="flex gap-2 text-[11px] text-foreground">
                      <Check className={`h-3.5 w-3.5 ${i === 0 ? 'text-accent' : 'text-primary'} shrink-0 mt-0.5`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => { openCheckout(plan.key); onClose(); }}
                  className={`w-full text-xs font-bold uppercase tracking-wider h-9 ${i === 0 ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}`}
                  variant={i === 0 ? 'default' : 'outline'}
                  size="sm"
                >
                  {plan.cta}
                </Button>
              </div>
            );
          })}

          <button
            onClick={() => setShowSquad(true)}
            className="w-full rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-3 text-center space-y-1 hover:bg-primary/10 transition-colors"
          >
            <p className="text-xs font-semibold text-foreground">{sq.banner}</p>
            <p className="text-[10px] font-bold text-primary underline">{sq.cta}</p>
          </button>
        </div>
      </div>

      <CultSquadModal open={showSquad} onOpenChange={setShowSquad} />
    </div>
  );
};

export default SalesPaywall;
