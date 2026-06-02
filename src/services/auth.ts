import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export const authService = {
  signUp: async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    return data;
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signInWithGoogle: async () => {
    const redirectTo = makeRedirectUri({
      scheme: 'findfree',
      path: 'auth-callback',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data?.url) throw new Error('No OAuth URL returned from Supabase.');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type === 'success' && result.url) {
      const parsed = Linking.parse(result.url);
      
      // Standard query params check
      let access_token = parsed.queryParams?.access_token as string | undefined;
      let refresh_token = parsed.queryParams?.refresh_token as string | undefined;

      // Supabase OAuth defaults to returning tokens in the hash fragment (#access_token=...)
      if (!access_token && result.url.includes('#')) {
        try {
          const hash = result.url.split('#')[1];
          const parts = hash.split('&');
          const hashParams: Record<string, string> = {};
          parts.forEach((part) => {
            const [key, val] = part.split('=');
            if (key && val) {
              hashParams[key] = decodeURIComponent(val);
            }
          });
          access_token = hashParams.access_token;
          refresh_token = hashParams.refresh_token;
        } catch (e) {
          console.warn('Failed to parse URL hash fragment:', e);
        }
      }

      if (access_token && refresh_token) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (sessionError) throw sessionError;
        return sessionData;
      }
    }
    return null;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};
