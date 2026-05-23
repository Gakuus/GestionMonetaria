import type { IAuthPort, AuthSession } from '@/application/ports/out/IAuthPort';
import type { Profile } from '@/shared/types';
import { createSupabaseClient } from './client';

export class SupabaseAuthAdapter implements IAuthPort {
  private client = createSupabaseClient();

  async getSession(): Promise<AuthSession> {
    const { data } = await this.client.auth.getSession();
    if (!data.session) return { user: null, session: null };
    return {
      user: {
        id: data.session.user.id,
        email: data.session.user.email ?? '',
      },
      session: data.session,
    };
  }

  async signIn(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return {
      user: data.user ? { id: data.user.id, email: data.user.email ?? '' } : null,
      session: data.session,
    };
  }

  async signUp(email: string, password: string, fullName: string): Promise<{ user: { id: string; email: string } | null }> {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw new Error(error.message);
    return {
      user: data.user ? { id: data.user.id, email: data.user.email ?? '' } : null,
    };
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw new Error(error.message);
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
    });
    if (error) throw new Error(error.message);
  }

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data;
  }

  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return this.client.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
}
