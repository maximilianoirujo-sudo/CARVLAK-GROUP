import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  User,
  Phone,
  Mail,
  CreditCard,
  MessageCircle,
  Car,
  Calendar,
  History,
  Trash2,
  Edit,
  Plus
} from 'lucide-react';
import { Client, Vehicle } from '../../types';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { sanitizePhoneForWhatsApp, normalizePlate, BUSINESS_CONFIG, formatCurrency } from '../../lib/formatters';

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onEdit: (client: Client) => void;
  onAddVehicleForClient: (client: Client) => void;
  onScheduleAppointmentForClient: (client: Client) => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  isOpen,
  onClose,
  client,
  onEdit,
  onAddVehicleForClient,
  onScheduleAppointmentForClient,
  onSelectVehicle
}) => {
  const { vehicles, appointments, archiveClient } = useData();
  const { showToast } = useToast();
  const [isConfirmArchiveOpen, setIsConfirmArchiveOpen] = useState(false);

  const clientVehicles = vehicles.filter((v) => v.client_id === client.id);
  const clientAppointments = appointments.filter((a) => a.client_id === client.id);

  const handleWhatsApp = () => {
    const clean = sanitizePhoneForWhatsApp(client.phone);
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(
      `¡Hola ${client.full_name}! Te escribimos de CARVLAK Group 🚗✨`
    )}`;
    window.open(url, '_blank');
  };

  const handleArchive = () => {
    archiveClient(client.id);
    showToast(`Cliente ${client.full_name} archivado`, 'info');
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={client.full_name}
        subtitle={`Cliente registrado vía ${client.origin}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5 text-xs">
          
          {/* Encabezado Cliente */}
          <div className="p-4 rounded-xl bg-black border border-[#2A2A2A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-base font-bold text-white">{client.full_name}</div>
              <div className="flex flex-wrap items-center gap-3 text-[#8A8A8A]">
                <span className="flex items-center gap-1 font-mono font-bold text-white">
                  <Phone className="w-3.5 h-3.5 text-[#8A8A8A]" /> {client.phone}
                </span>
                {client.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#8A8A8A]" /> {client.email}
                  </span>
                )}
                {client.cedula && (
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-[#8A8A8A]" /> CI: {client.cedula}
                  </span>
                )}
              </div>
            </div>

            {/* Botón WhatsApp */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white font-medium text-xs flex items-center justify-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-white" />
              <span>Abrir WhatsApp</span>
            </button>
          </div>

          {client.notes && (
            <div className="p-3 rounded-xl bg-black border border-[#2A2A2A] text-[#8A8A8A] italic">
              "{client.notes}"
            </div>
          )}

          {/* Vehículos Asociados */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-white" />
                <span>Vehículos Asociados ({clientVehicles.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  onAddVehicleForClient(client);
                  onClose();
                }}
                className="text-[11px] font-bold text-white hover:text-[#D7141A] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Asociar Auto</span>
              </button>
            </div>

            {clientVehicles.length === 0 ? (
              <p className="p-3 rounded-xl bg-black border border-[#2A2A2A] text-[#8A8A8A] text-center">
                Este cliente no tiene vehículos registrados aún.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {clientVehicles.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => {
                      onSelectVehicle(v);
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-black border border-[#2A2A2A] hover:border-white/40 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white">{v.brand} {v.model}</div>
                      <div className="text-[10px] text-[#8A8A8A]">{v.category} • Año {v.year || 'S/D'}</div>
                    </div>
                    <span className="font-mono text-white font-bold bg-[#141414] px-2 py-0.5 rounded text-[11px] border border-[#2A2A2A]">
                      {normalizePlate(v.plate)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historial de Turnos */}
          <div className="space-y-2 pt-2 border-t border-[#2A2A2A]">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-white" />
              <span>Historial de Visitas &amp; Turnos ({clientAppointments.length})</span>
            </h4>

            {clientAppointments.length === 0 ? (
              <p className="p-3 rounded-xl bg-black border border-[#2A2A2A] text-[#8A8A8A] text-center">
                Sin turnos previos en el sistema.
              </p>
            ) : (
              <div className="space-y-2">
                {clientAppointments.map((a) => {
                  const bConfig = BUSINESS_CONFIG[a.business];
                  return (
                    <div
                      key={a.id}
                      className="p-3 rounded-xl bg-black border border-[#2A2A2A] flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#141414] text-white border border-[#2A2A2A]">
                            {bConfig?.name || a.business}
                          </span>
                          <span className="font-bold text-white">{a.title || 'Servicio'}</span>
                        </div>
                        <div className="text-[10px] text-[#8A8A8A] mt-1">
                          📅 {a.start_time.slice(0, 10)} ({a.start_time.slice(11, 16)} hs)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">
                          {formatCurrency(a.price_amount, a.price_currency)}
                        </div>
                        <div className="text-[10px] text-[#8A8A8A]">{a.status}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Acciones inferiores */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-[#2A2A2A]">
            <button
              type="button"
              onClick={() => setIsConfirmArchiveOpen(true)}
              className="px-3 py-2 rounded-xl text-[#D7141A] hover:bg-[#D7141A]/10 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Archivar Cliente</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onEdit(client);
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
                  onScheduleAppointmentForClient(client);
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
        title="¿Archivar Cliente?"
        message={`El cliente ${client.full_name} (${client.phone}) será archivado del directorio activo. Sus datos y vehículos asociados no se perderán.`}
        confirmText="Archivar Cliente"
      />
    </>
  );
};
