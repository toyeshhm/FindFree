import { authService } from '@/services/auth';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
    },
  },
}));

describe('authService', () => {
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
});
