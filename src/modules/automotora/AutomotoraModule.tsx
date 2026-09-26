import React, { useState } from 'react';
import {
  Car,
  Users,
  DollarSign,
  Award,
  TrendingUp,
  Download,
  ExternalLink,
  ShieldCheck,
  Building2,
  Sparkles
} from 'lucide-react';
import { DealershipVehicle } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

// Componentes del Módulo Automotora
import { DealershipVehicleList } from './components/DealershipVehicleList';
import { DealershipVehicleModal } from './components/DealershipVehicleModal';
import { DealershipVehicleDetailDrawer } from './components/DealershipVehicleDetailDrawer';
import { DealershipCRMSection } from './components/DealershipCRMSection';
import { DealershipSaleModal } from './components/DealershipSaleModal';
import { DealershipDashboardSection } from './components/DealershipDashboardSection';
import { DealershipMigrationModal } from './components/DealershipMigrationModal';

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
  const [activeTab, setActiveTab] = useState<'stock' | 'crm' | 'gastos' | 'comisiones' | 'dashboard'>('stock');

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
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Banner Principal de la Automotora */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#181D26] to-[#0E131C] border border-amber-500/30 relative overflow-hidden shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                Fase 4 • Automotora CARVLAK
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                Multi-SaaS Ready
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {dealershipVehicles.length} vehículos
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              Gestión Integral de Automotora &amp; Stock
            </h1>

            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Catálogo centralizado, peritajes previos, alistamiento en taller, señas bancarias, permutas y comisiones de venta conectados a la base común.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenCatalog}
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ver Catálogo Web</span>
            </button>

            <button
              onClick={() => setIsMigrationModalOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Importar AppAuto</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navegación Modular (Tabs) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/80">
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'stock'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Stock &amp; Inventario</span>
        </button>

        <button
          onClick={() => setActiveTab('crm')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'crm'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>CRM &amp; Clientes Interesados</span>
        </button>

        <button
          onClick={() => setActiveTab('gastos')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'gastos'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Gastos Automotora</span>
        </button>

        <button
          onClick={() => setActiveTab('comisiones')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'comisiones'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Comisiones de Venta</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Métricas &amp; Rentabilidad</span>
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
