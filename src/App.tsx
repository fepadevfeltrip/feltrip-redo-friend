import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
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

const queryClient = new QueryClient();

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

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Owner and Admin: global dashboard with charts for all companies
  if (role === "owner" || role === "admin") {
    return <OwnerDashboard />;
  }

  // Manager: only HR panel for their company
  if (role === "manager") {
    return <ManagerDashboard onBack={() => { }} />;
  }

  // Community Member: only community access
  if (role === "community_member") {
    return <CommunityMemberApp />;
  }

  // For regular users (no admin role), use user_tier to determine access
  // Premium company → full platform with menus
  if (profile?.user_tier === "premium_company" || profile?.user_tier === "premium_company_plus_language") {
    return <ExpatApp />;
  }

  // Free or premium_individual → CultChat landing (Index)
  return <Navigate to="/app" replace />;
}

function AuthRoute() {
  const { user, role, isLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    // Admin roles go to premium dashboard
    if (role === "owner" || role === "admin" || role === "manager") {
      return <Navigate to="/premium" replace />;
    }
    // Premium company users go to the full platform
    if (profile?.user_tier === "premium_company" || profile?.user_tier === "premium_company_plus_language") {
      return <Navigate to="/premium" replace />;
    }
    // Free/individual go to CultChat landing
    return <Navigate to="/app" replace />;
  }

  // Non-logged users should go to landing, not see login page directly
  return <Navigate to="/" replace />;
}

function AffiliateCapture() {
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("active_affiliate", ref);
    }
  }, [location.search]);
  return null;
}

function RootRoute() {
  if (Capacitor.isNativePlatform()) {
    return <Navigate to="/app" replace />;
  }
  return <LandingPage />;
}

const AppRoutes = () => (
  <>
    <AffiliateCapture />
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/app" element={<ExpatApp />} />
      <Route path="/community" element={<ExpatApp initialTab="community" />} />
      <Route path="/presence-map" element={<MeuMapaTab />} />
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

const App = () => {
  // O initAppleStore agora está no lugar correto: dentro do componente App!
  useEffect(() => {
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
