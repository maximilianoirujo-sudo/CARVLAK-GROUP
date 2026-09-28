import React, { useState } from 'react';
import {
  Sparkles,
  History,
  Settings,
  Lock,
  Share2,
  Layers,
  ArrowRight,
  Palette
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { SocialMediaTemplateId } from '../../types';
import { SocialStudio } from './components/SocialStudio';
import { SocialHistorySection } from './components/SocialHistorySection';
import { SocialConfigSection } from './components/SocialConfigSection';
import { SocialTemplateEditor } from './components/SocialTemplateEditor';

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

  const [activeTab, setActiveTab] = useState<'studio' | 'templates' | 'history' | 'config'>('studio');

  const roles = profile?.roles || ['admin'];
  const isAdmin = roles.includes('admin');
  const isEncargado = roles.includes('encargado');
  const isVendedor = roles.includes('vendedor');

  // Verificación de permisos de rol:
  // Si es Vendedor y allow_vendedor es false, bloquear acceso.
  const hasAccess = isAdmin || isEncargado || (isVendedor && socialMediaConfig.allow_vendedor);

  if (!hasAccess) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-[#E5E5E3] text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-[#FDF2F2] border border-[#FACDCD] flex items-center justify-center mx-auto text-[#D7141A]">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-title font-bold text-[#161616]">Acceso restringido a redes sociales</h2>
        <p className="text-xs text-[#6B6B6B] leading-relaxed">
          La creación de imágenes y publicaciones oficiales de CARVLAK Group está configurada únicamente para <strong>Administradores y Encargados</strong>.
        </p>
        <p className="text-[11px] text-[#9A9A9A]">
          Si requerís generar contenido como vendedor, solicitá al administrador que habilite tu rol desde el panel de configuración de redes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Encabezado Principal y Pestañas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E5E5E3]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#F5F5F4] text-[#D7141A] border border-[#E5E5E3]">
              <Share2 className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-title font-bold text-[#161616] tracking-tight">
                Redes sociales
              </h1>
              <p className="text-xs text-[#6B6B6B]">
                Generá historias y publicaciones profesionales en 1080px con la identidad visual oficial de CARVLAK.
              </p>
            </div>
          </div>
        </div>

        {/* Selector de sub-pestañas */}
        <div className="flex items-center bg-[#F5F5F4] p-1 rounded-xl border border-[#E5E5E3] self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'studio'
                ? 'bg-white text-[#161616] shadow-sm'
                : 'text-[#6B6B6B] hover:text-[#161616]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Estudio creativo</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'templates'
                  ? 'bg-white text-[#161616] shadow-sm'
                  : 'text-[#6B6B6B] hover:text-[#161616]'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Plantillas</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-[#161616] shadow-sm'
                : 'text-[#6B6B6B] hover:text-[#161616]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial ({socialMediaPosts.length})</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'config'
                  ? 'bg-white text-[#161616] shadow-sm'
                  : 'text-[#6B6B6B] hover:text-[#161616]'
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

      {activeTab === 'templates' && isAdmin && <SocialTemplateEditor />}

      {activeTab === 'history' && <SocialHistorySection />}

      {activeTab === 'config' && isAdmin && <SocialConfigSection />}
    </div>
  );
};
