import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPreferences = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching notification preferences:', error);
      return;
    }

    setPreferences(data);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchPreferences();
      setIsLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const updatePreferences = async (updates: Partial<Pick<NotificationPreferences, 'email_notifications' | 'push_notifications'>>) => {
    if (!user) return false;

    if (preferences) {
      // Update existing preferences
      const { error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating notification preferences:', error);
        return false;
      }

      setPreferences(prev => prev ? { ...prev, ...updates } : null);
    } else {
      // Create new preferences
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert({ user_id: user.id, ...updates })
        .select()
        .single();

      if (error) {
        console.error('Error creating notification preferences:', error);
        return false;
      }

      setPreferences(data);
    }

    return true;
  };

  const toggleEmailNotifications = async () => {
    const newValue = !preferences?.email_notifications;
    return updatePreferences({ email_notifications: newValue });
  };

  const togglePushNotifications = async () => {
    const newValue = !preferences?.push_notifications;
    return updatePreferences({ push_notifications: newValue });
  };

  return {
    preferences,
    isLoading,
    updatePreferences,
    toggleEmailNotifications,
    togglePushNotifications,
    emailEnabled: preferences?.email_notifications ?? false,
    pushEnabled: preferences?.push_notifications ?? false,
    refresh: fetchPreferences
  };
}
