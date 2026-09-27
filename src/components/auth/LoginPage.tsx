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
    <div className="min-h-screen bg-[#F5F5F4] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white border border-[#E5E5E3] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        
        {/* Logo Oficial CARVLAK (Negro sobre fondo claro) */}
        <div className="text-center space-y-3">
          <img
            src="/logo-carvlak-black.png"
            alt="CARVLAK Group"
            className="h-10 sm:h-12 w-auto mx-auto object-contain"
          />
          <div>
            <h1 className="text-xl font-title font-bold text-[#161616]">
              Hub operativo central
            </h1>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Automotora • Detailing • Inspecciones
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#FDF2F2] border border-[#B80E14]/20 text-xs text-[#B80E14] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D7141A] shrink-0"></span>
            <span>{error}</span>
          </div>
        )}

        {/* Acceso rápido por empleado (Modo Demo / Equipo) */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-[#6B6B6B]">
            Ingreso rápido de equipo
          </div>
          <div className="grid grid-cols-1 gap-2">
            {availableProfiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => switchProfile(p.id)}
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#F5F5F4] border border-[#E5E5E3] hover:border-[#D0D0CD] text-xs transition-colors flex items-center justify-between min-h-[44px] cursor-pointer shadow-xs"
              >
                <div>
                  <div className="font-semibold text-[#161616]">{p.full_name}</div>
                  <div className="text-[11px] text-[#6B6B6B]">{p.roles.join(' • ')}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#9A9A9A]" />
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#E5E5E3]"></div>
          <span className="flex-shrink mx-3 text-[11px] text-[#9A9A9A] font-medium">O con credenciales</span>
          <div className="flex-grow border-t border-[#E5E5E3]"></div>
        </div>

        {/* Formulario tradicional */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-[#161616] mb-1.5">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#9A9A9A] absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@carvlak.com"
                className="w-full bg-white border border-[#E5E5E3] rounded-xl pl-9 pr-3 py-2 text-xs text-[#161616] placeholder-[#9A9A9A] focus:outline-none focus:border-[#D7141A] min-h-[42px] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#161616] mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#9A9A9A] absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-[#E5E5E3] rounded-xl pl-9 pr-3 py-2 text-xs text-[#161616] placeholder-[#9A9A9A] focus:outline-none focus:border-[#D7141A] min-h-[42px] transition-colors"
              />
            </div>
          </div>

          {/* Único botón de acción principal en Rojo #D7141A */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#D7141A] hover:bg-[#B80E14] text-white font-semibold text-xs transition-colors min-h-[44px] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="pt-2 text-center text-[11px] text-[#9A9A9A] flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          <span>Acceso restringido • CARVLAK Group © 2026</span>
        </div>

      </div>
    </div>
  );
};
