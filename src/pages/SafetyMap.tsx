import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MapPin, Phone, MessageSquare, Navigation, AlertTriangle, Heart, Shield, Info, Loader2, Share2, ArrowLeft, Building2, Users, Link2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MapboxMap from "@/components/maps/MapboxMap";
import { useTranslation } from "react-i18next";

type FeelingSafeType = "safe" | "alert" | "danger";

interface SafetyPin {
  id: string;
  latitude: number;
  longitude: number;
  type: string;
  title: string;
  content: string | null;
  is_shared_to_community?: boolean;
  is_shared_with_hr?: boolean;
}

interface SafetyMapProps {
  onBack?: () => void;
}

const SafetyMap = ({ onBack }: SafetyMapProps = {}) => {
  const { t } = useTranslation();
  const [selectedCountry, setSelectedCountry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [feelingType, setFeelingType] = useState<FeelingSafeType>("safe");
  const [savedPins, setSavedPins] = useState<SafetyPin[]>([]);
  const [isLoadingPins, setIsLoadingPins] = useState(true);
  const [shareWithCommunity, setShareWithCommunity] = useState(false);
  const [shareWithHR, setShareWithHR] = useState(false);

  // Load saved pins and track engagement when component mounts
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Track engagement
        await supabase.from("engagement_tracking").insert({
          user_id: user.id,
          activity_type: 'security_map',
          metadata: {}
        });

        loadPins();
      } else {
        setIsLoadingPins(false);
      }
    };
    init();
  }, []);

  const loadPins = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoadingPins(false);
        return;
      }

      const { data: pins } = await supabase
        .from("map_pins")
        .select("*")
        .order("created_at", { ascending: false });

      if (pins) {
        setSavedPins(pins);
      }
    } catch (error) {
      console.error("Error loading pins:", error);
    } finally {
      setIsLoadingPins(false);
    }
  };

  const handleMapClick = (lngLat: { lng: number; lat: number }) => {
    setSelectedLocation(lngLat);
    toast.info("Location selected! Fill in the details below.");
  };

  const handleEmergencyCall = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("engagement_tracking").insert({
        user_id: user.id,
        activity_type: 'security_map',
        metadata: { action: 'emergency_call' }
      });
    }
    toast.success("Safety network activated! HR, family and contacts notified.");
  };

  const handleLiveLocation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("engagement_tracking").insert({
        user_id: user.id,
        activity_type: 'security_map',
        metadata: { action: 'live_location' }
      });
    }
    toast.info("Sharing live location...");
  };

  const handleReportLocation = async () => {
    if (!selectedLocation) {
      toast.error("Please tap on the map or search an address to select a location.");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a title for this report.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Track the report
      await supabase.from("engagement_tracking").insert({
        user_id: user.id,
        activity_type: 'security_map',
        metadata: { 
          action: 'report_location',
          feeling_type: feelingType,
          title: title,
          description: description
        }
      });

      // Save to map_pins
      const { error } = await supabase.from("map_pins").insert({
        user_id: user.id,
        title: title.trim(),
        content: description.trim() || null,
        type: feelingType,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        is_shared_to_community: shareWithCommunity,
        is_shared_with_hr: shareWithHR
      });

      if (error) throw error;

      let successMessage = "Location saved to your personal map!";
      if (shareWithHR && shareWithCommunity) {
        successMessage = "Location reported and shared with HR and community!";
      } else if (shareWithHR) {
        successMessage = "Location reported and shared with HR!";
      } else if (shareWithCommunity) {
        successMessage = "Location shared with the community!";
      }
      
      toast.success(successMessage);
      setTitle("");
      setDescription("");
      setSelectedLocation(null);
      setShareWithCommunity(false);
      setShareWithHR(false);
      loadPins();
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyShareLink = (pinId: string) => {
    const shareUrl = `${window.location.origin}/shared-pin/${pinId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied! Share it with friends.");
  };

  const getFeelingIcon = (type: FeelingSafeType) => {
    switch (type) {
      case "safe": return <Heart className="h-5 w-5 text-chart-2" />;
      case "alert": return <AlertTriangle className="h-5 w-5 text-secondary" />;
      case "danger": return <Shield className="h-5 w-5 text-destructive" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10 p-6 space-y-6">
      {/* Back Button */}
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Button>
      )}

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-primary">{t('safetyMap.title')}</h1>
        <p className="text-muted-foreground">
          {t('safetyMap.subtitle')}
        </p>
      </div>

      {/* Privacy Notice */}
      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong>{t('safetyMap.privacyTitle')}</strong> {t('safetyMap.privacyDescription')}
        </AlertDescription>
      </Alert>

      {/* Emergency Call Card */}
      <Card className="p-6 bg-destructive/5 border-destructive/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-destructive/10">
            <Phone className="h-8 w-8 text-destructive" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-primary">{t('safetyMap.emergencyCall')}</h2>
              <p className="text-muted-foreground mt-2">
                {t('safetyMap.emergencyDescription')}
              </p>
            </div>
            <Button 
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              size="lg"
              onClick={handleEmergencyCall}
            >
              <Phone className="mr-2 h-5 w-5" />
              {t('safetyMap.triggerEmergency')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Location Card */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          {t('safetyMap.reportLocation')}
        </h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('safetyMap.howDoYouFeel')}</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={feelingType === "safe" ? "default" : "outline"}
                className={`${feelingType === "safe" ? "bg-chart-2 hover:bg-chart-2/90" : ""} px-2 text-xs sm:text-sm`}
                onClick={() => setFeelingType("safe")}
              >
                <Heart className="h-4 w-4 shrink-0 mr-1" />
                <span className="truncate">{t('safetyMap.welcome')}</span>
              </Button>
              <Button
                variant={feelingType === "alert" ? "default" : "outline"}
                className={`${feelingType === "alert" ? "bg-secondary hover:bg-secondary/90" : ""} px-2 text-xs sm:text-sm`}
                onClick={() => setFeelingType("alert")}
              >
                <AlertTriangle className="h-4 w-4 shrink-0 mr-1" />
                <span className="truncate">{t('safetyMap.alert')}</span>
              </Button>
              <Button
                variant={feelingType === "danger" ? "default" : "outline"}
                className={`${feelingType === "danger" ? "bg-destructive hover:bg-destructive/90" : ""} px-2 text-xs sm:text-sm`}
                onClick={() => setFeelingType("danger")}
              >
                <Shield className="h-4 w-4 shrink-0 mr-1" />
                <span className="truncate">{t('safetyMap.danger')}</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">{t('common.title')}</Label>
            <Input
              id="title"
              placeholder={t('safetyMap.titlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('common.description')} ({t('common.optional')})</Label>
            <Textarea
              id="description"
              placeholder={t('safetyMap.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Sharing Options */}
          <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
            <p className="text-sm font-medium text-foreground">{t('safetyMap.sharingOptions')}</p>
            
            {/* Share with HR */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <Label htmlFor="share-hr" className="text-sm cursor-pointer">
                  {t('safetyMap.shareWithHR')}
                </Label>
              </div>
              <Switch
                id="share-hr"
                checked={shareWithHR}
                onCheckedChange={setShareWithHR}
              />
            </div>
            {shareWithHR && (
              <p className="text-xs text-muted-foreground ml-6">
                {t('safetyMap.shareWithHRDesc')}
              </p>
            )}
            
            {/* Share with Community */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <Label htmlFor="share-community" className="text-sm cursor-pointer">
                  {t('safetyMap.shareWithCommunity')}
                </Label>
              </div>
              <Switch
                id="share-community"
                checked={shareWithCommunity}
                onCheckedChange={setShareWithCommunity}
              />
            </div>
            {shareWithCommunity && (
              <p className="text-xs text-muted-foreground ml-6">
                {t('safetyMap.shareWithCommunityDesc')}
              </p>
            )}
            
            {!shareWithHR && !shareWithCommunity && (
              <p className="text-xs text-muted-foreground italic">
                {t('safetyMap.privateOnly')}
              </p>
            )}
          </div>

          <Button
            onClick={handleReportLocation} 
            className="w-full"
            disabled={isSubmitting || !selectedLocation}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('common.submitting')}
              </>
            ) : (
              <>
                {getFeelingIcon(feelingType)}
                <span className="ml-2">{t('safetyMap.reportLocation')}</span>
              </>
            )}
          </Button>
          {!selectedLocation && (
            <p className="text-xs text-muted-foreground text-center">
              {t('safetyMap.selectLocationFirst')}
            </p>
          )}
          {selectedLocation && (
            <p className="text-sm text-primary font-medium text-center">
              ✓ {t('safetyMap.locationSelected')} {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
            </p>
          )}
        </div>
      </Card>

      {/* Map with Mapbox showing saved pins */}
      <Card className="p-4">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          {t('safetyMap.mapTitle')} ({savedPins.length} {t('safetyMap.reports')})
        </h3>
        <MapboxMap 
          pins={savedPins.map(pin => ({
            id: pin.id,
            latitude: pin.latitude,
            longitude: pin.longitude,
            type: pin.type as 'safe' | 'alert' | 'danger',
            title: pin.title,
            content: pin.content || undefined
          }))}
          showUserLocation={true}
          showSearch={true}
          onMapClick={handleMapClick}
          className="h-[300px]"
        />
      </Card>

      {/* Security Alert Actions */}
      <Card className="p-4">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          {t('safetyMap.quickActions')}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            className="justify-start px-2 text-xs sm:text-sm"
            onClick={handleLiveLocation}
          >
            <Navigation className="mr-1 sm:mr-2 h-4 w-4 shrink-0 text-destructive" />
            <span className="truncate">{t('safetyMap.liveLocation')}</span>
          </Button>
          <Button 
            variant="outline" 
            className="justify-start px-2 text-xs sm:text-sm"
            onClick={() => toast.info("Opening emergency contacts...")}
          >
            <Phone className="mr-1 sm:mr-2 h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{t('safetyMap.emergency')}</span>
          </Button>
        </div>
      </Card>

      {/* Emergency Numbers */}
      <Card className="p-4">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          {t('safetyMap.emergencyNumbers')}
        </h3>
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger>
            <SelectValue placeholder={t('safetyMap.selectCountry')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="br">Brazil - 190 (Police), 192 (SAMU)</SelectItem>
            <SelectItem value="pt">Portugal - 112 (Emergency)</SelectItem>
            <SelectItem value="us">USA - 911 (Emergency)</SelectItem>
            <SelectItem value="uk">UK - 999 (Emergency)</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {/* Map Legend */}
      <Card className="p-4">
        <h3 className="font-semibold text-foreground mb-4">{t('safetyMap.mapLegend')}</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-primary rounded-full border-2 border-background flex items-center justify-center">
              <MapPin className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm text-foreground">{t('safetyMap.yourLocation')}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-chart-2 rounded-full border-2 border-background flex items-center justify-center">
              <Heart className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm text-foreground">{t('safetyMap.welcomingZones')}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-secondary rounded-full border-2 border-background flex items-center justify-center">
              <AlertTriangle className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm text-foreground">{t('safetyMap.cautionZones')}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-destructive rounded-full border-2 border-background flex items-center justify-center">
              <Shield className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm text-foreground">{t('safetyMap.dangerZones')}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SafetyMap;
