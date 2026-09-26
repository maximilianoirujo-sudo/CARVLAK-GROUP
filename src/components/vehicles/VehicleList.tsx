import React, { useState, useMemo } from 'react';
import {
  Car,
  Search,
  Plus,
  Filter,
  ShieldCheck,
  User,
  Image as ImageIcon,
  ArrowRight
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Vehicle, VehicleCategory, VehicleOwnership } from '../../types';
import { normalizePlate } from '../../lib/formatters';
import { VehicleDetailModal } from './VehicleDetailModal';
import { VehicleFormModal } from './VehicleFormModal';

interface VehicleListProps {
  onScheduleAppointment: (vehicle: Vehicle) => void;
}

export const VehicleList: React.FC<VehicleListProps> = ({ onScheduleAppointment }) => {
  const { vehicles, clients } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | VehicleCategory>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | VehicleOwnership>('all');

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (categoryFilter !== 'all' && v.category !== categoryFilter) return false;
      if (ownershipFilter !== 'all' && v.ownership !== ownershipFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const plateNorm = v.plate.toLowerCase();
        const brandMatch = v.brand.toLowerCase().includes(q);
        const modelMatch = v.model.toLowerCase().includes(q);
        return plateNorm.includes(q) || brandMatch || modelMatch;
      }
      return true;
    });
  }, [vehicles, categoryFilter, ownershipFilter, searchTerm]);

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      
      {/*  */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#121721] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Vehículos</h2>
              <p className="text-xs text-slate-400">Ficha centralizada e historial por matrícula</p>
            </div>
          </div>

          <button
            onClick={() => {
              setVehicleToEdit(null);
              setIsFormOpen(true);
            }}
            className="px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Auto</span>
          </button>
        </div>

        {/*  */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por matrícula, marca o modelo (ej: SBX 1234, Hilux)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/*  */}
            <select
              value={ownershipFilter}
              onChange={(e) => setOwnershipFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">🚗 Toda propiedad</option>
              <option value="client">👤 Clientes particulares</option>
              <option value="dealership">🏢 Propio de automotora</option>
            </select>

            {/*  */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">📦 Todas las categorías</option>
              <option value="Chico">Chico</option>
              <option value="Mediano">Mediano</option>
              <option value="SUV/Rural">SUV / Rural</option>
              <option value="Pick-up">Pick-up</option>
              <option value="Moto">Moto</option>
            </select>
          </div>
        </div>
      </div>

      {/*  */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400">
        <span>{filteredVehicles.length} vehículos registrados</span>
        <span>Hacé clic en cualquier ficha para ver fotos e historial</span>
      </div>

      {/*  */}
      {filteredVehicles.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#121721] border border-slate-800 text-center text-slate-400">
          <Car className="w-12 h-12 mx-auto mb-3 opacity-25 text-amber-400" />
          <p className="text-base font-bold text-slate-300">No encontramos vehículos con esos filtros</p>
          <p className="text-xs text-slate-500 mt-1">Podés registrar un vehículo nuevo con el botón superior.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => {
            const client = clients.find((c) => c.id === vehicle.client_id);
            const isDealership = vehicle.ownership === 'dealership';
            const mainPhoto = vehicle.photos && vehicle.photos.length > 0 ? vehicle.photos[0] : null;

            return (
              <div
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle)}
                className="p-4 rounded-3xl bg-[#121721] border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all flex flex-col justify-between space-y-3 group shadow-lg"
              >
                <div>
                  {/*  */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700/80 font-black text-amber-400 text-xs tracking-widest font-mono">
                      {normalizePlate(vehicle.plate)}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {vehicle.category}
                    </span>
                  </div>

                  {/*  */}
                  {mainPhoto && (
                    <div className="mt-3 aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800/80">
                      <img
                        src={mainPhoto}
                        alt={vehicle.plate}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/*  */}
                  <div className="mt-3">
                    <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Año {vehicle.year || 'S/D'} • {vehicle.color || 'Sin color'} •{' '}
                      {vehicle.mileage ? vehicle.mileage.toLocaleString('es-UY') + ' km' : '0 km'}
                    </p>
                  </div>

                  {/*  */}
                  <div className="mt-3 p-2.5 rounded-2xl bg-[#0F141E] border border-slate-800/80 text-xs flex items-center justify-between">
                    {isDealership ? (
                      <span className="text-amber-400 font-bold flex items-center gap-1.5 text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5" /> Propio Automotora
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 truncate">
                        <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="text-slate-200 font-semibold truncate">
                          {client?.full_name || 'Particular'}
                        </span>
                      </div>
                    )}
                    {vehicle.photos?.length > 0 && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> {vehicle.photos.length}
                      </span>
                    )}
                  </div>
                </div>

                {/*  */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400 font-bold">
                  <span>Ver Ficha e Historial</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/*  */}
      {selectedVehicle && (
        <VehicleDetailModal
          isOpen={Boolean(selectedVehicle)}
          onClose={() => setSelectedVehicle(null)}
          vehicle={selectedVehicle}
          onEdit={(veh) => {
            setVehicleToEdit(veh);
            setIsFormOpen(true);
          }}
          onScheduleAppointment={onScheduleAppointment}
        />
      )}

      {isFormOpen && (
        <VehicleFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          vehicleToEdit={vehicleToEdit}
        />
      )}

    </div>
  );
};
