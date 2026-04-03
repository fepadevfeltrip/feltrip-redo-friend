import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MapPin {
  id: string;
  latitude: number;
  longitude: number;
  type: 'safe' | 'alert' | 'danger';
  title: string;
  content?: string;
}

interface MapboxMapProps {
  pins?: MapPin[];
  center?: [number, number];
  zoom?: number;
  onMapClick?: (lngLat: { lng: number; lat: number }) => void;
  showUserLocation?: boolean;
  showSearch?: boolean;
  className?: string;
}

const MapboxMap: React.FC<MapboxMapProps> = ({
  pins = [],
  center = [-9.1393, 38.7223], // Lisbon default
  zoom = 12,
  onMapClick,
  showUserLocation = true,
  showSearch = true,
  className = "h-[300px]"
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const initMap = async () => {
      if (!mapContainer.current || map.current) return;

      try {
        // Get Mapbox token from edge function
        const { data, error: fnError } = await supabase.functions.invoke('get-mapbox-token');
        
        if (fnError || !data?.token) {
          console.error('Mapbox token error:', fnError);
          throw new Error('Could not load map');
        }

        mapboxgl.accessToken = data.token;

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: center,
          zoom: zoom,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        if (onMapClick) {
          map.current.on('click', (e) => {
            onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat });
          });
        }

        map.current.on('load', () => {
          setIsLoading(false);
          
          // Get user location after map is loaded
          if (showUserLocation && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const loc: [number, number] = [position.coords.longitude, position.coords.latitude];
                setUserLocation(loc);
              },
              (err) => {
                console.log('Location not available:', err.message);
              }
            );
          }
        });

        map.current.on('error', (e) => {
          console.error('Mapbox error:', e);
        });

      } catch (err) {
        console.error('Map init error:', err);
        setError(err instanceof Error ? err.message : 'Error loading map');
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      searchMarkerRef.current?.remove();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update center when user location is available
  useEffect(() => {
    if (map.current && userLocation) {
      map.current.flyTo({ center: userLocation, zoom: 14 });

      // Add user location marker
      const userMarker = document.createElement('div');
      userMarker.className = 'w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg animate-pulse';
      
      new mapboxgl.Marker(userMarker)
        .setLngLat(userLocation)
        .addTo(map.current);
    }
  }, [userLocation]);

  // Update markers when pins change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    pins.forEach((pin) => {
      if (pin.latitude === 0 && pin.longitude === 0) return;

      const el = document.createElement('div');
      el.className = 'w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer';
      
      switch (pin.type) {
        case 'safe':
          el.style.backgroundColor = 'hsl(var(--chart-2))';
          el.innerHTML = '❤️';
          break;
        case 'alert':
          el.style.backgroundColor = 'hsl(var(--secondary))';
          el.innerHTML = '⚠️';
          break;
        case 'danger':
          el.style.backgroundColor = 'hsl(var(--destructive))';
          el.innerHTML = '🛡️';
          break;
      }

      // Sanitize user input to prevent XSS attacks
      const sanitizedTitle = DOMPurify.sanitize(pin.title, { ALLOWED_TAGS: [] });
      const sanitizedContent = pin.content ? DOMPurify.sanitize(pin.content, { ALLOWED_TAGS: [] }) : '';
      
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div class="p-2">
          <h3 class="font-bold text-sm">${sanitizedTitle}</h3>
          ${sanitizedContent ? `<p class="text-xs text-gray-600">${sanitizedContent}</p>` : ''}
        </div>`
      );

      const marker = new mapboxgl.Marker(el)
        .setLngLat([pin.longitude, pin.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [pins]);

  const handleSearch = async () => {
    if (!searchAddress.trim() || !map.current) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { address: searchAddress }
      });

      if (error) throw error;

      if (data?.found) {
        // Remove previous search marker
        searchMarkerRef.current?.remove();

        // Fly to the location
        map.current.flyTo({
          center: [data.longitude, data.latitude],
          zoom: 15
        });

        // Add a marker at the searched location
        const el = document.createElement('div');
        el.className = 'w-8 h-8 rounded-full bg-primary border-2 border-white shadow-lg flex items-center justify-center';
        el.innerHTML = '📍';

        searchMarkerRef.current = new mapboxgl.Marker(el)
          .setLngLat([data.longitude, data.latitude])
          .addTo(map.current);

        // Trigger the onMapClick callback if provided
        if (onMapClick) {
          onMapClick({ lng: data.longitude, lat: data.latitude });
        }
      } else {
        setError('Address not found. Try a more specific address.');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError('Search failed. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (error && !map.current) {
    return (
      <div className={`${className} bg-muted rounded-lg flex items-center justify-center`}>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className} rounded-lg overflow-hidden`}>
      {showSearch && (
        <div className="absolute top-3 left-3 right-12 z-10 flex gap-2">
          <Input
            placeholder="Search address..."
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            onKeyPress={handleKeyPress}
            className="bg-background/95 backdrop-blur-sm shadow-md"
          />
          <Button 
            size="icon" 
            onClick={handleSearch} 
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
      {isLoading && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      {error && map.current && (
        <div className="absolute bottom-3 left-3 right-3 z-10 bg-destructive/90 text-destructive-foreground text-sm p-2 rounded-md">
          {error}
        </div>
      )}
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default MapboxMap;
