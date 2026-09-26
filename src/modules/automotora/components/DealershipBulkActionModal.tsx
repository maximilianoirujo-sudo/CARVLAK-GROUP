import React, { useState, useMemo } from 'react';
import { X, DollarSign, RefreshCw, CheckCircle2, TrendingUp, TrendingDown, Layers, ArrowRight } from 'lucide-react';
import { DealershipVehicle, DealershipVehicleStatus } from '../../../types';

interface DealershipBulkActionModalProps {
  isOpen: boolean;
  selectedVehicles: DealershipVehicle[];
  onClose: () => void;
  onApplyStatus: (newStatus: DealershipVehicleStatus) => void;
  onApplyPriceAdjustment: (type: 'percent' | 'fixed', amount: number) => void;
}

const STATUS_OPTIONS: Array<{ id: DealershipVehicleStatus; label: string; color: string }> = [
  { id: 'evaluacion', label: 'En evaluación', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { id: 'comprado', label: 'Comprado', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { id: 'preparacion', label: 'En preparación', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { id: 'publicado', label: 'Publicado', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { id: 'reservado', label: 'Reservado', color: 'bg-amber-300/10 text-amber-300 border-amber-300/20' },
  { id: 'vendido', label: 'Vendido', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  { id: 'descartado', label: 'Descartado', color: 'bg-red-500/10 text-red-400 border-red-500/20' }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#18181b] border border-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Acciones masivas</h3>
              <p className="text-xs text-gray-400">
                {selectedVehicles.length} vehículo{selectedVehicles.length === 1 ? '' : 's'} seleccionado{selectedVehicles.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-gray-800 bg-zinc-900/40 px-6 pt-3 gap-4">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'status'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Cambio de Estado
          </button>
          <button
            onClick={() => setActiveTab('price')}
            className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'price'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
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
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
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
                        className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/10'
                            : 'bg-zinc-900/60 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{st.label}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* List of affected vehicles */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Vehículos que se modificarán:
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-800 rounded-xl divide-y divide-gray-800/60 bg-zinc-900/30">
                  {selectedVehicles.map((v) => (
                    <div key={v.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white">{v.brand} {v.model}</span>
                        <span className="text-gray-400 ml-2">({v.year})</span>
                        {v.plate && (
                          <span className="ml-2 font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] text-gray-300">
                            {v.plate}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{v.status}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
                        <span className="font-semibold text-blue-400">{targetStatus}</span>
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
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Método de ajuste:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setAdjustmentType('percent'); setAmount(0); }}
                    className={`p-3 rounded-xl border text-center text-xs font-semibold transition-all ${
                      adjustmentType === 'percent'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-zinc-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    Porcentaje (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAdjustmentType('fixed'); setAmount(0); }}
                    className={`p-3 rounded-xl border text-center text-xs font-semibold transition-all ${
                      adjustmentType === 'fixed'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-zinc-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    Monto fijo (USD)
                  </button>
                </div>
              </div>

              {/* Amount input & shortcuts */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Valor a ajustar (positivo para aumento, negativo para descuento):
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">
                      {adjustmentType === 'percent' ? '%' : 'USD'}
                    </span>
                    <input
                      type="number"
                      step={adjustmentType === 'percent' ? '1' : '50'}
                      value={amount || ''}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full pl-14 pr-4 py-2.5 bg-zinc-900 border border-gray-800 rounded-xl text-white font-mono text-base focus:outline-none focus:border-emerald-500"
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
                          className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-gray-300 border border-gray-700"
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
                          className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-gray-300 border border-gray-700 font-mono"
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
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Vista previa de precios resultantes:
                </label>
                <div className="max-h-56 overflow-y-auto border border-gray-800 rounded-xl bg-zinc-900/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900/80 sticky top-0 border-b border-gray-800 text-gray-400">
                      <tr>
                        <th className="p-2.5">Vehículo</th>
                        <th className="p-2.5 text-right">Precio Actual</th>
                        <th className="p-2.5 text-right">Ajuste</th>
                        <th className="p-2.5 text-right">Nuevo Precio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {pricePreviews.map((p) => (
                        <tr key={p.id} className="hover:bg-zinc-800/40">
                          <td className="p-2.5 font-medium text-white">
                            {p.brand} {p.model}
                            {p.plate && <span className="ml-1.5 font-mono text-[10px] text-gray-400">({p.plate})</span>}
                          </td>
                          <td className="p-2.5 text-right font-mono text-gray-400">
                            USD {p.currentPrice.toLocaleString('es-UY')}
                          </td>
                          <td className="p-2.5 text-right font-mono">
                            {p.diff === 0 ? (
                              <span className="text-gray-500">—</span>
                            ) : p.diff > 0 ? (
                              <span className="text-emerald-400 flex items-center justify-end gap-0.5">
                                <TrendingUp className="w-3 h-3" /> +{p.diff.toLocaleString('es-UY')}
                              </span>
                            ) : (
                              <span className="text-rose-400 flex items-center justify-end gap-0.5">
                                <TrendingDown className="w-3 h-3" /> {p.diff.toLocaleString('es-UY')}
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
        <div className="px-6 py-4 bg-zinc-900/40 border-t border-gray-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg transition-colors hover:bg-gray-800"
          >
            Cancelar
          </button>
          {activeTab === 'status' ? (
            <button
              type="submit"
              form="bulk-status-form"
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              Aplicar estado a {selectedVehicles.length} unidades
            </button>
          ) : (
            <button
              type="submit"
              form="bulk-price-form"
              disabled={amount === 0}
              className={`px-5 py-2 text-sm font-semibold text-white rounded-lg shadow-lg active:scale-95 transition-all ${
                amount === 0
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
              }`}
            >
              Aplicar ajuste de precio
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
