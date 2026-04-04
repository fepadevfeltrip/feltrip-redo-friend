import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MapPin, Save, FileText, Languages, Link, Cloud, Plus, Trash2, Loader2, ExternalLink, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MapboxMap from "@/components/maps/MapboxMap";
import { useTranslation } from "react-i18next";

interface Annotation {
  id: string;
  latitude: number;
  longitude: number;
  type: 'general' | 'language';
  title: string;
  content: string;
  link?: string;
  created_at: string;
}

const Annotations = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteLink, setNoteLink] = useState("");
  const [noteType, setNoteType] = useState<'general' | 'language'>('general');
  const [shareWithCommunity, setShareWithCommunity] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadAnnotations();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadAnnotations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_annotations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAnnotations(data?.map(item => ({
        id: item.id,
        latitude: item.latitude,
        longitude: item.longitude,
        type: item.type as 'general' | 'language',
        title: item.title,
        content: item.content || '',
        link: item.link || undefined,
        created_at: item.created_at
      })) || []);
    } catch (error) {
      console.error("Error loading annotations:", error);
      toast.error("Failed to load annotations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapClick = (lngLat: { lng: number; lat: number }) => {
    setSelectedLocation(lngLat);
    toast.info(t('annotations.selectLocationFirst'));
  };

  const handleSaveAnnotation = async () => {
    if (!selectedLocation) {
      toast.error(t('annotations.selectLocationFirst'));
      return;
    }
    if (!noteTitle.trim()) {
      toast.error(t('annotations.enterTitle'));
      return;
    }

    if (!user) {
      toast.error(t('annotations.mustBeLoggedIn'));
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("user_annotations").insert({
        user_id: user.id,
        title: noteTitle.trim(),
        content: noteText.trim(),
        type: noteType,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        link: noteLink.trim() || null
      });

      if (error) throw error;

      if (shareWithCommunity) {
        const { error: pinError } = await supabase.from("map_pins").insert({
          user_id: user.id,
          title: noteTitle.trim(),
          content: noteText.trim(),
          type: 'safe',
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          is_shared_to_community: true
        });

        if (pinError) {
          console.error("Error sharing to community:", pinError);
          toast.warning(t('annotations.failedToSave'));
        } else {
          toast.success(t('annotations.annotationShared'));
        }
      } else {
        toast.success(t('annotations.annotationSaved'));
      }

      setNoteTitle("");
      setNoteText("");
      setNoteLink("");
      setSelectedLocation(null);
      setShareWithCommunity(false);
      loadAnnotations();
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || t('annotations.failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAnnotation = async (id: string) => {
    try {
      const { error } = await supabase.from("user_annotations").delete().eq("id", id);
      if (error) throw error;
      toast.success(t('annotations.annotationDeleted'));
      loadAnnotations();
    } catch (error) {
      toast.error(t('annotations.failedToDelete'));
    }
  };

  const handleShareAnnotation = async (annotation: Annotation) => {
    if (!user) {
      toast.error(t('annotations.mustBeLoggedIn'));
      return;
    }

    try {
      const { error } = await supabase.from("map_pins").insert({
        user_id: user.id,
        title: annotation.title,
        content: annotation.content,
        type: 'safe',
        latitude: annotation.latitude,
        longitude: annotation.longitude,
        is_shared_to_community: true
      });

      if (error) throw error;
      toast.success(t('annotations.sharedWithCommunity'));
    } catch (error: any) {
      console.error("Share error:", error);
      toast.error(t('annotations.failedToSave'));
    }
  };

  const openCloudService = (service: string) => {
    const urls: Record<string, string> = {
      'icloud': 'https://www.icloud.com/iclouddrive',
      'dropbox': 'https://www.dropbox.com/home',
      'onedrive': 'https://onedrive.live.com'
    };
    window.open(urls[service], '_blank');
  };

  const mapPins = annotations.map(a => ({
    id: a.id,
    latitude: a.latitude,
    longitude: a.longitude,
    type: a.type === 'general' ? 'safe' as const : 'alert' as const,
    title: a.title,
    content: a.content
  }));

  const generalAnnotations = annotations.filter(a => a.type === 'general');
  const languageAnnotations = annotations.filter(a => a.type === 'language');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10 p-6 space-y-6 max-w-2xl mx-auto w-full">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-primary">{t('annotations.title')}</h1>
        <p className="text-muted-foreground">
          {t('annotations.subtitle')}
        </p>
        <Badge variant="secondary" className="gap-1">
          🔒 {t('annotations.privateNotice')}
        </Badge>
      </div>

      <Card className="p-3 sm:p-4">
        <h3 className="font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
          {t('annotations.searchOrTap')}
        </h3>
        <MapboxMap
          pins={mapPins}
          showUserLocation={true}
          showSearch={true}
          onMapClick={handleMapClick}
          className="h-[200px] sm:h-[250px] md:h-[300px]"
        />
        {selectedLocation && (
          <p className="text-sm text-primary mt-2 font-medium">
            ✓ {t('safetyMap.locationSelected')} {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
          </p>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          {t('annotations.newAnnotation')}
        </h3>

        <div className="space-y-2">
          <Label>{t('annotations.type')}</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={noteType === "general" ? "default" : "outline"}
              onClick={() => setNoteType("general")}
              className="justify-start px-2 text-xs sm:text-sm"
            >
              <FileText className="mr-1 sm:mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{t('annotations.generalNote')}</span>
            </Button>
            <Button
              variant={noteType === "language" ? "default" : "outline"}
              onClick={() => setNoteType("language")}
              className="justify-start px-2 text-xs sm:text-sm"
            >
              <Languages className="mr-1 sm:mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{t('annotations.languagePractice')}</span>
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">{t('annotations.titleLabel')}</Label>
          <Input
            id="title"
            placeholder={t('safetyMap.titlePlaceholder')}
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">{t('annotations.note')}</Label>
          <Textarea
            id="note"
            placeholder={noteType === 'language'
              ? t('annotations.notePlaceholderLanguage')
              : t('annotations.notePlaceholderGeneral')
            }
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="min-h-[100px] resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="link" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            {t('annotations.linkOptional')}
          </Label>
          <Input
            id="link"
            type="url"
            placeholder="https://..."
            value={noteLink}
            onChange={(e) => setNoteLink(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <Label htmlFor="share" className="text-sm font-medium">
                {t('annotations.shareWithCommunity')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('annotations.othersMayView')}
              </p>
            </div>
          </div>
          <Switch
            id="share"
            checked={shareWithCommunity}
            onCheckedChange={setShareWithCommunity}
          />
        </div>

        <Button
          onClick={handleSaveAnnotation}
          className="w-full"
          disabled={isSaving || !selectedLocation}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('common.saving')}
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              {t('annotations.saveAnnotation')}
            </>
          )}
        </Button>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Cloud className="h-5 w-5 text-primary" />
          {t('annotations.cloudStorage')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('annotations.cloudStorageDesc')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => openCloudService('icloud')} className="text-xs px-2">
            <ExternalLink className="mr-1 h-3 w-3 shrink-0" />
            <span className="truncate">iCloud</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => openCloudService('dropbox')} className="text-xs px-2">
            <ExternalLink className="mr-1 h-3 w-3 shrink-0" />
            <span className="truncate">Dropbox</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => openCloudService('onedrive')} className="text-xs px-2">
            <ExternalLink className="mr-1 h-3 w-3 shrink-0" />
            <span className="truncate">OneDrive</span>
          </Button>
        </div>
      </Card>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general" className="gap-2">
            <FileText className="h-4 w-4" />
            {t('annotations.general')} ({generalAnnotations.length})
          </TabsTrigger>
          <TabsTrigger value="language" className="gap-2">
            <Languages className="h-4 w-4" />
            {t('annotations.language')} ({languageAnnotations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-3 mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : generalAnnotations.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{t('annotations.noGeneralNotes')}</p>
              <p className="text-sm text-muted-foreground">{t('annotations.noGeneralNotesDesc')}</p>
            </Card>
          ) : (
            generalAnnotations.map((annotation) => (
              <Card key={annotation.id} className="p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{annotation.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{annotation.content}</p>
                    {annotation.link && (
                      <a
                        href={annotation.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
                      >
                        <Link className="h-3 w-3" />
                        {annotation.link}
                      </a>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      📍 {annotation.latitude.toFixed(4)}, {annotation.longitude.toFixed(4)} • {new Date(annotation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleShareAnnotation(annotation)}
                      title="Compartilhar com a comunidade"
                    >
                      <Users className="h-4 w-4 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAnnotation(annotation.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="language" className="space-y-3 mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : languageAnnotations.length === 0 ? (
            <Card className="p-8 text-center">
              <Languages className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{t('annotations.noLanguageNotes')}</p>
              <p className="text-sm text-muted-foreground">{t('annotations.noLanguageNotesDesc')}</p>
            </Card>
          ) : (
            languageAnnotations.map((annotation) => (
              <Card key={annotation.id} className="p-4 border-l-4 border-l-primary">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">{annotation.title}</h4>
                      <Badge variant="secondary" className="text-xs">{t('annotations.language')}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{annotation.content}</p>
                    {annotation.link && (
                      <a
                        href={annotation.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
                      >
                        <Link className="h-3 w-3" />
                        {annotation.link}
                      </a>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      📍 {annotation.latitude.toFixed(4)}, {annotation.longitude.toFixed(4)} • {new Date(annotation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleShareAnnotation(annotation)}
                      title="Compartilhar com a comunidade"
                    >
                      <Users className="h-4 w-4 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAnnotation(annotation.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Annotations;