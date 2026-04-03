import React from 'react';
import { openApplePurchase as openCheckout } from '@/lib/appleIAP';
import { Share2 } from 'lucide-react';

interface ChatExpiredPaywallProps {
  lang: 'pt' | 'en' | 'es' | 'fr' | 'zh';
  timeRemaining?: string | null;
  onShare?: () => void;
  canShare?: boolean;
}

const TEXTS = {
  pt: { 
    expired: 'Você já usou sua pergunta gratuita desta sessão', 
    gem: 'Roteiro Completo + 24h Chat — R$ 29,90',
    share: '✦ Compartilhar meu Arquétipo'
  },
  en: { 
    expired: "You've used your free question for this session", 
    gem: 'Full Itinerary + 24h Chat — R$ 29.90',
    share: '✦ Share my Archetype'
  },
  es: { 
    expired: 'Ya usaste tu pregunta gratuita de esta sesión', 
    gem: 'Itinerario Completo + 24h Chat — R$ 29,90',
    share: '✦ Compartir mi Arquetipo'
  },
  fr: { 
    expired: 'Vous avez utilisé votre question gratuite', 
    gem: 'Itinéraire Complet + 24h Chat — R$ 29,90',
    share: '✦ Partager mon Archétype'
  },
  zh: { 
    expired: '您已使用本次免费提问', 
    gem: '完整行程 + 24小时聊天 — R$ 29.90',
    share: '✦ 分享我的原型'
  },
};

const ChatExpiredPaywall: React.FC<ChatExpiredPaywallProps> = ({ lang, onShare, canShare = false }) => {
  const t = TEXTS[lang] || TEXTS.pt;

  return (
    <div className="w-full p-4 bg-card border-t border-border">
      <div className="max-w-3xl mx-auto space-y-3">
        <div className="text-center">
          <p className="text-sm font-bold text-destructive">⏰ {t.expired}</p>
        </div>
        
        {canShare && onShare && (
          <button
            onClick={onShare}
            className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl text-sm uppercase tracking-wider hover:brightness-105 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Share2 className="h-4 w-4" />
            {t.share}
          </button>
        )}
        
        <button
          onClick={() => openCheckout('personal_map')}
          className="w-full py-3 px-4 bg-accent text-accent-foreground font-bold rounded-xl text-xs uppercase tracking-wider hover:brightness-105 transition-all"
        >
          {t.gem}
        </button>
      </div>
    </div>
  );
};

export default ChatExpiredPaywall;
