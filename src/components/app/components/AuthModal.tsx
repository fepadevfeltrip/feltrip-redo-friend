import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Language } from "../types";
import { CONTENT } from "../constants";
import { LEGAL_TEXT_PT, LEGAL_TEXT_EN, LEGAL_TEXT_ES } from "../constants/legalTexts";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const SIGNUP_TEXTS = {
  pt: {
    termsNotice: "Ao entrar, você concorda com nossos",
    termsLink: "Termos de Uso e Política de Privacidade",
    notificationsOptIn: "Ativa as notificações e recebe códigos promocionais e surpresas feitas para o seu perfil.",
    orSeparator: "ou entre com e-mail",
    emailPlaceholder: "seu@email.com",
    sendCode: "Receber Código",
    codeSent: "Enviamos um código seguro para o seu e-mail",
    enterCode: "Entrar",
    invalidCode: "Código inválido. Verifique e tente novamente.",
    emailRequired: "Digite seu e-mail",
    sending: "Enviando...",
    verifying: "Verificando...",
    backToEmail: "← Trocar e-mail",
  },
  en: {
    termsNotice: "By signing in, you agree to our",
    termsLink: "Terms of Use and Privacy Policy",
    notificationsOptIn: "Enable notifications and receive promo codes and surprises tailored to your profile.",
    orSeparator: "or sign in with email",
    emailPlaceholder: "your@email.com",
    sendCode: "Get Code",
    codeSent: "We sent a secure code to your email",
    enterCode: "Sign In",
    invalidCode: "Invalid code. Please check and try again.",
    emailRequired: "Enter your email",
    sending: "Sending...",
    verifying: "Verifying...",
    backToEmail: "← Change email",
  },
  es: {
    termsNotice: "Al iniciar sesión, aceptas nuestros",
    termsLink: "Términos de Uso y Política de Privacidad",
    notificationsOptIn: "Activa las notificaciones y recibe códigos promocionales y sorpresas hechas para tu perfil.",
    orSeparator: "o entra con email",
    emailPlaceholder: "tu@email.com",
    sendCode: "Recibir Código",
    codeSent: "Enviamos un código seguro a tu email",
    enterCode: "Entrar",
    invalidCode: "Código inválido. Verifica e intenta de nuevo.",
    emailRequired: "Escribe tu email",
    sending: "Enviando...",
    verifying: "Verificando...",
    backToEmail: "← Cambiar email",
  },
};

interface AuthModalProps {
  isOpen: boolean;
  lang: Language;
  onClose: () => void;
  redirectTo?: string; // Adicionado para permitir rotas dinâmicas
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, lang, onClose, redirectTo }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showLegal, setShowLegal] = useState(false);
  const [wantsPromos, setWantsPromos] = useState(false);

  // OTP state
  const [otpStep, setOtpStep] = useState<"email" | "code">("email");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const t = CONTENT[lang];
  const st = SIGNUP_TEXTS[lang] || SIGNUP_TEXTS.pt;
  const legalText = lang === "en" ? LEGAL_TEXT_EN : lang === "es" ? LEGAL_TEXT_ES : LEGAL_TEXT_PT;

  // Define o destino: se veio prop usa ela, senão usa o padrão com a aba
  const targetRoute = redirectTo || "/app?tab=presence";

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (wantsPromos) localStorage.setItem("pending_notification_optin", "true");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Usa a rota dinâmica para redirecionar o Google corretamente
          redirectTo: `${window.location.origin}${targetRoute}`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg("Erro ao conectar com Google. Tente novamente.");
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!otpEmail.trim()) {
      setErrorMsg(st.emailRequired);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      if (wantsPromos) localStorage.setItem("pending_notification_optin", "true");

      const { error } = await supabase.auth.signInWithOtp({
        email: otpEmail.trim(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;
      setOtpStep("code");
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao enviar código.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const cleanCode = otpCode.trim();
    if (cleanCode.length !== 6) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: otpEmail.trim(),
        token: cleanCode,
        type: "email",
      });

      if (error) throw error;
      // Let onAuthStateChange handle the redirect — no full page reload
      onClose();
    } catch (err: any) {
      console.error("Erro de validação OTP:", err);
      setErrorMsg(st.invalidCode);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-boba-teal/40 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-boba-offWhite dark:bg-boba-darkCard rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border-2 border-boba-teal/20 dark:border-white/10 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-boba-teal/50 hover:text-boba-coral dark:text-white/50 dark:hover:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8 flex flex-col items-center text-center">
          <h2 className="text-3xl font-serif font-bold text-boba-teal dark:text-boba-offWhite mb-2 tracking-tight">
            {t.loginModalTitle}
          </h2>
          <p className="text-sm text-boba-teal/70 dark:text-gray-400 mb-6 font-medium leading-relaxed">
            {t.loginModalDesc}
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 text-xs font-bold rounded-xl border w-full bg-boba-coral/10 text-boba-coral border-boba-coral/20">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="w-full space-y-3">
            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 px-4 bg-boba-coral hover:bg-boba-coral/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              <div className="bg-white p-1.5 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              <span>{loading && otpStep === "email" ? "..." : t.continueGoogle}</span>
            </button>

            {/* Separator */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-boba-teal/10 dark:bg-white/10" />
              <span className="text-[10px] text-boba-teal/40 dark:text-white/30 uppercase tracking-widest font-bold">
                {st.orSeparator}
              </span>
              <div className="flex-1 h-px bg-boba-teal/10 dark:bg-white/10" />
            </div>

            {/* Email OTP Flow */}
            {otpStep === "email" ? (
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder={st.emailPlaceholder}
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-white dark:bg-black/20 border border-boba-teal/20 dark:border-white/10 rounded-xl text-sm text-boba-teal dark:text-white placeholder:text-boba-teal/30 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-boba-coral/40 transition-all disabled:opacity-70"
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || !otpEmail.trim()}
                  className="w-full py-3.5 px-4 bg-boba-teal hover:bg-boba-teal/90 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? st.sending : st.sendCode}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-boba-teal/70 dark:text-gray-400 leading-relaxed">📩 {st.codeSent}</p>
                <p className="text-xs text-boba-teal/50 dark:text-white/40 font-medium">{otpEmail}</p>

                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={loading || otpCode.length !== 6}
                  className="w-full py-3.5 px-4 bg-boba-coral hover:bg-boba-coral/90 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? st.verifying : st.enterCode}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpStep("email");
                    setOtpCode("");
                    setErrorMsg(null);
                  }}
                  className="text-xs text-boba-teal/50 dark:text-white/40 hover:text-boba-coral transition-colors"
                >
                  {st.backToEmail}
                </button>
              </div>
            )}
          </div>

          <label className="mt-5 w-full flex items-start gap-2 text-left cursor-pointer">
            <input
              type="checkbox"
              checked={wantsPromos}
              onChange={(e) => setWantsPromos(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-boba-teal/30 text-boba-coral focus:ring-boba-coral"
            />
            <span className="text-[11px] text-boba-teal/70 dark:text-white/60 leading-relaxed">
              {st.notificationsOptIn}
            </span>
          </label>

          <p className="mt-4 text-[10px] text-boba-teal/50 dark:text-white/30 text-center leading-relaxed">
            {st.termsNotice}{" "}
            <button
              type="button"
              onClick={() => setShowLegal(true)}
              className="underline hover:text-boba-coral transition-colors"
            >
              {st.termsLink}
            </button>
          </p>

          <p className="mt-3 text-[10px] text-boba-teal/40 dark:text-white/20 uppercase tracking-widest font-bold">
            {t.securePrivate}
          </p>
        </div>
      </div>

      {showLegal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowLegal(false)}
        >
          <div
            className="bg-boba-offWhite dark:bg-boba-darkCard rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl border border-boba-teal/20 dark:border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-boba-teal/10 dark:border-white/10">
              <h3 className="font-serif font-bold text-boba-teal dark:text-white">Feltrip Cultural AI — Cult AI</h3>
              <button
                onClick={() => setShowLegal(false)}
                className="text-boba-teal/50 hover:text-boba-coral dark:text-white/50 dark:hover:text-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              <div className="text-sm text-boba-teal/70 dark:text-white/60 whitespace-pre-wrap leading-relaxed">
                {legalText}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
