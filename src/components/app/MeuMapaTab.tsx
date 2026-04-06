import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, MapPin, Sparkles, Loader2 as Spinner, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import cultAnalystImage from "@/assets/cult-character-analyst.png";
import { CityQuestionnaire } from "./CityQuestionnaire";
import { parseMapContent } from "./pdf/mapPDFUtils";
import { CityMapViewer } from "./CityMapViewer";
import { PresenceMapPreview } from "./PresenceMapPreview";
import { useProfile } from "@/hooks/useProfile";
import { generateCityMap } from "./services/cityMapAgentService";
import { useUserTier } from "@/hooks/useUserTier";
import { useAuth } from "@/hooks/useAuth";
import PricingPaywall from "./components/PricingPaywall";
import { FeedbackPopup } from "./components/FeedbackPopup";
import { useTranslation } from "react-i18next";


interface DiaryEntry {
    pillar: string;
    sentiment: number;
}

type ViewState = "home" | "city_questionnaire" | "map_result" | "map_viewer" | "map_preview" | "generating";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--energy))', 'hsl(var(--muted))'];

export const MeuMapaTab = () => {
    const { t, i18n } = useTranslation();
    const { toast } = useToast();
    const { profile } = useProfile();
    const { user } = useAuth();
    const { includesFullMap, isLoading: tierLoading } = useUserTier();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [radarData, setRadarData] = useState<DiaryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewState, setViewState] = useState<ViewState>("home");
    const [completedMapId, setCompletedMapId] = useState<string | null>(null);
    const [hasExistingMap, setHasExistingMap] = useState(false);
    const [mapCount, setMapCount] = useState(0);
    const [cityQData, setCityQData] = useState<any>(null);
    const [showPaywall, setShowPaywall] = useState(false);
    const [showMapFeedback, setShowMapFeedback] = useState(false);
    const [previewScores, setPreviewScores] = useState<{ body: number; space: number; territory: number; identity: number; other: number } | null>(null);
    const [previewCity, setPreviewCity] = useState("");

    const isRealUser = !!user && !user.is_anonymous && !!user.email;

    const requireLogin = (): boolean => {
        if (isRealUser) return false; // logged in, proceed
        window.dispatchEvent(new CustomEvent("auth-required-for-checkout"));
        return true; // blocked
    };

    useEffect(() => {
        loadData();
        // Listen for auto-start from URL deep link
        const handler = () => setViewState("city_questionnaire");
        window.addEventListener('start-presence-map', handler);
        return () => window.removeEventListener('start-presence-map', handler);
    }, []);

    const loadData = async () => {
        try {
            let { data: { user } } = await supabase.auth.getUser();

            // Auto sign-in anonymously if no user (same pattern as gems flow)
            if (!user) {
                const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
                if (anonError) {
                    console.error('Anonymous sign-in error:', anonError);
                    setLoading(false);
                    return;
                }
                user = anonData.user;
            }

            if (!user) { setLoading(false); return; }
            setCurrentUser(user);
            // Check for existing city questionnaires
            const { data: cityQ, count: cityQCount } = await supabase
                .from("city_questionnaires")
                .select("id, city, stay_duration, purchasing_power, map_content, map_status, other_q1, other_q2, other_q3, other_q4, space_q1, space_q2, space_q3, space_q4, territory_q1, territory_q2, territory_q3, territory_q4, identity_q1, identity_q2, identity_q3, identity_q4, body_q1, body_q2, body_q3, body_q4", { count: 'exact' })
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(1);

            setMapCount(cityQCount || 0);

            if (cityQ && cityQ.length > 0) {
                setHasExistingMap(true);
                const latest = cityQ[0];
                setCityQData(latest);
                const otherScore = Math.round(((latest.other_q1 + latest.other_q2 + latest.other_q3 + latest.other_q4) / 20) * 100);
                const spaceScore = Math.round(((latest.space_q1 + latest.space_q2 + latest.space_q3 + latest.space_q4) / 20) * 100);
                const territoryScore = Math.round(((latest.territory_q1 + latest.territory_q2 + latest.territory_q3 + latest.territory_q4) / 20) * 100);
                const identityScore = Math.round(((latest.identity_q1 + latest.identity_q2 + latest.identity_q3 + latest.identity_q4) / 20) * 100);
                const bodyScore = Math.round(((latest.body_q1 + latest.body_q2 + latest.body_q3 + latest.body_q4) / 20) * 100);

                setRadarData([
                    { pillar: t('cityQ.portalOther'), sentiment: otherScore },
                    { pillar: t('cityQ.portalSpace'), sentiment: spaceScore },
                    { pillar: t('cityQ.portalTerritory'), sentiment: territoryScore },
                    { pillar: t('cityQ.portalIdentity'), sentiment: identityScore },
                    { pillar: t('cityQ.portalBody'), sentiment: bodyScore },
                ]);
            } else {
                // Fallback: check old presence_questionnaires
                const { data: questionnaires } = await supabase
                    .from("presence_questionnaires")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(1);

                if (questionnaires && questionnaires.length > 0) {
                    setHasExistingMap(true);
                    const latest = questionnaires[0];
                    const bodyScore = Math.round(((latest.body_q1 + latest.body_q2 + latest.body_q3) / 15) * 100);
                    const spaceScore = Math.round(((latest.space_q1 + latest.space_q2 + latest.space_q3) / 15) * 100);
                    const territoryScore = Math.round(((latest.territory_q1 + latest.territory_q2 + latest.territory_q3) / 15) * 100);
                    const otherScore = Math.round(((latest.other_q1 + latest.other_q2 + latest.other_q3) / 15) * 100);
                    const identityScore = Math.round(((latest.identity_q1 + latest.identity_q2 + latest.identity_q3) / 15) * 100);
                    setRadarData([
                        { pillar: t('cityQ.portalOther'), sentiment: otherScore },
                        { pillar: t('cityQ.portalSpace'), sentiment: spaceScore },
                        { pillar: t('cityQ.portalTerritory'), sentiment: territoryScore },
                        { pillar: t('cityQ.portalIdentity'), sentiment: identityScore },
                        { pillar: t('cityQ.portalBody'), sentiment: bodyScore },
                    ]);
                } else {
                    setRadarData([
                        { pillar: t('cityQ.portalOther'), sentiment: 0 },
                        { pillar: t('cityQ.portalSpace'), sentiment: 0 },
                        { pillar: t('cityQ.portalTerritory'), sentiment: 0 },
                        { pillar: t('cityQ.portalIdentity'), sentiment: 0 },
                        { pillar: t('cityQ.portalBody'), sentiment: 0 },
                    ]);
                }
            }
        } catch (error: any) {
            console.error(error);
            toast({ title: "Error loading data", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleQuestionnaireComplete = async (questionnaireId: string) => {
        setCompletedMapId(questionnaireId);

        // Fetch the completed questionnaire to get scores
        const { data: freshQ } = await supabase
            .from("city_questionnaires")
            .select("*")
            .eq("id", questionnaireId)
            .single();

        if (freshQ) {
            const scores = {
                body: Math.round(((freshQ.body_q1 + freshQ.body_q2 + freshQ.body_q3 + freshQ.body_q4) / 20) * 100),
                space: Math.round(((freshQ.space_q1 + freshQ.space_q2 + freshQ.space_q3 + freshQ.space_q4) / 20) * 100),
                territory: Math.round(((freshQ.territory_q1 + freshQ.territory_q2 + freshQ.territory_q3 + freshQ.territory_q4) / 20) * 100),
                identity: Math.round(((freshQ.identity_q1 + freshQ.identity_q2 + freshQ.identity_q3 + freshQ.identity_q4) / 20) * 100),
                other: Math.round(((freshQ.other_q1 + freshQ.other_q2 + freshQ.other_q3 + freshQ.other_q4) / 20) * 100),
            };

            // Always generate the map for everyone
            setCityQData(freshQ);
            setPreviewScores(scores);
            setPreviewCity(freshQ.city);

            // Show generating screen
            setViewState("generating");

            const result = await generateCityMap(freshQ as any, profile?.full_name || t('mapTab.traveler'));

            if (result.success) {
                // Re-fetch to get generated map_content
                const { data: updatedQ } = await supabase
                    .from("city_questionnaires")
                    .select("*")
                    .eq("id", questionnaireId)
                    .single();

                if (updatedQ) {
                    setCityQData(updatedQ);

                    if (includesFullMap) {
                        toast({ title: t('mapTab.mapReady'), description: t('mapTab.mapReadyDesc') });
                        setViewState("map_viewer");
                    } else {
                        setViewState("map_preview");
                    }
                }
            } else {
                toast({ title: t('mapTab.generationError'), description: result.error || t('mapTab.tryAgainLater'), variant: "destructive" });
                setViewState("home");
                await loadData();
            }
        } else {
            setViewState("home");
            await loadData();
        }
    };

    const handleViewMap = () => {
        if (!cityQData || !cityQData.map_content) {
            toast({ title: t('mapTab.generatingMap'), description: t('mapTab.generatingMapDesc'), variant: "destructive" });
            return;
        }
        // Non-premium users see the preview with paywall, not the full map
        if (!includesFullMap) {
            const latest = cityQData;
            const scores = {
                body: Math.round(((latest.body_q1 + latest.body_q2 + latest.body_q3 + latest.body_q4) / 20) * 100),
                space: Math.round(((latest.space_q1 + latest.space_q2 + latest.space_q3 + latest.space_q4) / 20) * 100),
                territory: Math.round(((latest.territory_q1 + latest.territory_q2 + latest.territory_q3 + latest.territory_q4) / 20) * 100),
                identity: Math.round(((latest.identity_q1 + latest.identity_q2 + latest.identity_q3 + latest.identity_q4) / 20) * 100),
                other: Math.round(((latest.other_q1 + latest.other_q2 + latest.other_q3 + latest.other_q4) / 20) * 100),
            };
            setPreviewScores(scores);
            setPreviewCity(latest.city);
            setViewState("map_preview");
            return;
        }
        setViewState("map_viewer");
    };

    // Map Viewer
    if (viewState === "map_viewer" && cityQData?.map_content) {
        const latest = cityQData;
        const mapScores = {
            body: Math.round(((latest.body_q1 + latest.body_q2 + latest.body_q3 + latest.body_q4) / 20) * 100),
            space: Math.round(((latest.space_q1 + latest.space_q2 + latest.space_q3 + latest.space_q4) / 20) * 100),
            territory: Math.round(((latest.territory_q1 + latest.territory_q2 + latest.territory_q3 + latest.territory_q4) / 20) * 100),
            identity: Math.round(((latest.identity_q1 + latest.identity_q2 + latest.identity_q3 + latest.identity_q4) / 20) * 100),
            other: Math.round(((latest.other_q1 + latest.other_q2 + latest.other_q3 + latest.other_q4) / 20) * 100),
        };
        const parsedContent = parseMapContent(latest.map_content);
        if (parsedContent) {
            return (
                <CityMapViewer
                    content={parsedContent}
                    scores={mapScores}
                    city={latest.city}
                    userName={profile?.full_name || t('mapTab.traveler')}
                    onBack={() => setShowMapFeedback(true)}
                    isAnonymous={!!currentUser && ((currentUser as any).is_anonymous === true || !currentUser.email)}
                />
            );
        } else {
            console.error('[MeuMapaTab] Failed to parse map_content, type:', typeof latest.map_content, 'preview:', String(latest.map_content).substring(0, 300));
            return (
                <div className="flex flex-col items-center justify-center h-full p-6 space-y-4">
                    <p className="text-destructive font-medium">{t('mapTab.loadError')}</p>
                    <Button variant="outline" onClick={() => setViewState("home")}>{t('common.back')}</Button>
                </div>
            );
        }
    }

    // Generating screen — shown while AI creates the map
    if (viewState === "generating") {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 space-y-6 text-center">
                <img src={cultAnalystImage} alt="Generating" className="w-28 h-28 object-contain animate-float" />
                <Spinner className="h-8 w-8 text-primary animate-spin" />
                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-primary">{t('mapTab.generatingMap')}</h2>
                    <p className="text-sm text-muted-foreground max-w-xs">
                        {t('mapTab.generatingMapDesc')}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                        ⏱ ~2-3 min
                    </p>
                </div>
            </div>
        );
    }

    // Map Preview (non-premium users)
    if (viewState === "map_preview" && previewScores && cityQData?.map_content) {
        const parsedPreviewContent = parseMapContent(cityQData.map_content);
        if (parsedPreviewContent) {
            return (
                <PresenceMapPreview
                    scores={previewScores}
                    city={previewCity}
                    content={parsedPreviewContent}
                    userName={profile?.full_name || t('mapTab.traveler')}
                    onUnlocked={() => {
                        setViewState("home");
                        loadData();
                    }}
                    onBack={() => setViewState("home")}
                />
            );
        }
    }

    // Feedback popup after closing map viewer
    if (showMapFeedback) {
        return (
            <div className="flex items-center justify-center h-full">
                <FeedbackPopup
                    featureLabel={t('mapTab.relationalMap')}
                    lang={i18n.language?.substring(0, 2) as "pt" | "en" | "es" || "pt"}
                    onClose={() => {
                        setShowMapFeedback(false);
                        setViewState("home");
                        // Navigate back to previous ExpatApp tab
                        const event = new CustomEvent('navigate-tab', { detail: 'presence' });
                        window.dispatchEvent(event);
                    }}
                />
            </div>
        );
    }

    // City Questionnaire View
    if (viewState === "city_questionnaire") {
        return (
            <CityQuestionnaire
                onComplete={handleQuestionnaireComplete}
                onBack={() => setViewState("home")}
            />
        );
    }

    // Home View
    return (
        <div className="flex flex-col h-full bg-background overflow-y-auto">
            <div className="p-6 space-y-6 max-w-2xl mx-auto w-full">
                {/* Boba Meditating at Top */}
                <div className="flex justify-center">
                    <img
                        src={cultAnalystImage}
                        alt="Cult Meditating"
                        className="w-32 h-32 object-contain animate-float"
                    />
                </div>

                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-bold text-primary">
                        {t('presence.howAreYouFeeling')}
                    </h1>
                    <p className="text-muted-foreground italic text-lg">
                        {t('presence.exploreYourPillars')}
                    </p>
                </div>

                {/* Botao Quero Meu Mapa */}
                <Button
                    onClick={() => {
                        if (requireLogin()) return;
                        const event = new CustomEvent("navigate-tab", { detail: "cult" });
                        window.dispatchEvent(event);
                    }}
                    className="w-full h-16 text-lg font-semibold gap-3"
                >
                    <Sparkles className="h-6 w-6" />
                    {t("mapTab.myPlacesInCity")}
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                    {t('mapTab.myPlacesInCityDesc')}
                </p>

                {/* Main CTA: City Map */}
                <Button
                    variant="outline"
                    disabled={tierLoading}
                    onClick={() => {
                        if (requireLogin()) return;
                        if (tierLoading) return;
                        if (mapCount >= 1) {
                            setShowPaywall(true);
                            return;
                        }
                        setViewState("city_questionnaire");
                    }}
                    className="w-full h-14 text-base font-semibold gap-3 border-primary/30"
                >
                    <MapPin className="h-5 w-5" />
                    {hasExistingMap ? t('cityQ.startAnotherMap') : t('cityQ.startMap')}
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                    {hasExistingMap
                        ? t('cityQ.startAnotherMapDesc')
                        : t('cityQ.startMapDesc')
                    }
                </p>

                {/* Sales Paywall */}
                {showPaywall && (
                    <PricingPaywall
                        onClose={() => setShowPaywall(false)}
                        lang={(i18n.language?.substring(0, 2) || 'pt') as any}
                    />
                )}

                <div className="bg-accent/20 border border-accent/30 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">
                        ⚡ {t('mapTab.mapIncluded')}
                    </p>
                </div>

                {/* Model and Method Cards */}
                <div className="space-y-3">
                    <Card>
                        <CardHeader className="p-4">
                            <CardTitle className="text-lg text-primary">{t('presence.modelTitle')}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-sm text-muted-foreground">
                                {t('presence.modelDescription')}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="p-4">
                            <CardTitle className="text-lg text-primary">{t('presence.methodTitle')}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-sm text-muted-foreground">
                                {t('presence.methodDescription')}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Map Section - shows if user has data */}
                {hasExistingMap && (
                    <div id="mapa-section" className="space-y-4">
                        {/* View Map Button */}
                        {cityQData?.map_content && cityQData.map_status === 'completed' && (
                            <Button
                                variant="outline"
                                onClick={() => { if (requireLogin()) return; handleViewMap(); }}
                                className="w-full h-14 text-base font-semibold gap-3 border-secondary/50 text-secondary hover:bg-secondary/10"
                            >
                                <Eye className="h-5 w-5" />
                                {t('mapTab.viewFullMap')}
                            </Button>
                        )}
                        {cityQData && (cityQData.map_status === 'pending' || cityQData.map_status === 'generating') && (
                            <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-3 text-center">
                                <p className="text-sm text-secondary font-medium">
                                    {t('mapTab.mapGenerating')}
                                </p>
                            </div>
                        )}
                        {cityQData && cityQData.map_status === 'failed' && (
                            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-center space-y-2">
                                <p className="text-sm text-destructive font-medium">
                                    {t('mapTab.mapError')}
                                </p>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-destructive/50 text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                        if (cityQData) {
                                            toast({ title: t('mapTab.generatingMap'), description: t('mapTab.generatingMapDesc') });
                                            generateCityMap(cityQData as any, profile?.full_name || t('mapTab.traveler')).then(result => {
                                                if (result.success) {
                                                    toast({ title: t('mapTab.mapReady'), description: t('mapTab.mapReadyDesc') });
                                                    loadData();
                                                } else {
                                                    toast({ title: t('mapTab.generationError'), description: result.error || t('mapTab.tryAgainLater'), variant: "destructive" });
                                                }
                                            });
                                        }
                                    }}
                                >
                                    {t('mapTab.retryGenerate')}
                                </Button>
                            </div>
                        )}
                        <Tabs defaultValue="radar" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="radar">{t('presence.presenceMap')}</TabsTrigger>
                                <TabsTrigger value="pillars">{t('presence.fivePillars')}</TabsTrigger>
                            </TabsList>

                            <TabsContent value="radar" className="space-y-4 mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('presence.radarTitle')}</CardTitle>
                                        <CardDescription>{t('presence.radarDescription')}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <div className="h-64 flex items-center justify-center">
                                                <p className="text-muted-foreground">Loading...</p>
                                            </div>
                                        ) : (
                                            <div className="h-64">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={radarData}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            label={({ pillar }) => pillar}
                                                            outerRadius={80}
                                                            fill="hsl(var(--primary))"
                                                            dataKey="sentiment"
                                                        >
                                                            {radarData.map((_, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="pillars" className="space-y-4 mt-4">
                                {radarData.map((data) => (
                                    <Card key={data.pillar}>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <TrendingUp className="h-5 w-5 text-primary" />
                                                {data.pillar}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary transition-all" style={{ width: `${data.sentiment}%` }} />
                                                </div>
                                                <span className="text-sm font-medium">{Math.round(data.sentiment)}%</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </div>
        </div >
    );
};
export default MeuMapaTab;