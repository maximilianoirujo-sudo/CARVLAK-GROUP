import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Phone,
  Mail,
  CreditCard,
  MessageCircle,
  Car,
  Calendar,
  History,
  Trash2,
  Edit,
  Plus,
  Share2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Client, Vehicle } from '../../types';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { sanitizePhoneForWhatsApp, BUSINESS_CONFIG, formatCurrency } from '../../lib/formatters';
import { UruguayanPlate } from '../ui/UruguayanPlate';

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
  const { vehicles, appointments, archiveClient, updateClientConsent } = useData();
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
          <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-base font-bold text-[#161616]">{client.full_name}</div>
              <div className="flex flex-wrap items-center gap-3 text-[#6B6B6B]">
                <span className="flex items-center gap-1 font-mono font-medium text-[#161616]">
                  <Phone className="w-3.5 h-3.5 text-[#9A9A9A]" /> {client.phone}
                </span>
                {client.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#9A9A9A]" /> {client.email}
                  </span>
                )}
                {client.cedula && (
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-[#9A9A9A]" /> CI: {client.cedula}
                  </span>
                )}
              </div>
            </div>

            {/* Botón WhatsApp */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3] font-medium text-xs flex items-center justify-center gap-2 transition-all self-start sm:self-auto cursor-pointer shadow-xs"
            >
              <MessageCircle className="w-4 h-4 text-[#161616]" />
              <span>Abrir WhatsApp</span>
            </button>
          </div>

          {/* Consentimiento Redes Sociales */}
          <div className="p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Share2 className="w-4 h-4 text-[#D7141A] shrink-0" />
              <div>
                <span className="font-semibold text-[#161616]">Fotos en redes sociales: </span>
                {client.social_media_consent ? (
                  <span className="inline-flex items-center gap-1 text-[#1E6B43] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Autorizado para Instagram
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[#945B0E]">
                    <AlertCircle className="w-3.5 h-3.5 text-[#945B0E]" /> Sin consentimiento registrado
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextConsent = !client.social_media_consent;
                updateClientConsent(client.id, nextConsent);
                showToast(
                  nextConsent
                    ? 'Consentimiento otorgado para fotos en redes'
                    : 'Consentimiento revocado',
                  'info'
                );
              }}
              className="text-[11px] font-medium text-[#6B6B6B] hover:text-[#161616] px-2.5 py-1 rounded-lg border border-[#E5E5E3] bg-white hover:bg-[#F5F5F4] transition-colors cursor-pointer shrink-0"
            >
              {client.social_media_consent ? 'Revocar' : 'Autorizar'}
            </button>
          </div>

          {client.notes && (
            <div className="p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] text-[#6B6B6B] italic">
              "{client.notes}"
            </div>
          )}

          {/* Vehículos Asociados */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-[#161616] flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-[#6B6B6B]" />
                <span>Vehículos asociados ({clientVehicles.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  onAddVehicleForClient(client);
                  onClose();
                }}
                className="text-xs font-medium text-[#D7141A] hover:text-[#B80E14] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Asociar auto</span>
              </button>
            </div>

            {clientVehicles.length === 0 ? (
              <p className="p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] text-[#6B6B6B] text-center">
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
                    className="p-3 rounded-xl bg-white border border-[#E5E5E3] hover:border-[#D0D0CD] cursor-pointer transition-all flex items-center justify-between shadow-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#161616]">{v.brand} {v.model}</div>
                      <div className="text-[11px] text-[#6B6B6B]">{v.category} • Año {v.year || 'S/D'}</div>
                    </div>
                    {v.plate && <UruguayanPlate plate={v.plate} size="sm" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historial de Turnos */}
          <div className="space-y-2 pt-2 border-t border-[#E5E5E3]">
            <h4 className="text-xs font-semibold text-[#161616] flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span>Historial de visitas y turnos ({clientAppointments.length})</span>
            </h4>

            {clientAppointments.length === 0 ? (
              <p className="p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] text-[#6B6B6B] text-center">
                Sin turnos previos en el sistema.
              </p>
            ) : (
              <div className="space-y-2">
                {clientAppointments.map((a) => {
                  const bConfig = BUSINESS_CONFIG[a.business];
                  return (
                    <div
                      key={a.id}
                      className="p-3 rounded-xl bg-white border border-[#E5E5E3] flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3]">
                            {bConfig?.name || a.business}
                          </span>
                          <span className="font-semibold text-[#161616]">{a.title || 'Servicio'}</span>
                        </div>
                        <div className="text-[11px] text-[#6B6B6B] mt-1">
                          {a.start_time.slice(0, 10)} ({a.start_time.slice(11, 16)} hs)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-[#161616]">
                          {formatCurrency(a.price_amount, a.price_currency)}
                        </div>
                        <div className="text-[11px] text-[#6B6B6B]">{a.status}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Acciones inferiores */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-[#E5E5E3]">
            <button
              type="button"
              onClick={() => setIsConfirmArchiveOpen(true)}
              className="px-3 py-2 rounded-xl text-[#B80E14] hover:bg-[#FDF2F2] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Archivar cliente</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onEdit(client);
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
                  onScheduleAppointmentForClient(client);
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
        title="¿Archivar cliente?"
        message={`El cliente ${client.full_name} (${client.phone}) será archivado del directorio activo. Sus datos y vehículos asociados no se perderán.`}
        confirmText="Archivar cliente"
      />
    </>
  );
};
