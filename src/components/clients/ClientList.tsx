import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageCircle,
  Car,
  ArrowRight
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Client, Vehicle, ClientOrigin } from '../../types';
import { sanitizePhoneForWhatsApp } from '../../lib/formatters';
import { ClientDetailModal } from './ClientDetailModal';
import { ClientFormModal } from './ClientFormModal';

interface ClientListProps {
  onAddVehicleForClient: (client: Client) => void;
  onScheduleAppointmentForClient: (client: Client) => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
}

export const ClientList: React.FC<ClientListProps> = ({
  onAddVehicleForClient,
  onScheduleAppointmentForClient,
  onSelectVehicle
}) => {
  const { clients, vehicles } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [originFilter, setOriginFilter] = useState<'all' | ClientOrigin>('all');

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (originFilter !== 'all' && c.origin !== originFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const nameMatch = c.full_name.toLowerCase().includes(q);
        const phoneMatch = c.phone.includes(q);
        const cedulaMatch = c.cedula?.includes(q);
        return nameMatch || phoneMatch || cedulaMatch;
      }
      return true;
    });
  }, [clients, originFilter, searchTerm]);

  const handleOpenWhatsApp = (e: React.MouseEvent, phone: string, name: string) => {
    e.stopPropagation();
    const clean = sanitizePhoneForWhatsApp(phone);
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(`¡Hola ${name}! Te escribimos de CARVLAK Group 🚗✨`)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      
      {/* Header y Filtros */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5F5F4] text-[#161616] flex items-center justify-center shrink-0 border border-[#E5E5E3]">
              <Users className="w-5 h-5 text-[#161616]" />
            </div>
            <div>
              <h2 className="text-lg font-title font-bold text-[#161616]">Directorio de clientes</h2>
              <p className="text-xs text-[#6B6B6B]">Base compartida entre Automotora, Detailing e Inspección</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setClientToEdit(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#D7141A] hover:bg-[#B80E14] text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo cliente</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#E5E5E3]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, teléfono o cédula (ej: Gonzalo, 099...)..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl text-xs text-[#161616] placeholder-[#9A9A9A] focus:outline-none focus:border-[#D7141A] focus:bg-white transition-colors"
            />
          </div>

          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value as any)}
            className="bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs font-medium text-[#161616] focus:outline-none focus:border-[#D7141A] cursor-pointer"
          >
            <option value="all">Todos los orígenes</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Instagram">Instagram</option>
            <option value="Presencial">Presencial</option>
            <option value="Referido">Referido</option>
            <option value="Google Form">Google Form</option>
          </select>
        </div>
      </div>

      {/* Contador */}
      <div className="flex items-center justify-between px-1 text-xs text-[#6B6B6B]">
        <span>{filteredClients.length} clientes registrados</span>
        <span>Hacé clic en WhatsApp para abrir chat directo</span>
      </div>

      {/* Grid de Clientes */}
      {filteredClients.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-[#E5E5E3] text-center text-[#6B6B6B]">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-25 text-[#9A9A9A]" />
          <p className="text-base font-bold text-[#161616]">No se encontraron clientes</p>
          <p className="text-xs text-[#6B6B6B] mt-1">Registrá uno nuevo haciendo clic en "+ Nuevo cliente".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredClients.map((client) => {
            const clientVehicles = vehicles.filter((v) => v.client_id === client.id);

            return (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="p-4 rounded-2xl bg-white border border-[#E5E5E3] hover:border-[#D0D0CD] cursor-pointer transition-all flex flex-col justify-between space-y-3 group shadow-xs"
              >
                <div>
                  {/* Encabezado */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]">
                      {client.origin}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleOpenWhatsApp(e, client.phone, client.full_name)}
                      className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3] hover:border-[#D0D0CD] transition-all flex items-center gap-1.5 text-[11px] font-medium cursor-pointer"
                      title="Abrir chat en WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#161616]" />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  {/* Nombre y teléfono en vertical */}
                  <div className="mt-3">
                    <h3 className="text-base font-bold text-[#161616] group-hover:text-[#D7141A] transition-colors">
                      {client.full_name}
                    </h3>
                    <p className="text-xs text-[#6B6B6B] font-mono flex items-center gap-1.5 mt-1">
                      <Phone className="w-3.5 h-3.5 text-[#9A9A9A]" />
                      <span>{client.phone}</span>
                    </p>
                  </div>

                  {/* Vehículos asociados */}
                  <div className="mt-3 flex items-center justify-between text-xs text-[#6B6B6B] p-2 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3]">
                    <span className="flex items-center gap-1.5 text-[#161616]">
                      <Car className="w-3.5 h-3.5 text-[#6B6B6B]" />
                      <span>{clientVehicles.length} {clientVehicles.length === 1 ? 'auto asociado' : 'autos asociados'}</span>
                    </span>
                    {client.cedula && (
                      <span className="text-[11px] text-[#6B6B6B]">CI: {client.cedula}</span>
                    )}
                  </div>

                  {client.notes && (
                    <p className="text-[11px] text-[#6B6B6B] italic line-clamp-1 mt-2">
                      "{client.notes}"
                    </p>
                  )}
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

      {selectedClient && (
        <ClientDetailModal
          isOpen={Boolean(selectedClient)}
          onClose={() => setSelectedClient(null)}
          client={selectedClient}
          onEdit={(c) => {
            setClientToEdit(c);
            setIsFormOpen(true);
          }}
          onAddVehicleForClient={onAddVehicleForClient}
          onScheduleAppointmentForClient={onScheduleAppointmentForClient}
          onSelectVehicle={onSelectVehicle}
        />
      )}

      {isFormOpen && (
        <ClientFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          clientToEdit={clientToEdit}
        />
      )}

    </div>
  );
};
