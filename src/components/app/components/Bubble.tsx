import React, { useState } from "react";
import { Message, Language } from "../types";
import { MRPChart } from "./MRPChart";
import { COLORS, CONTENT } from "../constants";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface BubbleProps {
  message: Message;
  lang: Language;
  onSave?: () => void;
  blurred?: boolean;
  onLogin?: () => void;
}

const parseInline = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|\*[^\*]+?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-boba-teal dark:text-boba-offWhite">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="italic opacity-90 text-boba-coral">
          {part.slice(1, -1)}
        </em>
      );
    }

    return part;
  });
};

const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  const filtered = text
    .replace(/<json>[\s\S]*?<\/json>/gi, "")
    .replace(/<json_a>[\s\S]*?<\/json_a>/gi, "")
    .replace(/<json_b>[\s\S]*?<\/json_b>/gi, "")
    .trim();

  if (!filtered) return null;

  const lines = filtered.split("\n");

  return (
    <div className="space-y-3">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-2" />;

        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={index} className="mt-6 mb-2 text-lg font-bold text-boba-teal dark:text-boba-offWhite">
              {parseInline(trimmed.replace("### ", ""))}
            </h3>
          );
        }

        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={index} className="mt-6 mb-3 text-xl font-bold text-boba-teal dark:text-boba-offWhite">
              {parseInline(trimmed.replace("## ", ""))}
            </h2>
          );
        }

        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={index} className="mt-6 mb-3 text-2xl font-bold text-boba-teal dark:text-boba-offWhite">
              {parseInline(trimmed.replace("# ", ""))}
            </h1>
          );
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
          return (
            <div key={index} className="ml-2 flex items-start gap-2">
              <span className="mt-1 text-xs text-boba-coral">●</span>
              <span className="leading-relaxed">{parseInline(trimmed.replace(/^[-•]\s/, ""))}</span>
            </div>
          );
        }

        if (/^\d+\.\s/.test(trimmed)) {
          const match = trimmed.match(/^(\d+)\.\s(.*)$/);
          if (match) {
            return (
              <div key={index} className="ml-2 flex items-start gap-2">
                <span className="mt-0.5 text-xs font-bold text-boba-teal dark:text-boba-offWhite">{match[1]}.</span>
                <span className="leading-relaxed">{parseInline(match[2])}</span>
              </div>
            );
          }
        }

        return (
          <p key={index} className="leading-relaxed">
            {parseInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

const SHIFT_ORDER = ["morning", "afternoon", "night"] as const;
type ShiftKey = (typeof SHIFT_ORDER)[number];

const SHIFT_LABELS: Record<ShiftKey, string> = {
  morning: "☀️ Manhã",
  afternoon: "🌤️ Tarde",
  night: "🌙 Noite",
};

const normalizeShift = (value: unknown): ShiftKey | null => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (["morning", "manha", "manhã"].includes(normalized)) return "morning";
  if (["afternoon", "tarde"].includes(normalized)) return "afternoon";
  if (["night", "noite"].includes(normalized)) return "night";
  return null;
};

export const Bubble: React.FC<BubbleProps> = ({ message, lang, blurred = false, onGoogleLogin }) => {
  const isUser = message.role === "user";
  const t = CONTENT[lang];

  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState<"idle" | "email" | "code">("idle");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const OTP_TEXTS: Record<string, any> = {
    pt: {
      or: "ou entre com e-mail",
      placeholder: "seu@email.com",
      send: "Receber Código",
      codeSent: "Código enviado para",
      verify: "Entrar",
      back: "← Trocar e-mail",
      invalid: "Código inválido",
    },
    en: {
      or: "or sign in with email",
      placeholder: "your@email.com",
      send: "Get Code",
      codeSent: "Code sent to",
      verify: "Sign In",
      back: "← Change email",
      invalid: "Invalid code",
    },
    es: {
      or: "o entra con email",
      placeholder: "tu@email.com",
      send: "Recibir Código",
      codeSent: "Código enviado a",
      verify: "Entrar",
      back: "← Cambiar email",
      invalid: "Código inválido",
    },
  };
  const ot = OTP_TEXTS[lang] || OTP_TEXTS.pt;

  const handleSendOtp = async () => {
    if (!otpEmail.trim()) return;

    setOtpLoading(true);
    setOtpError(null);

    try {
      localStorage.setItem("pending_action", "cult_gems");
      const { error } = await supabase.auth.signInWithOtp({
        email: otpEmail.trim(),
        options: { shouldCreateUser: true },
      });

      if (error) throw error;
      setOtpStep("code");
    } catch (e: any) {
      setOtpError(e.message || "Error");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) return;

    setOtpLoading(true);
    setOtpError(null);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: otpEmail.trim(),
        token: otpCode,
        type: "email",
      });

      if (error) throw error;
    } catch (e: any) {
      setOtpError(ot.invalid);
    } finally {
      setOtpLoading(false);
    }
  };

  const renderUnlockOverlay = () => {
    if (!blurred || !onGoogleLogin) return null;

    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <div className="mx-4 w-full max-w-sm space-y-4 rounded-3xl border-2 border-boba-coral/30 bg-white p-6 text-center shadow-2xl dark:bg-boba-darkCard sm:p-8">
          <div className="text-3xl">✨</div>
          <h3 className="font-serif text-xl font-bold text-boba-coral sm:text-2xl">{t.loginModalTitle}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{t.loginModalDesc}</p>

          <div className="space-y-1 px-2 text-left text-sm text-gray-600 dark:text-gray-300">
            <p className="mb-2 text-center font-bold text-boba-teal dark:text-boba-offWhite">
              {lang === "es" ? "DESBLOQUEAR INCLUYE:" : lang === "en" ? "UNLOCK INCLUDES:" : "DESBLOQUEAR INCLUI:"}
            </p>
            <p>• {lang === "es" ? "Detalles completos" : lang === "en" ? "Full location details" : "Detalhes completos"}</p>
            <p>• {lang === "es" ? "Tips exclusivos" : lang === "en" ? "Insider tips" : "Dicas exclusivas"}</p>
            <p>• {lang === "es" ? "Mejores horarios" : lang === "en" ? "Best times to go" : "Melhores horários"}</p>
            <p>• {lang === "es" ? "24h de chat con Cult AI" : lang === "en" ? "24h chat with Cult AI" : "24h de chat com Cult AI"}</p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={onGoogleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-boba-coral py-4 text-xs font-bold uppercase tracking-widest text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-boba-coral/90"
            >
              <div className="flex shrink-0 items-center justify-center rounded-full bg-white p-1.5">
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              {lang === "es" ? "Continuar con Google" : lang === "en" ? "Continue with Google" : "Continuar com Google"}
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{ot.or}</span>
              <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
            </div>

            {otpStep === "idle" ? (
              <button
                onClick={() => setOtpStep("email")}
                className="w-full rounded-2xl border-2 border-boba-teal/30 py-3 text-xs font-bold uppercase tracking-widest text-boba-teal transition-all hover:border-boba-teal"
              >
                {lang === "es" ? "Entrar con email" : lang === "en" ? "Sign in with email" : "Entrar com e-mail"}
              </button>
            ) : otpStep === "email" ? (
              <div className="space-y-3">
                <input
                  type="email"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  placeholder={ot.placeholder}
                  className="w-full rounded-2xl border border-gray-200 bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-boba-teal dark:border-white/10"
                />
                <button
                  onClick={handleSendOtp}
                  disabled={otpLoading || !otpEmail.trim()}
                  className="w-full rounded-2xl bg-boba-teal py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
                >
                  {otpLoading ? "..." : ot.send}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  {ot.codeSent} {otpEmail}
                </p>
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
                  onClick={handleVerifyOtp}
                  disabled={otpLoading || otpCode.length !== 6}
                  className="w-full rounded-2xl bg-boba-teal py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
                >
                  {otpLoading ? "..." : ot.verify}
                </button>
                <button onClick={() => setOtpStep("email")} className="text-xs font-bold text-boba-coral">
                  {ot.back}
                </button>
              </div>
            )}

            {otpError && <p className="text-xs font-bold text-boba-coral">{otpError}</p>}
          </div>
        </div>
      </div>
    );
  };

  const renderGemCard = (gem: any, key: string, shiftLabel?: string) => (
    <div
      key={key}
      className="relative overflow-hidden rounded-2xl border-l-4 bg-boba-offWhite/60 p-5 shadow-sm dark:bg-black/20"
      style={{ borderColor: COLORS[gem.pin_color] || COLORS.teal }}
    >
      {blurred && (
        <div className="absolute right-2 top-2 z-10 rounded-full bg-boba-coral px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider text-white animate-pulse">
          {lang === "es" ? "¡GEMA LISTA!" : lang === "en" ? "GEM FOUND!" : "GEMA PRONTA!"}
        </div>
      )}

      <div className="mb-1 flex items-start justify-between">
        <div className="flex items-center gap-2">
          {shiftLabel && (
            <span className="rounded bg-boba-coral/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-boba-coral">
              {shiftLabel}
            </span>
          )}
          {gem.categoria_principal && (
            <span className="rounded bg-boba-teal/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-boba-teal">
              {gem.categoria_principal}
            </span>
          )}
        </div>
      </div>

      <div className={blurred ? "pointer-events-none select-none blur-[6px]" : ""}>
        <div className="font-serif text-base font-bold text-boba-teal dark:text-gray-100">{gem.name || "Sem título"}</div>
        <div className="mb-2 text-[10px] font-medium uppercase text-gray-400">{gem.address || "Endereço não informado"}</div>
        {(gem.dia || gem.horario) && (
          <div className="mb-2 text-[10px] font-bold uppercase text-boba-coral">
            {gem.dia} {gem.horario ? `• ${gem.horario}` : ""}
          </div>
        )}
        <div className="text-sm italic leading-relaxed text-gray-600 dark:text-gray-300">"{gem.description || "Sem descrição."}"</div>
      </div>
    </div>
  );

  const renderGemSection = () => {
    try {
      const safeGems = Array.isArray(message.gems) ? message.gems.filter(Boolean) : [];
      if (safeGems.length === 0) return null;

      const hasRecognizedShifts = safeGems.some((gem) => normalizeShift((gem as any)?.shift));

      return (
        <div className="relative mt-10 space-y-6">
          <div className="mb-4 flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-boba-mustard/30" />
            <div className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.3em] text-boba-mustard">
              {t.gemSectionTitle}
            </div>
            <div className="h-[1px] flex-1 bg-boba-mustard/30" />
          </div>

          <div className="relative">
            <div className="grid gap-4">
              {hasRecognizedShifts
                ? SHIFT_ORDER.flatMap((shift) => {
                    const gemsForShift = safeGems.filter((gem) => normalizeShift((gem as any)?.shift) === shift);

                    if (gemsForShift.length === 0) {
                      return (
                        <div
                          key={`empty-${shift}`}
                          className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground"
                        >
                          <span className="mr-2 font-bold">{SHIFT_LABELS[shift]}:</span>
                          Sem atividade programada.
                        </div>
                      );
                    }

                    return gemsForShift.map((gem, idx) => renderGemCard(gem, `gem-${shift}-${idx}`, SHIFT_LABELS[shift]));
                  })
                : safeGems.map((gem, idx) => renderGemCard(gem, `gem-${idx}`))}
            </div>

            {renderUnlockOverlay()}
          </div>
        </div>
      );
    } catch (error) {
      console.error("Bubble — erro ao renderizar gemas:", error);
      return (
        <div className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          Não foi possível exibir este trecho do roteiro com segurança.
        </div>
      );
    }
  };

  return (
    <div className={`mb-6 flex w-full animate-fade-in-up ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] rounded-3xl px-6 py-5 text-sm font-sans shadow-md transition-all duration-300 sm:max-w-[85%] sm:text-base ${
          isUser
            ? "rounded-br-none bg-boba-coral text-white"
            : "rounded-bl-none border border-boba-teal/5 bg-white text-gray-700 dark:bg-boba-darkCard dark:text-gray-200"
        }`}
      >
        {message.isGraph && message.graphData ? (
          <MRPChart data={message.graphData} lang={lang} />
        ) : (
          <div className="w-full">
            {message.isPremiumLock ? (
              <div className="space-y-3 rounded-3xl border border-boba-coral/20 bg-boba-offWhite/70 p-5 dark:bg-black/20">
                <div className="text-3xl">🔒</div>
                <h3 className="font-serif text-lg font-bold text-boba-coral">{message.lockTitle || "Exclusivo Pro"}</h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {message.lockDescription || message.text}
                </p>
              </div>
            ) : (
              <div className={!isUser ? "font-serif" : ""}>
                <FormattedText text={message.text} />
              </div>
            )}

            {renderGemSection()}
          </div>
        )}
      </div>
    </div>
  );
};
