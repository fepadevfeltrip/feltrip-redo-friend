import React, { useState } from 'react';
import { openApplePurchase as openCheckout } from '@/lib/appleIAP';
import CultSquadModal from './CultSquadModal';

interface UpgradePaywallProps {
  gemsUsed: number;
  onBuyGem: () => void;
  onBuyPremium: () => void;
  onClose: () => void;
  lang: 'pt' | 'en' | 'es' | 'fr' | 'zh';
}

const TEXTS = {
  pt: {
    title: 'Você já usou sua gema gratuita',
    subtitle: 'Escolha como continuar:',
    buyGem: 'Gem Extra + 24h de chat — R$ 9,90',
    or: 'ou',
    mapTitle: 'Roteiro Cult Unificado',
    mapDesc: 'Tudo do plano Free + Roteiro Completo (até 7 dias) + 24h de Chat Ilimitado com a Cult AI',
    mapPrice: 'R$ 29,90',
    explorerTitle: 'A Imersão Completa',
    explorerDesc: '25 perguntas profundas do Mapão Fenomenológico + Diagnóstico de Moradia + 4h de IA Tutora de Idioma + Consultoria biográfica completa',
    explorerPrice: 'R$ 89,00',
    explorerBadge: 'Para Morar',
  },
  en: {
    title: "You've used your free gem",
    subtitle: 'Choose how to continue:',
    buyGem: 'Extra Gem + 24h chat — R$ 9.90',
    or: 'or',
    mapTitle: 'Unified Cult Itinerary',
    mapDesc: 'Everything in the Free plan + Full Itinerary (up to 7 days) + 24h Unlimited Chat with Cult AI',
    mapPrice: 'R$ 29.90',
    explorerTitle: 'The Full Immersion',
    explorerDesc: '25 deep phenomenological questions + Housing Diagnosis + 4h AI Language Tutor + Complete biographical consulting',
    explorerPrice: 'R$ 89.00',
    explorerBadge: 'To Live Here',
  },
  es: {
    title: 'Ya usaste tu gema gratuita',
    subtitle: 'Elige cómo continuar:',
    buyGem: 'Gema Extra + 24h de chat — R$ 9,90',
    or: 'o',
    mapTitle: 'Itinerario Cult Unificado',
    mapDesc: 'Todo del plan Free + Itinerario Completo (hasta 7 días) + 24h de Chat Ilimitado con Cult AI',
    mapPrice: 'R$ 29,90',
    explorerTitle: 'La Inmersión Completa',
    explorerDesc: '25 preguntas profundas del Mapeo Fenomenológico + Diagnóstico de vivienda + 4h IA Tutora de Idioma + Consultoría biográfica completa',
    explorerPrice: 'R$ 89,00',
    explorerBadge: 'Para Vivir Aquí',
  },
  fr: {
    title: "Vous avez utilisé votre gemme gratuite",
    subtitle: 'Choisissez comment continuer :',
    buyGem: 'Gemme Extra + 24h de chat — R$ 9,90',
    or: 'ou',
    mapTitle: 'Itinéraire Cult Unifié',
    mapDesc: 'Tout du plan Free + Itinéraire Complet (jusqu\'à 7 jours) + 24h de Chat Illimité avec Cult AI',
    mapPrice: 'R$ 29,90',
    explorerTitle: 'L\'Immersion Complète',
    explorerDesc: '25 questions profondes + Dossier Logement + 4h Tuteur IA Langue + Consulting biographique complet',
    explorerPrice: 'R$ 89,00',
    explorerBadge: 'Pour Vivre Ici',
  },
  zh: {
    title: '您已使用免费宝石',
    subtitle: '选择如何继续：',
    buyGem: '额外宝石 + 24小时聊天 — R$ 9.90',
    or: '或',
    mapTitle: 'Cult统一行程',
    mapDesc: '包含Free计划全部内容 + 完整行程（最多7天） + 24小时无限Chat',
    mapPrice: 'R$ 29.90',
    explorerTitle: '完整沉浸',
    explorerDesc: '25个深度现象学问题 + 住房诊断 + 4小时AI语言导师 + 完整传记咨询',
    explorerPrice: 'R$ 89.00',
    explorerBadge: '为了在这里生活',
  },
};

const SQUAD_TEXTS: Record<string, { banner: string; cta: string }> = {
  pt: { banner: '🎯 Trabalha ou estuda em uma instituição? Desbloqueie 50% OFF com seu Squad!', cta: 'Saiba mais' },
  en: { banner: '🎯 Work or study at an institution? Unlock 50% OFF with your Squad!', cta: 'Learn more' },
  es: { banner: '🎯 ¿Trabajas o estudias en una institución? ¡Desbloquea 50% OFF con tu Squad!', cta: 'Saber más' },
  fr: { banner: '🎯 Vous travaillez ou étudiez ? Débloquez 50% OFF avec votre Squad !', cta: 'En savoir plus' },
  zh: { banner: '🎯 在机构工作或学习？与您的Squad解锁50%折扣！', cta: '了解更多' },
};

const UpgradePaywall: React.FC<UpgradePaywallProps> = ({ gemsUsed, onBuyGem, onBuyPremium, onClose, lang }) => {
  const t = TEXTS[lang] || TEXTS.pt;
  const sq = SQUAD_TEXTS[lang] || SQUAD_TEXTS.pt;
  const [showSquad, setShowSquad] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-card rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-border relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors text-muted-foreground"
          aria-label="Fechar"
        >
          ✕
        </button>
        <div className="p-8 flex flex-col items-center text-center space-y-5">
          <span className="text-4xl">💎</span>

          <h2 className="text-2xl font-serif font-bold text-primary">{t.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t.subtitle}</p>

          <button
            onClick={onBuyGem}
            className="w-full py-4 px-4 bg-accent text-accent-foreground font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm uppercase tracking-wider"
          >
            {t.buyGem}
          </button>

          <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{t.or}</span>

          <div className="w-full p-5 bg-primary/5 rounded-2xl border border-primary/20 space-y-3">
            <h3 className="text-base font-serif font-bold text-foreground">{t.mapTitle}</h3>
            <p className="text-xs text-muted-foreground">{t.mapDesc}</p>
            <button
              onClick={() => { openCheckout('personal_map'); onClose(); }}
              className="w-full py-3 px-4 bg-primary text-primary-foreground font-bold rounded-xl transition-all shadow-lg hover:shadow-xl text-base"
            >
              {t.mapPrice}
            </button>
          </div>

          <div className="w-full p-5 bg-primary/10 rounded-2xl border-2 border-primary/40 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-base font-serif font-bold text-foreground">{t.explorerTitle}</h3>
              <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold">{t.explorerBadge}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t.explorerDesc}</p>
            <button
              onClick={() => { openCheckout('explorer'); onClose(); }}
              className="w-full py-3 px-4 bg-primary text-primary-foreground font-bold rounded-xl transition-all shadow-lg hover:shadow-xl text-base"
            >
              {t.explorerPrice}
            </button>
          </div>

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

export default UpgradePaywall;
