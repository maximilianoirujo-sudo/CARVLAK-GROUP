import React, { useState, useMemo } from 'react';
import {
  Car,
  Search,
  Plus,
  ShieldCheck,
  User,
  Image as ImageIcon,
  ArrowRight
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Vehicle, VehicleCategory, VehicleOwnership } from '../../types';
import { UruguayanPlate } from '../ui/UruguayanPlate';
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
      
      {/* Header y Filtros */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5F5F4] text-[#161616] flex items-center justify-center shrink-0 border border-[#E5E5E3]">
              <Car className="w-5 h-5 text-[#161616]" />
            </div>
            <div>
              <h2 className="text-lg font-title font-bold text-[#161616]">Vehículos</h2>
              <p className="text-xs text-[#6B6B6B]">Ficha centralizada e historial por matrícula</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setVehicleToEdit(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#D7141A] hover:bg-[#B80E14] text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar vehículo</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-[#E5E5E3]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por matrícula, marca o modelo (ej: SBX 1234, Hilux)..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl text-xs text-[#161616] placeholder-[#9A9A9A] focus:outline-none focus:border-[#D7141A] focus:bg-white transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={ownershipFilter}
              onChange={(e) => setOwnershipFilter(e.target.value as any)}
              className="bg-white border border-[#E5E5E3] rounded-xl px-2.5 py-2 text-xs font-medium text-[#161616] focus:outline-none focus:border-[#D7141A] cursor-pointer"
            >
              <option value="all">Toda propiedad</option>
              <option value="client">Clientes particulares</option>
              <option value="dealership">Propio de automotora</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-white border border-[#E5E5E3] rounded-xl px-2.5 py-2 text-xs font-medium text-[#161616] focus:outline-none focus:border-[#D7141A] cursor-pointer"
            >
              <option value="all">Todas las categorías</option>
              <option value="Chico">Chico</option>
              <option value="Mediano">Mediano</option>
              <option value="SUV/Rural">SUV / Rural</option>
              <option value="Pick-up">Pick-up</option>
              <option value="Moto">Moto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contador */}
      <div className="flex items-center justify-between px-1 text-xs text-[#6B6B6B]">
        <span>{filteredVehicles.length} vehículos registrados</span>
        <span>Hacé clic en cualquier ficha para ver fotos e historial</span>
      </div>

      {/* Grid de Vehículos */}
      {filteredVehicles.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-[#E5E5E3] text-center text-[#6B6B6B]">
          <Car className="w-12 h-12 mx-auto mb-3 opacity-25 text-[#9A9A9A]" />
          <p className="text-base font-bold text-[#161616]">No encontramos vehículos con esos filtros</p>
          <p className="text-xs text-[#6B6B6B] mt-1">Podés registrar un vehículo nuevo con el botón superior.</p>
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
                className="p-4 rounded-2xl bg-white border border-[#E5E5E3] hover:border-[#D0D0CD] cursor-pointer transition-all flex flex-col justify-between space-y-3 group shadow-xs"
              >
                <div>
                  {/* Encabezado */}
                  <div className="flex items-center justify-between gap-2">
                    <UruguayanPlate plate={vehicle.plate} size="sm" />
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]">
                      {vehicle.category}
                    </span>
                  </div>

                  {/* Foto */}
                  {mainPhoto && (
                    <div className="mt-3 aspect-video rounded-xl overflow-hidden bg-[#F5F5F4] border border-[#E5E5E3]">
                      <img
                        src={mainPhoto}
                        alt={vehicle.plate}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Datos del auto */}
                  <div className="mt-3">
                    <h3 className="text-base font-bold text-[#161616] group-hover:text-[#D7141A] transition-colors">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    <p className="text-xs text-[#6B6B6B] mt-1">
                      Año {vehicle.year || 'S/D'} • {vehicle.color || 'Sin color'} •{' '}
                      {vehicle.mileage ? vehicle.mileage.toLocaleString('es-UY') + ' km' : '0 km'}
                    </p>
                  </div>

                  {/* Propietario */}
                  <div className="mt-3 p-2.5 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] text-xs flex items-center justify-between">
                    {isDealership ? (
                      <span className="text-[#D7141A] font-semibold flex items-center gap-1.5 text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5" /> Propio automotora
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 truncate">
                        <User className="w-3.5 h-3.5 text-[#6B6B6B] shrink-0" />
                        <span className="text-[#161616] font-medium truncate">
                          {client?.full_name || 'Particular'}
                        </span>
                      </div>
                    )}
                    {vehicle.photos?.length > 0 && (
                      <span className="text-[11px] text-[#6B6B6B] flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-[#9A9A9A]" /> {vehicle.photos.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer ficha */}
                <div className="pt-2 border-t border-[#E5E5E3] flex items-center justify-between text-xs text-[#161616] font-semibold group-hover:text-[#D7141A] transition-colors">
                  <span>Ver ficha e historial</span>
                  <ArrowRight className="w-4 h-4 text-[#9A9A9A] group-hover:text-[#D7141A] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      )}

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
