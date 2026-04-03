import React, { useState } from "react";
import { X, Star } from "lucide-react";
import { saveFeedback } from "../services/supabaseClient";

interface FeedbackPopupProps {
  sessionId?: string | null;
  featureLabel: string;
  lang: "pt" | "en" | "es";
  onClose: () => void;
}

const TEXTS: Record<string, { title: string; placeholder: string; submit: string; skip: string; thanks: string }> = {
  pt: {
    title: "Como foi sua experiência?",
    placeholder: "Deixe um comentário (opcional)...",
    submit: "Enviar",
    skip: "Pular",
    thanks: "Obrigado pelo feedback! ✦",
  },
  en: {
    title: "How was your experience?",
    placeholder: "Leave a comment (optional)...",
    submit: "Submit",
    skip: "Skip",
    thanks: "Thanks for your feedback! ✦",
  },
  es: {
    title: "¿Cómo fue tu experiencia?",
    placeholder: "Deja un comentario (opcional)...",
    submit: "Enviar",
    skip: "Saltar",
    thanks: "¡Gracias por tu feedback! ✦",
  },
};

export const FeedbackPopup: React.FC<FeedbackPopupProps> = ({
  sessionId,
  featureLabel,
  lang,
  onClose,
}) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const t = TEXTS[lang] || TEXTS.pt;

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      const sid = sessionId || `feedback_${featureLabel}_${Date.now()}`;
      await saveFeedback(sid, rating, `[${featureLabel}] ${comment}`.trim());
    } catch (e) {
      console.error("Feedback error:", e);
    }
    setSubmitted(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white dark:bg-boba-darkCard rounded-2xl shadow-2xl p-6 animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <p className="font-serif text-lg font-bold text-primary">{t.thanks}</p>
          </div>
        ) : (
          <>
            <h3 className="font-serif text-lg font-bold text-foreground mb-1 pr-6">{t.title}</h3>
            <p className="text-xs text-muted-foreground mb-4 capitalize">{featureLabel}</p>

            {/* Stars */}
            <div className="flex justify-center gap-1.5 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      star <= (hovered || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Comment */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t.placeholder}
              maxLength={500}
              rows={2}
              className="w-full resize-none rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
            />

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.skip}
              </button>
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-widest shadow-md disabled:opacity-40 transition-all"
              >
                {submitting ? "..." : t.submit}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
