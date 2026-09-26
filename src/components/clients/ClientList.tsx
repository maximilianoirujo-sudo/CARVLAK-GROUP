import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageCircle,
  Car,
  Calendar,
  ArrowRight,
  Filter
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
      
      {/*  */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#121721] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Directorio de Clientes</h2>
              <p className="text-xs text-slate-400">Base compartida entre Automotora, Detailing e Inspección</p>
            </div>
          </div>

          <button
            onClick={() => {
              setClientToEdit(null);
              setIsFormOpen(true);
            }}
            className="px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, teléfono o cédula (ej: Gonzalo, 099...)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/*  */}
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">🌐 Todos los orígenes</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Instagram">Instagram</option>
            <option value="Presencial">Presencial</option>
            <option value="Referido">Referido</option>
            <option value="Google Form">Google Form</option>
          </select>
        </div>
      </div>

      {/*  */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400">
        <span>{filteredClients.length} clientes registrados</span>
        <span>Hacé clic en WhatsApp para abrir chat directo</span>
      </div>

      {/*  */}
      {filteredClients.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#121721] border border-slate-800 text-center text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-25 text-emerald-400" />
          <p className="text-base font-bold text-slate-300">No se encontraron clientes</p>
          <p className="text-xs text-slate-500 mt-1">Registrá uno nuevo haciendo clic en "+ Nuevo Cliente".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredClients.map((client) => {
            const clientVehicles = vehicles.filter((v) => v.client_id === client.id);

            return (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="p-4 rounded-3xl bg-[#121721] border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all flex flex-col justify-between space-y-3 group shadow-lg"
              >
                <div>
                  {/*  */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
                      {client.origin}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleOpenWhatsApp(e, client.phone, client.full_name)}
                      className="p-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 transition-all flex items-center gap-1 text-[11px] font-bold"
                      title="Abrir chat en WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  {/*  */}
                  <div className="mt-2">
                    <h3 className="text-base font-black text-white group-hover:text-emerald-300 transition-colors">
                      {client.full_name}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{client.phone}</span>
                    </p>
                  </div>

                  {/*  */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400 p-2 rounded-xl bg-[#0F141E] border border-slate-800/80">
                    <span className="flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{clientVehicles.length} {clientVehicles.length === 1 ? 'auto asociado' : 'autos asociados'}</span>
                    </span>
                    {client.cedula && (
                      <span className="text-[10px] text-slate-500">CI: {client.cedula}</span>
                    )}
                  </div>

                  {client.notes && (
                    <p className="text-[11px] text-slate-500 italic line-clamp-1 mt-2">
                      "{client.notes}"
                    </p>
                  )}
                </div>

                {/*  */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-emerald-400 font-bold">
                  <span>Ver Ficha e Historial</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/*  */}
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
