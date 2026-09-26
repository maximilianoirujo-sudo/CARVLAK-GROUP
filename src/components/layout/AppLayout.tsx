import React, { useState } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { QuickPlateSearchModal } from '../common/QuickPlateSearchModal';
import { HomeDashboard } from '../dashboard/HomeDashboard';
import { CalendarView } from '../agenda/CalendarView';
import { VehicleList } from '../vehicles/VehicleList';
import { VehicleDetailModal } from '../vehicles/VehicleDetailModal';
import { VehicleFormModal } from '../vehicles/VehicleFormModal';
import { ClientList } from '../clients/ClientList';
import { ClientFormModal } from '../clients/ClientFormModal';
import { TaskList } from '../tasks/TaskList';
import { TaskFormModal } from '../tasks/TaskFormModal';
import { AppointmentModal } from '../agenda/AppointmentModal';
import { EmployeeList } from '../employees/EmployeeList';
import { AutomotoraModule } from '../../modules/automotora/AutomotoraModule';
import { DetailingModule } from '../../modules/detailing/DetailingModule';
import { InspeccionModule } from '../../modules/inspecciones/InspeccionModule';
import { Vehicle, Client, Appointment } from '../../types';

export const AppLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('inicio');

  // Modales Globales
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [inspectVehicle, setInspectVehicle] = useState<Vehicle | null>(null);
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [vehicleDefaultClientId, setVehicleDefaultClientId] = useState<string | undefined>(undefined);

  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [appointmentDefaultVehicle, setAppointmentDefaultVehicle] = useState<Vehicle | null>(null);
  const [appointmentDefaultClient, setAppointmentDefaultClient] = useState<Client | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Manejo de Agendado directo desde un vehículo
  const handleScheduleForVehicle = (v: Vehicle) => {
    setAppointmentDefaultVehicle(v);
    setIsAppointmentModalOpen(true);
  };

  // Manejo de Agendado directo desde un cliente
  const handleScheduleForClient = (c: Client) => {
    setAppointmentDefaultClient(c);
    setIsAppointmentModalOpen(true);
  };

  // Manejo de Asignar auto para un cliente
  const handleAddVehicleForClient = (c: Client) => {
    setVehicleDefaultClientId(c.id);
    setIsVehicleFormOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070A0E] text-slate-100">
      
      {/*  */}
      <TopBar onOpenQuickSearch={() => setIsQuickSearchOpen(true)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/*  */}
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        {/*  */}
        <main className="flex-1 p-3 sm:p-6 overflow-x-hidden">
          {currentTab === 'inicio' && (
            <HomeDashboard
              onNavigate={setCurrentTab}
              onNewAppointment={() => setIsAppointmentModalOpen(true)}
              onNewVehicle={() => {
                setVehicleDefaultClientId(undefined);
                setIsVehicleFormOpen(true);
              }}
              onNewClient={() => setIsClientFormOpen(true)}
              onNewTask={() => setIsTaskModalOpen(true)}
              onSelectAppointment={() => setCurrentTab('agenda')}
            />
          )}

          {currentTab === 'agenda' && <CalendarView />}

          {currentTab === 'vehiculos' && (
            <VehicleList onScheduleAppointment={handleScheduleForVehicle} />
          )}

          {currentTab === 'clientes' && (
            <ClientList
              onAddVehicleForClient={handleAddVehicleForClient}
              onScheduleAppointmentForClient={handleScheduleForClient}
              onSelectVehicle={setInspectVehicle}
            />
          )}

          {currentTab === 'tareas' && <TaskList />}

          {currentTab === 'empleados' && <EmployeeList />}

          {currentTab === 'mod-automotora' && <AutomotoraModule />}
          {currentTab === 'mod-detailing' && <DetailingModule />}
          {currentTab === 'mod-inspeccion' && <InspeccionModule />}
        </main>
      </div>

      {/*  */}
      <BottomNav currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/*  */}
      {isQuickSearchOpen && (
        <QuickPlateSearchModal
          isOpen={isQuickSearchOpen}
          onClose={() => setIsQuickSearchOpen(false)}
          onSelectVehicle={(veh) => setInspectVehicle(veh)}
        />
      )}

      {/*  */}
      {inspectVehicle && (
        <VehicleDetailModal
          isOpen={Boolean(inspectVehicle)}
          onClose={() => setInspectVehicle(null)}
          vehicle={inspectVehicle}
          onEdit={() => {}}
          onScheduleAppointment={handleScheduleForVehicle}
        />
      )}

      {/*  */}
      {isVehicleFormOpen && (
        <VehicleFormModal
          isOpen={isVehicleFormOpen}
          onClose={() => {
            setIsVehicleFormOpen(false);
            setVehicleDefaultClientId(undefined);
          }}
          defaultClientId={vehicleDefaultClientId}
        />
      )}

      {/*  */}
      {isClientFormOpen && (
        <ClientFormModal
          isOpen={isClientFormOpen}
          onClose={() => setIsClientFormOpen(false)}
        />
      )}

      {/*  */}
      {isAppointmentModalOpen && (
        <AppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={() => {
            setIsAppointmentModalOpen(false);
            setAppointmentDefaultVehicle(null);
            setAppointmentDefaultClient(null);
          }}
        />
      )}

      {/*  */}
      {isTaskModalOpen && (
        <TaskFormModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
        />
      )}

    </div>
  );
};
