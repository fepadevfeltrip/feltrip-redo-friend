import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Lock, X, Loader2, Compass } from "lucide-react";
import bobaCultImage from "@/assets/boba-cult.png";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";

interface WelcomeByBobaProps {
  onStartWorkplace: () => void;
  onBack: () => void;
}

const BOBA_CULT_URL = "https://feltrip-culture-agent-ai-227971901250.us-west1.run.app";

export const WelcomeByBoba = ({ onStartWorkplace, onBack }: WelcomeByBobaProps) => {
  const { t } = useTranslation();
  const { minutesRemaining } = useCredits();
  const [showChat, setShowChat] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (showChat) {
      const fetchToken = async () => {
        setIframeLoading(true);
        setError(null);
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session?.access_token) {
            setError(t('common.pleaseLogin'));
            toast.error(t('common.pleaseLogin'));
            setIframeLoading(false);
            return;
          }

          // Build URL with token as query parameter for iframe
          const url = `${BOBA_CULT_URL}?token=${encodeURIComponent(session.access_token)}`;
          setIframeUrl(url);
        } catch (err) {
          console.error("Error getting auth token:", err);
          setError(t('common.connectionError'));
          toast.error(t('common.connectionError'));
        }
      };

      fetchToken();
    } else {
      // Reset state when closing
      setIframeUrl(null);
      setError(null);
      setIframeLoading(true);
    }
  }, [showChat, t]);

  const handleCloseChat = () => {
    setShowChat(false);
  };

  if (showChat) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl h-[90vh] flex flex-col overflow-hidden">
          <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between border-b p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <img 
                  src={bobaCultImage} 
                  alt="Cult" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div>
                <CardTitle className="text-xl">Cult</CardTitle>
                <p className="text-xs text-muted-foreground">{t('presence.yourConfidentialCompanion')}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleCloseChat}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 p-0 min-h-0 flex items-center justify-center">
            {iframeLoading && !error && (
              <div className="absolute flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>{t('presence.connectingToBoba')}</p>
              </div>
            )}
            {error ? (
              <div className="flex flex-col items-center gap-3 text-center p-6">
                <p className="text-destructive">{error}</p>
                <Button variant="outline" onClick={handleCloseChat}>{t('common.close')}</Button>
              </div>
            ) : iframeUrl ? (
              <iframe
                src={iframeUrl}
                className="w-full h-full border-0"
                allow="microphone; camera; autoplay"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                referrerPolicy="no-referrer"
                title="Cult"
                onLoad={() => setIframeLoading(false)}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-background overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header with Cult */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <img 
               src={bobaCultImage} 
                alt="Cult" 
                className="w-40 h-40 object-contain animate-float"
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-3 bg-primary/20 rounded-full blur-sm" />
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-widest text-primary/80">{t('presence.cultTitle')}</p>
            <h1 className="text-2xl font-bold text-foreground">
              {t('presence.cultSubtitle')}
            </h1>
          </div>
        </div>

        {/* Confidentiality Notice */}
        <div className="bg-muted/50 border border-border/50 rounded-lg p-4 flex items-start gap-3">
          <Lock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{t('presence.cultConfidentialTitle')}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('presence.cultConfidentialDesc')}
            </p>
          </div>
        </div>

        {/* Introduction */}
        <div className="space-y-4 text-muted-foreground">
          <div className="flex items-start gap-3">
            <Compass className="h-5 w-5 text-primary mt-1 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{t('presence.cultCompassTitle')}</p>
              <p className="leading-relaxed text-sm">
                {t('presence.cultCompassDesc')}
              </p>
            </div>
          </div>
          <p className="leading-relaxed text-sm">
            {t('presence.cultNotGenericAI')}
          </p>
        </div>

        {/* Credits Counter */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
          <p className="text-sm font-medium text-foreground"
            dangerouslySetInnerHTML={{ __html: t('presence.cultCredits').replace('<bold>', '<span class="text-primary font-bold">').replace('</bold>', '</span>') }}
          />
        </div>

        {/* Action Button */}
        <div className="w-full pt-2">
          <Button 
            onClick={() => setShowChat(true)}
            className="w-full h-16 text-lg font-semibold gap-3"
          >
            <MessageCircle className="h-6 w-6" />
            {t('presence.talkToCultChat')}
          </Button>
        </div>

        {/* Back Button */}
        <Button 
          onClick={onBack}
          variant="ghost"
          className="w-full"
        >
          {t('common.backToHome')}
        </Button>
      </div>
    </div>
  );
};
