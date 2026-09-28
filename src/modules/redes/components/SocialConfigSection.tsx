import React, { useState } from 'react';
import {
  Settings,
  Users,
  Instagram,
  MapPin,
  Phone,
  Save,
  RotateCcw,
  Share2,
  Shield,
  Zap,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertTriangle,
  Key,
  Download,
  Globe
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import {
  SocialMediaTemplateConfig,
  MetaInstagramConfig,
  SocialAutoTriggersConfig
} from '../../../types';
import { INITIAL_SOCIAL_MEDIA_CONFIG } from '../../../lib/mockData';
import { Button } from '../../../components/ui/Button';

export const SocialConfigSection: React.FC = () => {
  const { socialMediaConfig, updateSocialMediaConfig } = useData();
  const { showToast } = useToast();

  // Estados de datos generales y permisos
  const [allowVendedor, setAllowVendedor] = useState(socialMediaConfig.allow_vendedor);
  const [vendedorCanPublish, setVendedorCanPublish] = useState(socialMediaConfig.vendedor_can_publish ?? false);
  const [instagramHandle, setInstagramHandle] = useState(socialMediaConfig.instagram_handle);
  const [locationName, setLocationName] = useState(socialMediaConfig.location_name);
  const [whatsappNumber, setWhatsappNumber] = useState(socialMediaConfig.whatsapp_number);

  // Acción por defecto al generar pieza
  const [defaultAction, setDefaultAction] = useState<'download' | 'share' | 'instagram_direct'>(
    socialMediaConfig.meta_instagram?.defaultPublishAction || 'share'
  );

  // Configuración de Meta Graph API
  const [metaConfig, setMetaConfig] = useState<MetaInstagramConfig>({
    enabled: socialMediaConfig.meta_instagram?.enabled ?? false,
    businessAccountId: socialMediaConfig.meta_instagram?.businessAccountId || '17841400000000000',
    appId: socialMediaConfig.meta_instagram?.appId || '987654321098765',
    defaultPublishAction: socialMediaConfig.meta_instagram?.defaultPublishAction || 'share',
    hasBackendProxy: socialMediaConfig.meta_instagram?.hasBackendProxy ?? true,
    backendEndpoint: socialMediaConfig.meta_instagram?.backendEndpoint || 'https://api.carvlak.uy/functions/v1/publish-instagram',
    autoSchedule: socialMediaConfig.meta_instagram?.autoSchedule ?? false
  });

  // Automatizaciones sugeridas mapeadas a plantillas
  const [autoTriggers, setAutoTriggers] = useState<SocialAutoTriggersConfig>({
    onVehicleSold: socialMediaConfig.auto_triggers?.onVehicleSold ?? true,
    onVehicleSoldTemplateId: socialMediaConfig.auto_triggers?.onVehicleSoldTemplateId || 'auto-vendido',
    onVehicleNewEntry: socialMediaConfig.auto_triggers?.onVehicleNewEntry ?? true,
    onVehicleNewEntryTemplateId: socialMediaConfig.auto_triggers?.onVehicleNewEntryTemplateId || 'auto-nuevo-ingreso',
    onVehicleStaleStock: socialMediaConfig.auto_triggers?.onVehicleStaleStock ?? true,
    onVehicleStaleStockDays: socialMediaConfig.auto_triggers?.onVehicleStaleStockDays ?? 60,
    onVehicleStaleStockTemplateId: socialMediaConfig.auto_triggers?.onVehicleStaleStockTemplateId || 'auto-descuento',
    onDetailingDone: socialMediaConfig.auto_triggers?.onDetailingDone ?? true,
    onDetailingDoneTemplateId: socialMediaConfig.auto_triggers?.onDetailingDoneTemplateId || 'detailing-antes-despues',
    onMondayCatalog: socialMediaConfig.auto_triggers?.onMondayCatalog ?? false,
    onMondayCatalogTemplateId: socialMediaConfig.auto_triggers?.onMondayCatalogTemplateId || 'auto-catalogo-semana'
  });

  const handleSaveGlobalConfig = () => {
    updateSocialMediaConfig({
      allow_vendedor: allowVendedor,
      vendedor_can_publish: vendedorCanPublish,
      instagram_handle: instagramHandle.trim(),
      location_name: locationName.trim(),
      whatsapp_number: whatsappNumber.trim(),
      meta_instagram: {
        ...metaConfig,
        defaultPublishAction: defaultAction
      },
      auto_triggers: autoTriggers
    });
    showToast('Configuración de redes sociales y publicación guardada', 'success');
  };

  const handleResetToDefaults = () => {
    setAllowVendedor(INITIAL_SOCIAL_MEDIA_CONFIG.allow_vendedor);
    setVendedorCanPublish(false);
    setInstagramHandle(INITIAL_SOCIAL_MEDIA_CONFIG.instagram_handle);
    setLocationName(INITIAL_SOCIAL_MEDIA_CONFIG.location_name);
    setWhatsappNumber(INITIAL_SOCIAL_MEDIA_CONFIG.whatsapp_number);
    setDefaultAction('share');
    if (INITIAL_SOCIAL_MEDIA_CONFIG.meta_instagram) {
      setMetaConfig(INITIAL_SOCIAL_MEDIA_CONFIG.meta_instagram);
    }
    if (INITIAL_SOCIAL_MEDIA_CONFIG.auto_triggers) {
      setAutoTriggers(INITIAL_SOCIAL_MEDIA_CONFIG.auto_triggers);
    }
    updateSocialMediaConfig(INITIAL_SOCIAL_MEDIA_CONFIG);
    showToast('Valores restaurados por defecto de CARVLAK', 'info');
  };

  return (
    <div className="space-y-6">
      {/* 1. CONFIGURACIÓN GENERAL Y CONTACTO OFICIAL */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5E5E3] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#161616] flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#D7141A]" />
              Configuración general y datos de contacto
            </h2>
            <p className="text-xs text-[#6B6B6B]">
              Parámetros institucionales que se imprimen en los pies de imagen y llamados a la acción.
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

            <Button
              type="button"
              variant="primary"
              onClick={handleSaveGlobalConfig}
              className="text-xs font-bold uppercase tracking-wider h-10 px-4"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              <span>Guardar configuración</span>
            </Button>
          </div>
        </div>

        {/* Datos Oficiales de Contacto */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-[#6B6B6B] block mb-1.5 flex items-center gap-1.5">
              <Instagram className="w-3.5 h-3.5 text-[#D7141A]" />
              Usuario oficial de Instagram
            </label>
            <input
              type="text"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              placeholder="@car.vlak"
              className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-3 text-[#161616] font-mono text-xs focus:bg-white focus:border-[#161616] focus:outline-none"
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
              className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-3 text-[#161616] font-mono text-xs focus:bg-white focus:border-[#161616] focus:outline-none"
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
              className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-3 text-[#161616] text-xs focus:bg-white focus:border-[#161616] focus:outline-none"
            />
          </div>
        </div>

        {/* Acción por Defecto al Generar */}
        <div className="pt-2 border-t border-[#E5E5E3] space-y-2">
          <label className="text-xs font-bold text-[#161616] uppercase tracking-wider block">
            Acción predeterminada al generar una pieza
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'share',
                title: 'Compartir vía Web Share',
                desc: 'Abre Instagram Stories o Feed directamente en celulares con la imagen adjunta.'
              },
              {
                id: 'download',
                title: 'Descargar archivo HD',
                desc: 'Descarga el archivo PNG en 1080px al dispositivo y copia el copy.'
              },
              {
                id: 'instagram_direct',
                title: 'Publicar directo (Meta API)',
                desc: 'Envía la imagen a Instagram @car.vlak a través de la API oficial.'
              }
            ].map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => setDefaultAction(action.id as any)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  defaultAction === action.id
                    ? 'border-2 border-[#D7141A] bg-[#FDF2F2]/30 shadow-sm'
                    : 'border-[#E5E5E3] hover:border-[#D0D0CD] bg-white'
                }`}
              >
                <div className="font-title font-bold text-xs text-[#161616]">{action.title}</div>
                <p className="text-[11px] text-[#6B6B6B] mt-1 leading-relaxed">{action.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. GOBERNANZA Y PERMISOS POR ROL */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5E5E3] shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#161616] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#D7141A]" />
            Permisos de acceso y publicación por rol
          </h2>
          <p className="text-xs text-[#6B6B6B]">
            Controlá qué funciones tienen habilitadas los vendedores de CARVLAK.
          </p>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-xs text-[#161616]">
                Acceso al Estudio para vendedores
              </div>
              <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                Permite que los usuarios con rol vendedor puedan entrar al Estudio y generar piezas visuales.
              </p>
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

          <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-xs text-[#161616]">
                Publicación directa para vendedores
              </div>
              <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                Si está desactivado, los vendedores solo pueden descargar la imagen o enviarla a revisión antes de publicarla en la cuenta oficial.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={vendedorCanPublish}
                onChange={(e) => setVendedorCanPublish(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#D0D0CD] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D7141A]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 3. EVALUACIÓN TÉCNICA & CONEXIÓN META GRAPH API (INSTAGRAM @CAR.VLAK) */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5E5E3] shadow-sm space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#161616] flex items-center gap-2">
              <Instagram className="w-4 h-4 text-[#D7141A]" />
              Evaluación técnica: Publicación directa en Instagram (@car.vlak)
            </h2>
            <p className="text-xs text-[#6B6B6B]">
              Análisis de viabilidad, arquitectura de seguridad y conexión con Meta Graph API.
            </p>
          </div>

          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#EEF7F2] text-[#1E6B43] border border-[#CDE9D9] flex items-center gap-1.5 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Viabilidad técnica: Aprobada</span>
          </span>
        </div>

        {/* Explicación Técnica y Requisitos Reales */}
        <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E5E3] space-y-3 text-xs">
          <div className="font-bold text-[#161616] flex items-center gap-1.5">
            <Info className="w-4 h-4 text-[#D7141A]" />
            <span>Requisitos y funcionamiento de la API oficial de Meta para publicar en @car.vlak:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-[#6B6B6B] leading-relaxed">
            <div className="p-3 bg-white rounded-xl border border-[#E5E5E3] space-y-1.5">
              <div className="font-bold text-[#161616]">1. Publicación en el Feed (Formato 4:5 / 1:1)</div>
              <p>
                <strong>100% Viable:</strong> Meta Content Publishing API permite subir imágenes y programar posts automáticamente enviando la URL pública de la imagen y el texto a los endpoints oficiales de Graph API.
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-[#E5E5E3] space-y-1.5">
              <div className="font-bold text-[#161616]">2. Publicación de Stories (Formato 9:16)</div>
              <p>
                <strong>Requiere App Review:</strong> Las Stories directas vía API exigen aprobación de Meta (Advanced Access). Por ello, el flujo recomendado y sin fricción es <strong>Web Share API nativa</strong> en celulares.
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-[#E5E5E3] space-y-1.5">
              <div className="font-bold text-[#161616]">3. Almacenamiento público con HTTPS</div>
              <p>
                Meta Graph API <strong>no acepta subidas en base64 ni transferencias binarias directas</strong> al crear contenedores de medios; exige que la imagen resida en una URL pública con HTTPS (ej: Supabase Storage).
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-[#E5E5E3] space-y-1.5">
              <div className="font-bold text-[#161616]">4. Seguridad de Credenciales (Anti-Baneo)</div>
              <p>
                Los tokens de acceso de larga duración y el App Secret de Meta <strong>NUNCA deben exponerse en el código del navegador</strong>. Se ejecutan en un microservicio backend (Supabase Edge Function).
              </p>
            </div>
          </div>
        </div>

        {/* Campos de Conexión de Meta Graph API */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#161616] uppercase tracking-wider">
              Credenciales e Identificadores de Meta Business
            </span>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={metaConfig.enabled}
                onChange={(e) => setMetaConfig({ ...metaConfig, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#D0D0CD] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D7141A]"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-[#6B6B6B] block mb-1">
                Instagram Business Account ID
              </label>
              <input
                type="text"
                value={metaConfig.businessAccountId}
                onChange={(e) => setMetaConfig({ ...metaConfig, businessAccountId: e.target.value })}
                placeholder="17841400000000000"
                className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] font-mono text-xs focus:bg-white focus:border-[#161616] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#6B6B6B] block mb-1">
                Meta App ID (Facebook Developers)
              </label>
              <input
                type="text"
                value={metaConfig.appId}
                onChange={(e) => setMetaConfig({ ...metaConfig, appId: e.target.value })}
                placeholder="987654321098765"
                className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] font-mono text-xs focus:bg-white focus:border-[#161616] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#6B6B6B] block mb-1">
              Endpoint del Proxy Seguro (Supabase Edge Function)
            </label>
            <input
              type="text"
              value={metaConfig.backendEndpoint || ''}
              onChange={(e) => setMetaConfig({ ...metaConfig, backendEndpoint: e.target.value })}
              placeholder="https://api.carvlak.uy/functions/v1/publish-instagram"
              className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] font-mono text-xs focus:bg-white focus:border-[#161616] focus:outline-none"
            />
            <p className="text-[11px] text-[#6B6B6B] mt-1">
              Este endpoint procesa la subida al bucket de Supabase y efectúa el llamado seguro a la API de Meta sin exponer tokens en el celular o computadora.
            </p>
          </div>
        </div>
      </div>

      {/* 4. AUTOMATIZACIONES Y DISPARADORES SUGERIDOS */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5E5E3] shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#161616] flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#D7141A]" />
            Automatizaciones y sugerencias automáticas de publicación
          </h2>
          <p className="text-xs text-[#6B6B6B]">
            La app detecta hitos operativos y prepara la pieza gráfica con la plantilla correspondiente.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              title: 'Auto vendido: Generar historia de festejo',
              desc: 'Al registrar una venta en Automotora, sugiere pre-cargar la plantilla "VENDIDO" con la foto de portada.',
              checked: autoTriggers.onVehicleSold,
              onChange: (val: boolean) => setAutoTriggers({ ...autoTriggers, onVehicleSold: val }),
              templateName: 'Auto Vendido Oficial'
            },
            {
              title: 'Nuevo ingreso a stock: Publicación de bienvenida',
              desc: 'Al guardar una nueva unidad en estado disponible con fotos cargadas, sugiere compartir "NUEVO INGRESO".',
              checked: autoTriggers.onVehicleNewEntry,
              onChange: (val: boolean) => setAutoTriggers({ ...autoTriggers, onVehicleNewEntry: val }),
              templateName: 'Nuevo Ingreso'
            },
            {
              title: 'Stock estancado (>60 días): Oferta o descuento sugerido',
              desc: 'Alerta sobre unidades con más de 60 días sin vender para sugerir publicar una rebaja de precio en Stories.',
              checked: autoTriggers.onVehicleStaleStock,
              onChange: (val: boolean) => setAutoTriggers({ ...autoTriggers, onVehicleStaleStock: val }),
              templateName: 'Auto Descuento / Oferta'
            },
            {
              title: 'Detailing completado: Antes y Después',
              desc: 'Al marcar un servicio de Detailing como "Finalizado" con fotos antes/después, sugiere armar la comparativa 50/50.',
              checked: autoTriggers.onDetailingDone,
              onChange: (val: boolean) => setAutoTriggers({ ...autoTriggers, onDetailingDone: val }),
              templateName: 'Antes y Después'
            },
            {
              title: 'Catálogo de los lunes: Resumen semanal de stock',
              desc: 'Notifica los lunes por la mañana para compartir una historia con el carrusel de unidades destacadas.',
              checked: autoTriggers.onMondayCatalog,
              onChange: (val: boolean) => setAutoTriggers({ ...autoTriggers, onMondayCatalog: val }),
              templateName: 'Catálogo de la Semana'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] flex items-center justify-between gap-4"
            >
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[#161616] flex items-center gap-2">
                  <span>{item.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white text-[#6B6B6B] border border-[#E5E5E3]">
                    {item.templateName}
                  </span>
                </div>
                <p className="text-[11px] text-[#6B6B6B] leading-relaxed">{item.desc}</p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => item.onChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#D0D0CD] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D7141A]"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
