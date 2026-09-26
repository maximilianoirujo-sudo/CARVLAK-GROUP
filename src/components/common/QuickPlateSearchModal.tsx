import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { Search, Car, ArrowRight, ShieldCheck, User } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { normalizePlate } from '../../lib/formatters';
import { Vehicle } from '../../types';

interface QuickPlateSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
}

export const QuickPlateSearchModal: React.FC<QuickPlateSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectVehicle
}) => {
  const { vehicles, clients } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVehicles = useMemo(() => {
    if (!searchTerm.trim()) return vehicles.slice(0, 6);
    const q = searchTerm.toUpperCase().replace(/[^A-Z0-9]/g, '');

    return vehicles.filter((v) => {
      const plateClean = v.plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const brandMatch = v.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const modelMatch = v.model.toLowerCase().includes(searchTerm.toLowerCase());
      return plateClean.includes(q) || brandMatch || modelMatch;
    });
  }, [vehicles, searchTerm]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Búsqueda Rápida de Vehículo"
      subtitle="Escribí la matrícula para abrir su ficha desde cualquier pantalla"
      maxWidth="max-w-md"
    >
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Ej: SBX 1234, Hilux, BMW..."
          autoFocus
          className="w-full pl-11 pr-4 py-3 bg-[#131924] border border-amber-500/30 rounded-2xl text-base font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
        />
      </div>

      <div className="space-y-2 mt-3">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
          {searchTerm ? 'Resultados encontrados' : 'Vehículos recientes'}
        </div>

        {filteredVehicles.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Car className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold text-slate-400">No encontramos esa matrícula</p>
            <p className="text-xs text-slate-500 mt-0.5">Podés registrarlo desde la sección Vehículos</p>
          </div>
        ) : (
          filteredVehicles.map((vehicle) => {
            const client = clients.find((c) => c.id === vehicle.client_id);
            const isDealership = vehicle.ownership === 'dealership';

            return (
              <div
                key={vehicle.id}
                onClick={() => {
                  onSelectVehicle(vehicle);
                  onClose();
                }}
                className="p-3.5 rounded-2xl bg-[#131924] hover:bg-[#18202E] border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center font-black text-amber-400 text-sm tracking-widest shrink-0">
                    {normalizePlate(vehicle.plate)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      {vehicle.brand} {vehicle.model}
                    </h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      {isDealership ? (
                        <span className="text-amber-400 flex items-center gap-1 font-semibold text-[10px]">
                          <ShieldCheck className="w-3 h-3" /> Propio Automotora
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px]">
                          <User className="w-3 h-3 text-slate-400" /> {client?.full_name || 'Particular'}
                        </span>
                      )}
                      <span>• {vehicle.category}</span>
                    </p>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
};
