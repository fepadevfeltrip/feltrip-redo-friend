import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, Users, Clock, TrendingUp, MapPin, FileText, 
  LogOut, Loader2, Crown, BarChart3, Activity, Settings, Eye, Home, Bell
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerData } from "@/hooks/useOwnerData";
import { useIsMobile } from "@/hooks/use-mobile";
import { LanguageSelector } from "@/components/LanguageSelector";
import { CompanyLimitsManager } from "@/components/owner/CompanyLimitsManager";
import { ClientActivityPanel } from "@/components/owner/ClientActivityPanel";
import { HousingDataPanel } from "@/components/owner/HousingDataPanel";
import { NotificationPreferencesPanel } from "@/components/owner/NotificationPreferencesPanel";
import ManagerDashboard from "./ManagerDashboard";
import { useState } from "react";
import { 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
];

const OwnerDashboard = () => {
  const { t } = useTranslation();
  const { signOut, role } = useAuth();
  const { companyStats, globalStats, isLoading } = useOwnerData();
  const isMobile = useIsMobile();
  const [showManagerView, setShowManagerView] = useState(false);

  // If showing manager view, render ManagerDashboard
  if (showManagerView) {
    return <ManagerDashboard onBack={() => setShowManagerView(false)} />;
  }

  // Data for charts
  const usersByCompanyData = companyStats.map(c => ({
    name: c.companyName.length > 15 ? c.companyName.substring(0, 15) + '...' : c.companyName,
    fullName: c.companyName,
    usuarios: c.totalUsers,
    ativos: c.activeUsers
  }));

  const aiUsageData = companyStats.map(c => ({
    name: c.companyName.length > 15 ? c.companyName.substring(0, 15) + '...' : c.companyName,
    fullName: c.companyName,
    usado: c.aiMinutesUsed,
    limite: c.aiMinutesLimit
  }));

  const engagementData = companyStats.map(c => ({
    name: c.companyName.length > 15 ? c.companyName.substring(0, 15) + '...' : c.companyName,
    fullName: c.companyName,
    total: c.totalEngagement,
    idiomas: c.languagePractice,
    mapa: c.mapPins,
    questionarios: c.questionnaires
  }));

  const pieData = companyStats.map((c, index) => ({
    name: c.companyName,
    value: c.totalUsers,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="p-2 md:p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
              <Crown className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-bold text-foreground truncate">
                Owner Dashboard
              </h1>
              <p className="text-sm text-muted-foreground hidden md:block">
                Visão global de todas as empresas
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <LanguageSelector />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowManagerView(true)}
              className="hidden md:flex"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {role === 'manager' ? 'HR Dashboard' : 'Manager View'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">{t('nav.signOut')}</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7 h-auto">
              <TabsTrigger value="overview" className="gap-1 md:gap-2 text-xs md:text-sm px-1 py-2">
                <TrendingUp className="h-4 w-4" />
                <span className="truncate hidden sm:inline">Geral</span>
              </TabsTrigger>
              <TabsTrigger value="clients" className="gap-1 md:gap-2 text-xs md:text-sm px-1 py-2">
                <Eye className="h-4 w-4" />
                <span className="truncate hidden sm:inline">Clientes</span>
              </TabsTrigger>
              <TabsTrigger value="housing" className="gap-1 md:gap-2 text-xs md:text-sm px-1 py-2">
                <Home className="h-4 w-4" />
                <span className="truncate hidden sm:inline">Housing</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1 md:gap-2 text-xs md:text-sm px-1 py-2">
                <Bell className="h-4 w-4" />
                <span className="truncate hidden sm:inline">Notif.</span>
              </TabsTrigger>
              <TabsTrigger value="companies" className="gap-1 md:gap-2 text-xs md:text-sm px-1 py-2">
                <Building2 className="h-4 w-4" />
                <span className="truncate hidden sm:inline">Empresas</span>
              </TabsTrigger>
              <TabsTrigger value="usage" className="gap-1 md:gap-2 text-xs md:text-sm px-1 py-2">
                <Activity className="h-4 w-4" />
                <span className="truncate hidden sm:inline">Uso IA</span>
              </TabsTrigger>
              <TabsTrigger value="limits" className="gap-1 md:gap-2 text-xs md:text-sm px-1 py-2">
                <Settings className="h-4 w-4" />
                <span className="truncate hidden sm:inline">Limites</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Global Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Empresas</CardTitle>
                    <Building2 className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{globalStats.totalCompanies}</div>
                    <p className="text-xs text-muted-foreground">cadastradas</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Usuários</CardTitle>
                    <Users className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{globalStats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">total</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">IA Usada</CardTitle>
                    <Clock className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">{globalStats.totalAIMinutesUsed}</div>
                    <p className="text-xs text-muted-foreground">minutos</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Engajamento</CardTitle>
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{globalStats.totalEngagement}</div>
                    <p className="text-xs text-muted-foreground">interações</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pins no Mapa</CardTitle>
                    <MapPin className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{globalStats.totalMapPins}</div>
                    <p className="text-xs text-muted-foreground">marcações</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Questionários</CardTitle>
                    <FileText className="h-4 w-4 text-cyan-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-cyan-600">{globalStats.totalQuestionnaires}</div>
                    <p className="text-xs text-muted-foreground">respondidos</p>
                  </CardContent>
                </Card>
              </div>

              {/* Users Distribution */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Usuários por Empresa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {usersByCompanyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={usersByCompanyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="name" 
                            stroke="hsl(var(--foreground))" 
                            fontSize={12}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis stroke="hsl(var(--foreground))" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--card))", 
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px"
                            }}
                            labelFormatter={(value, payload) => payload?.[0]?.payload?.fullName || value}
                          />
                          <Legend />
                          <Bar dataKey="usuarios" name="Total" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="ativos" name="Ativos" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        Nenhuma empresa cadastrada
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Distribuição de Usuários
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name.substring(0, 10)}... ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--card))", 
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px"
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        Nenhuma empresa cadastrada
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Engagement Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Engajamento por Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {engagementData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={engagementData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="name" 
                          stroke="hsl(var(--foreground))" 
                          fontSize={12}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis stroke="hsl(var(--foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }}
                          labelFormatter={(value, payload) => payload?.[0]?.payload?.fullName || value}
                        />
                        <Legend />
                        <Bar dataKey="idiomas" name="Prática de Idiomas" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="mapa" name="Pins no Mapa" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="questionarios" name="Questionários" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                      Nenhum dado de engajamento
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Clients Tab */}
            <TabsContent value="clients" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    Atividade dos Clientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ClientActivityPanel />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Housing Tab */}
            <TabsContent value="housing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-primary" />
                    Investigações de Moradia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <HousingDataPanel />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Preferências de Notificação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <NotificationPreferencesPanel />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Companies Tab */}
            <TabsContent value="companies" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {companyStats.map((company) => (
                  <Card key={company.companyId} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Building2 className="h-5 w-5 text-primary" />
                        {company.companyName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{company.totalUsers} usuários</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span>{company.activeUsers} ativos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{company.aiMinutesUsed} min IA</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span>{company.totalEngagement} eng.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{company.mapPins} pins</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{company.questionnaires} quest.</span>
                        </div>
                      </div>
                      <div className="pt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Uso de IA</span>
                          <span>{company.aiMinutesUsed}/{company.aiMinutesLimit} min</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ 
                              width: `${Math.min((company.aiMinutesUsed / (company.aiMinutesLimit || 1)) * 100, 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {companyStats.length === 0 && (
                  <div className="col-span-full flex items-center justify-center h-64 text-muted-foreground">
                    Nenhuma empresa cadastrada
                  </div>
                )}
              </div>
            </TabsContent>

            {/* AI Usage Tab */}
            <TabsContent value="usage" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Uso de IA por Empresa (minutos)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aiUsageData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={aiUsageData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--foreground))" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          stroke="hsl(var(--foreground))" 
                          width={150}
                          fontSize={12}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }}
                          labelFormatter={(value, payload) => payload?.[0]?.payload?.fullName || value}
                        />
                        <Legend />
                        <Bar dataKey="usado" name="Usado" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="limite" name="Limite" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                      Nenhum dado de uso
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Users by AI Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Resumo de Consumo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Consumido</p>
                        <p className="text-2xl font-bold">{globalStats.totalAIMinutesUsed} minutos</p>
                      </div>
                      <Clock className="h-10 w-10 text-primary/30" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Média por Empresa</p>
                        <p className="text-2xl font-bold">
                          {globalStats.totalCompanies > 0 
                            ? Math.round(globalStats.totalAIMinutesUsed / globalStats.totalCompanies) 
                            : 0} minutos
                        </p>
                      </div>
                      <Building2 className="h-10 w-10 text-primary/30" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Média por Usuário</p>
                        <p className="text-2xl font-bold">
                          {globalStats.totalUsers > 0 
                            ? Math.round(globalStats.totalAIMinutesUsed / globalStats.totalUsers) 
                            : 0} minutos
                        </p>
                      </div>
                      <Users className="h-10 w-10 text-primary/30" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Limits Tab */}
            <TabsContent value="limits" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Gerenciar Limites de Uso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CompanyLimitsManager />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
