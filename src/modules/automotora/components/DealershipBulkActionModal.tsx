import React, { useState, useMemo } from 'react';
import { X, DollarSign, RefreshCw, CheckCircle2, TrendingUp, TrendingDown, Layers, ArrowRight } from 'lucide-react';
import { DealershipVehicle, DealershipVehicleStatus } from '../../../types';
import { Button } from '../../../components/ui/Button';

interface DealershipBulkActionModalProps {
  isOpen: boolean;
  selectedVehicles: DealershipVehicle[];
  onClose: () => void;
  onApplyStatus: (newStatus: DealershipVehicleStatus) => void;
  onApplyPriceAdjustment: (type: 'percent' | 'fixed', amount: number) => void;
}

const STATUS_OPTIONS: Array<{ id: DealershipVehicleStatus; label: string }> = [
  { id: 'evaluacion', label: 'En evaluación' },
  { id: 'comprado', label: 'Comprado' },
  { id: 'preparacion', label: 'En preparación' },
  { id: 'publicado', label: 'Publicado' },
  { id: 'reservado', label: 'Reservado' },
  { id: 'vendido', label: 'Vendido' },
  { id: 'descartado', label: 'Descartado' }
];

export const DealershipBulkActionModal: React.FC<DealershipBulkActionModalProps> = ({
  isOpen,
  selectedVehicles,
  onClose,
  onApplyStatus,
  onApplyPriceAdjustment
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'price'>('status');

  // Estado masivo
  const [targetStatus, setTargetStatus] = useState<DealershipVehicleStatus>('publicado');

  // Precios masivos
  const [adjustmentType, setAdjustmentType] = useState<'percent' | 'fixed'>('percent');
  const [amount, setAmount] = useState<number>(0);

  // Previsualización de cálculo de precio
  const pricePreviews = useMemo(() => {
    return selectedVehicles.map((v) => {
      const currentPrice = v.sale_price || 0;
      let newPrice = currentPrice;
      if (adjustmentType === 'percent') {
        newPrice = Math.round(currentPrice * (1 + (amount || 0) / 100));
      } else {
        newPrice = Math.max(0, Math.round(currentPrice + (amount || 0)));
      }
      const diff = newPrice - currentPrice;
      return {
        id: v.id,
        brand: v.brand,
        model: v.model,
        year: v.year,
        plate: v.plate,
        currentPrice,
        newPrice,
        diff
      };
    });
  }, [selectedVehicles, adjustmentType, amount]);

  if (!isOpen) return null;

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyStatus(targetStatus);
  };

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === 0) return;
    onApplyPriceAdjustment(adjustmentType, amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-panel border border-borde rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-borde flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-negro border border-borde text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Acciones masivas</h3>
              <p className="text-xs text-gris-texto">
                {selectedVehicles.length} vehículo{selectedVehicles.length === 1 ? '' : 's'} seleccionado{selectedVehicles.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gris-texto hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-borde bg-negro px-6 pt-3 gap-6">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'status'
                ? 'border-rojo text-white'
                : 'border-transparent text-gris-texto hover:text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Cambio de Estado
          </button>
          <button
            onClick={() => setActiveTab('price')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'price'
                ? 'border-rojo text-white'
                : 'border-transparent text-gris-texto hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Ajuste de Precios
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'status' ? (
            <form id="bulk-status-form" onSubmit={handleStatusSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gris-texto uppercase tracking-wider mb-2">
                  Seleccionar nuevo estado para las {selectedVehicles.length} unidades:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {STATUS_OPTIONS.map((st) => {
                    const isSelected = targetStatus === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setTargetStatus(st.id)}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-white text-black border-white shadow-md'
                            : 'bg-negro border-borde text-gris-texto hover:border-white/50 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{st.label}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-black" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* List of affected vehicles */}
              <div>
                <label className="block text-xs font-medium text-gris-texto mb-1.5">
                  Vehículos que se modificarán:
                </label>
                <div className="max-h-48 overflow-y-auto border border-borde rounded-xl divide-y divide-borde bg-negro">
                  {selectedVehicles.map((v) => (
                    <div key={v.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">{v.brand} {v.model}</span>
                        <span className="text-gris-texto ml-2">({v.year})</span>
                        {v.plate && (
                          <span className="ml-2 font-mono bg-panel border border-borde px-1.5 py-0.5 rounded text-[10px] text-white">
                            {v.plate}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gris-texto">{v.status}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gris-texto" />
                        <span className="font-bold text-white uppercase">{targetStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <form id="bulk-price-form" onSubmit={handlePriceSubmit} className="space-y-5">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-bold text-gris-texto uppercase tracking-wider mb-2">
                  Método de ajuste:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setAdjustmentType('percent'); setAmount(0); }}
                    className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${
                      adjustmentType === 'percent'
                        ? 'bg-white text-black border-white'
                        : 'bg-negro border-borde text-gris-texto hover:border-white/50 hover:text-white'
                    }`}
                  >
                    Porcentaje (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAdjustmentType('fixed'); setAmount(0); }}
                    className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${
                      adjustmentType === 'fixed'
                        ? 'bg-white text-black border-white'
                        : 'bg-negro border-borde text-gris-texto hover:border-white/50 hover:text-white'
                    }`}
                  >
                    Monto fijo (USD)
                  </button>
                </div>
              </div>

              {/* Amount input & shortcuts */}
              <div>
                <label className="block text-xs font-medium text-gris-texto mb-1.5">
                  Valor a ajustar (positivo para aumento, negativo para descuento):
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gris-texto text-sm font-bold">
                      {adjustmentType === 'percent' ? '%' : 'USD'}
                    </span>
                    <input
                      type="number"
                      step={adjustmentType === 'percent' ? '1' : '50'}
                      value={amount || ''}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full pl-14 pr-4 py-2.5 bg-negro border border-borde rounded-xl text-white font-mono text-base focus:outline-none focus:border-rojo"
                    />
                  </div>
                </div>

                {/* Shortcuts */}
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {adjustmentType === 'percent' ? (
                    <>
                      {[-10, -5, -3, 3, 5, 10].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setAmount(pct)}
                          className="px-2.5 py-1 text-xs rounded-lg bg-negro hover:bg-panel text-gris-texto hover:text-white border border-borde"
                        >
                          {pct > 0 ? `+${pct}%` : `${pct}%`}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      {[-2000, -1000, -500, 500, 1000, 2000].map((usd) => (
                        <button
                          key={usd}
                          type="button"
                          onClick={() => setAmount(usd)}
                          className="px-2.5 py-1 text-xs rounded-lg bg-negro hover:bg-panel text-gris-texto hover:text-white border border-borde font-mono"
                        >
                          {usd > 0 ? `+USD ${usd}` : `-USD ${Math.abs(usd)}`}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Live Preview Table */}
              <div>
                <label className="block text-xs font-bold text-gris-texto uppercase tracking-wider mb-2">
                  Vista previa de precios resultantes:
                </label>
                <div className="max-h-56 overflow-y-auto border border-borde rounded-xl bg-negro">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-negro sticky top-0 border-b border-borde text-gris-texto">
                      <tr>
                        <th className="p-2.5">Vehículo</th>
                        <th className="p-2.5 text-right">Precio Actual</th>
                        <th className="p-2.5 text-right">Ajuste</th>
                        <th className="p-2.5 text-right">Nuevo Precio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-borde">
                      {pricePreviews.map((p) => (
                        <tr key={p.id} className="hover:bg-panel">
                          <td className="p-2.5 font-bold text-white">
                            {p.brand} {p.model}
                            {p.plate && <span className="ml-1.5 font-mono text-[10px] text-gris-texto">({p.plate})</span>}
                          </td>
                          <td className="p-2.5 text-right font-mono text-gris-texto">
                            USD {p.currentPrice.toLocaleString('es-UY')}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold">
                            {p.diff === 0 ? (
                              <span className="text-gris-texto">—</span>
                            ) : p.diff > 0 ? (
                              <span className="text-white flex items-center justify-end gap-0.5">
                                <TrendingUp className="w-3 h-3 text-white" /> +{p.diff.toLocaleString('es-UY')}
                              </span>
                            ) : (
                              <span className="text-rojo flex items-center justify-end gap-0.5">
                                <TrendingDown className="w-3 h-3 text-rojo" /> {p.diff.toLocaleString('es-UY')}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-white">
                            USD {p.newPrice.toLocaleString('es-UY')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-negro border-t border-borde flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancelar
          </Button>
          {activeTab === 'status' ? (
            <Button
              type="submit"
              form="bulk-status-form"
              variant="primary"
            >
              Aplicar estado a {selectedVehicles.length} unidades
            </Button>
          ) : (
            <Button
              type="submit"
              form="bulk-price-form"
              variant="primary"
              disabled={amount === 0}
            >
              Aplicar ajuste de precio
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
