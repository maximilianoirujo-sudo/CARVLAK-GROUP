import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Car,
  User,
  ShieldCheck,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit,
  History,
  Image as ImageIcon
} from 'lucide-react';
import { Vehicle, Client } from '../../types';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { normalizePlate, BUSINESS_CONFIG } from '../../lib/formatters';

interface VehicleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  onEdit: (vehicle: Vehicle) => void;
  onScheduleAppointment: (vehicle: Vehicle) => void;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  onEdit,
  onScheduleAppointment
}) => {
  const { clients, vehicleHistory, archiveVehicle, updateVehicle } = useData();
  const { showToast } = useToast();

  const [isConfirmArchiveOpen, setIsConfirmArchiveOpen] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [showAddPhoto, setShowAddPhoto] = useState(false);

  const client = clients.find((c) => c.id === vehicle.client_id);
  const isDealership = vehicle.ownership === 'dealership';

  // Historial del auto en los 3 negocios
  const historyEvents = vehicleHistory
    .filter((h) => h.vehicle_id === vehicle.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const handleAddPhoto = () => {
    if (!newPhotoUrl.trim()) return;
    const currentPhotos = vehicle.photos || [];
    updateVehicle(vehicle.id, {
      photos: [...currentPhotos, newPhotoUrl.trim()]
    });
    setNewPhotoUrl('');
    setShowAddPhoto(false);
    showToast('Foto agregada a la galería', 'success');
  };

  const handleArchive = () => {
    archiveVehicle(vehicle.id);
    showToast(`Vehículo ${normalizePlate(vehicle.plate)} archivado`, 'info');
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`${vehicle.brand} ${vehicle.model} (${vehicle.year || 'S/A'})`}
        subtitle={`Matrícula única: ${normalizePlate(vehicle.plate)}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5 text-xs">
          
          {/* Encabezado Vehículo */}
          <div className="p-4 rounded-xl bg-black border border-[#2A2A2A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-12 rounded-lg bg-[#141414] border border-[#2A2A2A] flex items-center justify-center font-black text-white text-base tracking-widest font-mono">
                {normalizePlate(vehicle.plate)}
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {vehicle.brand} {vehicle.model}
                </div>
                <div className="text-[11px] text-[#8A8A8A] mt-0.5">
                  {vehicle.category} • {vehicle.color || 'Color sin especificar'}
                </div>
              </div>
            </div>

            <div>
              {isDealership ? (
                <span className="px-3 py-1 rounded-lg bg-[#D7141A]/10 text-[#D7141A] border border-[#D7141A]/30 font-bold flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4" /> Propio de la Automotora
                </span>
              ) : (
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-[#8A8A8A] uppercase">Titular / Cliente</span>
                  <div className="font-bold text-white flex items-center sm:justify-end gap-1 text-xs">
                    <User className="w-3.5 h-3.5 text-white" />
                    <span>{client?.full_name || 'Particular'}</span>
                  </div>
                  {client?.phone && (
                    <div className="text-[11px] text-[#8A8A8A]">{client.phone}</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Estadísticas Técnicas */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-xl bg-black border border-[#2A2A2A]">
              <div className="text-[10px] text-[#8A8A8A] uppercase">Kilometraje</div>
              <div className="text-sm font-bold text-white mt-0.5">
                {vehicle.mileage ? vehicle.mileage.toLocaleString('es-UY') + ' km' : '0 km'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-black border border-[#2A2A2A]">
              <div className="text-[10px] text-[#8A8A8A] uppercase">Año</div>
              <div className="text-sm font-bold text-white mt-0.5">{vehicle.year || 'S/D'}</div>
            </div>
            <div className="p-3 rounded-xl bg-black border border-[#2A2A2A]">
              <div className="text-[10px] text-[#8A8A8A] uppercase">Categoría</div>
              <div className="text-sm font-bold text-white mt-0.5">{vehicle.category}</div>
            </div>
          </div>

          {/* Galería de Fotos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-white" />
                <span>Galería de Fotos ({vehicle.photos?.length || 0})</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddPhoto(!showAddPhoto)}
                className="text-[11px] font-bold text-white hover:text-[#D7141A] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddPhoto ? 'Cerrar' : 'Agregar Foto'}</span>
              </button>
            </div>

            {showAddPhoto && (
              <div className="p-3 rounded-xl bg-black border border-[#2A2A2A] space-y-2 animate-fade-in">
                <label className="block text-[11px] text-[#8A8A8A]">URL de la imagen o Storage</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 bg-[#141414] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D7141A]"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="px-4 py-2 bg-[#D7141A] hover:bg-[#B51015] text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}

            {vehicle.photos && vehicle.photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {vehicle.photos.map((url, i) => (
                  <div key={i} className="aspect-video rounded-xl overflow-hidden bg-black border border-[#2A2A2A] relative group">
                    <img
                      src={url}
                      alt={`${vehicle.plate} - ${i}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-black border border-[#2A2A2A] text-center text-[#8A8A8A]">
                Sin fotos cargadas aún. Podés cargar fotos de inspección o detailing.
              </div>
            )}
          </div>

          {/* Historial */}
          <div className="space-y-3 pt-2 border-t border-[#2A2A2A]">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-white" />
              <span>Historial del Vehículo en CARVLAK Group</span>
            </h4>

            {historyEvents.length === 0 ? (
              <p className="text-[#8A8A8A] italic p-3 rounded-xl bg-black border border-[#2A2A2A] text-center">
                Sin eventos registrados aún. Se registrarán automáticamente con cada turno de detailing, peritaje o venta.
              </p>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#2A2A2A]">
                {historyEvents.map((ev) => {
                  const bConfig = BUSINESS_CONFIG[ev.business];
                  return (
                    <div key={ev.id} className="relative">
                      <div
                        className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-black bg-[#D7141A]"
                      ></div>
                      <div className="p-3 rounded-xl bg-black border border-[#2A2A2A] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-white">
                            {bConfig?.name || ev.business} • {ev.event_type}
                          </span>
                          <span className="text-[10px] text-[#8A8A8A]">
                            {ev.created_at.slice(0, 10)}
                          </span>
                        </div>
                        <p className="text-xs text-white/90">{ev.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botones de acción inferiores */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-[#2A2A2A]">
            <button
              type="button"
              onClick={() => setIsConfirmArchiveOpen(true)}
              className="px-3 py-2 rounded-xl text-[#D7141A] hover:bg-[#D7141A]/10 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Archivar Ficha</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onEdit(vehicle);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onScheduleAppointment(vehicle);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-[#D7141A] hover:bg-[#B51015] text-white font-bold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Agendar Turno</span>
              </button>
            </div>
          </div>

        </div>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmArchiveOpen}
        onClose={() => setIsConfirmArchiveOpen(false)}
        onConfirm={handleArchive}
        title="¿Archivar Vehículo?"
        message={`El vehículo ${normalizePlate(vehicle.plate)} (${vehicle.brand} ${vehicle.model}) será archivado y no aparecerá en las búsquedas activas. Se puede restaurar luego si es necesario.`}
        confirmText="Archivar Vehículo"
      />
    </>
  );
};
