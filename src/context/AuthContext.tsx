import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Role } from '../types';
import { INITIAL_PROFILES } from '../lib/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  // En producción sin Supabase configurado, bloquear ingreso totalmente
  if (!import.meta.env.DEV && !isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-[#F5F5F4] flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white border border-[#E5E5E3] rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm text-center">
          <div className="flex items-center justify-center gap-2">
            <img
              src="/carvlak-logo-negro.png"
              alt="CARVLAK"
              className="h-8 sm:h-9 w-auto object-contain"
            />
            <span className="text-sm font-sans font-medium text-[#6B6B6B] tracking-wide">
              Group
            </span>
          </div>
          <h1 className="text-lg font-title font-bold text-[#161616]">
            Configuración incompleta
          </h1>
          <p className="text-xs text-[#6B6B6B] leading-relaxed">
            Las credenciales de Supabase no están configuradas en las variables de entorno de este despliegue.
            Por políticas de seguridad, el ingreso al sistema se encuentra deshabilitado.
          </p>
        </div>
      </div>
    );
  }

  // En producción, los perfiles no se leen de localStorage
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    if (import.meta.env.DEV) {
      const saved = localStorage.getItem('carvlak_profiles');
      return saved ? JSON.parse(saved) : INITIAL_PROFILES;
    }
    return [];
  });

  const [profile, setProfile] = useState<Profile | null>(() => {
    if (import.meta.env.DEV) {
      const savedId = localStorage.getItem('carvlak_active_user_id');
      const found = profiles.find((p) => p.id === savedId);
      return found || profiles[0] || null;
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(Boolean(isSupabaseConfigured && !import.meta.env.DEV));
  const isDemoMode = !isSupabaseConfigured;

  // Persistir en localStorage solo en desarrollo
  useEffect(() => {
    if (import.meta.env.DEV) {
      localStorage.setItem('carvlak_profiles', JSON.stringify(profiles));
    }
  }, [profiles]);

  useEffect(() => {
    if (import.meta.env.DEV) {
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
          if (!import.meta.env.DEV) {
            setProfiles([]);
          }
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const login = async (email: string, password?: string): Promise<{ error?: string }> => {
    // Fuera de DEV, la contraseña es estrictamente obligatoria
    if (!import.meta.env.DEV && !password) {
      return { error: 'Debe ingresar una contraseña.' };
    }

    if (isSupabaseConfigured && supabase && password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return {};
    }

    // Login sin contraseña solo permitido en entorno DEV
    if (!import.meta.env.DEV) {
      return { error: 'Autenticación con Supabase requerida en este entorno.' };
    }

    // Modo Demo / Fallback local para desarrollo
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
    if (!import.meta.env.DEV) {
      setProfiles([]);
    }
  };

  const switchProfile = (profileId: string) => {
    if (!import.meta.env.DEV) {
      console.warn('El cambio directo de perfil está deshabilitado en producción.');
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
