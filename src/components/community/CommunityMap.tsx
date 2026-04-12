import { useState, useEffect, useRef, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, MessageCircle, Send, Trash2, Loader2, X, MapPin, Search, Shield, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCommunityTips, SharedTip, TipComment } from '@/hooks/useCommunityTips';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow, Locale } from 'date-fns';
import { ptBR, enUS, es, fr, zhCN } from 'date-fns/locale';
import { CreateCommunityPin } from './CreateCommunityPin';
import { useTranslation } from 'react-i18next';

const COPY = {
  pt: {
    search: "Buscar endereço...",
    add: "Adicionar",
    pains: "Dores",
    delights: "Delícias"
  },
  en: {
    search: "Search address...",
    add: "Add",
    pains: "Pains",
    delights: "Delights"
  },
  es: {
    search: "Buscar dirección...",
    add: "Añadir",
    pains: "Dolores",
    delicias: "Delicias"
  }
};

// Helper function to get city name from coordinates using reverse geocoding approximation
const getCityFromCoords = (lat: number, lng: number): string => {
  // Approximate city detection based on coordinates ranges
  if (lat >= -24 && lat <= -23 && lng >= -47 && lng <= -46) return 'São Paulo';
  if (lat >= -23 && lat <= -22 && lng >= -44 && lng <= -42) return 'Rio de Janeiro';
  if (lat >= -26 && lat <= -25 && lng >= -50 && lng <= -49) return 'Curitiba';
  if (lat >= -20 && lat <= -19 && lng >= -44 && lng <= -43) return 'Belo Horizonte';
  if (lat >= -31 && lat <= -29 && lng >= -52 && lng <= -50) return 'Porto Alegre';
  if (lat >= 38 && lat <= 39 && lng >= -10 && lng <= -8) return 'Lisboa';
  if (lat >= 40 && lat <= 42 && lng >= -9 && lng <= -8) return 'Porto';
  if (lat >= 40 && lat <= 41 && lng >= -4 && lng <= -3) return 'Madrid';
  if (lat >= 41 && lat <= 42 && lng >= 1 && lng <= 3) return 'Barcelona';
  if (lat >= 48 && lat <= 49 && lng >= 2 && lng <= 3) return 'Paris';
  if (lat >= 51 && lat <= 52 && lng >= -1 && lng <= 1) return 'Londres';
  if (lat >= 52 && lat <= 53 && lng >= 13 && lng <= 14) return 'Berlim';
  if (lat >= 40 && lat <= 42 && lng >= -75 && lng <= -73) return 'Nova York';
  if (lat >= 33 && lat <= 35 && lng >= -119 && lng <= -117) return 'Los Angeles';
  if (lat >= 25 && lat <= 26 && lng >= -81 && lng <= -79) return 'Miami';
  return 'Outra cidade';
};

const typeIcons: Record<string, string> = {
  food: '🍴',
  culture: '🎭',
  nature: '🌳',
  shopping: '🛍️',
  nightlife: '🌙',
  transport: '🚌',
  health: '🏥',
  other: '📍'
};

const dateLocales: Record<string, Locale> = {
  pt: ptBR,
  en: enUS,
  es: es,
  fr: fr,
  zh: zhCN
};

interface CommunityMapProps {
  isManager?: boolean;
}

export function CommunityMap({ isManager = false }: CommunityMapProps) {
  const { t, i18n } = useTranslation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const { user } = useAuth();
  const { sharedTips, isLoading, toggleLike, addComment, deleteComment, fetchComments, unshareFromCommunity, refresh } = useCommunityTips();

  const currentLocale = dateLocales[i18n.language] || enUS;
  const getTypeLabel = (type: string) => t(`community.tipTypes.${type}`) || type;

  const [selectedTip, setSelectedTip] = useState<SharedTip | null>(null);
  const [comments, setComments] = useState<TipComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showCreatePin, setShowCreatePin] = useState(false);
  const [newPinCoords, setNewPinCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const isAddingModeRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    isAddingModeRef.current = isAddingMode;
  }, [isAddingMode]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initMap = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error || !data?.token) {
          setMapError(t('community.errorLoadingMap'));
          return;
        }

        mapboxgl.accessToken = data.token;

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [-46.6333, -23.5505],
          zoom: 3
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.current.on('load', () => {
          setMapLoaded(true);
        });

        // Handle click to add pin
        map.current.on('click', (e) => {
          if (isAddingModeRef.current) {
            setNewPinCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
            setShowCreatePin(true);
            setIsAddingMode(false);
          }
        });
      } catch (err) {
        setMapError(t('community.errorInitMap'));
      }
    };

    initMap();

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add markers for tips
  useEffect(() => {
    if (!map.current || !mapLoaded || isLoading) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    sharedTips.forEach((tip) => {
      const el = document.createElement('div');
      el.className = 'cursor-pointer text-2xl transform hover:scale-125 transition-transform';
      el.textContent = typeIcons[tip.type] || '📍';
      el.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([tip.longitude, tip.latitude])
        .addTo(map.current!);

      el.addEventListener('click', () => {
        setSelectedTip(tip);
        loadComments(tip.id);
        map.current?.flyTo({
          center: [tip.longitude, tip.latitude],
          zoom: 14
        });
      });

      markersRef.current.push(marker);
    });

    if (sharedTips.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      sharedTips.forEach(tip => {
        bounds.extend([tip.longitude, tip.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 12 });
    }
  }, [sharedTips, mapLoaded, isLoading]);

  const loadComments = async (tipId: string) => {
    setLoadingComments(true);
    const tipComments = await fetchComments(tipId);
    setComments(tipComments);
    setLoadingComments(false);
  };

  const handleAddComment = async () => {
    if (!selectedTip || !newComment.trim()) return;

    const success = await addComment(selectedTip.id, newComment);
    if (success) {
      setNewComment('');
      await loadComments(selectedTip.id);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedTip) return;
    await deleteComment(commentId);
    await loadComments(selectedTip.id);
  };

  const handleLike = async () => {
    if (!selectedTip) return;
    await toggleLike(selectedTip.id);
    const updatedTip = sharedTips.find(t => t.id === selectedTip.id);
    if (updatedTip) {
      setSelectedTip({ ...updatedTip, user_liked: !selectedTip.user_liked, likes_count: selectedTip.user_liked ? selectedTip.likes_count - 1 : selectedTip.likes_count + 1 });
    }
  };

  const handleRemoveTip = async () => {
    if (!selectedTip) return;
    await unshareFromCommunity(selectedTip.id);
    setSelectedTip(null);
  };

  // Get unique cities from tips
  const citiesWithTips = useMemo(() => {
    const cityMap = new Map<string, { name: string; coords: [number, number]; count: number }>();

    sharedTips.forEach(tip => {
      const cityName = getCityFromCoords(tip.latitude, tip.longitude);
      if (!cityMap.has(cityName)) {
        cityMap.set(cityName, {
          name: cityName,
          coords: [tip.longitude, tip.latitude],
          count: 1
        });
      } else {
        const existing = cityMap.get(cityName)!;
        existing.count++;
      }
    });

    return Array.from(cityMap.values()).sort((a, b) => b.count - a.count);
  }, [sharedTips]);

  const flyToCity = (cityName: string) => {
    if (!map.current) return;
    const city = citiesWithTips.find(c => c.name === cityName);
    if (city) {
      map.current.flyTo({
        center: city.coords,
        zoom: 12,
        duration: 2000
      });
    }
  };

  const handleSearchAddress = async () => {
    if (!searchAddress.trim() || !map.current) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { address: searchAddress }
      });

      if (error || !data?.found) {
        console.log('Address not found:', searchAddress);
        return;
      }

      const lng = data.longitude;
      const lat = data.latitude;

      if (searchMarkerRef.current) {
        searchMarkerRef.current.remove();
      }

      const el = document.createElement('div');
      el.className = 'text-3xl';
      el.textContent = '📍';
      el.style.filter = 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))';

      searchMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map.current);

      map.current.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 2000
      });
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTipClick = (tip: SharedTip) => {
    setSelectedTip(tip);
    loadComments(tip.id);
    map.current?.flyTo({
      center: [tip.longitude, tip.latitude],
      zoom: 14
    });
  };

  if (mapError) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {mapError}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map */}
      <div className="relative h-[250px] sm:h-[350px] md:h-[400px] rounded-2xl overflow-hidden border border-border/60 shadow-sm">
        <div ref={mapContainer} className="absolute inset-0" />

        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Search bar on map */}
        {mapLoaded && (
          <div className="absolute top-3 left-3 right-12 z-10 flex gap-2">
            <Input
              placeholder={t('community.searchAddress')}
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchAddress()}
              className="bg-background/95 backdrop-blur-sm shadow-md rounded-xl"
            />
            <Button
              size="icon"
              onClick={handleSearchAddress}
              disabled={isSearching}
              className="shrink-0 shadow-md"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {/* City filter and tips count */}
        {mapLoaded && (
          <div className="absolute top-14 left-3 right-3 sm:right-auto flex flex-wrap items-center gap-2 pointer-events-none z-10">
            {citiesWithTips.length > 0 && (
              <div className="bg-background/95 backdrop-blur-sm rounded-xl shadow border border-border/40 pointer-events-auto">
                <Select onValueChange={flyToCity}>
                  <SelectTrigger className="w-[140px] sm:w-[180px] border-0 bg-transparent text-xs sm:text-sm">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
                      <SelectValue placeholder={t('community.city')} />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] bg-background z-50">
                    {citiesWithTips.map((city) => (
                      <SelectItem key={city.name} value={city.name}>
                        {city.name} ({city.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="hidden sm:block bg-background/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow border border-border/40 pointer-events-auto">
              <span className="text-sm font-medium">{sharedTips.length} {t('community.tips')}</span>
            </div>
            <Button
              size="sm"
              variant={isAddingMode ? "default" : "outline"}
              className="pointer-events-auto shadow text-xs sm:text-sm px-2 sm:px-3 rounded-xl"
              onClick={() => setIsAddingMode(!isAddingMode)}
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              {isAddingMode ? 'Click...' : t('community.add')}
            </Button>
          </div>
        )}

        {/* Adding mode indicator */}
        {isAddingMode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg z-10 text-sm font-medium">
            {t('community.clickToAdd')}
          </div>
        )}

        {/* Selected tip panel - fixed overlay on mobile */}
        {selectedTip && (
          <>
            {/* Full screen backdrop on mobile */}
            <div
              className="fixed inset-0 bg-black/40 z-40 sm:absolute sm:inset-0 sm:bg-black/20 sm:z-10"
              onClick={() => setSelectedTip(null)}
            />
            <div className="fixed bottom-0 left-0 right-0 sm:absolute sm:bottom-auto sm:top-4 sm:right-4 sm:left-auto w-full sm:w-80 max-h-[60vh] sm:max-h-[350px] bg-background rounded-t-2xl sm:rounded-2xl shadow-xl z-50 sm:z-20 flex flex-col">
              {/* Header - always visible */}
              <div className="flex-shrink-0">
                {/* Drag handle for mobile */}
                <div className="sm:hidden flex justify-center pt-3 pb-2">
                  <div className="w-12 h-1.5 rounded-full bg-muted-foreground/40" />
                </div>
                <div className="px-4 py-3 flex items-center justify-between border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{typeIcons[selectedTip.type] || '📍'}</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {getTypeLabel(selectedTip.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(isManager || selectedTip.user_id === user?.id) && (
                      <Button variant="ghost" size="sm" onClick={handleRemoveTip} className="text-destructive hover:text-destructive h-9 w-9 p-0 rounded-full">
                        {isManager && selectedTip.user_id !== user?.id ? (
                          <Shield className="h-4 w-4" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedTip(null)}
                      className="h-9 w-9 p-0 rounded-full"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-auto px-4 py-3">
                <div className="flex items-center gap-2 mb-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedTip.author?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(selectedTip.author?.full_name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{selectedTip.author?.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(selectedTip.created_at), { addSuffix: true, locale: currentLocale })}
                    </p>
                  </div>
                </div>

                <h4 className="font-semibold mb-1">{selectedTip.title}</h4>
                {selectedTip.content && (
                  <p className="text-sm text-muted-foreground mb-2">{selectedTip.content}</p>
                )}
                {selectedTip.image_url && (
                  <img
                    src={selectedTip.image_url}
                    alt={selectedTip.title}
                    className="w-full rounded-xl mb-3 max-h-24 object-cover"
                  />
                )}

                <div className="flex items-center gap-3 py-2 border-t border-b border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1 rounded-full ${selectedTip.user_liked ? 'text-red-500' : ''}`}
                    onClick={handleLike}
                  >
                    <Heart className={`h-4 w-4 ${selectedTip.user_liked ? 'fill-current' : ''}`} />
                    {selectedTip.likes_count}
                  </Button>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    {selectedTip.comments_count}
                  </span>
                </div>

                {/* Comments */}
                <div className="mt-3 space-y-2">
                  {loadingComments ? (
                    <div className="flex justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {comments.slice(0, 3).map((comment) => (
                        <div key={comment.id} className="flex gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={comment.author?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(comment.author?.full_name || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 bg-muted/50 rounded-xl p-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium">{comment.author?.full_name}</p>
                              {(comment.user_id === user?.id || isManager) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 rounded-full"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  title={isManager && comment.user_id !== user?.id ? 'Remover como gestor' : 'Remover'}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Fixed comment input at bottom */}
              <div className="flex-shrink-0 px-4 py-3 border-t border-border/40 bg-background">
                <div className="flex gap-2">
                  <Input
                    placeholder={t('community.writeComment')}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    className="text-sm rounded-full"
                  />
                  <Button size="sm" onClick={handleAddComment} className="rounded-full px-3">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tips List */}
      <Card>
        <CardContent className="py-3">
          <h3 className="font-semibold mb-3">{t('community.communityTips')}</h3>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : sharedTips.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('community.noTipsYet')}
            </p>
          ) : (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 pr-4">
                {sharedTips.map((tip) => (
                  <button
                    key={tip.id}
                    onClick={() => handleTipClick(tip)}
                    className={`w-full text-left p-3 rounded-xl border border-border/40 transition-all hover:bg-muted/50 ${selectedTip?.id === tip.id ? 'bg-muted border-primary/50 shadow-sm' : ''
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{typeIcons[tip.type] || '📍'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{tip.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {t('community.by')} {tip.author?.full_name}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" /> {tip.likes_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" /> {tip.comments_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Create Pin Dialog */}
      {newPinCoords && (
        <CreateCommunityPin
          open={showCreatePin}
          onOpenChange={setShowCreatePin}
          latitude={newPinCoords.lat}
          longitude={newPinCoords.lng}
          onSuccess={() => {
            refresh();
            setNewPinCoords(null);
          }}
        />
      )}
    </div>
  );
}
