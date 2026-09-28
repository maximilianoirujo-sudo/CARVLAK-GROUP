import React, { useState } from 'react';
import {
  Settings,
  Car,
  Fuel,
  Sliders,
  Palette,
  Sparkles,
  FileText,
  Plus,
  Trash2,
  Layers,
  Users,
  Eye,
  EyeOff,
  Clock
} from 'lucide-react';
import { DealershipConfig, DealershipCustomFieldDef } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/common/Modal';

export const DealershipConfigSection: React.FC = () => {
  const { dealershipConfig, updateDealershipConfig } = useData();
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'lists' | 'models' | 'custom_fields' | 'general'>(() => {
    if (typeof window !== 'undefined') {
      const section = new URLSearchParams(window.location.search).get('section');
      if (section && ['lists', 'models', 'custom_fields', 'general'].includes(section)) {
        return section as any;
      }
    }
    return 'lists';
  });

  // Asegurar que al cambiar de subpestaña o entrar a configuración la vista se posicione arriba
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('section') !== activeSubTab) {
        url.searchParams.set('section', activeSubTab);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [activeSubTab]);

  // Inputs para agregar nuevos elementos
  const [newBrandInput, setNewBrandInput] = useState('');
  const [newVehicleTypeInput, setNewVehicleTypeInput] = useState('');
  const [newFuelInput, setNewFuelInput] = useState('');
  const [newTransmissionInput, setNewTransmissionInput] = useState('');
  const [newColorInput, setNewColorInput] = useState('');
  const [newEquipmentInput, setNewEquipmentInput] = useState('');

  // Modelos por marca
  const [selectedBrandForModels, setSelectedBrandForModels] = useState<string>(
    dealershipConfig.brands?.[0] || 'Chevrolet'
  );
  const [newModelInput, setNewModelInput] = useState('');

  // Documentos requeridos
  const [newDocLabelInput, setNewDocLabelInput] = useState('');

  // Modal para nuevo Custom Field
  const [newFieldModalOpen, setNewFieldModalOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'boolean' | 'select'>('text');
  const [newFieldOptionsStr, setNewFieldOptionsStr] = useState('');
  const [newFieldShowInCatalog, setNewFieldShowInCatalog] = useState(false);
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // Helper para listas simples
  const handleAddItem = (
    key: keyof Pick<
      DealershipConfig,
      'brands' | 'vehicle_types' | 'fuel_types' | 'transmission_types' | 'colors' | 'equipment_items'
    >,
    value: string,
    resetFn: () => void
  ) => {
    const val = value.trim();
    if (!val) return;
    const currentList = dealershipConfig[key] || [];
    if (currentList.some((item) => item.toLowerCase() === val.toLowerCase())) {
      showToast(`"${val}" ya existe en la lista`, 'error');
      return;
    }
    const updated = [...currentList, val].sort();
    updateDealershipConfig({ [key]: updated });
    resetFn();
    showToast(`Elemento "${val}" agregado a la lista`, 'success');
  };

  const handleRemoveItem = (
    key: keyof Pick<
      DealershipConfig,
      'brands' | 'vehicle_types' | 'fuel_types' | 'transmission_types' | 'colors' | 'equipment_items'
    >,
    value: string
  ) => {
    const currentList = dealershipConfig[key] || [];
    const updated = currentList.filter((item) => item !== value);
    updateDealershipConfig({ [key]: updated });
    showToast(`Elemento "${value}" eliminado`, 'info');
  };

  // Modelos por marca
  const handleAddModel = () => {
    const model = newModelInput.trim();
    if (!model || !selectedBrandForModels) return;

    const currentMap = { ...(dealershipConfig.models_by_brand || {}) };
    const currentBrandModels = currentMap[selectedBrandForModels] || [];

    if (currentBrandModels.some((m) => m.toLowerCase() === model.toLowerCase())) {
      showToast(`El modelo "${model}" ya existe para ${selectedBrandForModels}`, 'error');
      return;
    }

    currentMap[selectedBrandForModels] = [...currentBrandModels, model].sort();
    updateDealershipConfig({ models_by_brand: currentMap });
    setNewModelInput('');
    showToast(`Modelo "${model}" agregado a ${selectedBrandForModels}`, 'success');
  };

  const handleRemoveModel = (brand: string, model: string) => {
    const currentMap = { ...(dealershipConfig.models_by_brand || {}) };
    currentMap[brand] = (currentMap[brand] || []).filter((m) => m !== model);
    updateDealershipConfig({ models_by_brand: currentMap });
    showToast(`Modelo "${model}" eliminado`, 'info');
  };

  // Documentación requerida
  const handleAddDocument = () => {
    const label = newDocLabelInput.trim();
    if (!label) return;
    const currentDocs = dealershipConfig.required_documents || [];
    const key = label.toLowerCase().replace(/[^a-z0-9]/g, '_');

    if (currentDocs.some((d) => d.key === key)) {
      showToast('Ya existe un documento con esa denominación', 'error');
      return;
    }

    const updated = [...currentDocs, { key, label, default_required: false }];
    updateDealershipConfig({ required_documents: updated });
    setNewDocLabelInput('');
    showToast(`Documento "${label}" agregado a requisitos de stock`, 'success');
  };

  const handleRemoveDocument = (key: string) => {
    const currentDocs = dealershipConfig.required_documents || [];
    const updated = currentDocs.filter((d) => d.key !== key);
    updateDealershipConfig({ required_documents: updated });
    showToast('Requisito documental eliminado', 'info');
  };

  // Custom Fields
  const handleCreateCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newFieldName.trim();
    if (!name) return;

    const currentFields = dealershipConfig.custom_fields || [];
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const options =
      newFieldType === 'select'
        ? newFieldOptionsStr
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    const newField: DealershipCustomFieldDef = {
      id,
      name,
      type: newFieldType,
      options,
      show_in_catalog: newFieldShowInCatalog,
      required: newFieldRequired
    };

    updateDealershipConfig({ custom_fields: [...currentFields, newField] });
    setNewFieldName('');
    setNewFieldOptionsStr('');
    setNewFieldShowInCatalog(false);
    setNewFieldRequired(false);
    setNewFieldModalOpen(false);
    showToast(`Campo personalizado "${name}" creado exitosamente`, 'success');
  };

  const handleRemoveCustomField = (fieldId: string) => {
    const currentFields = dealershipConfig.custom_fields || [];
    const updated = currentFields.filter((f) => f.id !== fieldId);
    updateDealershipConfig({ custom_fields: updated });
    showToast('Campo personalizado eliminado', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-[#E5E5E3] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616]">
            <Settings className="w-6 h-6 text-[#D7141A]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#161616] flex items-center gap-2">
              Configuración de automotora
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FEF7EC] text-[#945B0E] border border-[#FADBA8]">
                Solo administrador
              </span>
            </h2>
            <p className="text-xs text-[#6B6B6B]">
              Personalizá marcas, modelos, equipamiento, campos adicionales y permisos de vendedores.
            </p>
          </div>
        </div>
      </div>

      {/* Subtabs con Línea Roja */}
      <div className="flex items-center gap-2 border-b border-[#E5E5E3] pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('lists')}
          className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap border-b-2 ${
            activeSubTab === 'lists'
              ? 'border-[#D7141A] text-[#161616] font-bold'
              : 'border-transparent text-[#6B6B6B] hover:text-[#161616]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Listas desplegables
        </button>

        <button
          onClick={() => setActiveSubTab('models')}
          className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap border-b-2 ${
            activeSubTab === 'models'
              ? 'border-[#D7141A] text-[#161616] font-bold'
              : 'border-transparent text-[#6B6B6B] hover:text-[#161616]'
          }`}
        >
          <Car className="w-4 h-4" />
          Modelos por marca
        </button>

        <button
          onClick={() => setActiveSubTab('custom_fields')}
          className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap border-b-2 ${
            activeSubTab === 'custom_fields'
              ? 'border-[#D7141A] text-[#161616] font-bold'
              : 'border-transparent text-[#6B6B6B] hover:text-[#161616]'
          }`}
        >
          <Layers className="w-4 h-4" />
          Campos personalizados ({dealershipConfig.custom_fields?.length || 0})
        </button>

        <button
          onClick={() => setActiveSubTab('general')}
          className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap border-b-2 ${
            activeSubTab === 'general'
              ? 'border-[#D7141A] text-[#161616] font-bold'
              : 'border-transparent text-[#6B6B6B] hover:text-[#161616]'
          }`}
        >
          <Users className="w-4 h-4" />
          Permisos y reglas
        </button>
      </div>

      {/* SUBTAB 1: Listas Desplegables */}
      {activeSubTab === 'lists' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Marcas */}
          <div className="p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#161616] flex items-center gap-2">
                <Car className="w-4 h-4 text-[#D7141A]" />
                Marcas ({dealershipConfig.brands?.length || 0})
              </h3>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nueva marca..."
                value={newBrandInput}
                onChange={(e) => setNewBrandInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddItem('brands', newBrandInput, () => setNewBrandInput(''));
                }}
                className="flex-1 px-3 py-2 text-xs bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] outline-none"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAddItem('brands', newBrandInput, () => setNewBrandInput(''))}
              >
                <Plus className="w-4 h-4" /> Agregar
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {(dealershipConfig.brands || []).map((brand) => (
                <span
                  key={brand}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F5F4] text-xs text-[#161616] border border-[#E5E5E3]"
                >
                  {brand}
                  <button
                    onClick={() => handleRemoveItem('brands', brand)}
                    className="text-[#9A9A9A] hover:text-[#D7141A] transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Tipos de Vehículo */}
          <div className="p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-[#161616] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#D7141A]" />
              Tipos de vehículo ({dealershipConfig.vehicle_types?.length || 0})
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nuevo tipo (ej: Utilitario)..."
                value={newVehicleTypeInput}
                onChange={(e) => setNewVehicleTypeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddItem('vehicle_types', newVehicleTypeInput, () => setNewVehicleTypeInput(''));
                }}
                className="flex-1 px-3 py-2 text-xs bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] outline-none"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAddItem('vehicle_types', newVehicleTypeInput, () => setNewVehicleTypeInput(''))}
              >
                <Plus className="w-4 h-4" /> Agregar
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {(dealershipConfig.vehicle_types || []).map((vt) => (
                <span
                  key={vt}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F5F4] text-xs text-[#161616] border border-[#E5E5E3]"
                >
                  {vt}
                  <button
                    onClick={() => handleRemoveItem('vehicle_types', vt)}
                    className="text-[#9A9A9A] hover:text-[#D7141A] transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Combustibles */}
          <div className="p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-[#161616] flex items-center gap-2">
              <Fuel className="w-4 h-4 text-[#D7141A]" />
              Tipos de combustible
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nuevo combustible..."
                value={newFuelInput}
                onChange={(e) => setNewFuelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddItem('fuel_types', newFuelInput, () => setNewFuelInput(''));
                }}
                className="flex-1 px-3 py-2 text-xs bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] outline-none"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAddItem('fuel_types', newFuelInput, () => setNewFuelInput(''))}
              >
                <Plus className="w-4 h-4" /> Agregar
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {(dealershipConfig.fuel_types || []).map((ft) => (
                <span
                  key={ft}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F5F4] text-xs text-[#161616] border border-[#E5E5E3]"
                >
                  {ft}
                  <button
                    onClick={() => handleRemoveItem('fuel_types', ft)}
                    className="text-[#9A9A9A] hover:text-[#D7141A] transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Transmisiones */}
          <div className="p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-[#161616] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#D7141A]" />
              Transmisiones
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nueva transmisión..."
                value={newTransmissionInput}
                onChange={(e) => setNewTransmissionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddItem('transmission_types', newTransmissionInput, () => setNewTransmissionInput(''));
                }}
                className="flex-1 px-3 py-2 text-xs bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] outline-none"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAddItem('transmission_types', newTransmissionInput, () => setNewTransmissionInput(''))}
              >
                <Plus className="w-4 h-4" /> Agregar
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {(dealershipConfig.transmission_types || []).map((tt) => (
                <span
                  key={tt}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F5F4] text-xs text-[#161616] border border-[#E5E5E3]"
                >
                  {tt}
                  <button
                    onClick={() => handleRemoveItem('transmission_types', tt)}
                    className="text-[#9A9A9A] hover:text-[#D7141A] transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Colores */}
          <div className="p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-[#161616] flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#D7141A]" />
              Colores disponibles ({dealershipConfig.colors?.length || 0})
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nuevo color..."
                value={newColorInput}
                onChange={(e) => setNewColorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddItem('colors', newColorInput, () => setNewColorInput(''));
                }}
                className="flex-1 px-3 py-2 text-xs bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] outline-none"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAddItem('colors', newColorInput, () => setNewColorInput(''))}
              >
                <Plus className="w-4 h-4" /> Agregar
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {(dealershipConfig.colors || []).map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F5F4] text-xs text-[#161616] border border-[#E5E5E3]"
                >
                  {c}
                  <button
                    onClick={() => handleRemoveItem('colors', c)}
                    className="text-[#9A9A9A] hover:text-[#D7141A] transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Equipamiento sugerido */}
          <div className="p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-[#161616] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D7141A]" />
              Equipamiento y accesorios ({dealershipConfig.equipment_items?.length || 0})
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nuevo ítem (ej: Climatizador)..."
                value={newEquipmentInput}
                onChange={(e) => setNewEquipmentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddItem('equipment_items', newEquipmentInput, () => setNewEquipmentInput(''));
                }}
                className="flex-1 px-3 py-2 text-xs bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] outline-none"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAddItem('equipment_items', newEquipmentInput, () => setNewEquipmentInput(''))}
              >
                <Plus className="w-4 h-4" /> Agregar
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {(dealershipConfig.equipment_items || []).map((eq) => (
                <span
                  key={eq}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F5F4] text-xs text-[#161616] border border-[#E5E5E3]"
                >
                  {eq}
                  <button
                    onClick={() => handleRemoveItem('equipment_items', eq)}
                    className="text-[#9A9A9A] hover:text-[#D7141A] transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Documentación requerida */}
          <div className="p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 shadow-sm md:col-span-2">
            <h3 className="text-sm font-bold text-[#161616] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#D7141A]" />
              Documentación requerida para stock ({dealershipConfig.required_documents?.length || 0})
            </h3>
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                placeholder="Nuevo documento (ej: Certificado Notarial)..."
                value={newDocLabelInput}
                onChange={(e) => setNewDocLabelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddDocument();
                }}
                className="flex-1 px-3 py-2 text-xs bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] outline-none"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddDocument}
              >
                <Plus className="w-4 h-4" /> Agregar
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
              {(dealershipConfig.required_documents || []).map((doc) => (
                <div
                  key={doc.key}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] text-xs text-[#161616]"
                >
                  <span className="font-semibold">{doc.label}</span>
                  <button
                    onClick={() => handleRemoveDocument(doc.key)}
                    className="text-[#9A9A9A] hover:text-[#D7141A] p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Modelos por Marca */}
      {activeSubTab === 'models' && (
        <div className="space-y-6">
          {/* Brand picker selector */}
          <div className="p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 shadow-sm">
            <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
              1. Seleccioná una marca para gestionar sus modelos:
            </label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
              {(dealershipConfig.brands || []).map((brand) => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrandForModels(brand)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedBrandForModels === brand
                      ? 'bg-[#161616] text-white shadow-sm'
                      : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] border border-[#E5E5E3]'
                  }`}
                >
                  {brand} ({dealershipConfig.models_by_brand?.[brand]?.length || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Models list for chosen brand */}
          {selectedBrandForModels && (
            <div className="p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-[#161616] flex items-center gap-2">
                  <Car className="w-4 h-4 text-[#D7141A]" />
                  Modelos de <span className="text-[#161616] underline">{selectedBrandForModels}</span> ({dealershipConfig.models_by_brand?.[selectedBrandForModels]?.length || 0})
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Nuevo modelo para ${selectedBrandForModels}...`}
                    value={newModelInput}
                    onChange={(e) => setNewModelInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddModel();
                    }}
                    className="px-3 py-2 text-xs bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] outline-none w-64"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddModel}
                  >
                    <Plus className="w-4 h-4" /> Agregar
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2">
                {(dealershipConfig.models_by_brand?.[selectedBrandForModels] || []).map((model) => (
                  <div
                    key={model}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F5F4] text-xs text-[#161616] border border-[#E5E5E3] group"
                  >
                    <span className="font-semibold truncate">{model}</span>
                    <button
                      onClick={() => handleRemoveModel(selectedBrandForModels, model)}
                      className="text-[#9A9A9A] hover:text-[#D7141A] p-1 opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: Campos Personalizados */}
      {activeSubTab === 'custom_fields' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-[#E5E5E3] shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-[#161616] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#D7141A]" />
                Definición de campos personalizados por vehículo
              </h3>
              <p className="text-xs text-[#6B6B6B] mt-1 max-w-xl">
                Permite registrar datos adicionales específicos (ej: Consignación, Garantía, Ubicación física). Podés definir si se muestran públicamente en el catálogo web o si son solo internos.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setNewFieldModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo campo</span>
            </Button>
          </div>

          {/* Cards of fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(dealershipConfig.custom_fields || []).map((field) => (
              <div
                key={field.id}
                className="p-4 rounded-2xl bg-white border border-[#E5E5E3] flex items-start justify-between gap-3 hover:border-[#D0D0CD] transition-all shadow-sm"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#161616]">{field.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]">
                      {field.type}
                    </span>
                    {field.required && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FDF2F2] text-[#B80E14] border border-[#FADBA8]">
                        Obligatorio
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#6B6B6B]">
                    <span className="flex items-center gap-1">
                      {field.show_in_catalog ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-[#161616]" />
                          <span className="text-[#161616] font-medium">Visible en catálogo</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-[#9A9A9A]" />
                          <span>Solo interno</span>
                        </>
                      )}
                    </span>
                  </div>

                  {field.options && field.options.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {field.options.map((opt) => (
                        <span key={opt} className="text-[10px] px-2 py-0.5 rounded bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]">
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleRemoveCustomField(field.id)}
                  className="p-1.5 text-[#9A9A9A] hover:text-[#D7141A] rounded-lg hover:bg-[#F5F5F4] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: Reglas & Permisos */}
      {activeSubTab === 'general' && (
        <div className="space-y-6">
          {/* Permiso de edición a Vendedores */}
          <div className="p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#161616] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#D7141A]" />
                  Permiso de edición de stock para vendedores
                </h3>
                <p className="text-xs text-[#6B6B6B] max-w-xl leading-relaxed">
                  Por defecto, los vendedores tienen acceso de <strong>solo lectura</strong> al catálogo para atender clientes. Si activás este permiso, los vendedores podrán editar datos comerciales y fotos, pero los <strong>costos de compra, márgenes, precio mínimo aceptable y notas internas seguirán siendo 100% invisibles y protegidos</strong>.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={dealershipConfig.sellers_can_edit}
                  onChange={(e) => {
                    updateDealershipConfig({ sellers_can_edit: e.target.checked });
                    showToast(
                      e.target.checked
                        ? 'Permiso de edición habilitado para vendedores'
                        : 'Permiso de edición revocado (solo lectura)',
                      'info'
                    );
                  }}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-[#E5E5E3] border border-[#D0D0CD] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D7141A]"></div>
              </label>
            </div>
          </div>

          {/* Días en Stock y Alertas */}
          <div className="p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-[#161616] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D7141A]" />
              Alerta de antigüedad en stock (Auto estancado)
            </h3>
            <p className="text-xs text-[#6B6B6B] leading-relaxed max-w-xl">
              Define cuántos días puede permanecer un vehículo publicado antes de que el sistema active la alerta visual de estancamiento para impulsar ofertas o ajustes de precio.
            </p>
            <div className="flex items-center gap-3 max-w-xs">
              <input
                type="number"
                min="10"
                max="365"
                value={dealershipConfig.days_alert_threshold || 60}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 60;
                  updateDealershipConfig({ days_alert_threshold: val });
                }}
                className="w-28 px-3 py-2 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl text-[#161616] font-mono text-sm focus:outline-none focus:border-[#D7141A]"
              />
              <span className="text-xs text-[#6B6B6B] font-semibold">días en stock</span>
            </div>
          </div>

          {/* Costos y Valores por Defecto */}
          <div className="p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-[#161616] flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#D7141A]" />
              Parámetros financieros por defecto
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs text-[#6B6B6B] mb-1 font-medium">Tipo de cambio (UYU / USD):</label>
                <input
                  type="number"
                  step="0.1"
                  value={dealershipConfig.default_exchange_rate || 43.50}
                  onChange={(e) => {
                    updateDealershipConfig({ default_exchange_rate: parseFloat(e.target.value) || 43.50 });
                  }}
                  className="w-full px-3 py-2 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl text-[#161616] font-mono text-xs focus:outline-none focus:border-[#D7141A]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#6B6B6B] mb-1 font-medium">Costo alistamiento detailing ($ UYU):</label>
                <input
                  type="number"
                  step="100"
                  value={dealershipConfig.default_internal_detailing_cost || 2500}
                  onChange={(e) => {
                    updateDealershipConfig({ default_internal_detailing_cost: parseInt(e.target.value) || 2500 });
                  }}
                  className="w-full px-3 py-2 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl text-[#161616] font-mono text-xs focus:outline-none focus:border-[#D7141A]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#6B6B6B] mb-1 font-medium">Costo peritaje técnico ($ UYU):</label>
                <input
                  type="number"
                  step="100"
                  value={dealershipConfig.default_internal_inspection_cost || 1500}
                  onChange={(e) => {
                    updateDealershipConfig({ default_internal_inspection_cost: parseInt(e.target.value) || 1500 });
                  }}
                  className="w-full px-3 py-2 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl text-[#161616] font-mono text-xs focus:outline-none focus:border-[#D7141A]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO CAMPO PERSONALIZADO */}
      <Modal
        isOpen={newFieldModalOpen}
        onClose={() => setNewFieldModalOpen(false)}
        title="Nuevo campo personalizado"
        subtitle="Definí un atributo adicional para los vehículos de stock"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateCustomField} className="space-y-4">
          <div>
            <label className="block text-xs text-[#6B6B6B] mb-1 font-medium">Nombre del campo:</label>
            <input
              type="text"
              required
              placeholder="Ej: Ubicación física, Garantía meses, Consignación..."
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl text-[#161616] text-xs focus:outline-none focus:border-[#D7141A]"
            />
          </div>

          <div>
            <label className="block text-xs text-[#6B6B6B] mb-1 font-medium">Tipo de dato:</label>
            <select
              value={newFieldType}
              onChange={(e) => setNewFieldType(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl text-[#161616] text-xs focus:outline-none focus:border-[#D7141A]"
            >
              <option value="text">Texto simple</option>
              <option value="number">Número</option>
              <option value="boolean">Sí / No (Booleano)</option>
              <option value="select">Lista de opciones (Desplegable)</option>
            </select>
          </div>

          {newFieldType === 'select' && (
            <div>
              <label className="block text-xs text-[#6B6B6B] mb-1 font-medium">
                Opciones (separadas por comas):
              </label>
              <input
                type="text"
                required
                placeholder="Salón principal, Depósito, Taller..."
                value={newFieldOptionsStr}
                onChange={(e) => setNewFieldOptionsStr(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl text-[#161616] text-xs focus:outline-none focus:border-[#D7141A]"
              />
            </div>
          )}

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#6B6B6B]">
              <input
                type="checkbox"
                checked={newFieldShowInCatalog}
                onChange={(e) => setNewFieldShowInCatalog(e.target.checked)}
                className="rounded bg-[#F5F5F4] border-[#E5E5E3] text-[#D7141A] focus:ring-0"
              />
              <span>Mostrar en catálogo web / Tiendanube (público)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#6B6B6B]">
              <input
                type="checkbox"
                checked={newFieldRequired}
                onChange={(e) => setNewFieldRequired(e.target.checked)}
                className="rounded bg-[#F5F5F4] border-[#E5E5E3] text-[#D7141A] focus:ring-0"
              />
              <span>Campo obligatorio al crear vehículo</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E5E5E3]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setNewFieldModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Guardar campo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
