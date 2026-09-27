import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  User,
  ShieldCheck,
  Calendar,
  Trash2,
  Edit,
  Plus,
  History,
  Image as ImageIcon
} from 'lucide-react';
import { Vehicle } from '../../types';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { normalizePlate, BUSINESS_CONFIG } from '../../lib/formatters';
import { UruguayanPlate } from '../ui/UruguayanPlate';

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
          <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <UruguayanPlate plate={vehicle.plate} size="md" />
              <div>
                <div className="text-sm font-bold text-[#161616]">
                  {vehicle.brand} {vehicle.model}
                </div>
                <div className="text-[11px] text-[#6B6B6B] mt-0.5">
                  {vehicle.category} • {vehicle.color || 'Color sin especificar'}
                </div>
              </div>
            </div>

            <div>
              {isDealership ? (
                <span className="px-3 py-1 rounded-lg bg-[#FDF2F2] text-[#B80E14] border border-[#B80E14]/20 font-semibold flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4" /> Propio de automotora
                </span>
              ) : (
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-[#6B6B6B] font-medium">Titular / cliente</span>
                  <div className="font-semibold text-[#161616] flex items-center sm:justify-end gap-1 text-xs">
                    <User className="w-3.5 h-3.5 text-[#6B6B6B]" />
                    <span>{client?.full_name || 'Particular'}</span>
                  </div>
                  {client?.phone && (
                    <div className="text-[11px] text-[#6B6B6B] font-mono">{client.phone}</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Estadísticas Técnicas */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3]">
              <div className="text-[10px] text-[#6B6B6B] font-medium">Kilometraje</div>
              <div className="text-sm font-bold text-[#161616] mt-0.5">
                {vehicle.mileage ? vehicle.mileage.toLocaleString('es-UY') + ' km' : '0 km'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3]">
              <div className="text-[10px] text-[#6B6B6B] font-medium">Año</div>
              <div className="text-sm font-bold text-[#161616] mt-0.5">{vehicle.year || 'S/D'}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3]">
              <div className="text-[10px] text-[#6B6B6B] font-medium">Categoría</div>
              <div className="text-sm font-bold text-[#161616] mt-0.5">{vehicle.category}</div>
            </div>
          </div>

          {/* Galería de Fotos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-[#161616] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#6B6B6B]" />
                <span>Galería de fotos ({vehicle.photos?.length || 0})</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddPhoto(!showAddPhoto)}
                className="text-xs font-medium text-[#D7141A] hover:text-[#B80E14] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddPhoto ? 'Cerrar' : 'Agregar foto'}</span>
              </button>
            </div>

            {showAddPhoto && (
              <div className="p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] space-y-2 animate-fade-in">
                <label className="block text-[11px] text-[#6B6B6B] font-medium">URL de la imagen o storage</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] focus:outline-none focus:border-[#D7141A]"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="px-4 py-2 bg-[#D7141A] hover:bg-[#B80E14] text-white font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}

            {vehicle.photos && vehicle.photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {vehicle.photos.map((url, i) => (
                  <div key={i} className="aspect-video rounded-xl overflow-hidden bg-[#F5F5F4] border border-[#E5E5E3] relative group">
                    <img
                      src={url}
                      alt={`${vehicle.plate} - ${i}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] text-center text-[#6B6B6B]">
                Sin fotos cargadas aún. Podés cargar fotos de inspección o detailing.
              </div>
            )}
          </div>

          {/* Historial */}
          <div className="space-y-3 pt-2 border-t border-[#E5E5E3]">
            <h4 className="text-xs font-semibold text-[#161616] flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span>Historial del vehículo en CARVLAK Group</span>
            </h4>

            {historyEvents.length === 0 ? (
              <p className="text-[#6B6B6B] italic p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] text-center">
                Sin eventos registrados aún. Se registrarán automáticamente con cada turno de detailing, peritaje o venta.
              </p>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E5E3]">
                {historyEvents.map((ev) => {
                  const bConfig = BUSINESS_CONFIG[ev.business];
                  return (
                    <div key={ev.id} className="relative">
                      <div
                        className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-[#D7141A]"
                      ></div>
                      <div className="p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-[#161616]">
                            {bConfig?.name || ev.business} • {ev.event_type}
                          </span>
                          <span className="text-[11px] text-[#6B6B6B] font-mono">
                            {ev.created_at.slice(0, 10)}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B6B6B]">{ev.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botones de acción inferiores */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-[#E5E5E3]">
            <button
              type="button"
              onClick={() => setIsConfirmArchiveOpen(true)}
              className="px-3 py-2 rounded-xl text-[#B80E14] hover:bg-[#FDF2F2] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Archivar ficha</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onEdit(vehicle);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
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
                className="px-4 py-2 rounded-xl bg-[#D7141A] hover:bg-[#B80E14] text-white font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Agendar turno</span>
              </button>
            </div>
          </div>

        </div>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmArchiveOpen}
        onClose={() => setIsConfirmArchiveOpen(false)}
        onConfirm={handleArchive}
        title="¿Archivar vehículo?"
        message={`El vehículo ${normalizePlate(vehicle.plate)} (${vehicle.brand} ${vehicle.model}) será archivado y no aparecerá en las búsquedas activas. Se puede restaurar luego si es necesario.`}
        confirmText="Archivar vehículo"
      />
    </>
  );
};
