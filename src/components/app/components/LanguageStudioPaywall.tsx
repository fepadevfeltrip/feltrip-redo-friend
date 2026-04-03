import React, { useState } from 'react';
import { X, Languages, Clock, Calendar, Sparkles } from 'lucide-react';
import CultSquadModal from './CultSquadModal';
import { Button } from '@/components/ui/button';
import { getDisplayPrices } from '@/hooks/useDisplayCurrency';

interface LanguageStudioPaywallProps {
  onBuyUpgrade: () => void;
  onBuyImersao: () => void;
  onClose: () => void;
  lang: 'pt' | 'en' | 'es' | 'fr' | 'zh';
  reason?: 'NO_SUBSCRIPTION' | 'WEEKLY_LIMIT_REACHED';
  minutesUsed?: number;
  weeklyLimit?: number;
  resetsAt?: string;
}

const TEXTS = {
  pt: {
    title: 'Feltrip Language Studio',
    subtitle: 'Pratique conversas reais com IA para dominar o idioma do seu novo país.',
    imersaoTitle: 'A Imersão Completa',
    imersaoDesc: 'Mapão + 4h de Tutoria de Idioma com IA + Consultoria biográfica',
    imersaoBenefits: 'Pay per use • Tudo incluso',
    weeklyLimitTitle: 'Limite semanal atingido',
    weeklyLimitDesc: 'Você usou seus minutos desta semana. Renova em:',
  },
  en: {
    title: 'Feltrip Language Studio',
    subtitle: 'Practice real conversations with AI to master the language of your new country.',
    imersaoTitle: 'The Full Immersion',
    imersaoDesc: 'Deep Map + 4h AI Language Tutoring + biographical consulting',
    imersaoBenefits: 'Pay per use • All included',
    weeklyLimitTitle: 'Weekly limit reached',
    weeklyLimitDesc: 'You used your minutes this week. Resets at:',
  },
  es: {
    title: 'Feltrip Language Studio',
    subtitle: 'Practica conversaciones reales con IA.',
    imersaoTitle: 'La Inmersión Completa',
    imersaoDesc: 'Mapa Profundo + 4h Tutoría de Idioma con IA + Consultoría biográfica',
    imersaoBenefits: 'Pay per use • Todo incluido',
    weeklyLimitTitle: 'Límite semanal alcanzado',
    weeklyLimitDesc: 'Usaste tus minutos esta semana. Renueva en:',
  },
  fr: {
    title: 'Feltrip Language Studio',
    subtitle: 'Pratiquez des conversations avec l\'IA.',
    imersaoTitle: 'L\'Immersion Complète',
    imersaoDesc: 'Carte Profonde + 4h Tuteur IA Langue + Consulting biographique',
    imersaoBenefits: 'Pay per use • Tout inclus',
    weeklyLimitTitle: 'Limite hebdomadaire atteinte',
    weeklyLimitDesc: 'Vous avez utilisé vos minutes cette semaine.',
  },
  zh: {
    title: 'Feltrip Language Studio',
    subtitle: '与AI进行真实对话练习。',
    imersaoTitle: '完整沉浸',
    imersaoDesc: '深度地图 + 4小时AI语言辅导 + 传记咨询',
    imersaoBenefits: 'Pay per use • 全部包含',
    weeklyLimitTitle: '每周限制已达到',
    weeklyLimitDesc: '本周的分钟数已用完。',
  },
};

const SQUAD_TEXTS: Record<string, { banner: string; cta: string }> = {
  pt: { banner: '🎯 Trabalha ou estuda em uma instituição? Desbloqueie 50% OFF com seu Squad!', cta: 'Saiba mais' },
  en: { banner: '🎯 Work or study at an institution? Unlock 50% OFF with your Squad!', cta: 'Learn more' },
  es: { banner: '🎯 ¿Trabajas o estudias en una institución? ¡Desbloquea 50% OFF con tu Squad!', cta: 'Saber más' },
  fr: { banner: '🎯 Vous travaillez ou étudiez ? Débloquez 50% OFF avec votre Squad !', cta: 'En savoir plus' },
  zh: { banner: '🎯 在机构工作或学习？与您的Squad解锁50%折扣！', cta: '了解更多' },
};

const LanguageStudioPaywall: React.FC<LanguageStudioPaywallProps> = ({
  onBuyImersao,
  onClose,
  lang,
  reason = 'NO_SUBSCRIPTION',
  minutesUsed,
  weeklyLimit,
  resetsAt,
}) => {
  const t = TEXTS[lang] || TEXTS.pt;
  const sq = SQUAD_TEXTS[lang] || SQUAD_TEXTS.pt;
  const [showSquad, setShowSquad] = useState(false);
  const prices = getDisplayPrices(lang);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-card rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-border relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors text-muted-foreground"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-8 flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Languages className="h-8 w-8 text-primary-foreground" />
          </div>

          <h2 className="text-2xl font-serif font-bold text-foreground">
            {reason === 'WEEKLY_LIMIT_REACHED' ? t.weeklyLimitTitle : t.title}
          </h2>

          {reason === 'WEEKLY_LIMIT_REACHED' ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t.weeklyLimitDesc}</p>
              {resetsAt && (
                <p className="text-sm font-medium text-foreground">
                  {new Date(resetsAt).toLocaleDateString(lang, { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
              )}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{minutesUsed}/{weeklyLimit} min</span>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t.subtitle}
              </p>

              <div className="w-full p-5 bg-primary/5 rounded-2xl border-2 border-primary/20 space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs uppercase tracking-widest font-bold text-primary">
                    ⭐ {t.imersaoTitle}
                  </span>
                </div>
                <p className="text-sm text-foreground font-medium">{t.imersaoDesc}</p>
                <p className="text-xs text-muted-foreground">{t.imersaoBenefits}</p>
                <Button
                  onClick={onBuyImersao}
                  className="w-full py-4 font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {prices.imersao}
                </Button>
              </div>
            </>
          )}

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

export default LanguageStudioPaywall;
