import React, { useState } from 'react';
import {
  Settings,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Car,
  Fuel,
  Sliders,
  Palette,
  FileText,
  ShieldAlert,
  Sparkles,
  Users,
  Eye,
  EyeOff,
  Clock,
  Layers,
  HelpCircle
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { DealershipCustomFieldDef } from '../../../types';

export const DealershipConfigSection: React.FC = () => {
  const { dealershipConfig, updateDealershipConfig } = useData();
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'lists' | 'models' | 'custom_fields' | 'general'>('lists');

  // Estados locales para listas
  const [selectedBrandForModels, setSelectedBrandForModels] = useState<string>(
    dealershipConfig.brands?.[0] || 'Chevrolet'
  );

  // Inputs para agregar elementos
  const [newBrandInput, setNewBrandInput] = useState('');
  const [newModelInput, setNewModelInput] = useState('');
  const [newVehicleTypeInput, setNewVehicleTypeInput] = useState('');
  const [newFuelInput, setNewFuelInput] = useState('');
  const [newTransmissionInput, setNewTransmissionInput] = useState('');
  const [newColorInput, setNewColorInput] = useState('');
  const [newEquipmentInput, setNewEquipmentInput] = useState('');
  const [newDocLabelInput, setNewDocLabelInput] = useState('');

  // Formulario nuevo campo personalizado
  const [newFieldModalOpen, setNewFieldModalOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'boolean' | 'select'>('text');
  const [newFieldOptionsStr, setNewFieldOptionsStr] = useState('');
  const [newFieldShowInCatalog, setNewFieldShowInCatalog] = useState(false);
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // Handler para agregar items a listas simples
  const handleAddItem = (
    listKey: 'brands' | 'vehicle_types' | 'fuel_types' | 'transmission_types' | 'colors' | 'equipment_items',
    value: string,
    clearInput: () => void
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const currentList = dealershipConfig[listKey] || [];
    if (currentList.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      showToast('Ese elemento ya existe en la lista', 'warning');
      return;
    }
    const updated = [...currentList, trimmed];
    updateDealershipConfig({ [listKey]: updated });
    clearInput();
    showToast(`Elemento agregado a ${listKey}`, 'success');
  };

  const handleRemoveItem = (
    listKey: 'brands' | 'vehicle_types' | 'fuel_types' | 'transmission_types' | 'colors' | 'equipment_items',
    itemToRemove: string
  ) => {
    const currentList = dealershipConfig[listKey] || [];
    const updated = currentList.filter((item) => item !== itemToRemove);
    updateDealershipConfig({ [listKey]: updated });
    showToast('Elemento eliminado', 'info');
  };

  // Modelos por marca
  const handleAddModel = () => {
    const trimmed = newModelInput.trim();
    if (!trimmed || !selectedBrandForModels) return;

    const currentModelsMap = { ...(dealershipConfig.models_by_brand || {}) };
    const currentBrandModels = currentModelsMap[selectedBrandForModels] || [];

    if (currentBrandModels.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
      showToast('Ese modelo ya está registrado para esta marca', 'warning');
      return;
    }

    currentModelsMap[selectedBrandForModels] = [...currentBrandModels, trimmed];
    updateDealershipConfig({ models_by_brand: currentModelsMap });
    setNewModelInput('');
    showToast(`Modelo '${trimmed}' agregado a ${selectedBrandForModels}`, 'success');
  };

  const handleRemoveModel = (brand: string, modelToRemove: string) => {
    const currentModelsMap = { ...(dealershipConfig.models_by_brand || {}) };
    const currentBrandModels = currentModelsMap[brand] || [];
    currentModelsMap[brand] = currentBrandModels.filter((m) => m !== modelToRemove);
    updateDealershipConfig({ models_by_brand: currentModelsMap });
    showToast('Modelo eliminado', 'info');
  };

  // Documentos requeridos
  const handleAddDocument = () => {
    const trimmed = newDocLabelInput.trim();
    if (!trimmed) return;
    const currentDocs = dealershipConfig.required_documents || [];
    const key = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (currentDocs.some((d) => d.key === key)) {
      showToast('Ya existe un documento con esa clave', 'warning');
      return;
    }
    const updated = [...currentDocs, { key, label: trimmed, default_required: true }];
    updateDealershipConfig({ required_documents: updated });
    setNewDocLabelInput('');
    showToast('Documento agregado a la lista', 'success');
  };

  const handleRemoveDocument = (keyToRemove: string) => {
    const currentDocs = dealershipConfig.required_documents || [];
    const updated = currentDocs.filter((d) => d.key !== keyToRemove);
    updateDealershipConfig({ required_documents: updated });
    showToast('Documento eliminado', 'info');
  };

  // Campos personalizados
  const handleCreateCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrimmed = newFieldName.trim();
    if (!nameTrimmed) return;

    const currentFields = dealershipConfig.custom_fields || [];
    const id = `cf_${nameTrimmed.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    if (currentFields.some((f) => f.id === id)) {
      showToast('Ya existe un campo con nombre similar', 'warning');
      return;
    }

    const options =
      newFieldType === 'select'
        ? newFieldOptionsStr
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    const newField: DealershipCustomFieldDef = {
      id,
      name: nameTrimmed,
      type: newFieldType,
      options,
      show_in_catalog: newFieldShowInCatalog,
      required: newFieldRequired
    };

    updateDealershipConfig({
      custom_fields: [...currentFields, newField]
    });

    setNewFieldName('');
    setNewFieldType('text');
    setNewFieldOptionsStr('');
    setNewFieldShowInCatalog(false);
    setNewFieldRequired(false);
    setNewFieldModalOpen(false);
    showToast('Campo personalizado creado con éxito', 'success');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/60 border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Configuración de Automotora
              <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Solo Administrador
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Personalizá marcas, modelos, equipamiento, campos adicionales y permisos de vendedores.
            </p>
          </div>
        </div>
      </div>

      {/* Subtabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('lists')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'lists'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-gray-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Listas Desplegables
        </button>

        <button
          onClick={() => setActiveSubTab('models')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'models'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-gray-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Car className="w-4 h-4" />
          Modelos por Marca
        </button>

        <button
          onClick={() => setActiveSubTab('custom_fields')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'custom_fields'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-gray-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          Campos Personalizados ({dealershipConfig.custom_fields?.length || 0})
        </button>

        <button
          onClick={() => setActiveSubTab('general')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'general'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-gray-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          Permisos &amp; Reglas
        </button>
      </div>

      {/* SUBTAB 1: Listas Desplegables */}
      {activeSubTab === 'lists' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Marcas */}
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-amber-400" />
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
                className="flex-1 px-3 py-2 text-xs bg-zinc-800/80 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => handleAddItem('brands', newBrandInput, () => setNewBrandInput(''))}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {(dealershipConfig.brands || []).map((brand) => (
                <span
                  key={brand}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 text-xs text-gray-200 border border-gray-700/60"
                >
                  {brand}
                  <button
                    onClick={() => handleRemoveItem('brands', brand)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Tipos de Vehículo */}
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-gray-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Tipos de Vehículo ({dealershipConfig.vehicle_types?.length || 0})
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
                className="flex-1 px-3 py-2 text-xs bg-zinc-800/80 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => handleAddItem('vehicle_types', newVehicleTypeInput, () => setNewVehicleTypeInput(''))}
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {(dealershipConfig.vehicle_types || []).map((vt) => (
                <span
                  key={vt}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 text-xs text-gray-200 border border-gray-700/60"
                >
                  {vt}
                  <button
                    onClick={() => handleRemoveItem('vehicle_types', vt)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Combustibles */}
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-gray-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Fuel className="w-4 h-4 text-emerald-400" />
              Tipos de Combustible
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
                className="flex-1 px-3 py-2 text-xs bg-zinc-800/80 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => handleAddItem('fuel_types', newFuelInput, () => setNewFuelInput(''))}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {(dealershipConfig.fuel_types || []).map((ft) => (
                <span
                  key={ft}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 text-xs text-gray-200 border border-gray-700/60"
                >
                  {ft}
                  <button
                    onClick={() => handleRemoveItem('fuel_types', ft)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Transmisiones */}
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-gray-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
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
                className="flex-1 px-3 py-2 text-xs bg-zinc-800/80 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => handleAddItem('transmission_types', newTransmissionInput, () => setNewTransmissionInput(''))}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {(dealershipConfig.transmission_types || []).map((tt) => (
                <span
                  key={tt}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 text-xs text-gray-200 border border-gray-700/60"
                >
                  {tt}
                  <button
                    onClick={() => handleRemoveItem('transmission_types', tt)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Colores */}
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-gray-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-400" />
              Colores Disponibles ({dealershipConfig.colors?.length || 0})
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
                className="flex-1 px-3 py-2 text-xs bg-zinc-800/80 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => handleAddItem('colors', newColorInput, () => setNewColorInput(''))}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {(dealershipConfig.colors || []).map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 text-xs text-gray-200 border border-gray-700/60"
                >
                  {c}
                  <button
                    onClick={() => handleRemoveItem('colors', c)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Equipamiento sugerido */}
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-gray-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Equipamiento y Accesorios ({dealershipConfig.equipment_items?.length || 0})
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
                className="flex-1 px-3 py-2 text-xs bg-zinc-800/80 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => handleAddItem('equipment_items', newEquipmentInput, () => setNewEquipmentInput(''))}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {(dealershipConfig.equipment_items || []).map((eq) => (
                <span
                  key={eq}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 text-xs text-gray-200 border border-gray-700/60"
                >
                  {eq}
                  <button
                    onClick={() => handleRemoveItem('equipment_items', eq)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Documentación requerida */}
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-gray-800 space-y-4 md:col-span-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Documentación Requerida para Stock ({dealershipConfig.required_documents?.length || 0})
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
                className="flex-1 px-3 py-2 text-xs bg-zinc-800/80 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddDocument}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
              {(dealershipConfig.required_documents || []).map((doc) => (
                <div
                  key={doc.key}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-800/80 border border-gray-700/60 text-xs text-gray-200"
                >
                  <span className="font-medium">{doc.label}</span>
                  <button
                    onClick={() => handleRemoveDocument(doc.key)}
                    className="text-gray-500 hover:text-red-400 p-1 transition-colors"
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
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-gray-800 space-y-4">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
              1. Seleccioná una marca para gestionar sus modelos:
            </label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
              {(dealershipConfig.brands || []).map((brand) => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrandForModels(brand)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    selectedBrandForModels === brand
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-gray-700/60'
                  }`}
                >
                  {brand} ({dealershipConfig.models_by_brand?.[brand]?.length || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Models list for chosen brand */}
          {selectedBrandForModels && (
            <div className="p-5 rounded-2xl bg-zinc-900/50 border border-gray-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Car className="w-4 h-4 text-amber-400" />
                  Modelos de <span className="text-amber-400">{selectedBrandForModels}</span> ({dealershipConfig.models_by_brand?.[selectedBrandForModels]?.length || 0})
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
                    className="px-3 py-2 text-xs bg-zinc-800/80 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-amber-500 w-64"
                  />
                  <button
                    type="button"
                    onClick={handleAddModel}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Agregar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2">
                {(dealershipConfig.models_by_brand?.[selectedBrandForModels] || []).map((model) => (
                  <div
                    key={model}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-800 text-xs text-gray-200 border border-gray-700/60 group"
                  >
                    <span className="font-medium truncate">{model}</span>
                    <button
                      onClick={() => handleRemoveModel(selectedBrandForModels, model)}
                      className="text-gray-500 hover:text-red-400 p-1 opacity-60 group-hover:opacity-100 transition-opacity"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/50 border border-gray-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Definición de Campos Personalizados por Vehículo
              </h3>
              <p className="text-xs text-gray-400 mt-1 max-w-xl">
                Permite registrar datos adicionales específicos (ej: Consignación, Garantía, Ubicación física). Podés definir si se muestran públicamente en el catálogo web / Tiendanube o si son solo internos.
              </p>
            </div>
            <button
              onClick={() => setNewFieldModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/10"
            >
              <Plus className="w-4 h-4" />
              Nuevo Campo
            </button>
          </div>

          {/* Cards of fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(dealershipConfig.custom_fields || []).map((field) => (
              <div
                key={field.id}
                className="p-4 rounded-2xl bg-zinc-900/60 border border-gray-800 flex items-start justify-between gap-3 hover:border-gray-700 transition-all"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{field.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-gray-300 border border-gray-700">
                      {field.type}
                    </span>
                    {field.required && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                        Obligatorio
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      {field.show_in_catalog ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">Visible en Catálogo</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                          <span>Solo Interno</span>
                        </>
                      )}
                    </span>
                  </div>

                  {field.options && field.options.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {field.options.map((opt) => (
                        <span key={opt} className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-gray-400">
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleRemoveCustomField(field.id)}
                  className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"
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
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-gray-800 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  Permiso de Edición de Stock para Vendedores
                </h3>
                <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
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
                <div className="w-12 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>

          {/* Días en Stock y Alertas */}
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-gray-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-400" />
              Alerta de Antigüedad en Stock (Auto Estancado)
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xl">
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
                className="w-28 px-3 py-2 bg-zinc-800 border border-gray-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-rose-500"
              />
              <span className="text-xs text-gray-300 font-semibold">días en stock</span>
            </div>
          </div>

          {/* Costos y Valores por Defecto */}
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-gray-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-400" />
              Parámetros Financieros por Defecto
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Tipo de cambio (UYU / USD):</label>
                <input
                  type="number"
                  step="0.1"
                  value={dealershipConfig.default_exchange_rate || 43.50}
                  onChange={(e) => {
                    updateDealershipConfig({ default_exchange_rate: parseFloat(e.target.value) || 43.50 });
                  }}
                  className="w-full px-3 py-2 bg-zinc-800 border border-gray-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Costo alistamiento detailing ($ UYU):</label>
                <input
                  type="number"
                  step="100"
                  value={dealershipConfig.default_internal_detailing_cost || 2500}
                  onChange={(e) => {
                    updateDealershipConfig({ default_internal_detailing_cost: parseInt(e.target.value) || 2500 });
                  }}
                  className="w-full px-3 py-2 bg-zinc-800 border border-gray-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Costo peritaje técnico ($ UYU):</label>
                <input
                  type="number"
                  step="100"
                  value={dealershipConfig.default_internal_inspection_cost || 1500}
                  onChange={(e) => {
                    updateDealershipConfig({ default_internal_inspection_cost: parseInt(e.target.value) || 1500 });
                  }}
                  className="w-full px-3 py-2 bg-zinc-800 border border-gray-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO CAMPO PERSONALIZADO */}
      {newFieldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Nuevo Campo Personalizado</h3>

            <form onSubmit={handleCreateCustomField} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1 font-medium">Nombre del Campo:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ubicación física, Garantía meses, Consignación..."
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1 font-medium">Tipo de Dato:</label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="text">Texto simple</option>
                  <option value="number">Número</option>
                  <option value="boolean">Sí / No (Booleano)</option>
                  <option value="select">Lista de opciones (Desplegable)</option>
                </select>
              </div>

              {newFieldType === 'select' && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium">
                    Opciones (separadas por comas):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Salón principal, Depósito, Taller..."
                    value={newFieldOptionsStr}
                    onChange={(e) => setNewFieldOptionsStr(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={newFieldShowInCatalog}
                    onChange={(e) => setNewFieldShowInCatalog(e.target.checked)}
                    className="rounded bg-zinc-800 border-gray-700 text-amber-500 focus:ring-0"
                  />
                  <span>Mostrar en catálogo web / Tiendanube (público)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={newFieldRequired}
                    onChange={(e) => setNewFieldRequired(e.target.checked)}
                    className="rounded bg-zinc-800 border-gray-700 text-amber-500 focus:ring-0"
                  />
                  <span>Campo obligatorio al crear vehículo</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setNewFieldModalOpen(false)}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors"
                >
                  Guardar Campo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
