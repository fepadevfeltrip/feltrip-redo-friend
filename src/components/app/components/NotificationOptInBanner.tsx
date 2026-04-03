import React, { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const TEXTS: Record<string, { message: string; done: string }> = {
  pt: {
    message: "Ativa as notificações e recebe códigos promocionais e surpresas feitas para o seu perfil.",
    done: "Notificações ativadas ✦",
  },
  en: {
    message: "Enable notifications and receive promo codes and surprises tailored to your profile.",
    done: "Notifications enabled ✦",
  },
  es: {
    message: "Activa las notificaciones y recibe códigos promocionales y sorpresas hechas para tu perfil.",
    done: "Notificaciones activadas ✦",
  },
};

interface NotificationOptInBannerProps {
  lang?: string;
}

export const NotificationOptInBanner: React.FC<NotificationOptInBannerProps> = ({ lang = "pt" }) => {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const t = TEXTS[lang] || TEXTS.pt;

  useEffect(() => {
    if (!user) return;
    supabase
      .from("notification_preferences")
      .select("id, push_notifications")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.push_notifications) setHidden(true);
      });
  }, [user]);

  if (hidden) return null;

  const handleEnable = async () => {
    if (!user) return;
    const { data: existing } = await supabase
      .from("notification_preferences")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("notification_preferences")
        .update({ push_notifications: true, email_notifications: true })
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("notification_preferences")
        .insert({ user_id: user.id, push_notifications: true, email_notifications: true });
    }

    setEnabled(true);
    setTimeout(() => setHidden(true), 2500);
  };

  if (enabled) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-accent/10 text-accent text-xs font-medium animate-fade-in">
        <Check className="h-4 w-4" />
        {t.done}
      </div>
    );
  }

  return (
    <button
      onClick={handleEnable}
      className="w-full flex items-center gap-3 py-3 px-4 rounded-2xl bg-muted/50 hover:bg-accent/10 border border-border/50 hover:border-accent/30 transition-all text-left group"
    >
      <Bell className="h-4 w-4 text-muted-foreground group-hover:text-accent shrink-0 transition-colors" />
      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-snug">
        {t.message}
      </span>
    </button>
  );
};
