import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "expatriate" | "manager" | "admin" | "owner" | "community_member" | null; // 'expatriate' kept for DB enum compatibility, mapped as premium_company in UI

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    registrationCode: string,
    fullName: string,
    city: string,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchingRoleRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  const roleFetchedRef = useRef(false);

  const fetchUserRole = async (userId: string) => {
    // Prevent duplicate fetches for same user
    if (fetchingRoleRef.current && lastUserIdRef.current === userId) {
      return;
    }

    // Skip if role already fetched for this user
    if (roleFetchedRef.current && lastUserIdRef.current === userId) {
      setIsLoading(false);
      return;
    }

    fetchingRoleRef.current = true;
    lastUserIdRef.current = userId;

    try {
      const { data, error } = await supabase.rpc("get_user_role", { _user_id: userId });
      console.log("Fetched role for user:", userId, "Role:", data, "Error:", error);

      if (!error && data) {
        setRole(data as AppRole);
      } else {
        setRole(null);
      }
      roleFetchedRef.current = true;
    } finally {
      fetchingRoleRef.current = false;
      setIsLoading(false);
    }
  };

  const applyPendingNotificationOptIn = async (userId: string) => {
    const shouldOptIn = localStorage.getItem("pending_notification_optin") === "true";
    if (!shouldOptIn) return;

    try {
      const { data: existing } = await supabase
        .from("notification_preferences")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing?.id) {
        await supabase.from("notification_preferences").update({ email_notifications: true }).eq("user_id", userId);
      } else {
        await supabase
          .from("notification_preferences")
          .insert({ user_id: userId, email_notifications: true, push_notifications: false });
      }

      localStorage.removeItem("pending_notification_optin");
    } catch (e) {
      console.error("Failed to persist notification opt-in:", e);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let initialSessionChecked = false;

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!isMounted) return;

      console.log("Auth state changed:", event, currentSession?.user?.id);

      // --- SMART ROUTE RULE ---
      if (event === "SIGNED_IN" && currentSession?.user && !currentSession.user.is_anonymous) {
        const searchParams = window.location.search;
        const currentPath = window.location.pathname;
        const pendingAction = localStorage.getItem("pending_action");
        const pendingCheckout = localStorage.getItem("pending_checkout");
        const hasPendingSession = !!localStorage.getItem("pending_session_data");

        // If user is on root or /app, redirect based on pending action
        if (currentPath === "/" || currentPath === "/app") {
          setTimeout(() => {
            if (pendingCheckout) {
              return;
            }

            if (pendingAction === "housing_results") {
              localStorage.removeItem("pending_action");
              window.location.href = "/app?tab=housing";
            } else if (pendingAction === "cult_gems" || hasPendingSession) {
              localStorage.removeItem("pending_action");
              // Don't use window.location.href if already on /app?tab=cult — let React handle it
              if (!searchParams.includes("tab=cult")) {
                window.location.href = "/app?tab=cult";
              }
            } else if (pendingAction === "presence_map") {
              localStorage.removeItem("pending_action");
              window.location.href = "/app?tab=map";
            } else if (!searchParams.includes("tab=")) {
              window.location.href = "/app?tab=presence";
            }
          }, 100);
        }
      }
      // --- END ROUTE RULE ---

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      // Only fetch role if we have a new user and initial session was already checked
      if (currentSession?.user && initialSessionChecked) {
        // Defer async tasks to prevent deadlock
        setTimeout(() => {
          if (isMounted) {
            fetchUserRole(currentSession.user.id);
            applyPendingNotificationOptIn(currentSession.user.id);
          }
        }, 0);
      } else if (!currentSession) {
        setRole(null);
        roleFetchedRef.current = false;
        lastUserIdRef.current = null;
        setIsLoading(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (!isMounted) return;

      initialSessionChecked = true;

      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession?.user) {
        fetchUserRole(existingSession.user.id);
        applyPendingNotificationOptIn(existingSession.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, registrationCode: string, fullName: string, city: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      return { error: error as Error };
    }

    // If signup successful and user exists, assign role and create profile
    if (data.user) {
      // First try registration code (for main collaborators)
      const { error: roleError } = await supabase.rpc("use_registration_code", {
        _code: registrationCode,
        _user_id: data.user.id,
      });

      if (roleError) {
        await supabase.auth.signOut();
        return { error: new Error("Invalid or expired code. Please contact your administrator.") };
      }

      // Registration code worked, create user profile with city
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: data.user.id,
        full_name: fullName,
        city: city,
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // Profile creation is not critical, continue anyway
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    roleFetchedRef.current = false;
    lastUserIdRef.current = null;
  };

  return (
    <AuthContext.Provider value={{ user, session, role, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
