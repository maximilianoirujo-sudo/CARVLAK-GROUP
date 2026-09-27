import React, { useState } from 'react';
import {
  Car,
  Users,
  DollarSign,
  Award,
  TrendingUp,
  Download,
  ExternalLink,
  Settings
} from 'lucide-react';
import { DealershipVehicle } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Button } from '../../components/ui/Button';

// Componentes del Módulo Automotora
import { DealershipVehicleList } from './components/DealershipVehicleList';
import { DealershipVehicleModal } from './components/DealershipVehicleModal';
import { DealershipVehicleDetailDrawer } from './components/DealershipVehicleDetailDrawer';
import { DealershipCRMSection } from './components/DealershipCRMSection';
import { DealershipSaleModal } from './components/DealershipSaleModal';
import { DealershipDashboardSection } from './components/DealershipDashboardSection';
import { DealershipMigrationModal } from './components/DealershipMigrationModal';
import { DealershipConfigSection } from './components/DealershipConfigSection';

// Reutilización de Gastos y Comisiones
import { DetailingExpensesSection } from '../detailing/components/DetailingExpensesSection';
import { DetailingCommissionsSection } from '../detailing/components/DetailingCommissionsSection';

interface AutomotoraModuleProps {
  onOpenPublicCatalog?: () => void;
}

export const AutomotoraModule: React.FC<AutomotoraModuleProps> = ({ onOpenPublicCatalog }) => {
  const { profile } = useAuth();
  const { dealershipVehicles } = useData();

  const isAdmin = profile?.roles.includes('admin');

  // Pestaña activa
  const [activeTab, setActiveTab] = useState<'stock' | 'crm' | 'gastos' | 'comisiones' | 'dashboard' | 'config'>('stock');

  // Modales
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<DealershipVehicle | null>(null);

  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = useState<DealershipVehicle | null>(null);
  const [vehicleForSale, setVehicleForSale] = useState<DealershipVehicle | null>(null);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);

  // Handlers
  const handleOpenNewVehicle = () => {
    setVehicleToEdit(null);
    setIsVehicleModalOpen(true);
  };

  const handleOpenEditVehicle = (veh: DealershipVehicle) => {
    setVehicleToEdit(veh);
    setIsVehicleModalOpen(true);
  };

  const handleSelectVehicle = (veh: DealershipVehicle) => {
    setSelectedVehicleForDetail(veh);
  };

  const handleOpenSaleModal = (veh: DealershipVehicle) => {
    setVehicleForSale(veh);
  };

  const handleOpenCatalog = () => {
    if (onOpenPublicCatalog) {
      onOpenPublicCatalog();
    } else {
      window.open('/?catalogo=autos', '_blank');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Banner Principal de la Automotora */}
      <div className="p-5 sm:p-6 rounded-xl bg-panel border border-borde">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-title font-bold uppercase tracking-wider text-gris-texto">
                CARVLAK Automotores
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-negro text-gris-texto border border-borde">
                {dealershipVehicles.length} vehículos en stock
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-title font-bold text-white mt-1">
              Gestión integral de stock y ventas
            </h1>

            <p className="text-xs text-gris-texto mt-1 max-w-2xl leading-relaxed">
              Inventario de usados seleccionados y eléctricos 0km, señas bancarias, permutas, cuentas por pagar y comisiones de venta.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleOpenCatalog}
            >
              <ExternalLink className="w-3.5 h-3.5 text-gris-texto" />
              <span>Ver catálogo web</span>
            </Button>

            <Button
              variant="secondary"
              onClick={() => setIsMigrationModalOpen(true)}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Importar AppAuto</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Navegación Modular (Tabs con Línea Roja #D7141A para la pestaña activa) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-borde">
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-3 text-xs font-title font-bold uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] ${
            activeTab === 'stock'
              ? 'text-white border-b-2 border-rojo'
              : 'text-gris-texto hover:text-white'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Stock e inventario</span>
        </button>

        <button
          onClick={() => setActiveTab('crm')}
          className={`px-4 py-3 text-xs font-title font-bold uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] ${
            activeTab === 'crm'
              ? 'text-white border-b-2 border-rojo'
              : 'text-gris-texto hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>CRM interesados</span>
        </button>

        <button
          onClick={() => setActiveTab('gastos')}
          className={`px-4 py-3 text-xs font-title font-bold uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] ${
            activeTab === 'gastos'
              ? 'text-white border-b-2 border-rojo'
              : 'text-gris-texto hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Gastos automotora</span>
        </button>

        <button
          onClick={() => setActiveTab('comisiones')}
          className={`px-4 py-3 text-xs font-title font-bold uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] ${
            activeTab === 'comisiones'
              ? 'text-white border-b-2 border-rojo'
              : 'text-gris-texto hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Comisiones</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-3 text-xs font-title font-bold uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] ${
              activeTab === 'dashboard'
                ? 'text-white border-b-2 border-rojo'
                : 'text-gris-texto hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Rentabilidad</span>
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-3 text-xs font-title font-bold uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] ${
              activeTab === 'config'
                ? 'text-white border-b-2 border-rojo'
                : 'text-gris-texto hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configuración</span>
          </button>
        )}
      </div>

      {/* Renderizado de la Sección Activa */}
      {activeTab === 'stock' && (
        <DealershipVehicleList
          onSelectVehicle={handleSelectVehicle}
          onNewVehicle={handleOpenNewVehicle}
          onEditVehicle={handleOpenEditVehicle}
          onOpenSaleModal={handleOpenSaleModal}
          onOpenMigrationModal={() => setIsMigrationModalOpen(true)}
          onOpenPublicCatalog={handleOpenCatalog}
        />
      )}

      {activeTab === 'crm' && (
        <DealershipCRMSection onSelectVehicle={handleSelectVehicle} />
      )}

      {activeTab === 'gastos' && (
        <DetailingExpensesSection businessFilter="automotora" />
      )}

      {activeTab === 'comisiones' && (
        <DetailingCommissionsSection businessFilter="automotora" />
      )}

      {activeTab === 'dashboard' && <DealershipDashboardSection />}

      {activeTab === 'config' && <DealershipConfigSection />}

      {/* Modales y Drawers Globales de Automotora */}
      {isVehicleModalOpen && (
        <DealershipVehicleModal
          isOpen={isVehicleModalOpen}
          onClose={() => setIsVehicleModalOpen(false)}
          vehicleToEdit={vehicleToEdit}
        />
      )}

      {selectedVehicleForDetail && (
        <DealershipVehicleDetailDrawer
          vehicle={selectedVehicleForDetail}
          isOpen={Boolean(selectedVehicleForDetail)}
          onClose={() => setSelectedVehicleForDetail(null)}
          onEdit={handleOpenEditVehicle}
          onOpenSaleModal={handleOpenSaleModal}
          onOpenPublicCatalog={handleOpenCatalog}
        />
      )}

      {vehicleForSale && (
        <DealershipSaleModal
          vehicle={vehicleForSale}
          isOpen={Boolean(vehicleForSale)}
          onClose={() => setVehicleForSale(null)}
        />
      )}

      {isMigrationModalOpen && (
        <DealershipMigrationModal
          isOpen={isMigrationModalOpen}
          onClose={() => setIsMigrationModalOpen(false)}
        />
      )}
    </div>
  );
};
