import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UsageInfo {
  minutes_used: number;
  minutes_remaining: number;
  monthly_limit: number;
  period_start: string;
}

export function useCredits() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsage = async () => {
    if (!user) {
      setUsage(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('check_ai_time', {
        p_user_id: user.id
      });

      if (error) throw error;
      setUsage(data as unknown as UsageInfo);
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUsage = () => {
    fetchUsage();
  };

  useEffect(() => {
    fetchUsage();
  }, [user]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('usage-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_usage',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchUsage();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    usage,
    minutesUsed: usage?.minutes_used ?? 0,
    minutesRemaining: usage?.minutes_remaining ?? 0,
    monthlyLimit: usage?.monthly_limit ?? 240,
    isLoading,
    refreshUsage
  };
}