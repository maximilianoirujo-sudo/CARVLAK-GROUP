import React, { useState } from 'react';
import { X, Sparkles, Plus, Check, Clock, DollarSign, Layers } from 'lucide-react';
import { DetailingTariff, DetailingTariffPrices } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { formatCurrency } from '../../../lib/formatters';

interface DetailingTariffManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DetailingTariffManagerModal: React.FC<DetailingTariffManagerModalProps> = ({
  isOpen,
  onClose
}) => {
  const { detailingTariffs, updateDetailingTariff, addDetailingTariff } = useData();
  const { showToast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedPrices, setEditedPrices] = useState<DetailingTariffPrices>({
    chico: 0,
    mediano: 0,
    suv: 0,
    pickup: 0,
    moto: 0
  });

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceShort, setNewServiceShort] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceHours, setNewServiceHours] = useState(3);
  const [newPrices, setNewPrices] = useState<DetailingTariffPrices>({
    chico: 2000,
    mediano: 2500,
    suv: 3000,
    pickup: 3500,
    moto: 1500
  });

  if (!isOpen) return null;

  const startEditing = (tariff: DetailingTariff) => {
    setEditingId(tariff.id);
    setEditedPrices({ ...tariff.prices });
  };

  const saveEditing = (id: string) => {
    updateDetailingTariff(id, editedPrices);
    setEditingId(null);
    showToast('Tarifario actualizado correctamente', 'success');
  };

  const handleCreateNewService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) {
      showToast('Ingresá el nombre del servicio', 'error');
      return;
    }

    addDetailingTariff({
      name: newServiceName.trim(),
      shortName: newServiceShort.trim() || newServiceName.trim(),
      description: newServiceDesc.trim() || 'Servicio de estética automotriz',
      durationHours: Number(newServiceHours) || 2,
      prices: newPrices,
      isActive: true
    });

    setIsAddingNew(false);
    setNewServiceName('');
    setNewServiceShort('');
    setNewServiceDesc('');
    showToast('Nuevo servicio agregado al tarifario', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0E131F] border border-purple-500/30 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#121826]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Tarifario Paramétrico DetailVlak
              </h3>
              <p className="text-xs text-slate-400">
                Precios oficiales en $UYU adaptados automáticamente según categoría de vehículo.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingNew ? 'Cancelar' : 'Nuevo Servicio'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Formulario de Alta si se activa */}
        {isAddingNew && (
          <form onSubmit={handleCreateNewService} className="p-4 sm:p-5 bg-[#141A28] border-b border-slate-800 space-y-4 animate-fade-in">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
              Agregar nuevo servicio al catálogo
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400">Nombre Completo</label>
                <input
                  type="text"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="Ej: Sellado de Parabrisas Hidrofóbico"
                  className="w-full mt-1 bg-[#090D15] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400">Nombre Corto (WhatsApp)</label>
                <input
                  type="text"
                  value={newServiceShort}
                  onChange={(e) => setNewServiceShort(e.target.value)}
                  placeholder="Ej: Sellado Vidrios"
                  className="w-full mt-1 bg-[#090D15] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400">Tiempo Estimado (Horas)</label>
                <input
                  type="number"
                  step="0.5"
                  value={newServiceHours}
                  onChange={(e) => setNewServiceHours(Number(e.target.value))}
                  className="w-full mt-1 bg-[#090D15] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(['chico', 'mediano', 'suv', 'pickup', 'moto'] as const).map((cat) => (
                <div key={cat} className="p-2.5 rounded-xl bg-[#0B0F19] border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{cat}</span>
                  <div className="relative mt-1">
                    <span className="absolute left-2 top-2 text-[10px] text-slate-500 font-bold">$U</span>
                    <input
                      type="number"
                      value={newPrices[cat]}
                      onChange={(e) => setNewPrices({ ...newPrices, [cat]: Number(e.target.value) })}
                      className="w-full bg-[#121826] border border-slate-700 rounded-lg pl-7 pr-2 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg"
            >
              Guardar Servicio
            </button>
          </form>
        )}

        {/* Lista de servicios */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3">
          {detailingTariffs.map((t) => {
            const isEditing = editingId === t.id;

            return (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-[#121826] border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{t.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-purple-400" />
                        {t.durationHours} hs
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{t.description}</p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {isEditing ? (
                      <button
                        onClick={() => saveEditing(t.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-600/20"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Guardar</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => startEditing(t)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-colors"
                      >
                        Editar Precios
                      </button>
                    )}
                  </div>
                </div>

                {/* Precios por tamaño */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-slate-800/60">
                  {(['chico', 'mediano', 'suv', 'pickup', 'moto'] as const).map((cat) => {
                    const price = isEditing ? editedPrices[cat] : t.prices[cat];

                    return (
                      <div key={cat} className="p-2 rounded-xl bg-[#090D15] border border-slate-800/80 flex flex-col justify-between">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                          {cat === 'suv' ? 'SUV/Rural' : cat}
                        </span>
                        {isEditing ? (
                          <div className="relative mt-1">
                            <span className="absolute left-1.5 top-1 text-[10px] text-slate-500 font-bold">$U</span>
                            <input
                              type="number"
                              value={price}
                              onChange={(e) => setEditedPrices({ ...editedPrices, [cat]: Number(e.target.value) })}
                              className="w-full bg-[#121826] border border-purple-500/50 rounded pl-6 pr-1 py-0.5 text-xs text-white font-mono"
                            />
                          </div>
                        ) : (
                          <span className="text-xs font-mono font-bold text-amber-400 mt-1">
                            {formatCurrency(price, 'UYU')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
