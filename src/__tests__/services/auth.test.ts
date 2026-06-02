import { authService } from '@/services/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
      signInWithOAuth: jest.fn(),
      setSession: jest.fn(),
    },
  },
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('expo-linking', () => ({
  parse: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn().mockReturnValue('findfree://auth-callback'),
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('signUp calls supabase.auth.signUp with email and password', async () => {
    const { supabase } = require('@/lib/supabase');
    await authService.signUp('a@b.com', 'password123', 'Ada');
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'password123',
      options: { data: { name: 'Ada' } },
    });
  });

  it('signIn calls signInWithPassword', async () => {
    const { supabase } = require('@/lib/supabase');
    await authService.signIn('a@b.com', 'password123');
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.com', password: 'password123',
    });
  });

  it('signInWithGoogle handles successful standard query parameters', async () => {
    const { supabase } = require('@/lib/supabase');
    (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
      data: { url: 'https://supabase.co/oauth' },
      error: null,
    });
    (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
      type: 'success',
      url: 'findfree://auth-callback?access_token=foo&refresh_token=bar',
    });
    (Linking.parse as jest.Mock).mockReturnValue({
      queryParams: { access_token: 'foo', refresh_token: 'bar' },
    });
    (supabase.auth.setSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: 'foo' } },
      error: null,
    });

    const result = await authService.signInWithGoogle();

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'findfree://auth-callback',
        skipBrowserRedirect: true,
      },
    });
    expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
      'https://supabase.co/oauth',
      'findfree://auth-callback'
    );
    expect(Linking.parse).toHaveBeenCalledWith(
      'findfree://auth-callback?access_token=foo&refresh_token=bar'
    );
    expect(supabase.auth.setSession).toHaveBeenCalledWith({
      access_token: 'foo',
      refresh_token: 'bar',
    });
    expect(result).toEqual({ session: { access_token: 'foo' } });
  });

  it('signInWithGoogle parses hash fragment tokens correctly', async () => {
    const { supabase } = require('@/lib/supabase');
    (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
      data: { url: 'https://supabase.co/oauth' },
      error: null,
    });
    (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
      type: 'success',
      url: 'findfree://auth-callback#access_token=hash_access&refresh_token=hash_refresh',
    });
    (Linking.parse as jest.Mock).mockReturnValue({
      queryParams: {},
    });
    (supabase.auth.setSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: 'hash_access' } },
      error: null,
    });

    const result = await authService.signInWithGoogle();

    expect(supabase.auth.setSession).toHaveBeenCalledWith({
      access_token: 'hash_access',
      refresh_token: 'hash_refresh',
    });
    expect(result).toEqual({ session: { access_token: 'hash_access' } });
  });

  it('signInWithGoogle throws error when OAuth URL is missing', async () => {
    const { supabase } = require('@/lib/supabase');
    (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
      data: { url: null },
      error: null,
    });

    await expect(authService.signInWithGoogle()).rejects.toThrow(
      'No OAuth URL returned from Supabase.'
    );
  });
});
