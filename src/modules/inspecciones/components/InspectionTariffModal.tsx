import React, { useState } from 'react';
import { useData } from '../../../context/DataContext';
import { VehicleCategory } from '../../../types';
import { X, DollarSign, Save } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-xl bg-white border border-[#E5E5E3] shadow-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] text-[#D7141A] flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-title font-bold uppercase text-[#6B6B6B] tracking-wider">
                Configuración
              </span>
              <h2 className="text-base font-title font-bold text-[#161616]">Tarifario de inspecciones</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#6B6B6B]">
              Precios precompra por categoría ($UYU)
            </label>
            <div className="space-y-2 bg-[#F5F5F4] p-3.5 rounded-xl border border-[#E5E5E3]">
              {(['Chico', 'Mediano', 'SUV/Rural', 'Pick-up', 'Moto'] as VehicleCategory[]).map(
                (cat) => (
                  <div key={cat} className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-[#161616] w-28">{cat}</span>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className="text-[#6B6B6B] font-mono">$U</span>
                      <input
                        type="number"
                        value={prices[cat] || 0}
                        onChange={(e) => handlePriceChange(cat, Number(e.target.value) || 0)}
                        className="w-28 px-3 py-1.5 rounded-lg bg-white border border-[#E5E5E3] text-[#161616] font-mono text-xs focus:border-[#161616] outline-none text-right"
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#6B6B6B]">
                Recargo a domicilio ($UYU)
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[#6B6B6B] text-xs font-mono">$U</span>
                <input
                  type="number"
                  value={homeVisitSurcharge}
                  onChange={(e) => setHomeVisitSurcharge(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616] font-mono text-xs focus:bg-white focus:border-[#161616] outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#6B6B6B]">
                Costo interno ($UYU)
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[#6B6B6B] text-xs font-mono">$U</span>
                <input
                  type="number"
                  value={internalCost}
                  onChange={(e) => setInternalCost(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616] font-mono text-xs focus:bg-white focus:border-[#161616] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5E3]">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              <Save className="w-4 h-4" />
              <span>Guardar tarifas</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
