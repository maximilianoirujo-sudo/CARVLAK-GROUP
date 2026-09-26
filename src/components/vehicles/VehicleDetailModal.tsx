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
          
          {/*  */}
          <div className="p-4 rounded-2xl bg-[#131924] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-12 rounded-xl bg-slate-900 border-2 border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-base tracking-widest shadow-inner">
                {normalizePlate(vehicle.plate)}
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {vehicle.brand} {vehicle.model}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {vehicle.category} • {vehicle.color || 'Color sin especificar'}
                </div>
              </div>
            </div>

            <div>
              {isDealership ? (
                <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4" /> Propio de la Automotora
                </span>
              ) : (
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-400 uppercase">Titular / Cliente</span>
                  <div className="font-bold text-white flex items-center sm:justify-end gap-1 text-xs">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{client?.full_name || 'Particular'}</span>
                  </div>
                  {client?.phone && (
                    <div className="text-[11px] text-slate-400">{client.phone}</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/*  */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-xl bg-[#0F141E] border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Kilometraje</div>
              <div className="text-sm font-bold text-white mt-0.5">
                {vehicle.mileage ? vehicle.mileage.toLocaleString('es-UY') + ' km' : '0 km'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#0F141E] border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Año</div>
              <div className="text-sm font-bold text-white mt-0.5">{vehicle.year || 'S/D'}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#0F141E] border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Categoría</div>
              <div className="text-sm font-bold text-white mt-0.5">{vehicle.category}</div>
            </div>
          </div>

          {/*  */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Galería de Fotos ({vehicle.photos?.length || 0})</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddPhoto(!showAddPhoto)}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddPhoto ? 'Cerrar' : 'Agregar Foto'}</span>
              </button>
            </div>

            {showAddPhoto && (
              <div className="p-3 rounded-xl bg-[#0F141E] border border-amber-500/30 space-y-2 animate-fade-in">
                <label className="block text-[11px] text-slate-400">URL de la imagen o Storage</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-xl"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}

            {vehicle.photos && vehicle.photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {vehicle.photos.map((url, i) => (
                  <div key={i} className="aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800 relative group">
                    <img
                      src={url}
                      alt={`${vehicle.plate} - ${i}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#0F141E] border border-slate-800 text-center text-slate-500">
                Sin fotos cargadas aún. Podés cargar fotos de inspección o detailing.
              </div>
            )}
          </div>

          {/*  */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span>Historial del Vehículo en CARVLAK Group</span>
            </h4>

            {historyEvents.length === 0 ? (
              <p className="text-slate-500 italic p-3 rounded-xl bg-[#0F141E] border border-slate-800 text-center">
                Sin eventos registrados aún. Se registrarán automáticamente con cada turno de detailing, peritaje o venta.
              </p>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {historyEvents.map((ev) => {
                  const bConfig = BUSINESS_CONFIG[ev.business];
                  return (
                    <div key={ev.id} className="relative">
                      <div
                        className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-[#10151E]"
                        style={{ backgroundColor: bConfig.color }}
                      ></div>
                      <div className="p-3 rounded-xl bg-[#0F141E] border border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-black uppercase ${bConfig.textClass}`}>
                            {bConfig.name} • {ev.event_type}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {ev.created_at.slice(0, 10)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{ev.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/*  */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsConfirmArchiveOpen(true)}
              className="px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 font-bold flex items-center gap-1.5"
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
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1.5"
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
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
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
