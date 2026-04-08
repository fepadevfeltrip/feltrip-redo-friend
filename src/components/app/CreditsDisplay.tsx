import { useTranslation } from "react-i18next";
import { MessageCircle } from 'lucide-react';
import { useCredits } from '@/hooks/useCredits';
import { useAuth } from '@/hooks/useAuth';
import { useUserTier } from '@/hooks/useUserTier';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

const TEXTS = {
  pt: {
    remaining: "min restantes",
    remainingWeek: "restantes esta semana",
    used: "Usado",
    limit: "Limite",
    timeRemaining: "Tempo restante esta semana"
  },
  en: {
    remaining: "min remaining",
    remainingWeek: "remaining this week",
    used: "Used",
    limit: "Limit",
    timeRemaining: "Time remaining this week"
  },
  es: {
    remaining: "min restantes",
    remainingWeek: "restantes esta semana",
    used: "Usado",
    limit: "Límite",
    timeRemaining: "Tiempo restante esta semana"
  }
};

interface CreditsDisplayProps {
  variant?: 'compact' | 'full';
}

export function CreditsDisplay({ variant = 'compact' }: CreditsDisplayProps) {
  const { user } = useAuth();
  const { hasLanguageStudioIncluded } = useUserTier();
  const { minutesUsed, minutesRemaining, monthlyLimit, isLoading } = useCredits();
  const { i18n } = useTranslation();

  // Pega o idioma atual de forma segura
  const lang = (i18n.language?.substring(0, 2) || "pt") as "pt" | "en" | "es";
  const t = TEXTS[lang] || TEXTS.pt;

  const usagePercent = monthlyLimit > 0 ? (minutesUsed / monthlyLimit) * 100 : 0;
  const isLow = minutesRemaining <= 30;

  // Hide completely if not logged in or no Language Studio plan
  if (!user || !hasLanguageStudioIncluded) {
    return null;
  }

  if (isLoading) {
    return <Skeleton className="h-6 w-16" />;
  }

  if (variant === 'compact') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-sm font-medium ${isLow ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
            }`}>
            <MessageCircle className="h-4 w-4" />
            <span>💬 {minutesRemaining} {t.remaining}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t.timeRemaining}: {minutesRemaining} min</p>
          <p className="text-xs text-muted-foreground">{t.used}: {minutesUsed} / {monthlyLimit} min</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="p-4 bg-card rounded-lg border">
      <div className="flex items-center gap-2 mb-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <span className="font-semibold">Language Studio</span>
      </div>
      <div className={`text-3xl font-bold ${isLow ? 'text-destructive' : 'text-primary'}`}>
        💬 {minutesRemaining} min
      </div>
      <p className="text-sm text-muted-foreground mb-3">{t.remainingWeek}</p>
      <Progress value={usagePercent} className="h-2" />
      <div className="mt-2 text-xs text-muted-foreground flex justify-between">
        <span>{t.used}: {minutesUsed} min</span>
        <span>{t.limit}: {monthlyLimit} min</span>
      </div>
    </div>
  );
}