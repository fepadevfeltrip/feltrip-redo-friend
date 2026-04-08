import { useState, useRef, useEffect } from "react";
import { User, MapPin, Mail, Edit2, Save, X, Loader2, Camera, Calendar, Building2, Gem, Map, Trash2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

interface GemItem {
  id: string;
  name: string;
  cidade: string | null;
  categoria_principal: string | null;
  created_at: string;
}

interface MapItem {
  id: string;
  city: string;
  map_status: string;
  created_at: string;
}

interface SessionItem {
  id: string;
  city: string | null;
  emotional_status: string | null;
  poetic_proposition: string | null;
  language: string | null;
  created_at: string;
}

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, isLoading, updateProfile, uploadAvatar } = useProfile();

  const lang = i18n.language?.substring(0, 2) || "pt";

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editOriginCity, setEditOriginCity] = useState("");
  const [editPronoun, setEditPronoun] = useState("");
  const [editInstitution, setEditInstitution] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [gems, setGems] = useState<GemItem[]>([]);
  const [maps, setMaps] = useState<MapItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchExtras = async () => {
      const [gemsRes, mapsRes, sessionsRes] = await Promise.all([
        supabase.from('mrp_gems').select('id, name, cidade, categoria_principal, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('city_questionnaires').select('id, city, map_status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('mrp_sessions').select('id, city, emotional_status, poetic_proposition, language, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      ]);
      setGems((gemsRes.data as GemItem[]) || []);
      setMaps((mapsRes.data as MapItem[]) || []);
      setSessions((sessionsRes.data as SessionItem[]) || []);
      setLoadingExtras(false);
    };
    fetchExtras();
  }, [user]);

  const handleStartEdit = () => {
    setEditName(profile?.full_name || "");
    setEditCity(profile?.city || "");
    setEditOriginCity(profile?.origin_city || "");
    setEditPronoun(profile?.pronoun || "");
    setEditInstitution(profile?.institution || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast({ title: t('common.error'), description: t('profile.nameRequired'), variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const { error } = await updateProfile({
      full_name: editName.trim(),
      city: editCity.trim() || null,
      origin_city: editOriginCity.trim() || null,
      pronoun: editPronoun.trim() || null,
      institution: editInstitution.trim() || null,
    });
    if (error) {
      toast({ title: t('common.error'), description: t('profile.failedToUpdate'), variant: "destructive" });
    } else {
      toast({ title: t('common.success'), description: t('profile.updatedSuccess') });
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: t('profile.invalidFile'), description: t('profile.selectImage'), variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: t('profile.fileTooLarge'), description: t('profile.maxFileSize'), variant: "destructive" });
      return;
    }
    setIsUploadingAvatar(true);
    const { error } = await uploadAvatar(file);
    if (error) {
      toast({ title: t('profile.uploadFailed'), description: t('profile.failedUploadPhoto'), variant: "destructive" });
    } else {
      toast({ title: t('common.success'), description: t('profile.photoUpdated') });
    }
    setIsUploadingAvatar(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteSession = async (id: string) => {
    const confirmText = lang === "en" ? "Delete this archetype permanently?" : lang === "es" ? "¿Eliminar este arquetipo permanentemente?" : "Deletar este arquétipo permanentemente?";
    if (!window.confirm(confirmText)) return;

    const { error } = await supabase.from('mrp_sessions').delete().eq('id', id);
    if (error) {
      toast({ title: t('common.error'), variant: "destructive" });
    } else {
      setSessions(prev => prev.filter(s => s.id !== id));
      toast({ title: t('common.success') });
    }
  };

  const handleDeleteGem = async (id: string) => {
    const confirmText = lang === "en" ? "Delete this gem?" : lang === "es" ? "¿Eliminar esta gema?" : "Deletar esta gema?";
    if (!window.confirm(confirmText)) return;

    const { error } = await supabase.from('mrp_gems').delete().eq('id', id);
    if (error) {
      toast({ title: t('common.error'), variant: "destructive" });
    } else {
      setGems(prev => prev.filter(g => g.id !== id));
      toast({ title: t('common.success') });
    }
  };

  const handleDeleteMap = async (id: string) => {
    const confirmText = lang === "en" ? "Delete this map?" : lang === "es" ? "¿Eliminar este mapa?" : "Deletar este mapa?";
    if (!window.confirm(confirmText)) return;

    const { error } = await supabase.from('city_questionnaires').delete().eq('id', id);
    if (error) {
      toast({ title: t('common.error'), variant: "destructive" });
    } else {
      setMaps(prev => prev.filter(m => m.id !== id));
      toast({ title: t('common.success') });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc('purge_user_data', { p_user_id: user.id });
      if (error) throw error;
      await supabase.auth.signOut();
      toast({ title: t('profile.accountDeleted'), description: t('profile.accountDeletedDesc') });
      window.location.href = "/";
    } catch (err) {
      console.error("Delete account error:", err);
      toast({ title: t('common.error'), description: t('profile.deleteError'), variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const formatDate = (dateString: string) => {
    const locale = lang === "es" ? "es-ES" : lang === "en" ? "en-US" : "pt-BR";
    return new Date(dateString).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatJoinDate = (dateString: string) => {
    const locale = lang === "es" ? "es-ES" : lang === "en" ? "en-US" : "pt-BR";
    return new Date(dateString).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  };

  const getMapStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return `✅ ${t('profile.mapCompleted')}`;
      case 'generating': return `⏳ ${t('profile.mapGenerating')}`;
      case 'failed': return `❌ ${t('profile.mapFailed')}`;
      default: return `⏳ ${t('profile.mapPending')}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const rawName = profile?.full_name;
  const displayName = (!rawName || rawName === "Anonymous" || rawName === "Anônimo") ? "Curious Visitor" : rawName;
  const displayCity = profile?.city || "";
  const displayOriginCity = profile?.origin_city || "";
  const displayPronoun = profile?.pronoun || "";
  const displayInstitution = profile?.institution || "";
  const joinedDate = profile?.created_at ? formatJoinDate(profile.created_at) : "";

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <button onClick={handleAvatarClick} disabled={isUploadingAvatar} className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {isUploadingAvatar ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>

            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder={t('profile.fullNamePlaceholder')} className="font-semibold" />
                  <Input value={editPronoun} onChange={(e) => setEditPronoun(e.target.value)} placeholder={t('profile.pronounPlaceholder')} />
                  <Input value={editOriginCity} onChange={(e) => setEditOriginCity(e.target.value)} placeholder={t('profile.originCityPlaceholder')} />
                  <Input value={editCity} onChange={(e) => setEditCity(e.target.value)} placeholder={t('profile.currentCityPlaceholder')} />
                  <Input value={editInstitution} onChange={(e) => setEditInstitution(e.target.value)} placeholder={t('profile.institutionPlaceholder')} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      <span className="ml-1">{t('common.save')}</span>
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      <X className="h-4 w-4" /><span className="ml-1">{t('common.cancel')}</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                    <Button size="icon" variant="ghost" onClick={handleStartEdit}><Edit2 className="h-4 w-4" /></Button>
                  </div>
                  {displayPronoun && <p className="text-sm text-muted-foreground">{displayPronoun}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {displayCity && <Badge variant="secondary" className="gap-1"><MapPin className="h-3 w-3" />{displayCity}</Badge>}
                    {displayOriginCity && <Badge variant="outline" className="gap-1"><MapPin className="h-3 w-3" />{t('profile.from')} {displayOriginCity}</Badge>}
                    {displayInstitution && <Badge variant="secondary" className="gap-1"><Building2 className="h-3 w-3" />{displayInstitution}</Badge>}
                    {joinedDate && <Badge variant="outline" className="gap-1"><Calendar className="h-3 w-3" />{t('profile.since')} {joinedDate}</Badge>}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 pb-24 space-y-4">
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            {t('profile.contactInfo')}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{user?.email || t('profile.emailNotSet')}</span>
            </div>
            {displayCity && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /><span>{displayCity}</span></div>}
            {displayOriginCity && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /><span>{t('profile.origin')}: {displayOriginCity}</span></div>}
          </div>
        </Card>

        {/* My Archetypes / Sessions */}
        {sessions.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 px-1">
              <Gem className="h-4 w-4 text-primary" />
              {lang === "en" ? "My Archetypes" : lang === "es" ? "Mis Arquetipos" : "Meus Arquétipos"} ({sessions.length})
            </h3>
            {sessions.map(session => (
              <div
                key={session.id}
                className="w-full rounded-3xl overflow-hidden shadow-xl relative"
                style={{ background: "linear-gradient(160deg, #0D1F1A 0%, #1A1A2E 60%, #0D1F1A 100%)" }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-10 text-[#C4B8A0]/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => handleDeleteSession(session.id)}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>

                <div className="relative px-6 py-10 flex flex-col items-center text-center">
                  <div
                    className="absolute inset-0 opacity-[0.04] pointer-events-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    }}
                  />
                  <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#E8896A] mb-1">✦ CULTI AI</p>
                  {session.city && (
                    <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#C4B8A0] mb-6">
                      {session.city.toUpperCase()}
                    </p>
                  )}
                  <h2
                    className="font-serif font-bold text-[#F5EFE0] leading-[1.05] tracking-tight mb-3"
                    style={{ fontSize: "clamp(1.75rem, 7vw, 3rem)" }}
                  >
                    {session.emotional_status || "—"}
                  </h2>
                  {session.poetic_proposition && (
                    <p className="font-serif italic text-[#C4B8A0] text-sm max-w-xs leading-relaxed">
                      "{session.poetic_proposition}"
                    </p>
                  )}
                  <p className="mt-4 text-[10px] tracking-[0.15em] uppercase text-[#C4B8A0]/50">
                    {formatDate(session.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* My Gems */}
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Gem className="h-4 w-4 text-primary" />
            {t('profile.myGems')} ({gems.length})
          </h3>
          {loadingExtras ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : gems.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">{t('profile.noGemsYet')}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
              {gems.map(gem => (
                <div key={gem.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 group">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm shrink-0">💎</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{gem.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {gem.cidade || ''}{gem.categoria_principal ? ` · ${gem.categoria_principal}` : ''}{' · '}{formatDate(gem.created_at)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    onClick={() => handleDeleteGem(gem.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* My Maps */}
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Map className="h-4 w-4 text-primary" />
            {t('profile.myMaps')} ({maps.length})
          </h3>
          {loadingExtras ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : maps.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">{t('profile.noMapsYet')}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {maps.map(map => (
                <div key={map.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 group">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm shrink-0">🗺️</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{map.city}</p>
                    <p className="text-xs text-muted-foreground">
                      {getMapStatusLabel(map.map_status)}
                      {' · '}{formatDate(map.created_at)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    onClick={() => handleDeleteMap(map.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* DELETE ACCOUNT */}
        <Card className="p-4 space-y-3 border-destructive/30">
          <h3 className="font-semibold text-destructive flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            {t('profile.dangerZone')}
          </h3>
          {!showDeleteConfirm ? (
            <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t('profile.deleteAccount')}
            </Button>
          ) : (
            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive text-sm">{t('profile.deleteConfirmTitle')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('profile.deleteConfirmDesc')}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={handleDeleteAccount} disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
                  {t('profile.deleteConfirmButton')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}