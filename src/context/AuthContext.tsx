import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Role } from '../types';
import { INITIAL_PROFILES } from '../lib/mockData';
import { supabase, isSupabaseConfigured, isDemoModeAllowed } from '../lib/supabase';
import { SupabaseSetupScreen } from '../components/common/SupabaseSetupScreen';

export interface AuthContextType {
  profile: Profile | null;
  loading: boolean;
  isDemoMode: boolean;
  login: (email: string, password?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  switchProfile: (profileId: string) => void;
  availableProfiles: Profile[];
  updateProfileCommissions: (profileId: string, commissions: { automotora: number; detailing: number; inspeccion: number }) => Promise<void> | void;
  addProfile: (newProfile: Omit<Profile, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => Promise<{ error?: string }>;
  updateProfile: (profileId: string, updates: Partial<Profile>) => Promise<{ error?: string }>;
  toggleProfileActive: (profileId: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDemo = Boolean(!isSupabaseConfigured || isDemoModeAllowed());

  // En producción sin Supabase configurado y sin modo demo activado, mostrar pantalla de configuración
  if (!import.meta.env.DEV && !isSupabaseConfigured && !isDemoModeAllowed()) {
    return <SupabaseSetupScreen />;
  }

  // En producción, los perfiles se leen de Supabase a menos que esté en DEV o modo demo
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    if (import.meta.env.DEV || isDemoModeAllowed()) {
      const saved = localStorage.getItem('carvlak_profiles');
      return saved ? JSON.parse(saved) : INITIAL_PROFILES;
    }
    return [];
  });

  const [profile, setProfile] = useState<Profile | null>(() => {
    if (import.meta.env.DEV || isDemoModeAllowed()) {
      const savedId = localStorage.getItem('carvlak_active_user_id');
      const found = profiles.find((p) => p.id === savedId);
      return found || profiles[0] || null;
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(Boolean(isSupabaseConfigured && !isDemoModeAllowed() && !import.meta.env.DEV));
  const isDemoMode = isDemo;

  // Persistir en localStorage en desarrollo o modo demo
  useEffect(() => {
    if (import.meta.env.DEV || isDemoModeAllowed()) {
      localStorage.setItem('carvlak_profiles', JSON.stringify(profiles));
    }
  }, [profiles]);

  useEffect(() => {
    if (import.meta.env.DEV || isDemoModeAllowed()) {
      if (profile) {
        localStorage.setItem('carvlak_active_user_id', profile.id);
      } else {
        localStorage.removeItem('carvlak_active_user_id');
      }
    }
  }, [profile]);

  const fetchProfiles = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (data && !error) {
        setProfiles(data as Profile[]);
      }
    } catch (e) {
      console.error('Error al cargar perfiles desde Supabase:', e);
    }
  };

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
        await fetchProfiles();
      }
    } catch (e) {
      console.error('Error fetching profile from Supabase:', e);
    } finally {
      setLoading(false);
    }
  };

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
          if (!import.meta.env.DEV && !isDemoModeAllowed()) {
            setProfiles([]);
          }
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const login = async (email: string, password?: string): Promise<{ error?: string }> => {
    // Si Supabase está configurado y hay contraseña, autenticación real
    if (isSupabaseConfigured && supabase && password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return {};
    }

    // Modo Demo / Fallback local para desarrollo o prueba
    if (import.meta.env.DEV || isDemoModeAllowed()) {
      const found = profiles.find((p) => p.email?.toLowerCase() === email.toLowerCase());
      if (found) {
        if (!found.is_active) {
          return { error: 'Este usuario se encuentra inactivo. Contacte al administrador.' };
        }
        setProfile(found);
        return {};
      }
      return { error: 'Usuario no encontrado en los perfiles de demostración.' };
    }

    if (!password) {
      return { error: 'Debe ingresar una contraseña.' };
    }

    return { error: 'Autenticación con Supabase requerida en este entorno.' };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setProfile(null);
    if (!import.meta.env.DEV && !isDemoModeAllowed()) {
      setProfiles([]);
    }
  };

  const switchProfile = (profileId: string) => {
    if (!import.meta.env.DEV && !isDemoModeAllowed()) {
      console.warn('El cambio directo de perfil está deshabilitado en producción con Supabase.');
      return;
    }
    const found = profiles.find((p) => p.id === profileId);
    if (found) {
      setProfile(found);
    }
  };

  const updateProfileCommissions = async (
    profileId: string,
    commissions: { automotora: number; detailing: number; inspeccion: number }
  ) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, commissions } : p))
    );
    if (profile?.id === profileId) {
      setProfile((prev) => (prev ? { ...prev, commissions } : null));
    }

    // Guardar en Supabase si está disponible
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ commissions, updated_at: new Date().toISOString() })
          .eq('id', profileId);

        if (error) {
          console.error('Error al persistir comisiones de perfil en Supabase:', error.message);
        }
      } catch (err) {
        console.error('Fallo en updateProfileCommissions:', err);
      }
    }
  };

  const addProfile = async (newProfile: Omit<Profile, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<{ error?: string }> => {
    const nowIso = new Date().toISOString();
    const createdProfile: Profile = {
      ...newProfile,
      id: newProfile.id || `user-${crypto.randomUUID()}`,
      created_at: nowIso,
      updated_at: nowIso
    };

    setProfiles((prev) => [...prev.filter((p) => p.id !== createdProfile.id), createdProfile]);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('profiles').upsert(createdProfile);
        if (error) {
          console.error('Error insert profile Supabase:', error.message);
          return { error: error.message };
        }
      } catch (err: any) {
        return { error: err?.message || 'Error al guardar usuario' };
      }
    }
    return {};
  };

  const updateProfile = async (profileId: string, updates: Partial<Profile>): Promise<{ error?: string }> => {
    const nowIso = new Date().toISOString();
    setProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, ...updates, updated_at: nowIso } : p))
    );
    if (profile?.id === profileId) {
      setProfile((prev) => (prev ? { ...prev, ...updates, updated_at: nowIso } : null));
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ ...updates, updated_at: nowIso })
          .eq('id', profileId);
        if (error) return { error: error.message };
      } catch (err: any) {
        return { error: err?.message };
      }
    }
    return {};
  };

  const toggleProfileActive = async (profileId: string) => {
    const target = profiles.find((p) => p.id === profileId);
    if (!target) return;
    await updateProfile(profileId, { is_active: !target.is_active });
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
        updateProfileCommissions,
        addProfile,
        updateProfile,
        toggleProfileActive
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
