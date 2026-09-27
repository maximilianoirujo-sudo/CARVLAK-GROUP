import React, { useState } from 'react';
import { X, Sparkles, Plus, Check, Clock, DollarSign, Layers } from 'lucide-react';
import { DetailingTariff, DetailingTariffPrices } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { formatCurrency } from '../../../lib/formatters';
import { Button } from '../../../components/ui/Button';

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
      <div className="bg-panel border border-borde rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-borde flex items-center justify-between bg-negro">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-panel border border-borde text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-rojo" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Tarifario Paramétrico DetailVlak
              </h3>
              <p className="text-xs text-gris-texto">
                Precios oficiales en $UYU adaptados automáticamente según categoría de vehículo.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddingNew(!isAddingNew)}
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingNew ? 'Cancelar' : 'Nuevo Servicio'}</span>
            </Button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-panel hover:bg-negro text-gris-texto hover:text-white flex items-center justify-center transition-colors border border-borde"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Formulario de Alta si se activa */}
        {isAddingNew && (
          <form onSubmit={handleCreateNewService} className="p-4 sm:p-5 bg-panel border-b border-borde space-y-4 animate-fade-in">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Agregar nuevo servicio al catálogo
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gris-texto">Nombre Completo</label>
                <input
                  type="text"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="Ej: Sellado de Parabrisas Hidrofóbico"
                  className="w-full mt-1 bg-negro border border-borde rounded-xl px-3 py-2 text-xs text-white placeholder-gris-texto focus:border-rojo focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gris-texto">Nombre Corto (WhatsApp)</label>
                <input
                  type="text"
                  value={newServiceShort}
                  onChange={(e) => setNewServiceShort(e.target.value)}
                  placeholder="Ej: Sellado Vidrios"
                  className="w-full mt-1 bg-negro border border-borde rounded-xl px-3 py-2 text-xs text-white placeholder-gris-texto focus:border-rojo focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gris-texto">Tiempo Estimado (Horas)</label>
                <input
                  type="number"
                  step="0.5"
                  value={newServiceHours}
                  onChange={(e) => setNewServiceHours(Number(e.target.value))}
                  className="w-full mt-1 bg-negro border border-borde rounded-xl px-3 py-2 text-xs text-white focus:border-rojo focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(['chico', 'mediano', 'suv', 'pickup', 'moto'] as const).map((cat) => (
                <div key={cat} className="p-2.5 rounded-xl bg-negro border border-borde">
                  <span className="text-[10px] uppercase font-bold text-gris-texto block">{cat}</span>
                  <div className="relative mt-1">
                    <span className="absolute left-2 top-2 text-[10px] text-gris-texto font-bold">$U</span>
                    <input
                      type="number"
                      value={newPrices[cat]}
                      onChange={(e) => setNewPrices({ ...newPrices, [cat]: Number(e.target.value) })}
                      className="w-full bg-panel border border-borde rounded-lg pl-7 pr-2 py-1.5 text-xs text-white font-mono focus:border-rojo focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="primary"
              size="sm"
              type="submit"
            >
              Guardar Servicio
            </Button>
          </form>
        )}

        {/* Lista de servicios */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3">
          {detailingTariffs.map((t) => {
            const isEditing = editingId === t.id;

            return (
              <div
                key={t.id}
                className="p-4 rounded-xl bg-panel border border-borde hover:border-rojo/40 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{t.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-negro text-gris-texto border border-borde flex items-center gap-1 font-bold">
                        <Clock className="w-3 h-3 text-white" />
                        {t.durationHours} hs
                      </span>
                    </h4>
                    <p className="text-[11px] text-gris-texto mt-0.5">{t.description}</p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {isEditing ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => saveEditing(t.id)}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Guardar</span>
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => startEditing(t)}
                      >
                        Editar Precios
                      </Button>
                    )}
                  </div>
                </div>

                {/* Precios por tamaño */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-borde">
                  {(['chico', 'mediano', 'suv', 'pickup', 'moto'] as const).map((cat) => {
                    const price = isEditing ? editedPrices[cat] : t.prices[cat];

                    return (
                      <div key={cat} className="p-2 rounded-lg bg-negro border border-borde flex flex-col justify-between">
                        <span className="text-[9px] font-black uppercase tracking-wider text-gris-texto">
                          {cat === 'suv' ? 'SUV/Rural' : cat}
                        </span>
                        {isEditing ? (
                          <div className="relative mt-1">
                            <span className="absolute left-1.5 top-1 text-[10px] text-gris-texto font-bold">$U</span>
                            <input
                              type="number"
                              value={price}
                              onChange={(e) => setEditedPrices({ ...editedPrices, [cat]: Number(e.target.value) })}
                              className="w-full bg-panel border border-rojo rounded pl-6 pr-1 py-0.5 text-xs text-white font-mono focus:outline-none"
                            />
                          </div>
                        ) : (
                          <span className="text-xs font-mono font-bold text-white mt-1">
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
