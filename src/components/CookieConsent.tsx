import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const COOKIE_KEY = 'feltrip_cookie_consent';

const texts = {
  pt: {
    message: 'Ao utilizar nossos serviços, você concorda com o uso de cookies e outras tecnologias para personalizar sua experiência.',
    privacy: 'Política de Privacidade',
    terms: 'Termos de Uso',
    accept: 'Aceitar',
  },
  en: {
    message: 'By using our services, you agree to the use of cookies and other technologies to personalize your experience.',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    accept: 'Accept',
  },
  es: {
    message: 'Al utilizar nuestros servicios, aceptas el uso de cookies y otras tecnologías para personalizar tu experiencia.',
    privacy: 'Política de Privacidad',
    terms: 'Términos de Uso',
    accept: 'Aceptar',
  },
};

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const { i18n } = useTranslation();
  const lang = (i18n.language?.substring(0, 2) || 'pt') as keyof typeof texts;
  const t = texts[lang] || texts.pt;

  useEffect(() => {
    const accepted = localStorage.getItem(COOKIE_KEY);
    if (!accepted) setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] animate-fade-in-up">
      <div className="mx-auto max-w-lg p-4">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-5 space-y-3">
          <p className="text-sm text-foreground/80 leading-relaxed">
            {t.message}{' '}
            <a
              href="https://feltrip.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold underline underline-offset-2 hover:opacity-80"
            >
              {t.privacy}
            </a>{' '}
            &{' '}
            <a
              href="https://feltrip.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold underline underline-offset-2 hover:opacity-80"
            >
              {t.terms}
            </a>.
          </p>
          <button
            onClick={handleAccept}
            className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
