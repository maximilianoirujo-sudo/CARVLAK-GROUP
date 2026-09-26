import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Role } from '../types';
import { INITIAL_PROFILES } from '../lib/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  profile: Profile | null;
  loading: boolean;
  isDemoMode: boolean;
  login: (email: string, password?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  switchProfile: (profileId: string) => void;
  availableProfiles: Profile[];
  updateProfileCommissions: (profileId: string, commissions: { automotora: number; detailing: number; inspeccion: number }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem('carvlak_profiles');
    return saved ? JSON.parse(saved) : INITIAL_PROFILES;
  });

  const [profile, setProfile] = useState<Profile | null>(() => {
    const savedId = localStorage.getItem('carvlak_active_user_id');
    const found = profiles.find((p) => p.id === savedId);
    return found || profiles[0]; // Maximiliano Admin por defecto
  });

  const [loading, setLoading] = useState<boolean>(false);
  const isDemoMode = !isSupabaseConfigured;

  useEffect(() => {
    localStorage.setItem('carvlak_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    if (profile) {
      localStorage.setItem('carvlak_active_user_id', profile.id);
    }
  }, [profile]);

  // Si Supabase está configurado, sincronizar sesión
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      setLoading(true);
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchSupabaseProfile(session.user.id);
        } else {
          setLoading(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          fetchSupabaseProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const fetchSupabaseProfile = async (userId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setProfile(data as Profile);
      }
    } catch (e) {
      console.error('Error fetching profile from Supabase:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password?: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured && supabase && password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return {};
    }

    // Modo Demo / Fallback
    const found = profiles.find((p) => p.email?.toLowerCase() === email.toLowerCase());
    if (found) {
      if (!found.is_active) {
        return { error: 'Este usuario se encuentra inactivo. Contacte al administrador.' };
      }
      setProfile(found);
      return {};
    }

    return { error: 'Usuario no encontrado en el sistema.' };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setProfile(null);
  };

  const switchProfile = (profileId: string) => {
    const found = profiles.find((p) => p.id === profileId);
    if (found) {
      setProfile(found);
    }
  };

  const updateProfileCommissions = (profileId: string, commissions: { automotora: number; detailing: number; inspeccion: number }) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, commissions } : p))
    );
    if (profile?.id === profileId) {
      setProfile((prev) => (prev ? { ...prev, commissions } : null));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        profile,
        loading,
        isDemoMode,
        login,
        logout,
        switchProfile,
        availableProfiles: profiles,
        updateProfileCommissions
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
