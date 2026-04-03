import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserTier } from './useUserTier';

interface ChatAccess {
  hasAccess: boolean;
  isLimited: boolean; // true = free user, 1 follow-up only
  expiresAt: Date | null;
  timeRemaining: string | null;
  isLoading: boolean;
  grantFreeAccess: () => Promise<void>;
}

export function useChatAccess(userId?: string): ChatAccess {
  const { hasUnlimitedChat, isLoading: tierLoading } = useUserTier();
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  const fetchAccess = async () => {
    if (!userId) { setIsLoading(false); return; }
    
    const { data } = await supabase
      .from('chat_access')
      .select('expires_at')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1) as any;

    if (data && data.length > 0) {
      setExpiresAt(new Date(data[0].expires_at));
    } else {
      setExpiresAt(null);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchAccess(); }, [userId]);

  // Update time remaining every minute
  useEffect(() => {
    if (!expiresAt) { setTimeRemaining(null); return; }
    
    const update = () => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();
      if (diff <= 0) { setTimeRemaining(null); setExpiresAt(null); return; }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        setTimeRemaining(`${days}d ${hours % 24}h`);
      } else {
        setTimeRemaining(`${hours}h ${minutes}m`);
      }
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Grant 24h free access (after email capture)
  const grantFreeAccess = async () => {
    if (!userId) return;
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);
    
    await supabase.from('chat_access').insert({
      user_id: userId,
      plan_type: 'free_unlock',
      expires_at: expires.toISOString(),
    } as any);
    
    setExpiresAt(expires);
  };

  const hasPaidAccess = !!expiresAt && expiresAt.getTime() > Date.now();

  // Premium users: always full access
  // Paid (day_use) users: full access during 24h window
  // Free users: always have basic access (limited to 1 follow-up)
  return {
    hasAccess: hasUnlimitedChat || hasPaidAccess || true, // everyone can access chat
    isLimited: !hasUnlimitedChat && !hasPaidAccess, // free without paid window = limited
    expiresAt,
    timeRemaining: hasPaidAccess ? timeRemaining : null,
    isLoading: isLoading || tierLoading,
    grantFreeAccess,
  };
}
