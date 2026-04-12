import React, { useState, useEffect } from "react";
import { AuthModal } from "@/components/app/components/AuthModal";
import { Language } from "@/components/app/types";

const AUTH_TEXTS = {
  pt: {
    welcome: "Bem-vinda à Side B.",
    desc: "Para acessar as gemas ocultas e mapear sua presença, identifique-se abaixo.",
    manifesto: "Uma experiência exclusiva para quem busca sentir-se local.",
    identity: "Identidade Culti"
  },
  en: {
    welcome: "Welcome to Side B.",
    desc: "To access hidden gems and map your presence, please identify yourself below.",
    manifesto: "An exclusive experience for those seeking to feel like a local.",
    identity: "Culti Identity"
  },
  es: {
    welcome: "Bienvenida a Side B.",
    desc: "Para acceder a las gemas ocultas y mapear tu presencia, identifícate a continuación.",
    manifesto: "Una experiencia exclusiva para quienes buscan sentirse locales.",
    identity: "Identidad Culti"
  }
};

const Auth = () => {
  // Tenta pegar o idioma do navegador como padrão
  const [lang, setLang] = useState<Language>(() => {
    const browserLang = navigator.language.split('-')[0];
    return (browserLang === 'en' || browserLang === 'es') ? browserLang as Language : 'pt';
  });

  const t = AUTH_TEXTS[lang];

  return (
    <div className="min-h-screen bg-boba-offWhite flex flex-col items-center justify-center p-6 text-center transition-colors duration-500">

      {/* Seletor de Idioma Superior */}
      <div className="absolute top-8 flex gap-4 bg-white/50 backdrop-blur-sm p-1.5 rounded-full border border-boba-teal/10 shadow-sm">
        {(['pt', 'en', 'es'] as Language[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${lang === l
                ? "bg-boba-teal text-white shadow-md"
                : "text-boba-teal/40 hover:text-boba-teal/60"
              }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mb-8 animate-fade-in">
        <div className="w-16 h-16 bg-boba-teal rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
          <span className="text-2xl text-white font-serif italic">C</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-boba-teal tracking-tight">Culti</h1>
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-2xl border border-boba-teal/5 relative">
        <h2 className="text-xl font-serif font-bold text-boba-teal mb-2">{t.welcome}</h2>
        <p className="text-xs text-boba-teal/60 mb-8 leading-relaxed px-4">
          {t.desc}
        </p>

        {/* O AuthModal agora recebe o 'lang' dinâmico que você escolheu acima */}
        <div className="relative min-h-[300px]">
          <AuthModal
            isOpen={true}
            lang={lang}
            onClose={() => { }}
          />
        </div>
      </div>

      <p className="mt-12 text-[10px] text-boba-teal/30 font-medium max-w-[200px] leading-relaxed uppercase tracking-widest">
        {t.manifesto}
      </p>
    </div>
  );
};

export default Auth;