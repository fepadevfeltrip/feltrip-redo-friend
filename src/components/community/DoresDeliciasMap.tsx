import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Search, Plus, X, MapPin, Heart, MessageCircle, Send, Trash2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';

const MAGENTA = '#ff007f';
const TEAL = '#016970';

interface CommunityPin {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  type: string; // 'dor' or 'delicia'
  latitude: number;
  longitude: number;
  image_url: string | null;
  created_at: string;
  author?: { full_name: string; avatar_url: string | null };
  likes_count: number;
  user_liked: boolean;
}

const dateLocales: Record<string, any> = { pt: ptBR, en: enUS, es };

export function DoresDeliciasMap() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const isAddingRef = useRef(false);

  const [pins, setPins] = useState<CommunityPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [selectedPin, setSelectedPin] = useState<CommunityPin | null>(null);

  // Create pin dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPinCoords, setNewPinCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [newPinType, setNewPinType] = useState<'dor' | 'delicia'>('delicia');
  const [newPinTitle, setNewPinTitle] = useState('');
  const [newPinContent, setNewPinContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentLocale = dateLocales[i18n.language?.substring(0, 2)] || ptBR;

  useEffect(() => { isAddingRef.current = isAddingMode; }, [isAddingMode]);

  const fetchPins = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('map_pins')
      .select('*')
      .eq('is_shared_to_community', true)
      .in('type', ['dor', 'delicia', 'food', 'culture', 'nature', 'shopping', 'nightlife', 'transport', 'health', 'other'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Fetch author info
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Fetch likes
      const pinIds = data.map(p => p.id);
      const { data: likes } = await supabase
        .from('map_pin_likes')
        .select('map_pin_id, user_id')
        .in('map_pin_id', pinIds);

      const likesMap = new Map<string, { count: number; userLiked: boolean }>();
      likes?.forEach(l => {
        const existing = likesMap.get(l.map_pin_id) || { count: 0, userLiked: false };
        existing.count++;
        if (l.user_id === user?.id) existing.userLiked = true;
        likesMap.set(l.map_pin_id, existing);
      });

      const mappedPins: CommunityPin[] = data.map(pin => ({
        id: pin.id,
        user_id: pin.user_id,
        title: pin.title,
        content: pin.content,
        type: pin.type === 'dor' || pin.type === 'delicia' ? pin.type : 'delicia',
        latitude: pin.latitude,
        longitude: pin.longitude,
        image_url: pin.image_url,
        created_at: pin.created_at,
        author: profileMap.get(pin.user_id) ? {
          full_name: profileMap.get(pin.user_id)!.full_name,
          avatar_url: profileMap.get(pin.user_id)!.avatar_url
        } : undefined,
        likes_count: likesMap.get(pin.id)?.count || 0,
        user_liked: likesMap.get(pin.id)?.userLiked || false
      }));

      setPins(mappedPins);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchPins(); }, [user]);

  // Init map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initMap = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error || !data?.token) { setMapError('Erro ao carregar mapa'); return; }

        mapboxgl.accessToken = data.token;
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [-46.6333, -23.5505],
          zoom: 3
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.current.on('load', () => setMapLoaded(true));

        map.current.on('click', (e) => {
          if (isAddingRef.current) {
            setNewPinCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
            setShowCreateDialog(true);
            setIsAddingMode(false);
          }
        });
      } catch { setMapError('Erro ao inicializar mapa'); }
    };

    initMap();
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  // Render markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    pins.forEach(pin => {
      const isDor = pin.type === 'dor';
      const color = isDor ? MAGENTA : TEAL;
      const icon = isDor ? '🚩' : '💎';

      const el = document.createElement('div');
      el.className = 'cursor-pointer transform hover:scale-125 transition-transform';
      el.style.fontSize = '24px';
      el.style.filter = `drop-shadow(0 2px 4px ${color}44)`;
      el.textContent = icon;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([pin.longitude, pin.latitude])
        .addTo(map.current!);

      el.addEventListener('click', () => {
        if (user) {
          setSelectedPin(pin);
          map.current?.flyTo({ center: [pin.longitude, pin.latitude], zoom: 14 });
        }
      });

      markersRef.current.push(marker);
    });

    if (pins.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      pins.forEach(p => bounds.extend([p.longitude, p.latitude]));
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 12 });
    }
  }, [pins, mapLoaded, user]);

  const handleSearch = async () => {
    if (!searchAddress.trim() || !map.current) return;
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', { body: { address: searchAddress } });
      if (!error && data?.found) {
        map.current.flyTo({ center: [data.longitude, data.latitude], zoom: 15 });
      }
    } catch {} finally { setIsSearching(false); }
  };

  const handleCreatePin = async () => {
    if (!user || !newPinCoords || !newPinTitle.trim()) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('map_pins').insert({
        user_id: user.id,
        title: newPinTitle.trim(),
        content: newPinContent.trim() || null,
        type: newPinType,
        latitude: newPinCoords.lat,
        longitude: newPinCoords.lng,
        is_shared_to_community: true
      });

      if (error) throw error;

      toast({ title: newPinType === 'dor' ? '🚩 Dor registrada!' : '💎 Delícia adicionada!' });
      setShowCreateDialog(false);
      setNewPinTitle('');
      setNewPinContent('');
      setNewPinCoords(null);
      fetchPins();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally { setIsSubmitting(false); }
  };

  const handleToggleLike = async (pinId: string) => {
    if (!user) return;
    const pin = pins.find(p => p.id === pinId);
    if (!pin) return;

    if (pin.user_liked) {
      await supabase.from('map_pin_likes').delete().eq('map_pin_id', pinId).eq('user_id', user.id);
    } else {
      await supabase.from('map_pin_likes').insert({ map_pin_id: pinId, user_id: user.id });
    }
    fetchPins();
    if (selectedPin?.id === pinId) {
      setSelectedPin(prev => prev ? { ...prev, user_liked: !prev.user_liked, likes_count: prev.user_liked ? prev.likes_count - 1 : prev.likes_count + 1 } : null);
    }
  };

  const handleDeletePin = async (pinId: string) => {
    await supabase.from('map_pins').delete().eq('id', pinId);
    setSelectedPin(null);
    fetchPins();
  };

  if (mapError) {
    return <div className="p-8 text-center text-muted-foreground">{mapError}</div>;
  }

  const dorCount = pins.filter(p => p.type === 'dor').length;
  const deliciaCount = pins.filter(p => p.type === 'delicia').length;

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: MAGENTA }} />
          <span className="font-medium">{dorCount} Dores</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: TEAL }} />
          <span className="font-medium">{deliciaCount} Delícias</span>
        </span>
      </div>

      {/* Map */}
      <div className="relative h-[280px] sm:h-[380px] rounded-2xl overflow-hidden border border-border/60 shadow-sm">
        <div ref={mapContainer} className="absolute inset-0" />

        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Search */}
        {mapLoaded && (
          <div className="absolute top-3 left-3 right-12 z-10 flex gap-2">
            <Input
              placeholder="Buscar endereço..."
              value={searchAddress}
              onChange={e => setSearchAddress(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
              className="bg-background/95 backdrop-blur-sm shadow-md rounded-xl text-sm"
            />
            <Button size="icon" onClick={handleSearch} disabled={isSearching} className="shrink-0 shadow-md">
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        )}

        {/* Add button */}
        {mapLoaded && user && (
          <div className="absolute top-14 left-3 z-10">
            <Button
              size="sm"
              variant={isAddingMode ? 'default' : 'outline'}
              className="shadow text-xs rounded-xl"
              onClick={() => setIsAddingMode(!isAddingMode)}
            >
              <Plus className="h-3 w-3 mr-1" />
              {isAddingMode ? 'Clique no mapa...' : 'Adicionar'}
            </Button>
          </div>
        )}

        {/* Non-logged blur overlay */}
        {!user && mapLoaded && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] flex items-center justify-center z-10">
            <div className="text-center px-6">
              <p className="text-sm font-medium text-foreground">🔒 Faça login para interagir com o mapa</p>
            </div>
          </div>
        )}

        {isAddingMode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow-lg z-10 text-sm font-medium text-white" style={{ backgroundColor: TEAL }}>
            Toque no mapa para marcar
          </div>
        )}

        {/* Selected pin panel */}
        {selectedPin && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40 sm:absolute sm:inset-0 sm:bg-black/20 sm:z-10" onClick={() => setSelectedPin(null)} />
            <div className="fixed bottom-0 left-0 right-0 sm:absolute sm:bottom-auto sm:top-4 sm:right-4 sm:left-auto w-full sm:w-80 max-h-[60vh] sm:max-h-[350px] bg-background rounded-t-2xl sm:rounded-2xl shadow-xl z-50 sm:z-20 flex flex-col">
              <div className="flex-shrink-0">
                <div className="sm:hidden flex justify-center pt-3 pb-2">
                  <div className="w-12 h-1.5 rounded-full bg-muted-foreground/40" />
                </div>
                <div className="px-4 py-3 flex items-center justify-between border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{selectedPin.type === 'dor' ? '🚩' : '💎'}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-bold text-white"
                      style={{ backgroundColor: selectedPin.type === 'dor' ? MAGENTA : TEAL }}
                    >
                      {selectedPin.type === 'dor' ? 'Dor' : 'Delícia'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedPin.user_id === user?.id && (
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePin(selectedPin.id)} className="text-destructive h-9 w-9 p-0 rounded-full">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => setSelectedPin(null)} className="h-9 w-9 p-0 rounded-full">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-auto px-4 py-3">
                {selectedPin.author && (
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedPin.author.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{selectedPin.author.full_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{selectedPin.author.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(selectedPin.created_at), { addSuffix: true, locale: currentLocale })}
                      </p>
                    </div>
                  </div>
                )}
                <h4 className="font-semibold mb-1">{selectedPin.title}</h4>
                {selectedPin.content && <p className="text-sm text-muted-foreground mb-2">{selectedPin.content}</p>}
                {selectedPin.image_url && (
                  <img src={selectedPin.image_url} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />
                )}
                <div className="flex items-center gap-3 pt-2 border-t border-border/40">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleLike(selectedPin.id)}
                    className={selectedPin.user_liked ? 'text-red-500' : 'text-muted-foreground'}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${selectedPin.user_liked ? 'fill-red-500' : ''}`} />
                    {selectedPin.likes_count}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Pin Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              O que você viveu agora?
            </DialogTitle>
            <DialogDescription>Marque no mapa: uma Dor ou uma Delícia?</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setNewPinType('dor')}
                className={`p-4 rounded-xl border-2 transition-all text-center ${newPinType === 'dor' ? 'border-current shadow-lg' : 'border-border hover:border-muted-foreground/40'}`}
                style={newPinType === 'dor' ? { borderColor: MAGENTA, backgroundColor: MAGENTA + '10' } : {}}
              >
                <span className="text-2xl block mb-1">🚩</span>
                <span className="text-sm font-bold" style={{ color: MAGENTA }}>Dor</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">Cilada, furada, problema</p>
              </button>
              <button
                type="button"
                onClick={() => setNewPinType('delicia')}
                className={`p-4 rounded-xl border-2 transition-all text-center ${newPinType === 'delicia' ? 'border-current shadow-lg' : 'border-border hover:border-muted-foreground/40'}`}
                style={newPinType === 'delicia' ? { borderColor: TEAL, backgroundColor: TEAL + '10' } : {}}
              >
                <span className="text-2xl block mb-1">💎</span>
                <span className="text-sm font-bold" style={{ color: TEAL }}>Delícia</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">Segredo, gema, beleza</p>
              </button>
            </div>

            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                placeholder={newPinType === 'dor' ? 'Ex: Golpe do taxi no aeroporto' : 'Ex: Café secreto incrível'}
                value={newPinTitle}
                onChange={e => setNewPinTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                placeholder="Conte mais sobre o que aconteceu..."
                value={newPinContent}
                onChange={e => setNewPinContent(e.target.value)}
                rows={3}
              />
            </div>

            {newPinCoords && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                📍 {newPinCoords.lat.toFixed(4)}, {newPinCoords.lng.toFixed(4)}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
              <Button
                className="flex-1 text-white"
                style={{ backgroundColor: newPinType === 'dor' ? MAGENTA : TEAL }}
                onClick={handleCreatePin}
                disabled={isSubmitting || !newPinTitle.trim()}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {newPinType === 'dor' ? '🚩 Marcar Dor' : '💎 Marcar Delícia'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
