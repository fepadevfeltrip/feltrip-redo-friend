import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useTranslation } from 'react-i18next';

const PREF_KEY = 'feltrip_news_prefs_asked';

const texts = {
  pt: {
    title: 'Fique por dentro! 🌿',
    desc: 'Gostaria de receber novidades e conteúdos da Feltrip?',
    receiveNews: 'Quero receber novidades da Feltrip',
    newsletter: 'Assinar newsletter',
    save: 'Salvar',
    skip: 'Agora não',
  },
  en: {
    title: 'Stay connected! 🌿',
    desc: 'Would you like to receive news and content from Feltrip?',
    receiveNews: 'I want to receive Feltrip news',
    newsletter: 'Subscribe to newsletter',
    save: 'Save',
    skip: 'Not now',
  },
  es: {
    title: '¡Mantente al día! 🌿',
    desc: '¿Te gustaría recibir novedades y contenidos de Feltrip?',
    receiveNews: 'Quiero recibir novedades de Feltrip',
    newsletter: 'Suscribirme al newsletter',
    save: 'Guardar',
    skip: 'Ahora no',
  },
};

interface Props {
  userId: string;
}

export function NewsPreferencesModal({ userId }: Props) {
  const [visible, setVisible] = useState(false);
  const [wantNews, setWantNews] = useState(false);
  const [wantNewsletter, setWantNewsletter] = useState(false);
  const [saving, setSaving] = useState(false);
  const { i18n } = useTranslation();
  const lang = (i18n.language?.substring(0, 2) || 'pt') as keyof typeof texts;
  const t = texts[lang] || texts.pt;

  useEffect(() => {
    // Check if we already asked this user
    const asked = localStorage.getItem(PREF_KEY);
    if (asked) return;

    // Check if profile has default (false/false) prefs — meaning never set
    const checkProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('want_news, want_newsletter')
        .eq('user_id', userId)
        .maybeSingle();

      // Show modal only if both are false (default/never set)
      if (data && !data.want_news && !data.want_newsletter) {
        setVisible(true);
      } else {
        // Already set, mark as asked
        localStorage.setItem(PREF_KEY, 'true');
      }
    };
    checkProfile();
  }, [userId]);

  const dismiss = () => {
    localStorage.setItem(PREF_KEY, 'true');
    setVisible(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from('profiles')
      .update({ want_news: wantNews, want_newsletter: wantNewsletter })
      .eq('user_id', userId);
    dismiss();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-card rounded-2xl w-full max-w-sm shadow-2xl border border-border p-6 space-y-4">
        <h3 className="text-xl font-serif font-bold text-foreground">{t.title}</h3>
        <p className="text-sm text-muted-foreground">{t.desc}</p>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={wantNews}
              onChange={e => setWantNews(e.target.checked)}
              className="h-4 w-4 rounded accent-primary"
            />
            <span className="text-sm text-foreground">{t.receiveNews}</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={wantNewsletter}
              onChange={e => setWantNewsletter(e.target.checked)}
              className="h-4 w-4 rounded accent-primary"
            />
            <span className="text-sm text-foreground">{t.newsletter}</span>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? '...' : t.save}
          </button>
          <button
            onClick={dismiss}
            className="px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t.skip}
          </button>
        </div>
      </div>
    </div>
  );
}
