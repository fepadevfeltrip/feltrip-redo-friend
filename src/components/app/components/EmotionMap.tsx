import React, { useEffect, useRef, useState } from "react";
import { Gem, Language, City } from "../types";
import { COLORS, CONTENT } from "../constants";
import { supabase } from "@/integrations/supabase/client";

// Declare MapboxGL globally since we load via CDN
declare global {
  interface Window {
    mapboxgl: any;
  }
}

interface EmotionMapProps {
  gems: Gem[];
  lang: Language;
  center?: { lat: number; lng: number };
  selectedCity?: City | null;
}

export const EmotionMap: React.FC<EmotionMapProps> = ({ gems, lang, center, selectedCity }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapToken, setMapToken] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const t = CONTENT[lang];

  // Coordenadas padrão por cidade
  const cityCenters: Record<string, { lat: number; lng: number }> = {
    "Rio de Janeiro": { lat: -22.9068, lng: -43.1729 },
    "São Paulo": { lat: -23.5505, lng: -46.6333 },
    Florianópolis: { lat: -27.5954, lng: -48.548 },
  };

  const initialCenter = center || (selectedCity && cityCenters[selectedCity]) || cityCenters["Rio de Janeiro"];

  // Fetch token from edge function
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error || !data?.token) {
          console.error('Mapbox token error:', error);
          setMapError('Could not load map token');
          return;
        }
        setMapToken(data.token);
      } catch (err) {
        console.error('Mapbox token fetch error:', err);
        setMapError('Could not load map');
      }
    };
    fetchToken();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || !mapToken) return;
    if (!window.mapboxgl) {
      console.error("Mapbox GL JS not loaded correctly.");
      setMapError("Map library not loaded");
      return;
    }

    window.mapboxgl.accessToken = mapToken;

    if (map.current) {
      if (selectedCity && gems.length === 0) {
        map.current.flyTo({
          center: [cityCenters[selectedCity].lng, cityCenters[selectedCity].lat],
          zoom: 12,
        });
      }
      return;
    }

    map.current = new window.mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [initialCenter.lng, initialCenter.lat],
      zoom: 12,
      pitch: 45,
    });

    map.current.addControl(new window.mapboxgl.NavigationControl(), "top-right");

    const resizeObserver = new ResizeObserver(() => {
      if (map.current) map.current.resize();
    });
    resizeObserver.observe(mapContainer.current);

    return () => {
      resizeObserver.disconnect();
      if (map.current) map.current.remove();
      map.current = null;
    };
  }, [mapToken, selectedCity]);

  // Update markers when gems change
  useEffect(() => {
    if (!map.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (!gems || gems.length === 0) {
      // Se não houver gemas e uma cidade estiver selecionada, centralizar nela
      if (selectedCity) {
        map.current.flyTo({
          center: [cityCenters[selectedCity].lng, cityCenters[selectedCity].lat],
          zoom: 11,
        });
      }
      return;
    }

    const bounds = new window.mapboxgl.LngLatBounds();
    let validGemsCount = 0;

    gems.forEach((gem) => {
      const lat = parseFloat(gem.lat as unknown as string);
      const lng = parseFloat(gem.lng as unknown as string);

      if (isNaN(lat) || isNaN(lng)) {
        console.warn("Invalid coordinates for gem:", gem.name, gem.lat, gem.lng);
        return;
      }

      validGemsCount++;
      bounds.extend([lng, lat]);

      const el = document.createElement("div");
      el.className = "marker";
      el.style.width = "36px";
      el.style.height = "36px";
      el.style.cursor = "pointer";

      let pinColor = COLORS.teal;
      if (gem.pin_color === "coral") pinColor = COLORS.coral;
      if (gem.pin_color === "mustard") pinColor = COLORS.mustard;

      el.innerHTML = `
        <svg viewBox="0 0 24 24" width="36" height="36" stroke="white" stroke-width="2" fill="${pinColor}" stroke-linecap="round" stroke-linejoin="round" class="drop-shadow-lg transform hover:scale-110 transition-transform">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3" fill="white"></circle>
        </svg>
      `;

      const popupHTML = `
        <div class="bg-white dark:bg-[#2d2d2d] rounded-lg p-4 shadow-xl max-w-xs border-l-4" style="border-color: ${pinColor}; font-family: 'Inter', sans-serif;">
            <h4 class="font-bold text-lg text-[#006A71] dark:text-[#F8F8F4] mb-1 leading-tight">${gem.name}</h4>
            <p class="text-[10px] font-bold uppercase tracking-wider text-[#EAA823] mb-2">${gem.address || "Local"}</p>
            <p class="text-sm text-gray-600 dark:text-gray-300 italic leading-snug">"${gem.description}"</p>
        </div>
      `;

      const popup = new window.mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(popupHTML);

      const marker = new window.mapboxgl.Marker(el).setLngLat([lng, lat]).setPopup(popup).addTo(map.current);

      el.addEventListener("mouseenter", () => marker.togglePopup());
      el.addEventListener("mouseleave", () => marker.togglePopup());

      markersRef.current.push(marker);
    });

    if (validGemsCount > 0 && !bounds.isEmpty()) {
      map.current.fitBounds(bounds, { padding: 80, maxZoom: 15 });
    }
  }, [gems, selectedCity]);

  if (mapError) {
    return (
      <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-border relative bg-muted flex items-center justify-center">
        <p className="text-muted-foreground text-sm">{mapError}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-border relative bg-muted">
      {!mapToken && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-muted">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-black/80 backdrop-blur-sm p-3 rounded-xl text-xs space-y-2 z-10 shadow-lg border border-gray-100 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS.teal }}></div>
          <span className="font-medium text-gray-700 dark:text-gray-200">{t.legendIntrospective}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS.coral }}></div>
          <span className="font-medium text-gray-700 dark:text-gray-200">{t.legendSocial}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS.mustard }}></div>
          <span className="font-medium text-gray-700 dark:text-gray-200">{t.legendCreative}</span>
        </div>
      </div>
    </div>
  );
};
