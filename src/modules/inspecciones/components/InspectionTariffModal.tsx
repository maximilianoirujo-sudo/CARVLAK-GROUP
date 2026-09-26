import React, { useState } from 'react';
import { useData } from '../../../context/DataContext';
import { VehicleCategory } from '../../../types';
import { X, DollarSign, Save, ShieldCheck } from 'lucide-react';

interface InspectionTariffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InspectionTariffModal: React.FC<InspectionTariffModalProps> = ({
  isOpen,
  onClose
}) => {
  const { inspectionTariffs, updateInspectionTariffs } = useData();

  const [prices, setPrices] = useState<Record<VehicleCategory, number>>({
    ...inspectionTariffs.prices
  });
  const [homeVisitSurcharge, setHomeVisitSurcharge] = useState<number>(
    inspectionTariffs.homeVisitSurcharge
  );
  const [internalCost, setInternalCost] = useState<number>(
    inspectionTariffs.internalCost
  );

  const handlePriceChange = (category: VehicleCategory, value: number) => {
    setPrices((prev) => ({ ...prev, [category]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateInspectionTariffs({
      prices,
      homeVisitSurcharge,
      internalCost
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-[#0F1420] border border-slate-700 shadow-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                Configuración
              </span>
              <h2 className="text-base font-bold text-white">Tarifario de Inspecciones</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">
              Precios Precompra por Categoría ($UYU)
            </label>
            <div className="space-y-2 bg-[#090D14] p-3.5 rounded-2xl border border-slate-800">
              {(['Chico', 'Mediano', 'SUV/Rural', 'Pick-up', 'Moto'] as VehicleCategory[]).map(
                (cat) => (
                  <div key={cat} className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-slate-300 w-28">{cat}</span>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className="text-slate-500 font-mono">$U</span>
                      <input
                        type="number"
                        value={prices[cat] || 0}
                        onChange={(e) => handlePriceChange(cat, Number(e.target.value) || 0)}
                        className="w-28 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-emerald-500 outline-none text-right"
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">
                Recargo Domicilio ($UYU)
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-xs font-mono">$U</span>
                <input
                  type="number"
                  value={homeVisitSurcharge}
                  onChange={(e) => setHomeVisitSurcharge(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">
                Costo Interno ($UYU)
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-xs font-mono">$U</span>
                <input
                  type="number"
                  value={internalCost}
                  onChange={(e) => setInternalCost(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black hover:bg-emerald-400 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Tarifas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
