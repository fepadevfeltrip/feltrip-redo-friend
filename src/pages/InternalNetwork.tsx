import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Home, Heart, Briefcase, DollarSign, Users, BookOpen, TrendingUp, AlertCircle, Brain, GraduationCap, MessageCircle } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

interface InternalNetworkProps {
  onBack: () => void;
}

const WHATSAPP_LINK = "https://wa.me/351912345678"; // Replace with actual Feltrip WhatsApp number

const internalPartnerServices = [
  {
    icon: Brain,
    title: "Culture Tutor",
    description: "Cultural guidance and adaptation support for your team members",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: Heart,
    title: "Mental Health",
    description: "Psychological support specialized in relocation wellbeing",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
    iconColor: "text-pink-600 dark:text-pink-400",
  },
  {
    icon: GraduationCap,
    title: "Education Consultant",
    description: "Guidance on educational systems and school enrollment for families",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
];

const InternalNetwork = ({ onBack }: InternalNetworkProps) => {
  // Radar de Rede Interna
  const internalNetworkData = [
    { pillar: "Família", value: 85, fullMark: 100 },
    { pillar: "Saúde", value: 75, fullMark: 100 },
    { pillar: "Carreira", value: 90, fullMark: 100 },
    { pillar: "Finanças", value: 70, fullMark: 100 },
    { pillar: "Social", value: 65, fullMark: 100 },
    { pillar: "Cultura", value: 80, fullMark: 100 },
  ];

  // Pilares detalhados
  const pillarDetails = [
    {
      name: "Família",
      icon: Home,
      score: 85,
      trend: "+8%",
      status: "excellent",
      connections: 24,
      activities: [
        "Eventos familiares organizados",
        "Apoio em adaptação escolar",
        "Grupos de pais em mobilidade",
      ],
    },
    {
      name: "Saúde",
      icon: Heart,
      score: 75,
      trend: "+3%",
      status: "good",
      connections: 18,
      activities: [
        "Plano de saúde internacional",
        "Acompanhamento psicológico",
        "Programa de bem-estar",
      ],
    },
    {
      name: "Carreira",
      icon: Briefcase,
      score: 90,
      trend: "+12%",
      status: "excellent",
      connections: 32,
      activities: [
        "Mentoria profissional",
        "Desenvolvimento de skills",
        "Plano de carreira definido",
      ],
    },
    {
      name: "Finanças",
      icon: DollarSign,
      score: 70,
      trend: "+5%",
      status: "good",
      connections: 15,
      activities: [
        "Consultoria financeira",
        "Planejamento tributário",
        "Suporte para remessas",
      ],
    },
    {
      name: "Social",
      icon: Users,
      score: 65,
      trend: "-2%",
      status: "warning",
      connections: 12,
      activities: [
        "Eventos de integração",
        "Grupos de interesse",
        "Atividades recreativas",
      ],
    },
    {
      name: "Cultura",
      icon: BookOpen,
      score: 80,
      trend: "+7%",
      status: "good",
      connections: 22,
      activities: [
        "Aulas de idioma",
        "Workshops culturais",
        "Tours pela cidade",
      ],
    },
  ];

  // Evolução temporal da rede interna
  const evolutionData = [
    { month: "Jan", familia: 70, saude: 65, carreira: 75, financas: 60, social: 55, cultura: 70 },
    { month: "Fev", familia: 72, saude: 68, carreira: 78, financas: 62, social: 58, cultura: 72 },
    { month: "Mar", familia: 75, saude: 70, carreira: 82, financas: 65, social: 60, cultura: 75 },
    { month: "Abr", familia: 78, saude: 72, carreira: 85, financas: 67, social: 62, cultura: 77 },
    { month: "Mai", familia: 82, saude: 73, carreira: 88, financas: 68, social: 63, cultura: 78 },
    { month: "Jun", familia: 85, saude: 75, carreira: 90, financas: 70, social: 65, cultura: 80 },
  ];

  // Comparação de força por pilar
  const strengthComparisonData = [
    { pillar: "Família", interno: 85, desejado: 90 },
    { pillar: "Saúde", interno: 75, desejado: 85 },
    { pillar: "Carreira", interno: 90, desejado: 95 },
    { pillar: "Finanças", interno: 70, desejado: 80 },
    { pillar: "Social", interno: 65, desejado: 75 },
    { pillar: "Cultura", interno: 80, desejado: 85 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-chart-2/10 text-chart-2 border-chart-2/20";
      case "good":
        return "bg-primary/10 text-primary border-primary/20";
      case "warning":
        return "bg-secondary/10 text-secondary border-secondary/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Home className="h-8 w-8 text-primary" />
                Rede Parceira Interna
              </h1>
              <p className="text-muted-foreground">Apoio interno e bem-estar da equipe</p>
            </div>
          </div>
        </div>

        {/* Radar e Métricas */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Radar de Rede Interna
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={internalNetworkData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="pillar" 
                    stroke="hsl(var(--foreground))"
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]}
                    stroke="hsl(var(--foreground))"
                  />
                  <Radar
                    name="Força da Rede"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.5}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comparação: Atual vs Desejado</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={strengthComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="pillar" 
                    stroke="hsl(var(--foreground))"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="interno" fill="hsl(var(--primary))" name="Atual" />
                  <Bar dataKey="desejado" fill="hsl(var(--chart-2))" name="Meta" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Evolução Temporal */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução da Rede Interna</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="familia" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Família" />
                <Line type="monotone" dataKey="saude" stroke="hsl(var(--chart-4))" strokeWidth={2} name="Saúde" />
                <Line type="monotone" dataKey="carreira" stroke="hsl(var(--primary))" strokeWidth={2} name="Carreira" />
                <Line type="monotone" dataKey="financas" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Finanças" />
                <Line type="monotone" dataKey="social" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Social" />
                <Line type="monotone" dataKey="cultura" stroke="hsl(var(--chart-5))" strokeWidth={2} name="Cultura" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pilares Detalhados */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pillarDetails.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Card key={pillar.name} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Icon className="h-5 w-5 text-primary" />
                      {pillar.name}
                    </CardTitle>
                    <Badge className={getStatusColor(pillar.status)}>
                      {pillar.status === "excellent" ? "Excelente" : pillar.status === "good" ? "Bom" : "Atenção"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-primary">{pillar.score}%</div>
                      <p className="text-xs text-muted-foreground">{pillar.trend} vs anterior</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold text-foreground">{pillar.connections}</div>
                      <p className="text-xs text-muted-foreground">Conexões</p>
                    </div>
                  </div>
                  
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${pillar.score}%` }}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Atividades:</p>
                    <ul className="space-y-1">
                      {pillar.activities.map((activity, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{activity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feltrip Local Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Feltrip Local Services
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Request specialized support services for your team members via WhatsApp
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {internalPartnerServices.map((service) => {
                const Icon = service.icon;
                return (
                  <Card key={service.title} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-xl ${service.bgColor}`}>
                        <Icon className={`h-6 w-6 ${service.iconColor}`} />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h4 className="font-semibold text-foreground">{service.title}</h4>
                        <p className="text-xs text-muted-foreground">{service.description}</p>
                        <Button
                          size="sm"
                          onClick={() => window.open(WHATSAPP_LINK, '_blank')}
                          className="w-full gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Request
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InternalNetwork;
