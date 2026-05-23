import type { Profile } from '@/shared/types';

export interface AuthSession {
  user: {
    id: string;
    email: string;
  } | null;
  session: unknown | null;
}

export interface IAuthPort {
  getSession(): Promise<AuthSession>;
  signIn(email: string, password: string): Promise<AuthSession>;
  signUp(email: string, password: string, fullName: string): Promise<{ user: { id: string; email: string } | null }>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  getProfile(userId: string): Promise<Profile | null>;
  onAuthStateChange(callback: (event: string, session: unknown) => void): { data: { subscription: { unsubscribe: () => void } } };
}
