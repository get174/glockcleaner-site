import { createContext, useState, useEffect, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User, Session, Provider } from '@supabase/supabase-js';


export interface Profile {
  id: string; full_name: string | null; phone: string | null; avatar_url: string | null;
  created_at: string; updated_at: string;
}

export interface AuthContextType {
  user: User | null; session: Session | null; loading: boolean; profile: Profile | null;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  register: (email: string, password: string, metadata: { full_name: string; phone?: string }) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>;
  signInWithOAuth: (provider: Provider) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchProfile = async (userId: string, retries = 3) => {
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('fetchProfile error:', error.message);
        }
        if (attempt < retries) {
          await wait(500);
          continue;
        }
        return null;
      }

      if (data) {
        setProfile(data as Profile);
        return data as Profile | null;
      }

      if (attempt < retries) {
        await wait(500);
      }
    }

    return null;
  };

  useEffect(() => {
    // If Supabase is not configured at build-time, keep the app bootable.
    if (!isSupabaseConfigured) {
      setLoading(false);
      setUser(null);
      setSession(null);
      setProfile(null);
      return;
    }

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) await fetchProfile(session.user.id);
      } catch (error) {
        console.error('Auth init failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);


  const login = async (email: string, password: string) => {
    // Server-side validation
    if (!email || !email.includes('@') || email.length > 254) {
      return { error: new Error('Email invalide') as Error | null };
    }
    if (!password || password.length < 1) {
      return { error: new Error('Mot de passe requis') as Error | null };
    }

    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.session?.user) {
      await fetchProfile(data.session.user.id);
    }
    return { error: error as Error | null };
  };

  const register = async (email: string, password: string, metadata: { full_name: string; phone?: string }) => {
    // Server-side validation
    if (!email || !email.includes('@') || email.length > 254) {
      return { error: new Error('Email invalide') as Error | null };
    }
    if (!metadata.full_name || metadata.full_name.length > 100) {
      return { error: new Error('Nom invalide') as Error | null };
    }
    // Only allow safe characters
    if (!/^[a-zA-ZÀ-ÿ\s\-]+$/.test(metadata.full_name)) {
      return { error: new Error('Caractères non autorisés dans le nom') as Error | null };
    }
    if (metadata.phone && !/^\+?[0-9]+$/.test(metadata.phone)) {
      return { error: new Error('Numéro de téléphone invalide') as Error | null };
    }

    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: metadata } });
    if (error) return { error: error as Error | null };

    const user = data.user ?? data.session?.user;
    if (user) {
      await fetchProfile(user.id, 3);
    }

    if (data.session?.user) {
      await fetchProfile(data.session.user.id, 3);
    }

    return { error: null, needsEmailConfirmation: !data.session };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    window.location.href = '/';
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    return { error: error as Error | null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error as Error | null };
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };
    const { error } = await supabase.from('profiles').update(data).eq('id', user.id);
    if (!error) await fetchProfile(user.id);
    return { error: error as Error | null };
  };

  const signInWithOAuth = async (provider: Provider) => {
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/profile` } });
    return { error: error as Error | null };
  };

  const refreshProfile = async () => { if (user) await fetchProfile(user.id); };

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, login, register, logout, resetPassword, updatePassword, updateProfile, signInWithOAuth, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
