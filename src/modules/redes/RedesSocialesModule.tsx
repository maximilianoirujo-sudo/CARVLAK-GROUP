import React, { useState } from 'react';
import {
  Sparkles,
  History,
  Settings,
  Lock,
  Share2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { SocialMediaTemplateId } from '../../types';
import { SocialStudio } from './components/SocialStudio';
import { SocialHistorySection } from './components/SocialHistorySection';
import { SocialConfigSection } from './components/SocialConfigSection';

interface RedesSocialesModuleProps {
  initialVehicleId?: string;
  initialTemplateId?: SocialMediaTemplateId;
}

export const RedesSocialesModule: React.FC<RedesSocialesModuleProps> = ({
  initialVehicleId,
  initialTemplateId
}) => {
  const { profile } = useAuth();
  const { socialMediaConfig, socialMediaPosts } = useData();

  const [activeTab, setActiveTab] = useState<'studio' | 'history' | 'config'>('studio');

  const roles = profile?.roles || ['admin'];
  const isAdmin = roles.includes('admin');
  const isEncargado = roles.includes('encargado');
  const isVendedor = roles.includes('vendedor');

  // Verificación de permisos de rol:
  // Si es Vendedor y allow_vendedor es false, bloquear acceso.
  const hasAccess = isAdmin || isEncargado || (isVendedor && socialMediaConfig.allow_vendedor);

  if (!hasAccess) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-[#141414] rounded-3xl border border-[#2A2A2A] text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-[#D7141A]/10 border border-[#D7141A]/30 flex items-center justify-center mx-auto text-[#D7141A]">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-white">Acceso Restringido a Redes Sociales</h2>
        <p className="text-xs text-[#8A8A8A] leading-relaxed">
          La creación de imágenes y publicaciones oficiales de CARVLAK Group está configurada únicamente para <strong>Administradores y Encargados</strong>.
        </p>
        <p className="text-[11px] text-[#8A8A8A]">
          Si requerís generar contenido como vendedor, solicitá al administrador que habilite tu rol desde el panel de configuración de Redes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado Principal y Pestañas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#2A2A2A]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#D7141A]/10 text-[#D7141A] border border-[#D7141A]/20">
              <Share2 className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Redes Sociales & Marketing Studio
              </h1>
              <p className="text-xs text-[#8A8A8A]">
                Generá historias y publicaciones profesionales en 1080px con la identidad visual oficial de CARVLAK.
              </p>
            </div>
          </div>
        </div>

        {/* Selector de sub-pestañas */}
        <div className="flex items-center bg-[#141414] p-1.5 rounded-2xl border border-[#2A2A2A] self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'studio'
                ? 'bg-[#D7141A] text-white shadow-md'
                : 'text-[#8A8A8A] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Estudio Creativo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#D7141A] text-white shadow-md'
                : 'text-[#8A8A8A] hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial ({socialMediaPosts.length})</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'config'
                  ? 'bg-[#D7141A] text-white shadow-md'
                  : 'text-[#8A8A8A] hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configuración</span>
            </button>
          )}
        </div>
      </div>

      {/* Contenido según pestaña activa */}
      {activeTab === 'studio' && (
        <SocialStudio
          initialVehicleId={initialVehicleId}
          initialTemplateId={initialTemplateId}
        />
      )}

      {activeTab === 'history' && <SocialHistorySection />}

      {activeTab === 'config' && isAdmin && <SocialConfigSection />}
    </div>
  );
};
