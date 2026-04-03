import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FeedbackPopup } from "./components/FeedbackPopup";

interface BobaProfessoraChatProps {
  onClose: () => void;
}

const STUDIO_BASE_URL = "https://feltrip-language-studio-227971901250.us-west1.run.app";

// Helper to build authenticated URL
const buildAuthenticatedUrl = (baseUrl: string, token: string, extraToken?: string) => {
  const url = new URL(baseUrl);
  url.searchParams.set('token', token);
  if (extraToken) {
    url.searchParams.set('studio_token', extraToken);
  }
  return url.toString();
};

export const BobaProfessoraChat = ({ onClose }: BobaProfessoraChatProps) => {
  const [studioUrl, setStudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasReportedRef = useRef(false);
  const primaryUserIdRef = useRef<string | null>(null);

  // Get the primary user ID (family members feature removed)
  const getPrimaryUserId = async (userId: string): Promise<string> => {
    return userId;
  };

  const reportUsage = async () => {
    if (hasReportedRef.current || !startTimeRef.current || !primaryUserIdRef.current) return;
    
    hasReportedRef.current = true;
    const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
    
    // Only report if at least 5 seconds were spent
    if (durationSeconds < 5) return;

    try {
      // Report usage against the primary user's quota (shared family time)
      const { error } = await supabase.rpc('use_ai_time', {
        p_user_id: primaryUserIdRef.current,
        p_duration_seconds: durationSeconds,
        p_ai_function: 'language_studio'
      });

      if (error) {
        console.error("Error reporting usage:", error);
      } else {
        const minutesUsed = Math.ceil(durationSeconds / 60);
        console.log(`Reported ${minutesUsed} minute(s) of Language Studio usage`);
      }
    } catch (err) {
      console.error("Error reporting usage:", err);
    }
  };

  useEffect(() => {
    const fetchToken = async () => {
      try {
        // First get the Supabase session for authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setError("Please log in to continue.");
          setLoading(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Please log in to continue.");
          setLoading(false);
          return;
        }

        // Get the primary user ID for time tracking (family shares time)
        const primaryUserId = await getPrimaryUserId(user.id);
        primaryUserIdRef.current = primaryUserId;

        const { data, error } = await supabase.functions.invoke('language-studio-token');
        
        if (error) {
          console.error("Error fetching token:", error);
          setError("Authentication failed. Please try again.");
          return;
        }

        if (data?.error) {
          if (data.error === "No AI time remaining") {
            setError("Your family has no minutes available this month.");
            toast.error("No AI minutes available");
          } else {
            setError(data.error);
          }
          return;
        }

        if (data?.token) {
          // Build URL with both auth token (for middleware) and studio token (for app logic)
          const url = buildAuthenticatedUrl(STUDIO_BASE_URL, session.access_token, data.token);
          setStudioUrl(url);
          startTimeRef.current = Date.now();
        }
      } catch (err) {
        console.error("Error:", err);
        setError("Connection error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchToken();

    // Report usage when component unmounts
    return () => {
      reportUsage();
    };
  }, []);

  // Report usage before window/tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      reportUsage();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleClose = async () => {
    await reportUsage();
    if (studioUrl && !loading && !error) {
      setShowFeedback(true);
    } else {
      onClose();
    }
  };

  if (showFeedback) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <FeedbackPopup
          featureLabel="Language Studio"
          lang="pt"
          onClose={onClose}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl h-[90vh] flex flex-col overflow-hidden">
        <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <span className="text-2xl">🗣️</span>
            </div>
            <div>
              <CardTitle className="text-xl">Feltrip Language Studio</CardTitle>
              <p className="text-xs text-muted-foreground">Practice real-world conversations with AI</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 p-0 min-h-0 flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Connecting to Language Studio...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 text-center p-6">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={handleClose}>Close</Button>
            </div>
          ) : studioUrl ? (
            <iframe
              src={studioUrl}
              className="w-full h-full border-0"
              allow="microphone; camera; autoplay"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              referrerPolicy="no-referrer"
              title="Feltrip Language Studio"
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};
