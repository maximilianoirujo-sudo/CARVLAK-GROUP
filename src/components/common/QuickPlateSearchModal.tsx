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
      title="Búsqueda rápida de vehículo"
      subtitle="Escribí la matrícula para abrir su ficha desde cualquier pantalla"
      maxWidth="max-w-md"
    >
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Ej: SBX 1234, Hilux, BMW..."
          autoFocus
          className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E5E3] rounded-xl text-base font-bold text-[#161616] placeholder:text-[#9A9A9A] focus:outline-none focus:border-[#D7141A] focus:ring-1 focus:ring-[#D7141A]"
        />
      </div>

      <div className="space-y-2 mt-3">
        <div className="text-[11px] font-semibold text-[#6B6B6B] px-1">
          {searchTerm ? 'Resultados encontrados' : 'Vehículos recientes'}
        </div>

        {filteredVehicles.length === 0 ? (
          <div className="text-center py-8 text-[#6B6B6B]">
            <Car className="w-10 h-10 mx-auto mb-2 text-[#9A9A9A]" />
            <p className="text-sm font-semibold text-[#161616]">No encontramos esa matrícula</p>
            <p className="text-xs text-[#6B6B6B] mt-0.5">Podés registrarlo desde la sección Vehículos</p>
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
                className="p-3.5 rounded-xl bg-white hover:bg-[#F5F5F4] border border-[#E5E5E3] hover:border-[#161616] cursor-pointer transition-all flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] flex items-center justify-center font-black text-[#161616] text-sm tracking-widest shrink-0">
                    {normalizePlate(vehicle.plate)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#161616] transition-colors">
                      {vehicle.brand} {vehicle.model}
                    </h4>
                    <p className="text-xs text-[#6B6B6B] flex items-center gap-1.5 mt-0.5">
                      {isDealership ? (
                        <span className="text-[#D7141A] flex items-center gap-1 font-semibold text-[10px]">
                          <ShieldCheck className="w-3 h-3" /> Propio automotora
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px]">
                          <User className="w-3 h-3 text-[#6B6B6B]" /> {client?.full_name || 'Particular'}
                        </span>
                      )}
                      <span>• {vehicle.category}</span>
                    </p>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-[#9A9A9A] group-hover:text-[#161616] group-hover:translate-x-1 transition-all" />
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
};
