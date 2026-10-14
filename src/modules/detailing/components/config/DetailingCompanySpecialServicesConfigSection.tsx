import React, { useState } from 'react';
import { useData } from '../../../../context/DataContext';
import { useAuth } from '../../../../context/AuthContext';
import { DetailingCompanySpecialService, SpecialServicePriceMode } from '../../../../types';
import { DEFAULT_COMPANY_SPECIAL_SERVICES, getSpecialServicePrice, DEFAULT_PREVENTA_TARIFF } from '../../lib/companyTariffUtils';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Check, X, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export const DetailingCompanySpecialServicesConfigSection: React.FC = () => {
  const { 
    detailingConfig, 
    updateDetailingConfig, 
    detailingCompanyServices,
    addDetailingCompanyService,
    updateDetailingCompanyService,
    deleteDetailingCompanyServicePermanent,
    reorderDetailingCompanyServices
  } = useData();
  const { profile } = useAuth();
  const isAdmin = profile?.roles?.includes('admin');

  const tariff = detailingConfig?.preventa_tariff || DEFAULT_PREVENTA_TARIFF;
  const services = detailingCompanyServices && detailingCompanyServices.length > 0 
    ? detailingCompanyServices 
    : (detailingConfig?.company_special_services || DEFAULT_COMPANY_SPECIAL_SERVICES);

  const [editingService, setEditingService] = useState<DetailingCompanySpecialService | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleToggleActive = async (id: string) => {
    if (!isAdmin) return;
    const target = services.find(s => s.id === id);
    if (!target) return;
    try {
      await updateDetailingCompanyService(id, { is_active: !target.is_active });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error(e);
      setErrorMessage('No se pudo actualizar el servicio.');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (!isAdmin) return;
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= services.length) return;
    const copy = [...services];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;
    const reordered = copy.map((item, idx) => ({ ...item, sort_order: idx + 1, order: idx + 1 }));
    try {
      await reorderDetailingCompanyServices(reordered);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error(e);
      setErrorMessage('No se pudo reordenar los servicios.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm('¿Eliminar este servicio especial del catálogo?')) return;
    try {
      const res = await deleteDetailingCompanyServicePermanent(id);
      if (res && !res.success && res.error) {
        setErrorMessage(res.error);
        return;
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error(e);
      setErrorMessage('Error al eliminar el servicio.');
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    if (!editingService.name.trim()) {
      alert('El nombre es obligatorio.');
      return;
    }

    const mode = editingService.price_mode || editingService.pricing_mode || 'unico';
    const sqlMode = (mode === 'per_size' || mode === 'por_tamaño') 
      ? 'por_tamaño' 
      : (mode === 'percentage_size' || mode === 'porcentaje') 
        ? 'porcentaje' 
        : 'unico';

    const pricesObj = editingService.prices_per_size || editingService.prices_by_size || editingService.prices || { '1': 0, '2': 0, '3': 0, '4': 0 };
    const basePrice = sqlMode === 'unico' 
      ? (Number(editingService.unique_price) || Number(editingService.base_price) || 0)
      : (Number(editingService.base_price) || 0);

    const payload: DetailingCompanySpecialService = {
      ...editingService,
      pricing_mode: sqlMode as any,
      price_mode: mode as any,
      prices: pricesObj,
      prices_per_size: pricesObj as any,
      base_price: basePrice,
      unique_price: basePrice,
      is_active: editingService.is_active !== undefined ? editingService.is_active : true,
      sort_order: editingService.sort_order || services.length + 1,
      order: editingService.order || services.length + 1
    };

    try {
      if (isCreating) {
        await addDetailingCompanyService({
          ...payload,
          id: payload.id || 'cs-' + Math.random().toString(36).substring(2, 9)
        });
      } else {
        await updateDetailingCompanyService(payload.id, payload);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setEditingService(null);
      setIsCreating(false);
    } catch (err) {
      console.error(err);
      setErrorMessage('No se pudo guardar el servicio, reintentá.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-[#E5E5E3] shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#D7141A]" />
            <h2 className="text-xl font-bold uppercase tracking-wider text-neutral-900 font-['Barlow_Condensed']">
              Servicios Especiales para Empresas
            </h2>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Catálogo de adicionales y preparaciones especiales con precios por tamaño, precio único o calculados según el % de tarifa.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setEditingService({
                id: '',
                name: '',
                description: '',
                price_mode: 'unique',
                unique_price: 0,
                prices_by_size: { 1: 0, 2: 0, 3: 0, 4: 0 },
                prices_per_size: { 1: 0, 2: 0, 3: 0, 4: 0 },
                base_price: 0,
                is_active: true,
                order: services.length + 1,
                sort_order: services.length + 1
              });
              setIsCreating(true);
            }}
            className="inline-flex items-center gap-2 bg-[#D7141A] hover:bg-[#b01015] text-white px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            + Nuevo servicio especial
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Servicios especiales guardados correctamente.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {/* Lista de servicios */}
      <div className="bg-white rounded-xl border border-[#E5E5E3] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E5E3] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-['Barlow_Condensed']">
            Catálogo ({services.length} servicios)
          </span>
          <span className="text-xs text-neutral-400">
            Los precios en $0 se consideran a cotizar o sin cargo.
          </span>
        </div>

        <div className="divide-y divide-neutral-100">
          {services.map((svc, index) => {
            const previewPrice1 = getSpecialServicePrice(svc, 1, tariff);
            const previewPrice2 = getSpecialServicePrice(svc, 2, tariff);
            const previewPrice3 = getSpecialServicePrice(svc, 3, tariff);
            const previewPrice4 = getSpecialServicePrice(svc, 4, tariff);

            return (
              <div
                key={svc.id}
                className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                  !svc.is_active ? 'bg-neutral-50/70 opacity-60' : 'hover:bg-neutral-50/50'
                }`}
              >
                {/* Info */}
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-neutral-900 text-base">{svc.name}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      svc.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
                    }`}>
                      {svc.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 font-medium">
                      {svc.price_mode === 'unique' && 'Precio único'}
                      {svc.price_mode === 'per_size' && 'Por tamaño (1 a 4)'}
                      {svc.price_mode === 'percentage_size' && `% por tamaño (${tariff.increase_percentage}%)`}
                    </span>
                  </div>

                  {svc.description && (
                    <p className="text-xs text-neutral-500">{svc.description}</p>
                  )}

                  {/* Precios preview */}
                  <div className="pt-1 flex items-center gap-2 text-xs flex-wrap">
                    {svc.price_mode === 'unique' ? (
                      <span className="font-bold text-neutral-800">
                        {previewPrice1 > 0 ? `$${previewPrice1.toLocaleString('es-UY')}` : 'Sin precio definido'}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 text-neutral-600">
                        <span>T1: <strong className="text-neutral-900">${previewPrice1.toLocaleString('es-UY')}</strong></span>
                        <span>·</span>
                        <span>T2: <strong className="text-neutral-900">${previewPrice2.toLocaleString('es-UY')}</strong></span>
                        <span>·</span>
                        <span>T3: <strong className="text-neutral-900">${previewPrice3.toLocaleString('es-UY')}</strong></span>
                        <span>·</span>
                        <span>T4: <strong className="text-neutral-900">${previewPrice4.toLocaleString('es-UY')}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 self-end md:self-auto">
                  {isAdmin && (
                    <>
                      {/* Reordenar */}
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        title="Subir"
                        className="p-1.5 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === services.length - 1}
                        title="Bajar"
                        className="p-1.5 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      <div className="h-4 w-px bg-neutral-200 mx-1" />

                      {/* Toggle active */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(svc.id)}
                        className={`text-xs px-2.5 py-1 rounded font-bold uppercase tracking-wider border ${
                          svc.is_active
                            ? 'border-neutral-300 text-neutral-600 hover:bg-neutral-100'
                            : 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {svc.is_active ? 'Desactivar' : 'Activar'}
                      </button>

                      {/* Editar */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingService(JSON.parse(JSON.stringify(svc)));
                          setIsCreating(false);
                        }}
                        className="p-1.5 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Eliminar */}
                      <button
                        type="button"
                        onClick={() => handleDelete(svc.id)}
                        className="p-1.5 rounded text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Editar / Crear */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E5E5E3] shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E5E5E3] flex items-center justify-between bg-neutral-50">
              <h3 className="font-bold text-neutral-900 uppercase tracking-wider font-['Barlow_Condensed'] text-lg">
                {isCreating ? 'Nuevo servicio especial' : 'Editar servicio especial'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Nombre del servicio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Pulido de faros"
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-[#D7141A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre lo que incluye o recomendaciones..."
                  value={editingService.description || ''}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-[#D7141A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Modo de precio
                </label>
                <select
                  value={editingService.price_mode}
                  onChange={(e) => {
                    const mode = e.target.value as SpecialServicePriceMode;
                    setEditingService({ ...editingService, price_mode: mode });
                  }}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#D7141A]"
                >
                  <option value="unique">Precio único para todos los tamaños</option>
                  <option value="per_size">Precio específico por cada tamaño (1 a 4)</option>
                  <option value="percentage_size">Calculado con % de tarifa por tamaño</option>
                </select>
              </div>

              {/* Campos según modo */}
              {editingService.price_mode === 'unique' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Precio ($ UYU)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={editingService.unique_price || ''}
                    onChange={(e) => setEditingService({
                      ...editingService,
                      unique_price: e.target.value ? Number(e.target.value) : 0
                    })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-[#D7141A]"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">Dejar en 0 si es a cotizar o sin costo fijo.</p>
                </div>
              )}

              {editingService.price_mode === 'per_size' && (
                <div className="grid grid-cols-2 gap-3 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                  {[1, 2, 3, 4].map((sizeNum) => {
                    const currentPrices = (editingService.prices_per_size || editingService.prices_by_size || {}) as Record<1 | 2 | 3 | 4, number>;
                    const val = currentPrices[sizeNum as 1 | 2 | 3 | 4] || 0;
                    const sizeLabel = sizeNum === 1 ? 'Chico' : sizeNum === 2 ? 'Mediano' : sizeNum === 3 ? 'SUV' : 'Grande / Pick-up';

                    return (
                      <div key={sizeNum}>
                        <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                          T{sizeNum} ({sizeLabel})
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={val || ''}
                          onChange={(e) => {
                            const newPrice = e.target.value ? Number(e.target.value) : 0;
                            const nextPrices = {
                              ...currentPrices,
                              [sizeNum]: newPrice
                            } as Record<1 | 2 | 3 | 4, number>;
                            setEditingService({
                              ...editingService,
                              prices_per_size: nextPrices,
                              prices_by_size: nextPrices
                            });
                          }}
                          className="w-full px-2.5 py-1.5 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:border-[#D7141A]"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {editingService.price_mode === 'percentage_size' && (
                <div className="space-y-3 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      Precio base para Tamaño 1 ($ UYU)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={editingService.base_price || ''}
                      onChange={(e) => setEditingService({
                        ...editingService,
                        base_price: e.target.value ? Number(e.target.value) : 0
                      })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#D7141A]"
                    />
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Se aplicará el {tariff.increase_percentage}% por tamaño con modo {tariff.calculation_mode}.
                    </p>
                  </div>

                  {Number(editingService.base_price) > 0 && (
                    <div className="pt-2 border-t border-neutral-200 grid grid-cols-4 gap-2 text-center text-xs">
                      {[1, 2, 3, 4].map(s => {
                        const preview = getSpecialServicePrice(
                          { ...editingService, base_price: Number(editingService.base_price) },
                          s as 1 | 2 | 3 | 4,
                          tariff
                        );
                        return (
                          <div key={s} className="bg-white p-1.5 rounded border border-neutral-200">
                            <span className="text-[10px] text-neutral-500 font-bold block">T{s}</span>
                            <span className="font-bold text-neutral-900">${preview.toLocaleString('es-UY')}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="service_is_active"
                  checked={editingService.is_active}
                  onChange={(e) => setEditingService({ ...editingService, is_active: e.target.checked })}
                  className="rounded text-[#D7141A] focus:ring-[#D7141A]"
                />
                <label htmlFor="service_is_active" className="text-sm text-neutral-800 font-medium">
                  Servicio activo (disponible al cargar trabajos)
                </label>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D7141A] hover:bg-[#b01015] text-white rounded-lg text-sm font-bold uppercase tracking-wider shadow-sm"
                >
                  Guardar servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
