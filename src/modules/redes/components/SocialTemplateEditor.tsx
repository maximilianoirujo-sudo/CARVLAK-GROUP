import React, { useState, useMemo, useEffect } from 'react';
import {
  Palette,
  Layers,
  Sparkles,
  RotateCcw,
  Copy,
  Trash2,
  Check,
  Plus,
  ArrowLeft,
  Sliders,
  Type,
  Eye,
  Shield,
  Send,
  MoveUp,
  MoveDown,
  DollarSign,
  Car,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Save
} from 'lucide-react';
import {
  SocialMediaCategory,
  SocialMediaFormat,
  SocialMediaTemplateConfig,
  FormatLayoutConfig,
  TemplateBackgroundMode,
  TemplateLogoVersion,
  TemplateFontFamily,
  LogoPosition,
  DealershipVehicle
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/ui/Button';
import { SocialCanvasPreview } from './SocialCanvasPreview';
import { formatCurrency } from '../../../lib/formatters';
import { INITIAL_SOCIAL_MEDIA_CONFIG } from '../../../lib/mockData';

const DEFAULT_LAYOUT_STORY: FormatLayoutConfig = {
  backgroundMode: 'full_photo',
  backgroundColor: '#0a0a0a',
  vignetteOpacity: 0.85,
  logoVersion: 'blanco',
  logoPosition: 'top-left',
  coverPlateDefault: false,
  showStamp: true,
  stampText: '',
  stampColor: '#D7141A',
  stampRotation: -12,
  fontFamily: 'Archivo Narrow',
  fontScale: 'normal',
  showPrice: true,
  showOriginalPrice: false,
  priceColor: '#D7141A',
  specsSelection: ['year', 'mileage', 'fuel', 'transmission'],
  specsOrder: ['year', 'mileage', 'fuel', 'transmission', 'engine', 'range_km'],
  ctaText: 'CARVLAK Group',
  phoneText: '099 123 456'
};

const DEFAULT_LAYOUT_POST: FormatLayoutConfig = {
  ...DEFAULT_LAYOUT_STORY,
  vignetteOpacity: 0.80,
  stampRotation: -10
};

const SPEC_LABELS: Record<string, string> = {
  year: 'Año del vehículo',
  mileage: 'Kilometraje',
  fuel: 'Combustible',
  transmission: 'Transmisión',
  engine: 'Motorización',
  range_km: 'Autonomía (Eléctricos)'
};

const BRAND_COLORS = [
  { label: 'Rojo CARVLAK', value: '#D7141A' },
  { label: 'Amarillo Oferta', value: '#EAB308' },
  { label: 'Verde Eléctrico', value: '#22C55E' },
  { label: 'Blanco Puro', value: '#FFFFFF' },
  { label: 'Negro Profundo', value: '#0A0A0A' },
  { label: 'Gris Grafito', value: '#222222' }
];

export const SocialTemplateEditor: React.FC = () => {
  const {
    socialMediaConfig,
    saveSocialTemplate,
    duplicateSocialTemplate,
    deleteSocialTemplate,
    toggleSocialTemplateActive,
    resetSocialTemplateToDefault,
    dealershipVehicles
  } = useData();

  const { showToast } = useToast();

  // Estados de vista
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<'todas' | SocialMediaCategory>('todas');

  // Estados del editor activo
  const [activeFormat, setActiveFormat] = useState<SocialMediaFormat>('story');
  const [editorTemplate, setEditorTemplate] = useState<SocialMediaTemplateConfig | null>(null);
  const [selectedSampleCarId, setSelectedSampleCarId] = useState<string>('');
  const [activeControlTab, setActiveControlTab] = useState<'car' | 'fondo' | 'logo' | 'sello' | 'texto' | 'precios' | 'specs' | 'contacto'>('fondo');

  // Auto de muestra seleccionado para preview
  const sampleCar: DealershipVehicle = useMemo(() => {
    return (
      dealershipVehicles.find((v) => v.id === selectedSampleCarId) ||
      dealershipVehicles[0]
    );
  }, [dealershipVehicles, selectedSampleCarId]);

  // Lista de plantillas ordenada
  const templatesList = useMemo(() => {
    const list = Object.values(socialMediaConfig.templates);
    if (filterCategory === 'todas') return list;
    return list.filter((t) => t.category === filterCategory);
  }, [socialMediaConfig.templates, filterCategory]);

  // Iniciar edición de una plantilla
  const handleStartEdit = (template: SocialMediaTemplateConfig) => {
    const storyConfig: FormatLayoutConfig = {
      ...DEFAULT_LAYOUT_STORY,
      stampText: template.stamp_text || '',
      logoPosition: template.logo_position || 'top-left',
      ...(template.layout_story || {})
    };

    const postConfig: FormatLayoutConfig = {
      ...DEFAULT_LAYOUT_POST,
      stampText: template.stamp_text || '',
      logoPosition: template.logo_position || 'top-left',
      ...(template.layout_post || {})
    };

    setEditorTemplate({
      ...template,
      layout_story: storyConfig,
      layout_post: postConfig
    });
    setEditingTemplateId(template.id);
    if (dealershipVehicles.length > 0 && !selectedSampleCarId) {
      setSelectedSampleCarId(dealershipVehicles[0].id);
    }
  };

  // Crear nueva plantilla desde cero
  const handleCreateNewTemplate = () => {
    const newId = `plantilla-custom-${Date.now()}`;
    const newTemplate: SocialMediaTemplateConfig = {
      id: newId,
      title: 'Nueva plantilla personalizada',
      category: 'automotora',
      description: 'Plantilla personalizada con diseño a medida para el equipo.',
      is_active: true,
      is_custom: true,
      stamp_text: 'DESTACADO',
      logo_position: 'top-left',
      default_caption_template: '¡Descubrí esta nueva oportunidad en CARVLAK!\n\n📲 Consultas por MD o WhatsApp al {phone}.\n📍 {location}',
      default_hashtags: '#Carvlak #AutosUruguay #Oportunidad',
      layout_story: { ...DEFAULT_LAYOUT_STORY, stampText: 'DESTACADO' },
      layout_post: { ...DEFAULT_LAYOUT_POST, stampText: 'DESTACADO' }
    };
    setEditorTemplate(newTemplate);
    setEditingTemplateId(newId);
    showToast('Nueva plantilla creada. Podés personalizar su diseño.', 'info');
  };

  // Guardar plantilla editada
  const handleSaveTemplate = () => {
    if (!editorTemplate) return;
    saveSocialTemplate(editorTemplate);
    showToast(`Plantilla "${editorTemplate.title}" guardada correctamente`, 'success');
  };

  // Guardar y volver a la galería
  const handleSaveAndClose = () => {
    if (!editorTemplate) return;
    saveSocialTemplate(editorTemplate);
    showToast(`Plantilla "${editorTemplate.title}" guardada`, 'success');
    setEditingTemplateId(null);
  };

  // Duplicar plantilla
  const handleDuplicate = (templateId: string) => {
    const dup = duplicateSocialTemplate(templateId);
    if (dup) {
      showToast(`Plantilla duplicada como "${dup.title}"`, 'success');
    }
  };

  // Eliminar plantilla personalizada
  const handleDelete = (templateId: string, title: string) => {
    if (window.confirm(`¿Seguro que querés eliminar la plantilla "${title}"?`)) {
      deleteSocialTemplate(templateId);
      showToast('Plantilla eliminada', 'info');
    }
  };

  // Restaurar plantilla predeterminada a valores de fábrica
  const handleResetToDefault = (templateId: string) => {
    if (window.confirm('¿Restaurar el diseño original oficial de CARVLAK para esta plantilla?')) {
      resetSocialTemplateToDefault(templateId);
      showToast('Diseño original restaurado', 'info');
      if (editingTemplateId === templateId) {
        const resetTpl = INITIAL_SOCIAL_MEDIA_CONFIG.templates[templateId];
        if (resetTpl) {
          handleStartEdit(resetTpl);
        }
      }
    }
  };

  // Actualizar configuración del formato activo (story o post)
  const currentFormatLayout: FormatLayoutConfig = useMemo(() => {
    if (!editorTemplate) return DEFAULT_LAYOUT_STORY;
    if (activeFormat === 'story') {
      return editorTemplate.layout_story || DEFAULT_LAYOUT_STORY;
    }
    return editorTemplate.layout_post || DEFAULT_LAYOUT_POST;
  }, [editorTemplate, activeFormat]);

  const updateCurrentFormatLayout = (updates: Partial<FormatLayoutConfig>) => {
    if (!editorTemplate) return;
    setEditorTemplate((prev) => {
      if (!prev) return prev;
      const targetKey = activeFormat === 'story' ? 'layout_story' : 'layout_post';
      const existing = prev[targetKey] || (activeFormat === 'story' ? DEFAULT_LAYOUT_STORY : DEFAULT_LAYOUT_POST);
      return {
        ...prev,
        [targetKey]: {
          ...existing,
          ...updates
        }
      };
    });
  };

  // Copiar diseño de Story a Post o viceversa
  const handleCopyLayoutAcrossFormats = () => {
    if (!editorTemplate) return;
    const sourceKey = activeFormat === 'story' ? 'layout_story' : 'layout_post';
    const targetKey = activeFormat === 'story' ? 'layout_post' : 'layout_story';
    const sourceLayout = editorTemplate[sourceKey] || DEFAULT_LAYOUT_STORY;

    setEditorTemplate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [targetKey]: { ...sourceLayout }
      };
    });
    showToast(`Diseño copiado al formato ${activeFormat === 'story' ? 'Feed (4:5)' : 'Historia (9:16)'}`, 'success');
  };

  // Specs computadas para el auto de muestra según la selección y el orden
  const sampleCarSpecs = useMemo(() => {
    const list: string[] = [];
    const selection = currentFormatLayout.specsSelection || [];
    const order = currentFormatLayout.specsOrder || ['year', 'mileage', 'fuel', 'transmission', 'engine', 'range_km'];

    order.forEach((key) => {
      if (!selection.includes(key)) return;
      if (key === 'year' && sampleCar.year) list.push(`Año ${sampleCar.year}`);
      if (key === 'mileage' && sampleCar.mileage) list.push(`${sampleCar.mileage.toLocaleString('es-UY')} km`);
      if (key === 'fuel' && sampleCar.fuel) list.push(sampleCar.fuel);
      if (key === 'transmission' && sampleCar.transmission) list.push(sampleCar.transmission);
      if (key === 'engine' && sampleCar?.engine) list.push(sampleCar.engine);
      if (key === 'range_km' && sampleCar?.autonomy_km) list.push(`${sampleCar.autonomy_km} km autonomía`);
    });

    return list;
  }, [sampleCar, currentFormatLayout]);

  const sampleCarPrice = useMemo(() => {
    return sampleCar.sale_price
      ? formatCurrency(sampleCar.sale_price, sampleCar.sale_currency || 'USD')
      : 'Consultar precio';
  }, [sampleCar]);

  // Si no estamos editando ninguna plantilla: VISTA DE GALERÍA
  if (!editingTemplateId || !editorTemplate) {
    return (
      <div className="space-y-6">
        {/* Encabezado y Barra de Filtros */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E5E3] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#161616] flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#D7141A]" />
                Diseñador visual de plantillas de redes
              </h2>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Personalizá elementos, tipografías, sellos y formatos de cada plantilla para el equipo.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={handleCreateNewTemplate}
              className="text-xs font-bold uppercase tracking-wider h-10 px-4 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Nueva plantilla</span>
            </Button>
          </div>

          {/* Filtros por Categoría */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#E5E5E3]">
            <span className="text-[11px] font-bold text-[#6B6B6B] uppercase mr-2">Filtrar:</span>
            {(['todas', 'automotora', 'detailing', 'inspeccion'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer whitespace-nowrap ${
                  filterCategory === cat
                    ? 'bg-[#161616] text-white'
                    : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] hover:bg-[#EBEBEA]'
                }`}
              >
                {cat === 'todas' ? 'Todas las plantillas' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grilla de Plantillas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templatesList.map((template) => {
            const isActive = template.is_active !== false;
            const isCustom = template.is_custom === true;

            return (
              <div
                key={template.id}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between space-y-4 shadow-sm ${
                  isActive ? 'border-[#E5E5E3] hover:border-[#D0D0CD]' : 'border-[#E5E5E3] opacity-60 bg-[#FAFAFA]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#D7141A]" />
                        <h3 className="font-title font-bold text-sm text-[#161616] leading-tight">
                          {template.title}
                        </h3>
                      </div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]">
                        {template.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isCustom ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FDF2F2] text-[#D7141A] border border-[#FACDCD]">
                          Personalizada
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F5F5F4] text-[#6B6B6B]">
                          Oficial
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#6B6B6B] line-clamp-2 leading-relaxed">
                    {template.description}
                  </p>

                  {/* Badges de características */}
                  <div className="flex flex-wrap gap-1.5 text-[10px] pt-1">
                    {template.stamp_text && (
                      <span className="px-2 py-0.5 rounded bg-[#161616] text-white font-bold tracking-wider">
                        Sello: {template.stamp_text}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]">
                      Logo: {template.logo_position}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]">
                      9:16 + 4:5
                    </span>
                  </div>
                </div>

                {/* Acciones de la plantilla */}
                <div className="pt-3 border-t border-[#E5E5E3] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {/* Toggle Activa/Inactiva */}
                    <button
                      type="button"
                      title={isActive ? 'Desactivar plantilla' : 'Activar plantilla'}
                      onClick={() => toggleSocialTemplateActive(template.id)}
                      className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#EEF7F2] text-[#1E6B43] border-[#CDE9D9] hover:bg-[#D9EFE3]'
                          : 'bg-[#F5F5F4] text-[#8A8A8A] border-[#E5E5E3] hover:text-[#161616]'
                      }`}
                    >
                      {isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </button>

                    {/* Duplicar */}
                    <button
                      type="button"
                      title="Duplicar plantilla"
                      onClick={() => handleDuplicate(template.id)}
                      className="p-1.5 rounded-lg bg-white border border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] transition-colors cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Restaurar si es oficial */}
                    {!isCustom && (
                      <button
                        type="button"
                        title="Restaurar diseño original de fábrica"
                        onClick={() => handleResetToDefault(template.id)}
                        className="p-1.5 rounded-lg bg-white border border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}

                    {/* Eliminar si es custom */}
                    {isCustom && (
                      <button
                        type="button"
                        title="Eliminar plantilla"
                        onClick={() => handleDelete(template.id, template.title)}
                        className="p-1.5 rounded-lg bg-[#FDF2F2] border border-[#FACDCD] text-[#D7141A] hover:bg-[#FCE8E8] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Botón Editar Diseño */}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleStartEdit(template)}
                    className="text-xs font-bold"
                  >
                    <Sliders className="w-3.5 h-3.5 mr-1" />
                    <span>Editar diseño</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // MODO 2: EDITOR VISUAL INTERACTIVO CON PREVIEW EN TIEMPO REAL
  return (
    <div className="space-y-6">
      {/* Barra Superior del Editor */}
      <div className="bg-white p-5 rounded-2xl border border-[#E5E5E3] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditingTemplateId(null)}
            className="p-2 rounded-xl bg-[#F5F5F4] hover:bg-[#EBEBEA] text-[#161616] border border-[#E5E5E3] transition-colors cursor-pointer"
            title="Volver a la galería"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D7141A]" />
              <input
                type="text"
                value={editorTemplate.title}
                onChange={(e) => setEditorTemplate({ ...editorTemplate, title: e.target.value })}
                className="font-title font-bold text-base text-[#161616] bg-transparent border-b border-transparent hover:border-[#E5E5E3] focus:border-[#D7141A] focus:outline-none px-1"
              />
            </div>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Personalizando diseño para historias y publicaciones oficiales.
            </p>
          </div>
        </div>

        {/* Formato Switcher & Acciones */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Formato activo: Story (9:16) vs Post (4:5) */}
          <div className="flex items-center bg-[#F5F5F4] p-1 rounded-xl border border-[#E5E5E3]">
            <button
              type="button"
              onClick={() => setActiveFormat('story')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFormat === 'story'
                  ? 'bg-white text-[#161616] shadow-sm'
                  : 'text-[#6B6B6B] hover:text-[#161616]'
              }`}
            >
              Historia 9:16 (1080x1920)
            </button>
            <button
              type="button"
              onClick={() => setActiveFormat('post')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFormat === 'post'
                  ? 'bg-white text-[#161616] shadow-sm'
                  : 'text-[#6B6B6B] hover:text-[#161616]'
              }`}
            >
              Feed 4:5 (1080x1350)
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyLayoutAcrossFormats}
            title="Copiar ajustes de este formato al otro"
            className="px-3 py-2 rounded-xl bg-white border border-[#E5E5E3] text-xs font-semibold text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar al otro formato</span>
          </button>

          {!editorTemplate.is_custom && (
            <button
              type="button"
              onClick={() => handleResetToDefault(editorTemplate.id)}
              className="px-3 py-2 rounded-xl bg-white border border-[#E5E5E3] text-xs font-semibold text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar original</span>
            </button>
          )}

          {/* ÚNICO BOTÓN ROJO PRIMARIO */}
          <Button
            type="button"
            variant="primary"
            onClick={handleSaveAndClose}
            className="text-xs font-bold uppercase tracking-wider h-10 px-5 shadow-sm"
          >
            <Save className="w-4 h-4 mr-1.5" />
            <span>Guardar plantilla</span>
          </Button>
        </div>
      </div>

      {/* Editor a Dos Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: CONTROLES DE DISEÑO (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Navegación por pestañas de controles */}
          <div className="bg-white p-2 rounded-2xl border border-[#E5E5E3] shadow-sm flex items-center gap-1 overflow-x-auto text-xs font-bold">
            {[
              { id: 'fondo', label: '1. Fondo y Viñeta' },
              { id: 'logo', label: '2. Logo CARVLAK' },
              { id: 'sello', label: '3. Sello y Tag' },
              { id: 'texto', label: '4. Tipografía' },
              { id: 'precios', label: '5. Precios' },
              { id: 'specs', label: '6. Ficha técnica' },
              { id: 'car', label: '7. Auto muestra' },
              { id: 'contacto', label: '8. Caption y CTA' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveControlTab(tab.id as any)}
                className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  activeControlTab === tab.id
                    ? 'bg-[#161616] text-white shadow-sm'
                    : 'text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 1. CONTROL: FONDO Y VIÑETA */}
          {activeControlTab === 'fondo' && (
            <div className="bg-white p-6 rounded-2xl border border-[#E5E5E3] shadow-sm space-y-5 animate-fade-in">
              <h3 className="font-title font-bold text-sm text-[#161616]">
                Modo de fondo y tratamiento de imagen
              </h3>

              {/* Modo de fondo */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block">
                  Estilo de fondo
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'full_photo', title: 'Foto completa', desc: 'Foto cubre todo el fondo' },
                    { id: 'photo_with_band', title: 'Foto con franja', desc: 'Foto superior + franja oscura inferior' },
                    { id: 'flat_color', title: 'Fondo plano', desc: 'Color sólido con foto en tarjeta flotante' }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => updateCurrentFormatLayout({ backgroundMode: mode.id as TemplateBackgroundMode })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        currentFormatLayout.backgroundMode === mode.id
                          ? 'border-2 border-[#D7141A] bg-[#FDF2F2]/30 shadow-sm'
                          : 'border-[#E5E5E3] hover:border-[#D0D0CD] bg-white'
                      }`}
                    >
                      <div className="font-title font-bold text-xs text-[#161616]">{mode.title}</div>
                      <p className="text-[11px] text-[#6B6B6B] mt-0.5">{mode.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider de oscurecimiento de viñeta */}
              {currentFormatLayout.backgroundMode !== 'flat_color' && (
                <div className="space-y-2 pt-2 border-t border-[#E5E5E3]">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-[#6B6B6B] uppercase tracking-wider">
                      Viñeta / Oscurecimiento cinematográfico
                    </label>
                    <span className="font-mono font-bold text-[#D7141A]">
                      {Math.round((currentFormatLayout.vignetteOpacity ?? 0.85) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={currentFormatLayout.vignetteOpacity ?? 0.85}
                    onChange={(e) => updateCurrentFormatLayout({ vignetteOpacity: parseFloat(e.target.value) })}
                    className="w-full accent-[#D7141A] cursor-pointer"
                  />
                  <p className="text-[11px] text-[#6B6B6B]">
                    Asegura un alto contraste y legibilidad óptima para los textos y precios de CARVLAK.
                  </p>
                </div>
              )}

              {/* Color de fondo */}
              <div className="space-y-2 pt-2 border-t border-[#E5E5E3]">
                <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block">
                  Color de fondo (Franja o fondo plano)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {BRAND_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => updateCurrentFormatLayout({ backgroundColor: c.value })}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        currentFormatLayout.backgroundColor === c.value
                          ? 'border-2 border-[#D7141A] bg-white shadow-sm'
                          : 'border-[#E5E5E3] hover:border-[#D0D0CD] bg-[#F5F5F4]'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: c.value }} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. CONTROL: LOGO CARVLAK */}
          {activeControlTab === 'logo' && (
            <div className="bg-white p-6 rounded-2xl border border-[#E5E5E3] shadow-sm space-y-5 animate-fade-in">
              <h3 className="font-title font-bold text-sm text-[#161616]">
                Identidad institucional y logotipo oficial
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Versión del logo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block">
                    Versión del logo
                  </label>
                  <select
                    value={currentFormatLayout.logoVersion || 'blanco'}
                    onChange={(e) => updateCurrentFormatLayout({ logoVersion: e.target.value as TemplateLogoVersion })}
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-xs text-[#161616] font-semibold focus:border-[#D7141A] focus:outline-none cursor-pointer"
                  >
                    <option value="blanco">Blanco (Fondos oscuros y fotos)</option>
                    <option value="negro">Negro (Fondos claros o blancos)</option>
                    <option value="auto">Automático según el fondo</option>
                  </select>
                </div>

                {/* Posición del logo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block">
                    Ubicación del logo
                  </label>
                  <select
                    value={currentFormatLayout.logoPosition || 'top-left'}
                    onChange={(e) => updateCurrentFormatLayout({ logoPosition: e.target.value as LogoPosition })}
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-xs text-[#161616] font-semibold focus:border-[#D7141A] focus:outline-none cursor-pointer"
                  >
                    <option value="top-left">Superior izquierda (Recomendado)</option>
                    <option value="top-center">Superior centro</option>
                    <option value="top-right">Superior derecha</option>
                    <option value="bottom-left">Inferior izquierda</option>
                    <option value="bottom-right">Inferior derecha</option>
                  </select>
                </div>
              </div>

              {/* Tapar Matrícula por Defecto */}
              <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[#D7141A] shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-[#161616]">Tapar matrícula por defecto</div>
                    <p className="text-[11px] text-[#6B6B6B]">
                      Aplica el distintivo oficial CARVLAK sobre la chapa al cargar esta plantilla.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={currentFormatLayout.coverPlateDefault || false}
                    onChange={(e) => updateCurrentFormatLayout({ coverPlateDefault: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#D0D0CD] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D7141A]"></div>
                </label>
              </div>
            </div>
          )}

          {/* 3. CONTROL: SELLO Y TAG */}
          {activeControlTab === 'sello' && (
            <div className="bg-white p-6 rounded-2xl border border-[#E5E5E3] shadow-sm space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-title font-bold text-sm text-[#161616]">
                    Sello distintivo de alto impacto
                  </h3>
                  <p className="text-xs text-[#6B6B6B]">
                    Ejemplos: VENDIDO, RESERVADO, NUEVO INGRESO, OFERTA, 100% ELÉCTRICO.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentFormatLayout.showStamp}
                    onChange={(e) => updateCurrentFormatLayout({ showStamp: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#D0D0CD] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D7141A]"></div>
                </label>
              </div>

              {currentFormatLayout.showStamp && (
                <div className="space-y-4 pt-2 border-t border-[#E5E5E3]">
                  <div>
                    <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1">
                      Texto del sello
                    </label>
                    <input
                      type="text"
                      value={currentFormatLayout.stampText || ''}
                      onChange={(e) => updateCurrentFormatLayout({ stampText: e.target.value.toUpperCase() })}
                      placeholder="Ej: VENDIDO, RESERVADO, NUEVO INGRESO"
                      className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-xs text-[#161616] font-bold tracking-wider focus:border-[#D7141A] focus:outline-none uppercase"
                    />
                  </div>

                  {/* Color del sello */}
                  <div>
                    <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1.5">
                      Color del marco y texto del sello
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {BRAND_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => updateCurrentFormatLayout({ stampColor: c.value })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            currentFormatLayout.stampColor === c.value
                              ? 'border-2 border-[#D7141A] bg-white shadow-sm'
                              : 'border-[#E5E5E3] hover:border-[#D0D0CD] bg-[#F5F5F4]'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: c.value }} />
                          <span>{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Inclinación / Rotación */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-[#6B6B6B] uppercase tracking-wider">
                        Inclinación dinámica del sello
                      </label>
                      <span className="font-mono font-bold text-[#D7141A]">
                        {currentFormatLayout.stampRotation ?? -12}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-20"
                      max="20"
                      step="1"
                      value={currentFormatLayout.stampRotation ?? -12}
                      onChange={(e) => updateCurrentFormatLayout({ stampRotation: parseInt(e.target.value) })}
                      className="w-full accent-[#D7141A] cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. CONTROL: TIPOGRAFÍA Y TEXTOS */}
          {activeControlTab === 'texto' && (
            <div className="bg-white p-6 rounded-2xl border border-[#E5E5E3] shadow-sm space-y-5 animate-fade-in">
              <h3 className="font-title font-bold text-sm text-[#161616]">
                Tipografía oficial y escala de texto
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block">
                    Familia tipográfica
                  </label>
                  <select
                    value={currentFormatLayout.fontFamily || 'Archivo Narrow'}
                    onChange={(e) => updateCurrentFormatLayout({ fontFamily: e.target.value as TemplateFontFamily })}
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-xs text-[#161616] font-semibold focus:border-[#D7141A] focus:outline-none cursor-pointer"
                  >
                    <option value="Archivo Narrow">Archivo Narrow (Oficial CARVLAK)</option>
                    <option value="Barlow Condensed">Barlow Condensed (Compacta y deportiva)</option>
                    <option value="system-ui">System UI (Moderna neutra)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block">
                    Escala de tamaño
                  </label>
                  <select
                    value={currentFormatLayout.fontScale || 'normal'}
                    onChange={(e) => updateCurrentFormatLayout({ fontScale: e.target.value as any })}
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-xs text-[#161616] font-semibold focus:border-[#D7141A] focus:outline-none cursor-pointer"
                  >
                    <option value="normal">Normal (Equilibrado)</option>
                    <option value="large">Grande (+15%)</option>
                    <option value="xlarge">Extra grande (+30%)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-[#E5E5E3]">
                <div>
                  <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1">
                    Plantilla de Titular (opcional)
                  </label>
                  <input
                    type="text"
                    value={editorTemplate.headline_default || ''}
                    onChange={(e) => setEditorTemplate({ ...editorTemplate, headline_default: e.target.value })}
                    placeholder="Dejar vacío para usar 'Marca Modelo Versión'"
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none font-medium"
                  />
                  <p className="text-[11px] text-[#6B6B6B] mt-1">
                    Podés usar variables como <code>{'{brand}'}</code>, <code>{'{model}'}</code>, <code>{'{year}'}</code>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 5. CONTROL: PRECIOS */}
          {activeControlTab === 'precios' && (
            <div className="bg-white p-6 rounded-2xl border border-[#E5E5E3] shadow-sm space-y-5 animate-fade-in">
              <h3 className="font-title font-bold text-sm text-[#161616]">
                Visibilidad de precios y ofertas
              </h3>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#161616]">Mostrar precio de venta destacado</div>
                    <p className="text-[11px] text-[#6B6B6B]">Muestra el valor en USD del auto en tamaño gigante.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentFormatLayout.showPrice}
                    onChange={(e) => updateCurrentFormatLayout({ showPrice: e.target.checked })}
                    className="w-4 h-4 accent-[#D7141A] cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#161616]">Mostrar precio original tachado</div>
                    <p className="text-[11px] text-[#6B6B6B]">Especial para plantillas de oportunidad o rebaja.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentFormatLayout.showOriginalPrice}
                    onChange={(e) => updateCurrentFormatLayout({ showOriginalPrice: e.target.checked })}
                    className="w-4 h-4 accent-[#D7141A] cursor-pointer"
                  />
                </div>
              </div>

              {/* Color del precio */}
              <div className="pt-2 border-t border-[#E5E5E3]">
                <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block mb-2">
                  Color del precio destacado
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Rojo CARVLAK', value: '#D7141A' },
                    { label: 'Blanco Puro', value: '#FFFFFF' },
                    { label: 'Amarillo', value: '#EAB308' }
                  ].map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => updateCurrentFormatLayout({ priceColor: c.value })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        currentFormatLayout.priceColor === c.value
                          ? 'border-2 border-[#D7141A] bg-white shadow-sm'
                          : 'border-[#E5E5E3] hover:border-[#D0D0CD] bg-[#F5F5F4]'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: c.value }} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 6. CONTROL: FICHA TÉCNICA */}
          {activeControlTab === 'specs' && (
            <div className="bg-white p-6 rounded-2xl border border-[#E5E5E3] shadow-sm space-y-5 animate-fade-in">
              <div>
                <h3 className="font-title font-bold text-sm text-[#161616]">
                  Datos de la ficha técnica y su orden
                </h3>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Marcá los datos que querés incluir y utilizá las flechas para ordenar los chips en la imagen.
                </p>
              </div>

              <div className="space-y-2">
                {(currentFormatLayout.specsOrder || ['year', 'mileage', 'fuel', 'transmission', 'engine', 'range_km']).map(
                  (specKey, index, arr) => {
                    const isSelected = (currentFormatLayout.specsSelection || []).includes(specKey);

                    const moveUp = () => {
                      if (index === 0) return;
                      const next = [...arr];
                      const temp = next[index - 1];
                      next[index - 1] = next[index];
                      next[index] = temp;
                      updateCurrentFormatLayout({ specsOrder: next });
                    };

                    const moveDown = () => {
                      if (index === arr.length - 1) return;
                      const next = [...arr];
                      const temp = next[index + 1];
                      next[index + 1] = next[index];
                      next[index] = temp;
                      updateCurrentFormatLayout({ specsOrder: next });
                    };

                    const toggleSelection = () => {
                      const prevSel = currentFormatLayout.specsSelection || [];
                      const nextSel = isSelected ? prevSel.filter((k) => k !== specKey) : [...prevSel, specKey];
                      updateCurrentFormatLayout({ specsSelection: nextSel });
                    };

                    return (
                      <div
                        key={specKey}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                          isSelected ? 'bg-white border-[#E5E5E3]' : 'bg-[#FAFAFA] border-[#EAEAEA] opacity-60'
                        }`}
                      >
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={toggleSelection}
                            className="w-4 h-4 accent-[#D7141A] cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-[#161616]">
                            {SPEC_LABELS[specKey] || specKey}
                          </span>
                        </label>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={moveUp}
                            className="p-1 rounded bg-[#F5F5F4] hover:bg-[#EBEBEA] disabled:opacity-30 text-[#161616] cursor-pointer"
                            title="Subir"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === arr.length - 1}
                            onClick={moveDown}
                            className="p-1 rounded bg-[#F5F5F4] hover:bg-[#EBEBEA] disabled:opacity-30 text-[#161616] cursor-pointer"
                            title="Bajar"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* 7. CONTROL: AUTO DE MUESTRA REAL */}
          {activeControlTab === 'car' && (
            <div className="bg-white p-6 rounded-2xl border border-[#E5E5E3] shadow-sm space-y-4 animate-fade-in">
              <div>
                <h3 className="font-title font-bold text-sm text-[#161616]">
                  Seleccionar vehículo real del inventario
                </h3>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Probá el diseño en vivo con cualquier auto cargado en el stock de CARVLAK.
                </p>
              </div>

              <select
                value={selectedSampleCarId}
                onChange={(e) => setSelectedSampleCarId(e.target.value)}
                className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-3 text-xs text-[#161616] font-semibold focus:border-[#D7141A] focus:outline-none cursor-pointer"
              >
                {dealershipVehicles.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.brand} {car.model} {car.version || ''} ({car.year}) — {formatCurrency(car.sale_price || 0, 'USD')} [{car.plate}]
                  </option>
                ))}
              </select>

              {sampleCar.images && sampleCar.images.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block mb-2">
                    Fotos disponibles de la unidad
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {sampleCar.images.map((img, idx) => (
                      <div key={idx} className="aspect-video rounded-lg overflow-hidden border border-[#E5E5E3]">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 8. CONTROL: CONTACTO Y CAPTION */}
          {activeControlTab === 'contacto' && (
            <div className="bg-white p-6 rounded-2xl border border-[#E5E5E3] shadow-sm space-y-5 animate-fade-in">
              <h3 className="font-title font-bold text-sm text-[#161616]">
                Textos de pie, llamado a la acción y copy de Instagram
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1">
                    Texto CTA inferior
                  </label>
                  <input
                    type="text"
                    value={currentFormatLayout.ctaText || 'CARVLAK Group'}
                    onChange={(e) => updateCurrentFormatLayout({ ctaText: e.target.value })}
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1">
                    Teléfono en pie de imagen (opcional)
                  </label>
                  <input
                    type="text"
                    value={currentFormatLayout.phoneText || ''}
                    onChange={(e) => updateCurrentFormatLayout({ phoneText: e.target.value })}
                    placeholder="Ej: 099 123 456"
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-[#E5E5E3]">
                <div>
                  <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1">
                    Texto sugerido por defecto para el post
                  </label>
                  <textarea
                    rows={4}
                    value={editorTemplate.default_caption_template}
                    onChange={(e) => setEditorTemplate({ ...editorTemplate, default_caption_template: e.target.value })}
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1">
                    Hashtags por defecto
                  </label>
                  <input
                    type="text"
                    value={editorTemplate.default_hashtags || '#Carvlak #AutosUruguay'}
                    onChange={(e) => setEditorTemplate({ ...editorTemplate, default_hashtags: e.target.value })}
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: PREVIEW EN VIVO (5 COLS) */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-white p-4 rounded-2xl border border-[#E5E5E3] shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
              <span className="text-xs font-bold text-[#161616] flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#D7141A]" />
                <span>Vista previa en vivo • {activeFormat === 'story' ? 'Historia 9:16' : 'Feed 4:5'}</span>
              </span>

              <span className="text-[11px] font-mono text-[#6B6B6B]">
                {activeFormat === 'story' ? '1080 x 1920 px' : '1080 x 1350 px'}
              </span>
            </div>

            <SocialCanvasPreview
              format={activeFormat}
              onFormatChange={setActiveFormat}
              templateId={editorTemplate.id}
              imageUrl={sampleCar.images?.[0] || 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80'}
              headline={`${sampleCar.brand} ${sampleCar.model} ${sampleCar.version || ''}`.trim()}
              subtitle={`${sampleCar.year} • ${sampleCar.vehicle_type || 'Sedán'}`}
              price={currentFormatLayout.showPrice ? sampleCarPrice : ''}
              originalPrice={currentFormatLayout.showOriginalPrice ? '$27.500 USD' : ''}
              specs={sampleCarSpecs}
              stampText={currentFormatLayout.stampText || editorTemplate.stamp_text || ''}
              coverPlate={currentFormatLayout.coverPlateDefault || false}
              onCoverPlateChange={(val) => updateCurrentFormatLayout({ coverPlateDefault: val })}
              platePosition={{ x: 540, y: activeFormat === 'story' ? 1100 : 800, scale: 1 }}
              onPlatePositionChange={() => {}}
              imagePan={{ x: 0, y: 0, zoom: 1 }}
              onImagePanChange={() => {}}
              logoPosition={currentFormatLayout.logoPosition || 'top-left'}
              instagramHandle={socialMediaConfig.instagram_handle}
              locationName={socialMediaConfig.location_name}
              layoutConfig={currentFormatLayout}
              onSaveToHistory={() => {}}
              suggestedFileName={`carvlak-plantilla-${editorTemplate.id}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
