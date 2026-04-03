import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DAILY_FREE_GEMS = 1;
const GEM_PRICE_BRL = 9.90;
const EXPLORER_PRICE_BRL = 129.90;

interface GemUsage {
  totalGems: number;
  gemsToday: number;
  dailyLimit: number;
  freeRemaining: number;
  isLocked: boolean;
  isLoading: boolean;
}

export function useGemLimit(userId: string | undefined) {
  const [usage, setUsage] = useState<GemUsage>({
    totalGems: 0,
    gemsToday: 0,
    dailyLimit: DAILY_FREE_GEMS,
    freeRemaining: DAILY_FREE_GEMS,
    isLocked: false,
    isLoading: true,
  });

  const fetchGemCount = async () => {
    if (!userId) {
      setUsage(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Get today's start in UTC
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Fetch total gems and today's gems in parallel
      const [totalResult, todayResult] = await Promise.all([
        supabase
          .from('mrp_gems')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('mrp_gems')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', todayStart.toISOString()),
      ]);

      if (totalResult.error) throw totalResult.error;

      const total = totalResult.count || 0;
      const today = todayResult.count || 0;
      const freeRemaining = Math.max(0, DAILY_FREE_GEMS - today);
      const isLocked = today >= DAILY_FREE_GEMS;

      setUsage({
        totalGems: total,
        gemsToday: today,
        dailyLimit: DAILY_FREE_GEMS,
        freeRemaining,
        isLocked,
        isLoading: false,
      });
    } catch (err) {
      console.error('Error fetching gem count:', err);
      setUsage(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchGemCount();
  }, [userId]);

  return { ...usage, refresh: fetchGemCount, DAILY_FREE_GEMS, GEM_PRICE_BRL, EXPLORER_PRICE_BRL };
}
