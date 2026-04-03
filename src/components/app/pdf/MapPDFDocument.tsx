import { Document, Page, Text, View, StyleSheet, Svg, Polygon, Circle, Line, pdf } from "@react-pdf/renderer";
import type { MapPDFData, MapContentStructured } from "../types/mapContent";

// Feltrip brand colors
const COLORS = {
  primary: "#1B6B7D", // teal
  secondary: "#D4943A", // mustard/gold
  accent: "#FF6B6B", // coral
  energy: "#FF1493", // energy pink
  background: "#F7F3EE", // off-white warm
  white: "#FFFFFF",
  dark: "#1B3A42",
  muted: "#8A9DA3",
  pillar: {
    body: "#FF6B6B",
    space: "#D4943A",
    territory: "#1B6B7D",
    identity: "#FF1493",
    other: "#6B8F71",
  },
};

const styles = StyleSheet.create({
  // Cover page
  coverPage: {
    backgroundColor: COLORS.primary,
    padding: 60,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  coverTitle: {
    fontSize: 36,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 12,
  },
  coverSubtitle: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: "center",
    marginBottom: 40,
    fontFamily: "Helvetica",
  },
  coverMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: 8,
  },
  coverUserName: {
    fontSize: 22,
    color: COLORS.white,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    marginTop: 60,
  },
  coverCity: {
    fontSize: 18,
    color: COLORS.secondary,
    textAlign: "center",
    marginTop: 8,
  },
  coverDivider: {
    width: 80,
    height: 2,
    backgroundColor: COLORS.secondary,
    marginVertical: 30,
  },
  coverLogo: {
    width: 120,
    height: 40,
    marginBottom: 30,
  },
  felltripText: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: COLORS.secondary,
    letterSpacing: 4,
    marginBottom: 6,
  },
  felltripSubText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  // Content pages
  page: {
    backgroundColor: COLORS.white,
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 50,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E0DA",
  },
  pageHeaderTitle: {
    fontSize: 8,
    color: COLORS.muted,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  pageNumber: {
    fontSize: 8,
    color: COLORS.muted,
  },

  // Introduction
  introTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: COLORS.primary,
    marginBottom: 16,
  },
  introText: {
    fontSize: 11,
    lineHeight: 1.7,
    color: COLORS.dark,
    textAlign: "justify",
  },

  // Radar section
  radarTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: "center",
  },
  radarContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  radarLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 20,
  },
  radarLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  radarLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  radarLegendText: {
    fontSize: 9,
    color: COLORS.dark,
  },

  // Pillar sections
  pillarPage: {
    backgroundColor: COLORS.white,
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 50,
  },
  pillarHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  pillarColorBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  pillarTitleContainer: {
    flex: 1,
  },
  pillarTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
  },
  pillarScore: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  pillarSummary: {
    fontSize: 12,
    lineHeight: 1.6,
    color: COLORS.dark,
    marginBottom: 16,
    fontFamily: "Helvetica-Oblique",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.muted,
    paddingLeft: 12,
  },
  pillarAnalysis: {
    fontSize: 11,
    lineHeight: 1.7,
    color: COLORS.dark,
    textAlign: "justify",
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: COLORS.primary,
    marginBottom: 10,
    marginTop: 16,
  },

  // Recommendations
  recommendationItem: {
    flexDirection: "row",
    marginBottom: 6,
    paddingLeft: 8,
  },
  recommendationBullet: {
    fontSize: 11,
    color: COLORS.secondary,
    marginRight: 8,
    fontFamily: "Helvetica-Bold",
  },
  recommendationText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: COLORS.dark,
    flex: 1,
  },

  // Places
  placeCard: {
    backgroundColor: COLORS.background,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  placeName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.primary,
    marginBottom: 3,
  },
  placeNeighborhood: {
    fontSize: 9,
    color: COLORS.muted,
    marginBottom: 6,
  },
  placeDescription: {
    fontSize: 10,
    lineHeight: 1.5,
    color: COLORS.dark,
    marginBottom: 4,
  },
  placeWhy: {
    fontSize: 9,
    lineHeight: 1.4,
    color: COLORS.secondary,
    fontFamily: "Helvetica-Oblique",
  },

  // Conclusion
  conclusionPage: {
    backgroundColor: COLORS.background,
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 50,
  },
  conclusionTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: COLORS.primary,
    marginBottom: 20,
  },
  conclusionText: {
    fontSize: 11,
    lineHeight: 1.7,
    color: COLORS.dark,
    textAlign: "justify",
    marginBottom: 30,
  },
  poeticBox: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 24,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  poeticLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: COLORS.secondary,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  poeticText: {
    fontSize: 13,
    lineHeight: 1.8,
    color: COLORS.primary,
    fontFamily: "Helvetica-Oblique",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: COLORS.muted,
  },
});

// Helper: Generate radar chart SVG points
const generateRadarPoints = (scores: Record<string, number>, radius: number, cx: number, cy: number) => {
  const pillars = ["body", "space", "territory", "identity", "other"];
  const angleStep = (2 * Math.PI) / pillars.length;
  const startAngle = -Math.PI / 2;

  return pillars
    .map((key, i) => {
      const score = (scores[key] || 0) / 100;
      const angle = startAngle + i * angleStep;
      const x = cx + radius * score * Math.cos(angle);
      const y = cy + radius * score * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");
};

const generateAxisPoints = (radius: number, cx: number, cy: number) => {
  const count = 5;
  const angleStep = (2 * Math.PI) / count;
  const startAngle = -Math.PI / 2;

  return Array.from({ length: count }, (_, i) => {
    const angle = startAngle + i * angleStep;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      labelX: cx + (radius + 15) * Math.cos(angle),
      labelY: cy + (radius + 15) * Math.sin(angle),
    };
  });
};

const generateGridPoints = (radius: number, cx: number, cy: number) => {
  const count = 5;
  const angleStep = (2 * Math.PI) / count;
  const startAngle = -Math.PI / 2;

  return Array.from({ length: count }, (_, i) => {
    const angle = startAngle + i * angleStep;
    return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
  }).join(" ");
};

const PILLAR_LABELS: Record<string, string> = {
  body: "Corpo",
  space: "Espaço",
  territory: "Território",
  identity: "Identidade",
  other: "O Outro",
};

const PILLAR_ORDER = ["body", "space", "territory", "identity", "other"] as const;

const PageHeader = ({ pageNum }: { pageNum: number }) => (
  <View style={styles.pageHeader}>
    <Text style={styles.pageHeaderTitle}>Feltrip • Mapa de Presença Relacional</Text>
    <Text style={styles.pageNumber}>{pageNum}</Text>
  </View>
);

const PageFooter = () => (
  <View style={styles.footer}>
    <Text style={styles.footerText}>feltrip.com</Text>
    <Text style={styles.footerText}>Documento confidencial • Uso pessoal</Text>
  </View>
);

export const MapPDFDocument = ({ data }: { data: MapPDFData }) => {
  const { content, scores, city, userName, generatedAt, purchasingPower, stayDuration } = data;
  const cx = 140;
  const cy = 120;
  const maxRadius = 90;

  const stayLabels: Record<string, string> = {
    up_to_15_days: "Até 15 dias",
    up_to_1_month: "Até 1 mês",
    up_to_3_months: "Até 3 meses",
  };
  const powerLabels: Record<string, string> = {
    economic: "Econômico",
    moderate: "Moderado",
    comfortable: "Confortável",
    premium: "Premium",
  };

  let pageNum = 0;

  return (
    <Document title={`Mapa de Presença - ${userName}`} author="Feltrip" subject="Mapa de Presença Relacional">
      {/* === COVER PAGE === */}
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.felltripText}>FELTRIP</Text>
        <Text style={styles.felltripSubText}>Mapa de Presença Relacional</Text>
        <View style={styles.coverDivider} />
        <Text style={styles.coverTitle}>{content.title || "Seu Mapa na Cidade"}</Text>
        <Text style={styles.coverSubtitle}>{content.subtitle || `Uma cartografia sensível de ${city}`}</Text>
        <Text style={styles.coverUserName}>{userName}</Text>
        <Text style={styles.coverCity}>{city}</Text>
        <View style={{ marginTop: 40 }}>
          <Text style={styles.coverMeta}>
            {stayLabels[stayDuration] || stayDuration} • {powerLabels[purchasingPower] || purchasingPower}
          </Text>
          <Text style={styles.coverMeta}>Gerado em {generatedAt}</Text>
        </View>
      </Page>

      {/* === INTRODUCTION + RADAR === */}
      <Page size="A4" style={styles.page}>
        <PageHeader pageNum={++pageNum} />
        <Text style={styles.introTitle}>Introdução</Text>
        <Text style={styles.introText}>{content.introduction}</Text>

        <View style={{ marginTop: 30 }}>
          <Text style={styles.radarTitle}>Seu Radar de Presença</Text>
          <View style={styles.radarContainer}>
            <Svg width={280} height={260} viewBox="0 0 280 260">
              {/* Grid circles */}
              {[0.2, 0.4, 0.6, 0.8, 1.0].map((level) => (
                <Polygon
                  key={`grid-${level}`}
                  points={generateGridPoints(maxRadius * level, cx, cy)}
                  stroke="#E5E0DA"
                  strokeWidth={0.5}
                  fill="none"
                />
              ))}
              {/* Axes */}
              {generateAxisPoints(maxRadius, cx, cy).map((pt, i) => (
                <Line key={`axis-${i}`} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#E5E0DA" strokeWidth={0.5} />
              ))}
              {/* Data polygon */}
              <Polygon
                points={generateRadarPoints(scores, maxRadius, cx, cy)}
                fill="rgba(27, 107, 125, 0.2)"
                stroke={COLORS.primary}
                strokeWidth={2}
              />
              {/* Score dots */}
              {(() => {
                const pillars = PILLAR_ORDER;
                const angleStep = (2 * Math.PI) / pillars.length;
                const startAngle = -Math.PI / 2;
                return pillars.map((key, i) => {
                  const score = (scores[key] || 0) / 100;
                  const angle = startAngle + i * angleStep;
                  const x = cx + maxRadius * score * Math.cos(angle);
                  const y = cy + maxRadius * score * Math.sin(angle);
                  return (
                    <Circle
                      key={`dot-${key}`}
                      cx={x}
                      cy={y}
                      r={4}
                      fill={COLORS.pillar[key as keyof typeof COLORS.pillar]}
                    />
                  );
                });
              })()}
            </Svg>
          </View>
          {/* Legend */}
          <View style={styles.radarLegend}>
            {PILLAR_ORDER.map((key) => (
              <View key={key} style={styles.radarLegendItem}>
                <View style={[styles.radarLegendDot, { backgroundColor: COLORS.pillar[key] }]} />
                <Text style={styles.radarLegendText}>
                  {PILLAR_LABELS[key]} — {scores[key]}%
                </Text>
              </View>
            ))}
          </View>
        </View>
        <PageFooter />
      </Page>

      {/* === PILLAR SECTIONS (one per pillar, can span pages) === */}
      {PILLAR_ORDER.map((pillarKey) => {
        const section = content.sections[pillarKey];
        if (!section) return null;
        const color = COLORS.pillar[pillarKey];
        pageNum++;

        return (
          <Page key={pillarKey} size="A4" style={styles.pillarPage}>
            <PageHeader pageNum={pageNum} />
            <View style={styles.pillarHeader}>
              <View style={[styles.pillarColorBar, { backgroundColor: color }]} />
              <View style={styles.pillarTitleContainer}>
                <Text style={[styles.pillarTitle, { color }]}>{section.title || PILLAR_LABELS[pillarKey]}</Text>
                <Text style={styles.pillarScore}>Score: {scores[pillarKey]}%</Text>
              </View>
            </View>

            <Text style={styles.pillarSummary}>{section.summary}</Text>
            <Text style={styles.pillarAnalysis}>{section.deep_analysis}</Text>

            {section.recommendations && section.recommendations.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Recomendações</Text>
                {section.recommendations.map((rec, i) => (
                  <View key={i} style={styles.recommendationItem}>
                    <Text style={[styles.recommendationBullet, { color }]}>▸</Text>
                    <Text style={styles.recommendationText}>{rec}</Text>
                  </View>
                ))}
              </>
            )}

            {section.places && section.places.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Lugares para Você</Text>
                {section.places.map((place, i) => (
                  <View key={i} style={styles.placeCard}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <Text style={styles.placeNeighborhood}>{place.neighborhood}</Text>
                    <Text style={styles.placeDescription}>{place.description}</Text>
                    <Text style={styles.placeWhy}>→ {place.why}</Text>
                  </View>
                ))}
              </>
            )}
            <PageFooter />
          </Page>
        );
      })}

      {/* === PURCHASING POWER INSIGHTS === */}
      {content.purchasing_power_insights && (
        <Page size="A4" style={styles.page}>
          <PageHeader pageNum={++pageNum} />
          <Text style={styles.introTitle}>Insights de Experiência</Text>
          <Text style={styles.introText}>{content.purchasing_power_insights}</Text>
          <PageFooter />
        </Page>
      )}

      {/* === CONCLUSION + POETIC PROPOSITION === */}
      <Page size="A4" style={styles.conclusionPage}>
        <PageHeader pageNum={++pageNum} />
        <Text style={styles.conclusionTitle}>Conclusão</Text>
        <Text style={styles.conclusionText}>{content.conclusion}</Text>

        {content.poetic_proposition && (
          <View style={styles.poeticBox}>
            <Text style={styles.poeticLabel}>Proposição Poética</Text>
            <Text style={styles.poeticText}>{content.poetic_proposition}</Text>
          </View>
        )}
        <PageFooter />
      </Page>
    </Document>
  );
};

/**
 * Generate and download the map PDF on-demand.
 */
export const downloadMapPDF = async (data: MapPDFData) => {
  const blob = await pdf(<MapPDFDocument data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `feltrip-mapa-${data.city.toLowerCase().replace(/\s+/g, "-")}-${data.userName.toLowerCase().replace(/\s+/g, "-")}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Parse the AI response (map_content) into the structured format.
 * The agent MUST return valid JSON matching MapContentStructured.
 */
export const parseMapContent = (raw: string): MapContentStructured | null => {
  const tryParse = (str: string): MapContentStructured | null => {
    try {
      const parsed = JSON.parse(str);

      // --- VALIDAÇÃO DETALHADA PARA DEBUG ---
      if (!parsed) {
        console.error("[MAP-PARSER] Erro: JSON gerado pelo agente está vazio ou nulo.");
        return null;
      }
      if (!parsed.sections) {
        console.error("[MAP-PARSER] Erro: JSON inválido. Faltou a chave obrigatória 'sections'.");
        return null;
      }
      if (typeof parsed.introduction !== "string") {
        console.error("[MAP-PARSER] Erro: JSON inválido. Faltou a chave 'introduction' ou ela não é um texto.");
        return null;
      }
      // Se passou por tudo, o formato está correto!
      return parsed as MapContentStructured;
    } catch (error) {
      console.error("[MAP-PARSER] Erro ao tentar processar (JSON.parse) o texto do agente:", error);
      return null;
    }
  };

  console.log("[MAP-PARSER] Iniciando análise do texto bruto recebido...");

  // 1. Try direct parse
  let result = tryParse(raw);
  if (result) return result;

  // 2. Try extracting from markdown code blocks
  console.log("[MAP-PARSER] Tentando extrair JSON de blocos de markdown (```json)...");
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    result = tryParse(jsonMatch[1].trim());
    if (result) return result;
  }

  // 3. Try finding JSON object in the string
  console.log("[MAP-PARSER] Tentando encontrar as chaves {} no texto bruto...");
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    result = tryParse(raw.substring(firstBrace, lastBrace + 1));
    if (result) return result;
  }

  console.error("[MAP-PARSER] Falha crítica: O agente não enviou um JSON estruturado válido.");
  return null;
};

/**
 * Build MapPDFData from questionnaire data + AI response.
 */
export const buildMapPDFData = (params: {
  mapContent: string;
  scores: { body: number; space: number; territory: number; identity: number; other: number };
  city: string;
  stayDuration: string;
  purchasingPower: string;
  userName: string;
}): MapPDFData | null => {
  const content = parseMapContent(params.mapContent);
  if (!content) return null;

  return {
    content,
    scores: params.scores,
    city: params.city,
    stayDuration: params.stayDuration,
    purchasingPower: params.purchasingPower,
    userName: params.userName,
    generatedAt: new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
  };
};
