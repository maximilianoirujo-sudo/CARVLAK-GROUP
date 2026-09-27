import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, ArrowRight, Lock, Mail } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { availableProfiles, switchProfile, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const res = await login(email, password);
      if (res.error) setError(res.error);
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-[#111111] border border-[#222222] rounded-lg p-6 sm:p-8 space-y-6">
        
        {/* Logo Oficial CARVLAK (Blanco sobre fondo negro) */}
        <div className="text-center space-y-3">
          <img
            src="/logo-carvlak-white.png"
            alt="CARVLAK Group"
            className="h-10 sm:h-12 w-auto mx-auto object-contain"
          />
          <div>
            <h1 className="text-lg font-title font-bold text-white tracking-wide">
              Hub operativo central
            </h1>
            <p className="text-xs text-[#888888] mt-0.5">
              Automotora • Detailing • Inspecciones
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-[#D7141A]/10 border border-[#D7141A]/30 text-xs text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D7141A] shrink-0"></span>
            <span>{error}</span>
          </div>
        )}

        {/* Acceso rápido por empleado (Modo Demo / Equipo) */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
            Ingreso rápido de equipo
          </div>
          <div className="grid grid-cols-1 gap-2">
            {availableProfiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => switchProfile(p.id)}
                className="w-full text-left px-3 py-2.5 rounded-md bg-[#1A1A1A] hover:bg-[#222222] border border-[#2A2A2A] hover:border-[#6B6B6B] text-xs transition-colors flex items-center justify-between min-h-[44px]"
              >
                <div>
                  <div className="font-semibold text-white">{p.full_name}</div>
                  <div className="text-[10px] text-[#888888]">{p.roles.join(' • ')}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#888888]" />
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#222222]"></div>
          <span className="flex-shrink mx-3 text-[10px] text-[#6B6B6B] uppercase tracking-wider font-semibold">O con credenciales</span>
          <div className="flex-grow border-t border-[#222222]"></div>
        </div>

        {/* Formulario tradicional */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#AAAAAA] mb-1">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@carvlak.com"
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-md pl-9 pr-3 py-2 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-white min-h-[42px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#AAAAAA] mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-md pl-9 pr-3 py-2 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-white min-h-[42px]"
              />
            </div>
          </div>

          {/* Único botón de acción principal en Rojo #D7141A */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-md bg-[#D7141A] hover:bg-[#B50F14] text-white font-title font-bold text-xs uppercase tracking-wider transition-colors min-h-[44px] shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="pt-2 text-center text-[10px] text-[#555555] flex items-center justify-center gap-1">
          <Shield className="w-3 h-3" />
          <span>Acceso restringido • CARVLAK Group © 2026</span>
        </div>

      </div>
    </div>
  );
};
