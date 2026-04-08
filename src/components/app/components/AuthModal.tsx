import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Language } from "../types";
import { CONTENT } from "../constants";
import { LEGAL_TEXT_PT, LEGAL_TEXT_EN, LEGAL_TEXT_ES } from "../constants/legalTexts";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Capacitor } from "@capacitor/core";
import OneSignal from "onesignal-cordova-plugin";

const SIGNUP_TEXTS = {
  pt: {
    termsNotice: "Ao entrar, você concorda com nossos",
    termsLink: "Termos de Uso e Política de Privacidade",
    notificationsOptIn: "Ativa as notificações e recebe códigos promocionais e surpresas feitas para o seu perfil.",
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
    emailPlaceholder: "your@email.com",
    sendCode: "Get Code",
    codeSent: "We sent a secure code to your email",
    enterCode: "Sign In",
    invalidCode: "Invalid code. Please check and try again.",
    emailRequired: "Enter your email",
    sending: "Sending...",
    verifying: "Verificando...",
    backToEmail: "← Change email",
  },
  es: {
    termsNotice: "Al iniciar sesión, aceptas nuestros",
    termsLink: "Términos de Uso y Política de Privacidad",
    notificationsOptIn: "Activa las notificaciones y recibe códigos promocionais y sorpresas hechas para tu perfil.",
    emailPlaceholder: "tu@email.com",
    sendCode: "Recibir Código",
    codeSent: "Enviamos um código seguro a tu email",
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
  redirectTo?: string;
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

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    if (!otpEmail.trim()) {
      setErrorMsg(st.emailRequired);
      return;
    }

    // Apple Review: skip real OTP, go straight to code input
    if (otpEmail.trim().toLowerCase() === APPLE_REVIEW_EMAIL) {
      setOtpStep("code");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      if (wantsPromos) localStorage.setItem("pending_notification_optin", "true");
      const { error } = await supabase.auth.signInWithOtp({
        email: otpEmail.trim(),
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setOtpStep("code");
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao enviar código.");
    } finally {
      setLoading(false);
    }
  };

  const APPLE_REVIEW_EMAIL = "talkawaylanguage@gmail.com";

  const handleVerifyOtp = async () => {
    const cleanCode = otpCode.trim();
    if (cleanCode.length !== 6) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const emailLower = otpEmail.trim().toLowerCase();

      // Apple Review bypass: use Edge Function for the tester account
      if (emailLower === APPLE_REVIEW_EMAIL) {
        const { data: bypassData, error: bypassError } = await supabase.functions.invoke(
          "apple-review-auth",
          { body: { email: emailLower, code: cleanCode } }
        );

        if (bypassError) throw bypassError;
        if (bypassData?.error) throw new Error(bypassData.error);

        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: bypassData.token_hash,
          type: "magiclink",
        });

        if (verifyError) throw verifyError;

        // OneSignal Login for Apple Review User
        if (Capacitor.isNativePlatform() && verifyData?.user?.id) {
          OneSignal.login(verifyData.user.id);
        }

        onClose();
        return;
      }

      // Normal OTP verification
      const { data, error } = await supabase.auth.verifyOtp({
        email: otpEmail.trim(),
        token: cleanCode,
        type: "email",
      });

      if (error) throw error;

      // CONEXÃO COM ONESIGNAL: Atrela o ID do usuário logado ao aparelho
      if (Capacitor.isNativePlatform() && data?.user?.id) {
        OneSignal.login(data.user.id);
        console.log("✅ OneSignal vinculado ao usuário:", data.user.id);
      }

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