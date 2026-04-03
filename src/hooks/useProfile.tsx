import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  city: string | null;
  origin_city: string | null;
  pronoun: string | null;
  institution: string | null;
  avatar_url: string | null;
  company_id: string | null;
  user_tier: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_end_date: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [hasFetchedProfile, setHasFetchedProfile] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setHasFetchedProfile(false);
      setIsFetching(false);
      return;
    }

    setIsFetching(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err as Error);
    } finally {
      setIsFetching(false);
      setHasFetchedProfile(true);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  // isLoading is true while auth is loading OR until the first profile fetch completes for logged users
  const isLoading = authLoading || (!!user && (!hasFetchedProfile || isFetching));

  const updateProfile = async (updates: Partial<Pick<UserProfile, 'full_name' | 'city' | 'origin_city' | 'pronoun' | 'institution' | 'avatar_url'>>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (updateError) {
      return { error: updateError };
    }

    // Refresh profile data
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
    }

    return { error: null };
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { error: new Error('Not authenticated'), url: null };

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    // Delete old avatar if exists
    await supabase.storage.from('avatars').remove([fileName]);

    // Upload new avatar
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      return { error: uploadError, url: null };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`; // Add timestamp to bust cache

    // Update profile with new avatar URL
    const { error: updateError } = await updateProfile({ avatar_url: avatarUrl });

    if (updateError) {
      return { error: updateError, url: null };
    }

    return { error: null, url: avatarUrl };
  };

  return { profile, isLoading, error, updateProfile, uploadAvatar, refreshProfile: fetchProfile };
}
