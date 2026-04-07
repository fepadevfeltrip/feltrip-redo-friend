import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ArrowLeft, Users, Shield, TrendingUp, Heart, Globe, LogOut, Loader2, Building2, MapPin, Menu, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useHRData } from "@/hooks/useHRData";
import { useIsMobile } from "@/hooks/use-mobile";
import SecureMap from "./SecureMap";

import { CommunityManagement } from "@/components/hr/CommunityManagement";
import { ManagerCommunityView } from "@/components/hr/ManagerCommunityView";
import { InternalRequestsPanel } from "@/components/hr/InternalRequestsPanel";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Separator } from "@/components/ui/separator";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface ManagerDashboardProps {
  onBack: () => void;
}

const ManagerDashboard = ({ onBack }: ManagerDashboardProps) => {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState<"dashboard" | "secure-map" | "safety-map" | "community-view">("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { signOut } = useAuth();
  const { collaborators, workplaceData, engagement, safetyMapPins, languageEngagementPercentage, totalCollaborators, totalEngagement, isLoading } = useHRData();
  const isMobile = useIsMobile();

  // Se estiver em uma view específica, renderizar o componente correspondente
  if (currentView === "secure-map") {
    return <SecureMap onBack={() => setCurrentView("dashboard")} />;
  }

  // Note: "safety-map" for HR should show SecureMap (analytics), not SafetyMap (collaborator tool)
  if (currentView === "safety-map") {
    return <SecureMap onBack={() => setCurrentView("dashboard")} />;
  }

  if (currentView === "community-view") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10">
        <div className="p-4">
          <Button variant="ghost" onClick={() => setCurrentView("dashboard")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.backToDashboard')}
          </Button>
          {/* Manager accesses community directly as admin */}
          <ManagerCommunityView />
        </div>
      </div>
    );
  }

  // Workplace MRP data (6 blocks per person)

  // Workplace MRP data (6 blocks per person)
  const workplaceChartData = workplaceData.map(e => ({
    name: e.fullName,
    [t('manager.workplaceSpace', 'Space')]: e.space,
    [t('manager.workplaceBody', 'Body')]: e.body,
    [t('manager.workplacePeople', 'People')]: e.other,
    [t('manager.workplaceCulture', 'Culture')]: e.culture,
    [t('manager.workplaceBelonging', 'Belonging')]: e.belonging,
    [t('manager.workplaceResponsibility', 'Responsibility')]: e.responsibility
  }));

  // Engagement data for chart
  const engagementChartData = engagement.map(e => ({
    name: e.fullName,
    [t('manager.language')]: e.languagePractice,
    [t('manager.safety')]: e.securityMap,
    [t('manager.presenceLabel')]: e.presenceQuestionnaire
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 p-5 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-bold text-foreground truncate">{t('manager.hrRadar')}</h1>
              <p className="text-sm text-muted-foreground hidden md:block">{t('manager.strategicVision')}</p>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex gap-2 items-center">
            <LanguageSelector />
            <Button variant="outline" size="sm" onClick={() => setCurrentView("community-view")}>
              <Users className="h-4 w-4 mr-2" />
              {t('expatApp.community')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentView("safety-map")}>
              <Shield className="h-4 w-4 mr-2" />
              {t('expatApp.safeMap')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              {t('nav.signOut')}
            </Button>
          </div>

          {/* Mobile Hamburger Menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 pt-[env(safe-area-inset-top,3rem)] bg-background border-border flex flex-col">
              <div className="flex flex-col h-full">
                <div className="p-6 bg-muted/40 relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                  <h2 className="font-semibold text-foreground text-lg">{t('manager.hrRadar')}</h2>
                  <p className="text-sm text-muted-foreground">{t('manager.strategicVision')}</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                  <div className="pb-2">
                    <LanguageSelector />
                  </div>
                  <Separator className="my-2" />
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => {
                      setCurrentView("community-view");
                      setIsMenuOpen(false);
                    }}
                  >
                    <Users className="h-5 w-5" />
                    {t('expatApp.community')}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => {
                      setCurrentView("safety-map");
                      setIsMenuOpen(false);
                    }}
                  >
                    <Shield className="h-5 w-5" />
                    {t('expatApp.safeMap')}
                  </Button>
                  <Separator className="my-2" />
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive"
                    onClick={() => signOut()}
                  >
                    <LogOut className="h-5 w-5" />
                    {t('nav.signOut')}
                  </Button>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="overview" className="gap-1 md:gap-2 text-xs md:text-sm px-2 py-2 flex-col md:flex-row h-auto">
              <TrendingUp className="h-4 w-4" />
              <span className="truncate">{isMobile ? t('manager.overview').split(' ')[0] : t('manager.overview')}</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="gap-1 md:gap-2 text-xs md:text-sm px-2 py-2 flex-col md:flex-row h-auto">
              <Building2 className="h-4 w-4" />
              <span className="truncate">{isMobile ? t('expatApp.community').slice(0, 6) : t('expatApp.community')}</span>
            </TabsTrigger>
            <TabsTrigger value="internal" className="gap-1 md:gap-2 text-xs md:text-sm px-2 py-2 flex-col md:flex-row h-auto">
              <Users className="h-4 w-4" />
              <span className="truncate">{isMobile ? 'Request' : t('manager.requestServices')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('manager.activeCollaborators')}</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">{totalCollaborators}</div>
                      <p className="text-xs text-muted-foreground">{t('manager.sharingData')}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('manager.totalEngagement')}</CardTitle>
                      <Heart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">{totalEngagement}</div>
                      <p className="text-xs text-muted-foreground">{t('manager.interactionsRecorded')}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('manager.languageEngagement')}</CardTitle>
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">
                        {languageEngagementPercentage}%
                      </div>
                      <p className="text-xs text-muted-foreground">{t('manager.ofUsersPracticing')}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('manager.safetyMapPins')}</CardTitle>
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">
                        {safetyMapPins.length}
                      </div>
                      <p className="text-xs text-muted-foreground">{t('manager.locationsMarked')}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-1">
                  {/* Engagement by Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('manager.engagementByActivity')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {engagementChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={engagementChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                            <YAxis stroke="hsl(var(--foreground))" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px"
                              }}
                            />
                            <Legend />
                            <Bar dataKey={t('manager.language')} fill="hsl(var(--chart-1))" />
                            <Bar dataKey={t('manager.safety')} fill="hsl(var(--chart-2))" />
                            <Bar dataKey={t('manager.presenceLabel')} fill="hsl(var(--primary))" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                          {t('manager.noEngagementData')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* 6 Blocks per Collaborator - Workplace MRP */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('manager.workplaceMRP', 'MRP Workplace')}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('manager.workplaceMRPDescription', 'Relational Presence Map in the Workplace - 6 dimensions')}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {workplaceChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={workplaceChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                          <YAxis stroke="hsl(var(--foreground))" domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px"
                            }}
                          />
                          <Legend />
                          <Bar dataKey={t('manager.workplaceSpace', 'Space')} fill="hsl(var(--chart-1))" />
                          <Bar dataKey={t('manager.workplaceBody', 'Body')} fill="hsl(var(--chart-2))" />
                          <Bar dataKey={t('manager.workplacePeople', 'People')} fill="hsl(var(--chart-3))" />
                          <Bar dataKey={t('manager.workplaceCulture', 'Culture')} fill="hsl(var(--chart-4))" />
                          <Bar dataKey={t('manager.workplaceBelonging', 'Belonging')} fill="hsl(var(--chart-5))" />
                          <Bar dataKey={t('manager.workplaceResponsibility', 'Responsibility')} fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[400px] text-muted-foreground flex-col gap-2">
                        <span>{t('manager.noWorkplaceData', 'No workplace data shared yet')}</span>
                        <span className="text-sm">{t('manager.workplaceDataAppearsWhenShared', 'Data appears when collaborators complete the MRP Workplace questionnaire')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Community Management */}
          <TabsContent value="community" className="space-y-6">
            <CommunityManagement />
          </TabsContent>

          {/* Request Feltrip Services */}
          <TabsContent value="internal" className="space-y-6">
            <InternalRequestsPanel />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default ManagerDashboard;
