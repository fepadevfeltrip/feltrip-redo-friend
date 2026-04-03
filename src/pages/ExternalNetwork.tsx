import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Globe, Network, HandshakeIcon, Users, MessageSquare, Award, MapPin, TrendingUp } from "lucide-react";
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
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";

interface ExternalNetworkProps {
  onBack: () => void;
}

const ExternalNetwork = ({ onBack }: ExternalNetworkProps) => {
  // Radar de Rede Externa
  const externalNetworkData = [
    { pillar: "Comunidade", value: 70, fullMark: 100 },
    { pillar: "Networking", value: 85, fullMark: 100 },
    { pillar: "Serviços", value: 60, fullMark: 100 },
    { pillar: "Mentoria", value: 75, fullMark: 100 },
    { pillar: "Voluntariado", value: 55, fullMark: 100 },
    { pillar: "Conexões", value: 80, fullMark: 100 },
  ];

  // Pilares externos detalhados
  const externalPillarDetails = [
    {
      name: "Comunidade Local",
      icon: Users,
      score: 70,
      trend: "+6%",
      status: "good",
      partners: 15,
      activities: [
        "Grupos de mobilidade global",
        "Eventos culturais locais",
        "Integração comunitária",
      ],
    },
    {
      name: "Networking Profissional",
      icon: Network,
      score: 85,
      trend: "+12%",
      status: "excellent",
      partners: 28,
      activities: [
        "Eventos de networking",
        "Conferências do setor",
        "Meetups profissionais",
      ],
    },
    {
      name: "Serviços Locais",
      icon: MapPin,
      score: 60,
      trend: "+3%",
      status: "warning",
      partners: 12,
      activities: [
        "Parcerias com empresas",
        "Descontos para equipe",
        "Serviços especializados",
      ],
    },
    {
      name: "Mentoria Externa",
      icon: MessageSquare,
      score: 75,
      trend: "+8%",
      status: "good",
      partners: 18,
      activities: [
        "Mentores internacionais",
        "Programas de coaching",
        "Consultoria especializada",
      ],
    },
    {
      name: "Voluntariado",
      icon: HandshakeIcon,
      score: 55,
      trend: "+2%",
      status: "warning",
      partners: 8,
      activities: [
        "ONGs parceiras",
        "Projetos sociais",
        "Ações comunitárias",
      ],
    },
    {
      name: "Conexões Globais",
      icon: Globe,
      score: 80,
      trend: "+10%",
      status: "good",
      partners: 22,
      activities: [
        "Rede internacional",
        "Parcerias globais",
        "Grupos de interesse",
      ],
    },
  ];

  // Evolução temporal da rede externa
  const evolutionData = [
    { month: "Jan", comunidade: 60, networking: 70, servicos: 50, mentoria: 65, voluntariado: 45, conexoes: 65 },
    { month: "Fev", comunidade: 62, networking: 73, servicos: 52, mentoria: 68, voluntariado: 47, conexoes: 68 },
    { month: "Mar", comunidade: 65, networking: 76, servicos: 55, mentoria: 70, voluntariado: 50, conexoes: 72 },
    { month: "Abr", comunidade: 67, networking: 80, servicos: 56, mentoria: 72, voluntariado: 52, conexoes: 75 },
    { month: "Mai", comunidade: 68, networking: 82, servicos: 58, mentoria: 73, voluntariado: 53, conexoes: 77 },
    { month: "Jun", comunidade: 70, networking: 85, servicos: 60, mentoria: 75, voluntariado: 55, conexoes: 80 },
  ];

  // Mapa de impacto (força vs alcance)
  const impactMapData = [
    { name: "Comunidade", impact: 70, reach: 65, connections: 15 },
    { name: "Networking", impact: 85, reach: 80, connections: 28 },
    { name: "Serviços", impact: 60, reach: 50, connections: 12 },
    { name: "Mentoria", impact: 75, reach: 70, connections: 18 },
    { name: "Voluntariado", impact: 55, reach: 45, connections: 8 },
    { name: "Conexões", impact: 80, reach: 75, connections: 22 },
  ];

  // Comparação de força por pilar
  const strengthComparisonData = [
    { pillar: "Comunidade", externo: 70, desejado: 80 },
    { pillar: "Networking", externo: 85, desejado: 90 },
    { pillar: "Serviços", externo: 60, desejado: 75 },
    { pillar: "Mentoria", externo: 75, desejado: 85 },
    { pillar: "Voluntariado", externo: 55, desejado: 70 },
    { pillar: "Conexões", externo: 80, desejado: 90 },
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
                <Globe className="h-8 w-8 text-chart-2" />
                Rede Parceira Externa
              </h1>
              <p className="text-muted-foreground">Conexões externas e parcerias estratégicas</p>
            </div>
          </div>
        </div>

        {/* Radar e Mapa de Impacto */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-chart-2" />
                Radar de Rede Externa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={externalNetworkData}>
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
                    name="Conexões Externas"
                    dataKey="value"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2))"
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
              <CardTitle>Mapa de Impacto (Força vs Alcance)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number" 
                    dataKey="reach" 
                    name="Alcance"
                    stroke="hsl(var(--foreground))"
                    label={{ value: 'Alcance', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="impact" 
                    name="Impacto"
                    stroke="hsl(var(--foreground))"
                    label={{ value: 'Impacto', angle: -90, position: 'insideLeft' }}
                  />
                  <ZAxis type="number" dataKey="connections" range={[100, 1000]} name="Conexões" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    cursor={{ strokeDasharray: '3 3' }}
                  />
                  <Scatter name="Pilares" data={impactMapData} fill="hsl(var(--chart-2))" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Comparação Atual vs Meta */}
        <Card>
          <CardHeader>
            <CardTitle>Comparação: Atual vs Meta</CardTitle>
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
                <Bar dataKey="externo" fill="hsl(var(--chart-2))" name="Atual" />
                <Bar dataKey="desejado" fill="hsl(var(--primary))" name="Meta" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Evolução Temporal */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução da Rede Externa</CardTitle>
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
                <Line type="monotone" dataKey="comunidade" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Comunidade" />
                <Line type="monotone" dataKey="networking" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Networking" />
                <Line type="monotone" dataKey="servicos" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Serviços" />
                <Line type="monotone" dataKey="mentoria" stroke="hsl(var(--chart-4))" strokeWidth={2} name="Mentoria" />
                <Line type="monotone" dataKey="voluntariado" stroke="hsl(var(--chart-5))" strokeWidth={2} name="Voluntariado" />
                <Line type="monotone" dataKey="conexoes" stroke="hsl(var(--primary))" strokeWidth={2} name="Conexões" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pilares Detalhados */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {externalPillarDetails.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Card key={pillar.name} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Icon className="h-5 w-5 text-chart-2" />
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
                      <div className="text-3xl font-bold text-chart-2">{pillar.score}%</div>
                      <p className="text-xs text-muted-foreground">{pillar.trend} vs anterior</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold text-foreground">{pillar.partners}</div>
                      <p className="text-xs text-muted-foreground">Parceiros</p>
                    </div>
                  </div>
                  
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-chart-2 transition-all"
                      style={{ width: `${pillar.score}%` }}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Atividades:</p>
                    <ul className="space-y-1">
                      {pillar.activities.map((activity, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-chart-2 mt-1">•</span>
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
      </div>
    </div>
  );
};

export default ExternalNetwork;
