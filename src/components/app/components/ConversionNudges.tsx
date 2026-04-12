import React from 'react';
import { Button } from '@/components/ui/button';
import { Map, Lock } from 'lucide-react';
import { openApplePurchase as openCheckout } from '@/lib/appleIAP';

interface MapNudgePopupProps {
  onClose: () => void;
  lang: 'pt' | 'en' | 'es' | 'fr' | 'zh';
}

const TEXTS: Record<string, { title: string; subtitle: string; cta: string }> = {
  pt: { title: 'Quer descobrir seu bairro ideal?', subtitle: 'Seu Mapa Pessoal revela os 5 pilares da sua presença + lugares feitos pra você.', cta: 'Fazer meu Mapa Pessoal → R$ 129,90' },
  en: { title: 'Want to discover your ideal neighborhood?', subtitle: 'Your Personal Map reveals the 5 pillars of your presence + places made for you.', cta: 'Get my Personal Map → $ 29.00' },
  es: { title: '¿Quieres descubrir tu barrio ideal?', subtitle: 'Tu Mapa Personal revela los 5 pilares de tu presencia + lugares hechos para ti.', cta: 'Hacer mi Mapa Personal → $ 29,00' },
  fr: { title: 'Vous voulez découvrir votre quartier idéal ?', subtitle: 'Votre Carte Personnelle révèle les 5 piliers de votre présence + lieux pour vous.', cta: 'Ma Carte Personnelle → $ 29,90' },
  zh: { title: '想发现您理想的社区？', subtitle: '您的个人地图揭示您存在的5个支柱+为您打造的地点。', cta: '获取个人地图 → $ 29.90' },
};

export const MapNudgePopup: React.FC<MapNudgePopupProps> = ({ onClose, lang }) => {
  const t = TEXTS[lang] || TEXTS.pt;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-4 animate-fade-in-up">
      <div className="max-w-md mx-auto bg-card border border-border rounded-2xl shadow-2xl p-5 space-y-3 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground text-sm">✕</button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Map className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-foreground">{t.title}</h3>
            <p className="text-[11px] text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>
        <Button className="w-full" size="sm" onClick={() => { openCheckout('personal_map'); onClose(); }}>
          {t.cta}
        </Button>
      </div>
    </div>
  );
};

interface StickyMapCtaProps {
  lang: 'pt' | 'en' | 'es' | 'fr' | 'zh';
  onClose: () => void;
}

const STICKY_TEXTS: Record<string, { cta: string }> = {
  pt: { cta: '🔓 Desbloquear análise completa → R$ 129,90' },
  en: { cta: '🔓 Unlock full analysis → $ 29.90' },
  es: { cta: '🔓 Desbloquear análisis completo → $ 29,90' },
  fr: { cta: '🔓 Débloquer l\'analyse complète → $ 29,90' },
  zh: { cta: '🔓 解锁完整分析 → $ 29.90' },
};

export const StickyMapCta: React.FC<StickyMapCtaProps> = ({ lang, onClose }) => {
  const t = STICKY_TEXTS[lang] || STICKY_TEXTS.pt;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-primary text-primary-foreground py-3 px-4 shadow-lg">
      <div className="max-w-md mx-auto flex items-center gap-3">
        <Lock className="h-4 w-4 shrink-0" />
        <button
          onClick={() => { openCheckout('personal_map'); onClose(); }}
          className="flex-1 text-sm font-bold text-center hover:underline"
        >
          {t.cta}
        </button>
        <button onClick={onClose} className="text-primary-foreground/60 hover:text-primary-foreground text-xs">✕</button>
      </div>
    </div>
  );
};

interface PostLoginMapBannerProps {
  lang: 'pt' | 'en' | 'es' | 'fr' | 'zh';
  onClose: () => void;
}

const BANNER_TEXTS: Record<string, { title: string; cta: string }> = {
  pt: { title: '✨ Seu Mapa está pronto.', cta: 'Ver análise completa → R$ 129,90' },
  en: { title: '✨ Your Map is ready.', cta: 'See full analysis → $ 29.90' },
  es: { title: '✨ Tu Mapa está listo.', cta: 'Ver análisis completo → $ 29,90' },
  fr: { title: '✨ Votre Carte est prête.', cta: 'Voir l\'analyse complète → $ 29,90' },
  zh: { title: '✨ 您的地图已准备好。', cta: '查看完整分析 → $ 29.90' },
};

export const PostLoginMapBanner: React.FC<PostLoginMapBannerProps> = ({ lang, onClose }) => {
  const t = BANNER_TEXTS[lang] || BANNER_TEXTS.pt;

  return (
    <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-4 flex items-center gap-3">
      <div className="flex-1">
        <p className="text-sm font-bold text-foreground">{t.title}</p>
      </div>
      <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs whitespace-nowrap"
        onClick={() => { openCheckout('personal_map'); onClose(); }}
      >
        {t.cta}
      </Button>
      <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
    </div>
  );
};

interface RenewalPopupProps {
  lang: 'pt' | 'en' | 'es' | 'fr' | 'zh';
  planKey: string;
  onClose: () => void;
}

const RENEWAL_TEXTS: Record<string, { title: string; subtitle: string; cta: string }> = {
  pt: { title: 'Seu acesso expirou', subtitle: 'Renove agora e continue explorando sem limites.', cta: 'Renovar acesso' },
  en: { title: 'Your access has expired', subtitle: 'Renew now and keep exploring without limits.', cta: 'Renew access' },
  es: { title: 'Tu acceso ha expirado', subtitle: 'Renueva ahora y sigue explorando sin límites.', cta: 'Renovar acceso' },
  fr: { title: 'Votre accès a expiré', subtitle: 'Renouvelez maintenant pour continuer.', cta: 'Renouveler l\'accès' },
  zh: { title: '您的访问权限已过期', subtitle: '立即续订，继续无限探索。', cta: '续订访问' },
};

export const RenewalPopup: React.FC<RenewalPopupProps> = ({ lang, planKey, onClose }) => {
  const t = RENEWAL_TEXTS[lang] || RENEWAL_TEXTS.pt;
  const priceKey = (planKey === 'explorer' ? 'explorer' : 'personal_map') as 'explorer' | 'personal_map';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center space-y-5 relative border border-border">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">✕</button>
        <span className="text-4xl">⏰</span>
        <h2 className="text-xl font-bold text-foreground">{t.title}</h2>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        <Button className="w-full" onClick={() => { openCheckout(priceKey); onClose(); }}>
          {t.cta}
        </Button>
      </div>
    </div>
  );
};
