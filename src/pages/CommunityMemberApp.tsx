import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MobileFrame } from "@/components/MobileFrame";
import Profile from "./Profile";
import Community from "./Community";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, X, LogOut, Loader2, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { NotificationBell } from "@/components/app/NotificationBell";
import { LanguageSelector } from "@/components/LanguageSelector";

const WHATSAPP_LINK = "https://wa.me/5521976100692";

type TabType = "community" | "profile";

const CommunityMemberApp = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>("community");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { signOut } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const rawName = profile?.full_name;
  const displayName = (!rawName || rawName === "Anonymous" || rawName === "Anônimo") ? "Curious Visitor" : rawName;
  const displayCity = profile?.city || t('profile.locationNotSet');
  const initials = getInitials(displayName);

  return (
    <MobileFrame>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="p-4 border-b border-border bg-card flex items-center justify-between">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 pt-[env(safe-area-inset-top,3rem)] bg-background border-border flex flex-col">
              <div className="flex flex-col h-full">
                {/* User Info */}
                <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {profileLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {profileLoading ? t('common.loading') : displayName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {profileLoading ? "" : displayCity}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <nav className="flex-1 p-4 space-y-1 overflow-auto">
                  <Button
                    variant={activeTab === "community" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => {
                      setActiveTab("community");
                      setIsMenuOpen(false);
                    }}
                  >
                    <Heart className="h-5 w-5" />
                    <span>{t('expatApp.community')}</span>
                  </Button>

                  <Button
                    variant={activeTab === "profile" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => {
                      setActiveTab("profile");
                      setIsMenuOpen(false);
                    }}
                  >
                    <User className="h-5 w-5" />
                    <span>{t('expatApp.myProfile')}</span>
                  </Button>

                  <Separator className="my-2" />

                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-primary hover:text-primary"
                    onClick={() => window.open(WHATSAPP_LINK, '_blank')}
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>{t('community.discoverFeltrip', 'Conheça a plataforma Feltrip')}</span>
                  </Button>

                  <Separator className="my-2" />

                  <div className="px-2 py-2">
                    <LanguageSelector />
                  </div>

                  <Separator className="my-2" />

                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive"
                    onClick={() => signOut()}
                  >
                    <LogOut className="h-5 w-5" />
                    <span>{t('nav.signOut')}</span>
                  </Button>
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          <h1 className="text-xl font-bold text-primary">Feltrip Community</h1>

          <div className="flex items-center gap-1">
            <LanguageSelector />
            <NotificationBell />
            <Avatar className="w-10 h-10">
              <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === "community" && <Community />}
          {activeTab === "profile" && <Profile />}
        </div>

        {/* Bottom Navigation - Only Community and Profile */}
        <div className="border-t border-border bg-card shrink-0">
          <div className="flex justify-around items-center h-16 px-2">
            <button
              onClick={() => setActiveTab("community")}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 transition-colors flex-1 min-w-0 ${activeTab === "community" ? "text-primary" : "text-muted-foreground"
                }`}
            >
              <Heart className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium truncate">{t('expatApp.community')}</span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 transition-colors flex-1 min-w-0 ${activeTab === "profile" ? "text-primary" : "text-muted-foreground"
                }`}
            >
              <User className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium truncate">{t('expatApp.myProfile')}</span>
            </button>
          </div>
        </div>
      </div>
    </MobileFrame>
  );
};

export default CommunityMemberApp;
