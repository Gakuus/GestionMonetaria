'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getAuthAdapter } from '@/infrastructure/config/container';
import type { Profile } from '@/shared/types';

interface AuthState {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    const auth = getAuthAdapter();
    let cancelled = false;

    auth
      .getSession()
      .then((session) => {
        if (cancelled) return;
        if (!session.user) {
          setState({ user: null, profile: null, loading: false });
          return;
        }
        return auth.getProfile(session.user.id).then((profile) => {
          if (!cancelled) setState({ user: session.user, profile, loading: false });
        });
      })
      .catch(() => {
        if (!cancelled) setState({ user: null, profile: null, loading: false });
      });

    // Subscribe to auth state changes (session refresh, etc.)
    const { data: { subscription } } = auth.onAuthStateChange((event, rawSession) => {
      if (cancelled) return;
      const s = rawSession as { user?: { id: string; email?: string } } | null;
      if (event === 'SIGNED_OUT') {
        setState({ user: null, profile: null, loading: false });
        return;
      }
      if (s?.user) {
        auth.getProfile(s.user.id).then((profile) => {
          if (!cancelled) setState({ user: { id: s.user!.id, email: s.user!.email ?? '' }, profile, loading: false });
        });
      }
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const auth = getAuthAdapter();
    const session = await auth.signIn(email, password);
    if (session.user) {
      const profile = await auth.getProfile(session.user.id);
      setState({ user: session.user, profile, loading: false });
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    const auth = getAuthAdapter();
    await auth.signUp(email, password, fullName);
  };

  const logout = async () => {
    const auth = getAuthAdapter();
    await auth.signOut();
    setState({ user: null, profile: null, loading: false });
  };

  const resetPassword = async (email: string) => {
    const auth = getAuthAdapter();
    await auth.resetPassword(email);
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
