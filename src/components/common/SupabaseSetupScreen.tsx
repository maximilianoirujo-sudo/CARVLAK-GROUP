import React, { useState } from 'react';
import {
  Database,
  Key,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock
} from 'lucide-react';
import { Button } from '../ui/Button';

export const SupabaseSetupScreen: React.FC = () => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [error, setError] = useState('');
  const [showVercelGuide, setShowVercelGuide] = useState(false);

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setError('Por favor completá tanto la URL como la Anon Key de Supabase.');
      return;
    }

    if (!cleanUrl.startsWith('https://') || !cleanUrl.includes('supabase.co')) {
      setError('La URL de Supabase debe tener el formato https://tu-proyecto.supabase.co');
      return;
    }

    try {
      localStorage.setItem('carvlak_supabase_url', cleanUrl);
      localStorage.setItem('carvlak_supabase_anon_key', cleanKey);
      localStorage.removeItem('carvlak_allow_demo_mode');
      window.location.reload();
    } catch {
      setError('Error al guardar credenciales en el navegador.');
    }
  };

  const handleEnterDemoMode = () => {
    try {
      localStorage.setItem('carvlak_allow_demo_mode', 'true');
      window.location.reload();
    } catch {
      setError('Error al activar el modo demostración.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-lg bg-white border border-[#E5E5E3] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Cabecera */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <img
              src="/carvlak-logo-negro.png"
              alt="CARVLAK"
              className="h-9 w-auto object-contain"
            />
            <span className="text-sm font-sans font-medium text-[#6B6B6B] tracking-wide">
              Group
            </span>
          </div>
          <h1 className="text-xl font-display font-bold text-[#161616]">
            Conectar Base de Datos Supabase
          </h1>
          <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
            Para sincronizar turnos, cotizaciones y cobros entre todos los celulares del taller, conectá tu proyecto de Supabase.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Opción 1: Conectar Credenciales en este Navegador */}
        <form onSubmit={handleSaveCredentials} className="space-y-4 pt-2">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#161616] mb-1">
                URL del Proyecto Supabase
              </label>
              <div className="relative">
                <Database className="w-4 h-4 text-[#9A9A9A] absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl pl-9 pr-3 py-2 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#161616] mb-1">
                Clave Pública (anon / public key)
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-[#9A9A9A] absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-[#161616] focus:border-[#D7141A] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <Button variant="primary" type="submit" className="w-full justify-center gap-2 py-2.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Guardar y Conectar Supabase</span>
          </Button>
        </form>

        {/* Separador */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#E5E5E3]"></div>
          <span className="flex-shrink mx-3 text-[11px] font-medium text-[#9A9A9A] uppercase tracking-wider">
            o también
          </span>
          <div className="flex-grow border-t border-[#E5E5E3]"></div>
        </div>

        {/* Opción 2: Modo Demostración */}
        <div className="p-4 rounded-2xl bg-[#F5F5F4] border border-[#E5E5E3] space-y-2 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#161616]">
            <Sparkles className="w-3.5 h-3.5 text-[#D7141A]" />
            <span>¿Querés probar la plataforma de inmediato?</span>
          </div>
          <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
            Podés ingresar en Modo Demostración para ver el calendario, cotizaciones, comprobantes y comisiones sin conectar Supabase todavía.
          </p>
          <Button
            variant="secondary"
            type="button"
            onClick={handleEnterDemoMode}
            className="w-full justify-center gap-1.5 text-xs py-2 mt-1"
          >
            <span>Acceder en Modo Demostración</span>
          </Button>
        </div>

        {/* Opción 3: Guía de configuración en Vercel */}
        <div className="border border-[#E5E5E3] rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowVercelGuide(!showVercelGuide)}
            className="w-full p-3.5 text-left text-xs font-bold text-[#161616] flex items-center justify-between bg-white hover:bg-[#F5F5F4] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#D7141A]" />
              <span>¿Cómo dejarlo configurado fijo en Vercel para todos?</span>
            </div>
            {showVercelGuide ? (
              <ChevronUp className="w-4 h-4 text-[#9A9A9A]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#9A9A9A]" />
            )}
          </button>

          {showVercelGuide && (
            <div className="p-4 bg-[#F5F5F4] border-t border-[#E5E5E3] text-xs text-[#6B6B6B] space-y-2.5">
              <p>Para que ningún empleado tenga que configurar claves en su celular:</p>
              <ol className="list-decimal pl-4 space-y-1.5 text-[11px]">
                <li>
                  Entrá a tu cuenta de <strong>Vercel</strong> y abrí el proyecto <strong>carvlak-group</strong>.
                </li>
                <li>
                  Andá a <strong>Settings</strong> &gt; <strong>Environment Variables</strong>.
                </li>
                <li>
                  Agregá estas 2 variables:
                  <div className="mt-1 space-y-1 font-mono text-[10px] bg-white p-2 rounded-lg border border-[#E5E5E3] text-[#161616]">
                    <div><strong>VITE_SUPABASE_URL</strong> = https://tu-proyecto.supabase.co</div>
                    <div><strong>VITE_SUPABASE_ANON_KEY</strong> = tu_clave_anon</div>
                  </div>
                </li>
                <li>
                  Andá a la pestaña <strong>Deployments</strong>, hacé clic en los tres puntos del último despliegue y tocá <strong>Redeploy</strong>.
                </li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
