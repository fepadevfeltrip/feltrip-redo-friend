import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import AuthPage from "./pages/AuthPage";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import ExpatApp from "./pages/ExpatApp";
import CommunityMemberApp from "./pages/CommunityMemberApp";
import ManagerDashboard from "./pages/ManagerDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import JoinCommunityPage from "./pages/JoinCommunityPage";
import ConciergePage from "./pages/ConciergePage";
import AffiliateRedirect from "./pages/AffiliateRedirect";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import { Loader2 } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { initAppleStore } from "@/lib/appleIAP";
import MeuMapaTab from "@/components/app/MeuMapaTab";
import { supabase } from "@/integrations/supabase/client";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";

const queryClient = new QueryClient();

// Função para garantir que o usuário logado vá para o lugar certo
function RoleBasedRedirect() {
  const { user, role, isLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (role === "owner" || role === "admin") return <OwnerDashboard />;
  if (role === "manager") return <ManagerDashboard onBack={() => { }} />;
  if (role === "community_member") return <CommunityMemberApp />;

  if (profile?.user_tier === "premium_company" || profile?.user_tier === "premium_company_plus_language") {
    return <ExpatApp />;
  }

  return <Navigate to="/app" replace />;
}

// Rota de Autenticação: Impede logado de ver login e vice-versa
function AuthRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <AuthPage />;
}

function AffiliateCapture() {
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref");
    if (ref) localStorage.setItem("active_affiliate", ref);
  }, [location.search]);
  return null;
}

function RootRoute() {
  const { user, isLoading } = useAuth();

  // Enquanto o Supabase pensa, não mostra nada
  if (isLoading) return null;

  // Como é iOS exclusivo: Tem usuário? Vai pro app. Não tem? Vai pro login.
  return user ? <Navigate to="/app" replace /> : <Navigate to="/auth" replace />;
}

const AppRoutes = () => {
  const { user, isLoading } = useAuth();

  // SISTEMA DE PUSH IMPECÁVEL
  useEffect(() => {
    if (Capacitor.isNativePlatform() && user?.id) {
      const setupPush = async () => {
        try {
          // Remove ouvintes antigos para evitar duplicidade e loops de logout
          await FirebaseMessaging.removeAllListeners();

          // Listener para capturar o Token (Pode disparar em atualizações de token)
          await FirebaseMessaging.addListener('tokenReceived', async (event) => {
            const { error } = await supabase
              .from('profiles')
              .update({ apns_token: event.token })
              .eq('user_id', user.id);

            if (error) console.error("❌ Erro ao atualizar token no Supabase:", error.message);
          });

          // Solicita permissão e registra no serviço de mensagens
          const permission = await FirebaseMessaging.requestPermissions();
          if (permission.receive === 'granted') {
            // Captura o token na hora da permissão e SALVA IMEDIATAMENTE
            const { token } = await FirebaseMessaging.getToken();
            console.log("🎫 Token FCM gerado com sucesso:", token);

            const { error } = await supabase
              .from('profiles')
              .update({ apns_token: token })
              .eq('user_id', user.id);

            if (error) console.error("❌ Erro ao salvar token no Supabase:", error.message);
            else console.log("✅ Token registrado para o usuário:", user.id);
          }
        } catch (e) {
          console.error("⚠️ Falha ao configurar Push nativo:", e);
        }
      };

      setupPush();
    }
  }, [user?.id]); // Só executa quando o ID do usuário é confirmado

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <AffiliateCapture />
      <Routes>
        <Route path="/" element={<RootRoute />} />

        {/* Rotas de Aplicativo: Proteção absoluta */}
        <Route path="/app" element={user ? <ExpatApp /> : <Navigate to="/auth" replace />} />
        <Route path="/community" element={user ? <ExpatApp initialTab="community" /> : <Navigate to="/auth" replace />} />
        <Route path="/presence-map" element={user ? <MeuMapaTab /> : <Navigate to="/app" replace />} />

        {/* Rotas de Sistema */}
        <Route path="/auth" element={<AuthRoute />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/join/:slug" element={<JoinCommunityPage />} />
        <Route path="/concierge" element={<ConciergePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/premium" element={<RoleBasedRedirect />} />
        <Route path="/r/:slug" element={<AffiliateRedirect />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => {
  useEffect(() => {
    // Inicializa IAP Apple
    initAppleStore();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <BrowserRouter>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;