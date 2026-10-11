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
import { PublicQuoteRequestPage } from '../public/PublicQuoteRequestPage';
import { InspectionPublicReportPage } from '../../modules/inspecciones/components/InspectionPublicReportPage';
import { DealershipPublicCatalogPage } from '../../modules/automotora/components/DealershipPublicCatalogPage';
import { FloatingQuickActions } from './FloatingQuickActions';
import { DealershipVehicleModal } from '../../modules/automotora/components/DealershipVehicleModal';
import { DetailingQuoterModal } from '../../modules/detailing/components/DetailingQuoterModal';

// Carga perezosa (lazy) de los 4 módulos de negocio
const AutomotoraModule = React.lazy(() =>
  import('../../modules/automotora/AutomotoraModule').then((m) => ({ default: m.AutomotoraModule }))
);
const DetailingModule = React.lazy(() =>
  import('../../modules/detailing/DetailingModule').then((m) => ({ default: m.DetailingModule }))
);
const InspeccionModule = React.lazy(() =>
  import('../../modules/inspecciones/InspeccionModule').then((m) => ({ default: m.InspeccionModule }))
);
const RedesSocialesModule = React.lazy(() =>
  import('../../modules/redes/RedesSocialesModule').then((m) => ({ default: m.RedesSocialesModule }))
);
import { Vehicle, Client, Appointment, SocialMediaTemplateId } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { LoginPage } from '../auth/LoginPage';
import { Lock } from 'lucide-react';
import { isEncargado } from '../../lib/permissions';
import { Button } from '../ui/Button';

export const AppLayout: React.FC = () => {
  const { profile } = useAuth();
  const { clients, vehicles } = useData();

  // Sincronización inicial con la URL actual (?tab=...)
  const [currentTab, setCurrentTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab) return tab;
    }
    return 'inicio';
  });

  const [redesParams, setRedesParams] = useState<{ vehicleId?: string; templateId?: SocialMediaTemplateId } | null>(null);

  // Escuchar navegación con botones Atrás/Adelante del navegador
  React.useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') || 'inicio';
      if (tabParam !== currentTab) {
        setCurrentTab(tabParam);
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentTab]);

  // Manejador centralizado de cambio de pantalla con reseteo de scroll y URL
  const handleNavigateTab = (tab: string, extraParams?: Record<string, string>) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      if (extraParams) {
        Object.entries(extraParams).forEach(([k, v]) => {
          if (v) url.searchParams.set(k, v);
          else url.searchParams.delete(k);
        });
      } else {
        url.searchParams.delete('sub');
        url.searchParams.delete('section');
      }
      window.history.pushState({}, '', url.toString());
    }
  };

  // Vista Pública de Presupuestos (sin login / accesible por URL o toggle)
  const [isPublicFormView, setIsPublicFormView] = useState(() => {
    return typeof window !== 'undefined' && (
      window.location.search.includes('public=presupuesto') || 
      window.location.search.includes('public=detailing')
    );
  });

  // Vista Pública de Catálogo de Automotora (?catalogo=autos)
  const [isPublicCatalogView, setIsPublicCatalogView] = useState(() => {
    return typeof window !== 'undefined' && (
      window.location.search.includes('catalogo=autos') ||
      window.location.search.includes('catalogo=true')
    );
  });

  // Vista Pública de Informe de Inspección (?informe=tk_xxxx)
  const publicReportToken = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('informe')
    : null;

  // Modales Globales
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [inspectVehicle, setInspectVehicle] = useState<Vehicle | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [vehicleDefaultClientId, setVehicleDefaultClientId] = useState<string | undefined>(undefined);

  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  const [appointmentDefaultVehicle, setAppointmentDefaultVehicle] = useState<Vehicle | null>(null);
  const [appointmentDefaultClient, setAppointmentDefaultClient] = useState<Client | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Modales para acciones rápidas
  const [isQuoterModalOpen, setIsQuoterModalOpen] = useState(false);
  const [isDealershipVehicleModalOpen, setIsDealershipVehicleModalOpen] = useState(false);

  // Manejo de Agendado directo desde un vehículo
  const handleScheduleForVehicle = (v: Vehicle) => {
    setAppointmentToEdit(null);
    setAppointmentDefaultVehicle(v);
    const linkedClient = clients.find((c) => c.id === v.client_id) || null;
    setAppointmentDefaultClient(linkedClient);
    setIsAppointmentModalOpen(true);
  };

  // Manejo de Agendado directo desde un cliente
  const handleScheduleForClient = (c: Client) => {
    setAppointmentToEdit(null);
    setAppointmentDefaultClient(c);
    const linkedVeh = vehicles.find((v) => v.client_id === c.id) || null;
    setAppointmentDefaultVehicle(linkedVeh);
    setIsAppointmentModalOpen(true);
  };

  // Manejo de acción rápida Nuevo Auto
  const handleQuickNewVehicle = () => {
    if (currentTab === 'mod-automotora') {
      setIsDealershipVehicleModalOpen(true);
    } else {
      setEditingVehicle(null);
      setVehicleDefaultClientId(undefined);
      setIsVehicleFormOpen(true);
    }
  };

  // Manejo de Asignar auto para un cliente
  const handleAddVehicleForClient = (c: Client) => {
    setEditingVehicle(null);
    setVehicleDefaultClientId(c.id);
    setIsVehicleFormOpen(true);
  };

  // Manejo de apertura de Redes Sociales con plantilla y vehículo preseleccionados
  const handleOpenRedesWithItem = (vehicleId?: string, templateId?: SocialMediaTemplateId) => {
    setRedesParams({ vehicleId, templateId });
    handleNavigateTab('redes-sociales', {
      ...(vehicleId ? { vehicleId } : {}),
      ...(templateId ? { templateId } : {})
    });
  };

  // Si se accede con token de informe público (?informe=...)
  if (publicReportToken) {
    return <InspectionPublicReportPage token={publicReportToken} />;
  }

  // Si está activa la vista pública de formulario de presupuesto (reemplazo de Google Form)
  if (isPublicFormView) {
    return <PublicQuoteRequestPage onBackToApp={() => setIsPublicFormView(false)} />;
  }

  // Si está activa la vista pública del catálogo de autos (?catalogo=autos)
  if (isPublicCatalogView) {
    return <DealershipPublicCatalogPage onBackToApp={() => setIsPublicCatalogView(false)} />;
  }

  // Si el usuario no ha iniciado sesión, mostrar pantalla de Login corporativa
  if (!profile) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F4] text-[#161616]">
      {/* TopBar */}
      <TopBar
        onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
        onSelectTab={handleNavigateTab}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar currentTab={currentTab} onSelectTab={handleNavigateTab} />

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-6 overflow-x-hidden">
          {currentTab === 'inicio' && (
            <HomeDashboard
              onNavigate={handleNavigateTab}
              onNewAppointment={() => {
                setAppointmentToEdit(null);
                setAppointmentDefaultVehicle(null);
                setAppointmentDefaultClient(null);
                setIsAppointmentModalOpen(true);
              }}
              onNewVehicle={() => {
                setEditingVehicle(null);
                setVehicleDefaultClientId(undefined);
                setIsVehicleFormOpen(true);
              }}
              onNewClient={() => setIsClientFormOpen(true)}
              onNewTask={() => setIsTaskModalOpen(true)}
              onSelectAppointment={(appt) => {
                setAppointmentToEdit(appt);
                setIsAppointmentModalOpen(true);
              }}
              onOpenRedesWithItem={handleOpenRedesWithItem}
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

          {currentTab === 'empleados' && (
            isEncargado(profile) ? (
              <EmployeeList />
            ) : (
              <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-[#E5E5E3] text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-[#FDF2F2] border border-[#FACDCD] flex items-center justify-center mx-auto text-[#D7141A]">
                  <Lock className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-title font-bold text-[#161616]">Acceso restringido al equipo</h2>
                <p className="text-xs text-[#6B6B6B] leading-relaxed">
                  Solo los Encargados y Administradores pueden gestionar el personal y permisos del equipo.
                </p>
                <Button variant="secondary" onClick={() => handleNavigateTab('inicio')}>
                  Volver al inicio
                </Button>
              </div>
            )
          )}

          {currentTab === 'mod-automotora' && (
            <React.Suspense fallback={<div className="flex items-center justify-center p-12 text-xs text-[#6B6B6B] animate-pulse">Cargando Automotora...</div>}>
              <AutomotoraModule
                onOpenPublicCatalog={() => setIsPublicCatalogView(true)}
                initialSubTab={typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('sub') || undefined : undefined}
              />
            </React.Suspense>
          )}
          {currentTab === 'mod-detailing' && (
            <React.Suspense fallback={<div className="flex items-center justify-center p-12 text-xs text-[#6B6B6B] animate-pulse">Cargando Detailing...</div>}>
              <DetailingModule onOpenPublicForm={() => setIsPublicFormView(true)} />
            </React.Suspense>
          )}
          {currentTab === 'mod-inspeccion' && (
            <React.Suspense fallback={<div className="flex items-center justify-center p-12 text-xs text-[#6B6B6B] animate-pulse">Cargando Carbusters...</div>}>
              <InspeccionModule onNavigateToDetailing={() => handleNavigateTab('mod-detailing')} />
            </React.Suspense>
          )}

          {currentTab === 'redes-sociales' && (
            <React.Suspense fallback={<div className="flex items-center justify-center p-12 text-xs text-[#6B6B6B] animate-pulse">Cargando Redes Sociales...</div>}>
              <RedesSocialesModule
                initialVehicleId={redesParams?.vehicleId}
                initialTemplateId={redesParams?.templateId}
              />
            </React.Suspense>
          )}
        </main>
      </div>

      {/* BottomNav */}
      <BottomNav currentTab={currentTab} onSelectTab={handleNavigateTab} />

      {/* Botón flotante con acciones rápidas para celular */}
      <FloatingQuickActions
        onNewAppointment={() => {
          setAppointmentToEdit(null);
          setAppointmentDefaultVehicle(null);
          setAppointmentDefaultClient(null);
          setIsAppointmentModalOpen(true);
        }}
        onNewVehicle={handleQuickNewVehicle}
        onNewClient={() => setIsClientFormOpen(true)}
        onNewQuote={() => setIsQuoterModalOpen(true)}
        onCreateSocialPost={() => handleNavigateTab('redes-sociales')}
      />

      {/* Quick Search Modal */}
      {isQuickSearchOpen && (
        <QuickPlateSearchModal
          isOpen={isQuickSearchOpen}
          onClose={() => setIsQuickSearchOpen(false)}
          onSelectVehicle={(veh) => setInspectVehicle(veh)}
        />
      )}

      {/* Vehicle Detail Modal */}
      {inspectVehicle && (
        <VehicleDetailModal
          isOpen={Boolean(inspectVehicle)}
          onClose={() => setInspectVehicle(null)}
          vehicle={inspectVehicle}
          onEdit={(veh) => {
            setEditingVehicle(veh);
            setIsVehicleFormOpen(true);
            setInspectVehicle(null);
          }}
          onScheduleAppointment={handleScheduleForVehicle}
        />
      )}

      {/* Vehicle Form Modal */}
      {isVehicleFormOpen && (
        <VehicleFormModal
          isOpen={isVehicleFormOpen}
          onClose={() => {
            setIsVehicleFormOpen(false);
            setVehicleDefaultClientId(undefined);
            setEditingVehicle(null);
          }}
          vehicleToEdit={editingVehicle}
          defaultClientId={vehicleDefaultClientId}
        />
      )}

      {/* Client Form Modal */}
      {isClientFormOpen && (
        <ClientFormModal
          isOpen={isClientFormOpen}
          onClose={() => setIsClientFormOpen(false)}
        />
      )}

      {/* Appointment Modal */}
      {isAppointmentModalOpen && (
        <AppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={() => {
            setIsAppointmentModalOpen(false);
            setAppointmentDefaultVehicle(null);
            setAppointmentDefaultClient(null);
            setAppointmentToEdit(null);
          }}
          appointmentToEdit={appointmentToEdit}
          defaultVehicleId={appointmentDefaultVehicle?.id}
          defaultClientId={appointmentDefaultClient?.id || appointmentDefaultVehicle?.client_id}
        />
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <TaskFormModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
        />
      )}

      {/* Dealership Vehicle Modal (Acción rápida nuevo auto de stock) */}
      {isDealershipVehicleModalOpen && (
        <DealershipVehicleModal
          isOpen={isDealershipVehicleModalOpen}
          onClose={() => setIsDealershipVehicleModalOpen(false)}
        />
      )}

      {/* Detailing Quoter Modal (Acción rápida nueva cotización) */}
      {isQuoterModalOpen && (
        <DetailingQuoterModal
          isOpen={isQuoterModalOpen}
          onClose={() => setIsQuoterModalOpen(false)}
        />
      )}
    </div>
  );
};
