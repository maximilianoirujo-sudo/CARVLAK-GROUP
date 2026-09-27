import React, { useState } from 'react';
import {
  Settings,
  Users,
  Instagram,
  MapPin,
  Phone,
  Save,
  Check,
  Edit,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { SocialMediaTemplateId, LogoPosition, SocialMediaTemplateConfig } from '../../../types';
import { INITIAL_SOCIAL_MEDIA_CONFIG } from '../../../lib/mockData';

export const SocialConfigSection: React.FC = () => {
  const { socialMediaConfig, updateSocialMediaConfig } = useData();
  const { showToast } = useToast();

  const [allowVendedor, setAllowVendedor] = useState(socialMediaConfig.allow_vendedor);
  const [instagramHandle, setInstagramHandle] = useState(socialMediaConfig.instagram_handle);
  const [locationName, setLocationName] = useState(socialMediaConfig.location_name);
  const [whatsappNumber, setWhatsappNumber] = useState(socialMediaConfig.whatsapp_number);

  // Edición de plantillas
  const [editingTemplateId, setEditingTemplateId] = useState<SocialMediaTemplateId | null>(null);
  const [templateDrafts, setTemplateDrafts] = useState<Record<SocialMediaTemplateId, SocialMediaTemplateConfig>>(
    socialMediaConfig.templates
  );

  const handleSaveGlobalConfig = () => {
    updateSocialMediaConfig({
      allow_vendedor: allowVendedor,
      instagram_handle: instagramHandle.trim(),
      location_name: locationName.trim(),
      whatsapp_number: whatsappNumber.trim(),
      templates: templateDrafts
    });
    showToast('Configuración de redes sociales guardada', 'success');
  };

  const handleUpdateTemplateField = (
    templateId: SocialMediaTemplateId,
    field: keyof SocialMediaTemplateConfig,
    value: any
  ) => {
    setTemplateDrafts((prev) => ({
      ...prev,
      [templateId]: {
        ...prev[templateId],
        [field]: value
      }
    }));
  };

  const handleResetToDefaults = () => {
    setAllowVendedor(INITIAL_SOCIAL_MEDIA_CONFIG.allow_vendedor);
    setInstagramHandle(INITIAL_SOCIAL_MEDIA_CONFIG.instagram_handle);
    setLocationName(INITIAL_SOCIAL_MEDIA_CONFIG.location_name);
    setWhatsappNumber(INITIAL_SOCIAL_MEDIA_CONFIG.whatsapp_number);
    setTemplateDrafts(INITIAL_SOCIAL_MEDIA_CONFIG.templates);
    updateSocialMediaConfig(INITIAL_SOCIAL_MEDIA_CONFIG);
    showToast('Valores restaurados por defecto de CARVLAK', 'info');
  };

  return (
    <div className="space-y-6">
      {/* 1. CONFIGURACIÓN GENERAL Y PERMISOS */}
      <div className="bg-[#141414] p-6 rounded-3xl border border-[#2A2A2A] shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#D7141A]" />
              Configuración General y Permisos
            </h2>
            <p className="text-xs text-[#8A8A8A]">
              Definí quiénes pueden generar piezas y los datos oficiales de contacto de CARVLAK.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="px-3.5 py-2 rounded-xl bg-black border border-[#2A2A2A] text-xs font-semibold text-[#8A8A8A] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Predeterminados</span>
            </button>

            <button
              type="button"
              onClick={handleSaveGlobalConfig}
              className="px-4 py-2 rounded-xl bg-[#D7141A] hover:bg-[#B51015] text-xs font-bold text-white flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>

        {/* Permisos por Rol */}
        <div className="p-4 rounded-2xl bg-black border border-[#2A2A2A] flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-[#D7141A] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-xs text-white">
                Permiso para Rol Vendedor
              </div>
              <p className="text-[11px] text-[#8A8A8A] mt-0.5">
                Por defecto, Administradores y Encargados tienen acceso completo. Activá esta opción para permitir que los Vendedores creen imágenes y compartan piezas.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={allowVendedor}
              onChange={(e) => setAllowVendedor(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#2A2A2A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D7141A]"></div>
          </label>
        </div>

        {/* Datos Oficiales de Contacto */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <Instagram className="w-3.5 h-3.5 text-[#D7141A]" />
              Usuario de Instagram
            </label>
            <input
              type="text"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              placeholder="@car.vlak"
              className="w-full bg-black border border-[#2A2A2A] rounded-xl p-3 text-white font-mono focus:border-[#D7141A] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#D7141A]" />
              Teléfono WhatsApp CTA
            </label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="099 123 456"
              className="w-full bg-black border border-[#2A2A2A] rounded-xl p-3 text-white font-mono focus:border-[#D7141A] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#D7141A]" />
              Ubicación de Referencia
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Shangrilá, Canelones"
              className="w-full bg-black border border-[#2A2A2A] rounded-xl p-3 text-white focus:border-[#D7141A] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. GESTOR DE PLANTILLAS OFICIALES */}
      <div className="bg-[#141414] p-6 rounded-3xl border border-[#2A2A2A] shadow-md space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Edit className="w-4 h-4 text-[#D7141A]" />
            Personalización de Plantillas Oficiales
          </h2>
          <p className="text-xs text-[#8A8A8A]">
            Ajustá sellos predeterminados, textos sugeridos y la ubicación por defecto del logo en cada formato.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {Object.values(templateDrafts).map((template) => {
            const isEditing = editingTemplateId === template.id;

            return (
              <div
                key={template.id}
                className="bg-black rounded-2xl border border-[#2A2A2A] p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D7141A]"></span>
                    <span>{template.title}</span>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#141414] text-[#8A8A8A] border border-[#2A2A2A]">
                    {template.category}
                  </span>
                </div>

                <p className="text-[11px] text-[#8A8A8A]">
                  {template.description}
                </p>

                {/* Campos configurables */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <label className="text-[10px] text-[#8A8A8A] uppercase font-bold block mb-1">
                      Sello por defecto
                    </label>
                    <input
                      type="text"
                      value={template.stamp_text || ''}
                      onChange={(e) =>
                        handleUpdateTemplateField(template.id, 'stamp_text', e.target.value)
                      }
                      placeholder="Sin sello"
                      className="w-full bg-[#141414] border border-[#2A2A2A] rounded-xl p-2 text-white text-xs uppercase focus:border-[#D7141A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8A8A8A] uppercase font-bold block mb-1">
                      Posición del Logo
                    </label>
                    <select
                      value={template.logo_position}
                      onChange={(e) =>
                        handleUpdateTemplateField(template.id, 'logo_position', e.target.value as LogoPosition)
                      }
                      className="w-full bg-[#141414] border border-[#2A2A2A] rounded-xl p-2 text-white text-xs focus:border-[#D7141A] focus:outline-none cursor-pointer"
                    >
                      <option value="top-left">Superior Izq</option>
                      <option value="top-center">Superior Centro</option>
                      <option value="top-right">Superior Der</option>
                      <option value="bottom-left">Inferior Izq</option>
                      <option value="bottom-right">Inferior Der</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
