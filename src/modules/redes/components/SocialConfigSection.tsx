import React, { useState } from 'react';
import {
  Settings,
  Users,
  Instagram,
  MapPin,
  Phone,
  Save,
  Edit,
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
      <div className="bg-white p-6 rounded-2xl border border-[#E5E5E3] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#161616] flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#D7141A]" />
              Configuración general y permisos
            </h2>
            <p className="text-xs text-[#6B6B6B]">
              Definí quiénes pueden generar piezas y los datos oficiales de contacto de CARVLAK.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E5E3] text-xs font-medium text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar predeterminados</span>
            </button>

            <button
              type="button"
              onClick={handleSaveGlobalConfig}
              className="px-4 py-2 rounded-xl bg-[#D7141A] hover:bg-[#B80E14] text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar cambios</span>
            </button>
          </div>
        </div>

        {/* Permisos por Rol */}
        <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-[#D7141A] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-xs text-[#161616]">
                Permiso para rol vendedor
              </div>
              <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                Por defecto, administradores y encargados tienen acceso completo. Activá esta opción para permitir que los vendedores creen imágenes y compartan piezas.
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
            <div className="w-11 h-6 bg-[#D0D0CD] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D7141A]"></div>
          </label>
        </div>

        {/* Datos Oficiales de Contacto */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-[#6B6B6B] block mb-1.5 flex items-center gap-1.5">
              <Instagram className="w-3.5 h-3.5 text-[#D7141A]" />
              Usuario de Instagram
            </label>
            <input
              type="text"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              placeholder="@car.vlak"
              className="w-full bg-white border border-[#E5E5E3] rounded-xl p-3 text-[#161616] font-mono text-xs focus:border-[#D7141A] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#6B6B6B] block mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#D7141A]" />
              Teléfono WhatsApp CTA
            </label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="099 123 456"
              className="w-full bg-white border border-[#E5E5E3] rounded-xl p-3 text-[#161616] font-mono text-xs focus:border-[#D7141A] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#6B6B6B] block mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#D7141A]" />
              Ubicación de referencia
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Shangrilá, Canelones"
              className="w-full bg-white border border-[#E5E5E3] rounded-xl p-3 text-[#161616] text-xs focus:border-[#D7141A] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. GESTOR DE PLANTILLAS OFICIALES */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5E5E3] shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#161616] flex items-center gap-2">
            <Edit className="w-4 h-4 text-[#D7141A]" />
            Personalización de plantillas oficiales
          </h2>
          <p className="text-xs text-[#6B6B6B]">
            Ajustá sellos predeterminados, textos sugeridos y la ubicación por defecto del logo en cada formato.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {Object.values(templateDrafts).map((template) => {
            return (
              <div
                key={template.id}
                className="bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xs text-[#161616] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D7141A]"></span>
                    <span>{template.title}</span>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white text-[#6B6B6B] border border-[#E5E5E3]">
                    {template.category}
                  </span>
                </div>

                <p className="text-[11px] text-[#6B6B6B]">
                  {template.description}
                </p>

                {/* Campos configurables */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <label className="text-[10px] text-[#6B6B6B] font-semibold block mb-1">
                      Sello por defecto
                    </label>
                    <input
                      type="text"
                      value={template.stamp_text || ''}
                      onChange={(e) =>
                        handleUpdateTemplateField(template.id, 'stamp_text', e.target.value)
                      }
                      placeholder="Sin sello"
                      className="w-full bg-white border border-[#E5E5E3] rounded-xl p-2 text-[#161616] text-xs focus:border-[#D7141A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#6B6B6B] font-semibold block mb-1">
                      Posición del logo
                    </label>
                    <select
                      value={template.logo_position}
                      onChange={(e) =>
                        handleUpdateTemplateField(template.id, 'logo_position', e.target.value as LogoPosition)
                      }
                      className="w-full bg-white border border-[#E5E5E3] rounded-xl p-2 text-[#161616] text-xs focus:border-[#D7141A] focus:outline-none cursor-pointer"
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
