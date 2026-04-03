import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

/**
 * Native Google Sign-In for Capacitor (iOS/Android).
 * Falls back to Supabase OAuth on web.
 */
export async function signInWithGoogleNative(): Promise<{ error: Error | null }> {
  const platform = Capacitor.getPlatform();

  if (platform === 'web') {
    // Web fallback: use Supabase OAuth redirect
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error: error as Error | null };
  }

  // Native (iOS / Android): use Capacitor Google Auth plugin
  try {
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');

    // Initialize on first call (safe to call multiple times)
    await GoogleAuth.initialize({
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });

    const googleUser = await GoogleAuth.signIn();
    const idToken = googleUser.authentication.idToken;

    if (!idToken) {
      return { error: new Error('Google Sign-In did not return an ID token.') };
    }

    // Exchange the Google ID token with Supabase
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    return { error: error as Error | null };
  } catch (err: any) {
    // User cancelled or plugin error
    if (err?.message?.includes('canceled') || err?.message?.includes('cancelled')) {
      return { error: null }; // user cancelled, not an error
    }
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}
