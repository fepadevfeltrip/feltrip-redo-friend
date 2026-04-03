import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Hook to check if user has purchased a personal map (unlocking the 5-pillar analysis).
 * Checks the map_purchases table for any purchase by this user.
 */
export function useMapPurchase(userId?: string) {
  const [hasPurchasedMap, setHasPurchasedMap] = useState(false);
  const [mapCreditsRemaining, setMapCreditsRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetch = async () => {
      // Check for any map purchase (personal_map, explorer_credit, language_studio_included)
      const { data, error } = await supabase
        .from('map_purchases')
        .select('id, purchase_type')
        .eq('user_id', userId) as any;

      if (!error && data) {
        setHasPurchasedMap(data.length > 0);
        // Count unused explorer credits (simplified: total credits)
        const credits = data.filter((p: any) => 
          p.purchase_type === 'explorer_credit' || 
          p.purchase_type === 'personal_map' || 
          p.purchase_type === 'language_studio_included'
        ).length;
        setMapCreditsRemaining(credits);
      }
      setIsLoading(false);
    };

    fetch();
  }, [userId]);

  return { hasPurchasedMap, mapCreditsRemaining, isLoading };
}
