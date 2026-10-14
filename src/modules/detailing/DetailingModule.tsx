import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  Building2,
  FileText,
  Package,
  Award,
  DollarSign,
  TrendingUp,
  Settings,
  Plus,
  RefreshCw,
  ChevronDown,
  Car
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';

// Componentes de las secciones
import { DetailingMonthJobsSection } from './components/DetailingMonthJobsSection';
import { DetailingCalendarView } from './components/agenda/DetailingCalendarView';
import { DetailingCompaniesSection } from './components/DetailingCompaniesSection';
import { DetailingCompanyJobModal } from './components/DetailingCompanyJobModal';
import { DetailingReceiptsSection } from './components/receipts/DetailingReceiptsSection';
import { DetailingStockSection } from './components/DetailingStockSection';
import { DetailingCommissionsSection } from './components/DetailingCommissionsSection';
import { DetailingExpensesSection } from './components/DetailingExpensesSection';
import { DetailingDashboardSection } from './components/DetailingDashboardSection';
import { DetailingConfigTab } from './components/DetailingConfigTab';
import { DetailingQuoterModal } from './components/DetailingQuoterModal';

interface DetailingModuleProps {
  onOpenPublicForm?: () => void;
}

export const DetailingModule: React.FC<DetailingModuleProps> = () => {
  const { profile } = useAuth();
  const { detailingConfig, updateDetailingConfig, refreshData, isSyncing, lastSyncedAt } = useData();
  const { showToast } = useToast();

  const isAdmin = profile?.roles.includes('admin');

  // Pestaña inicial: 'jobs' (Trabajos del mes)
  const [activeTab, setActiveTab] = useState<
    'jobs' | 'calendar' | 'companies' | 'receipts' | 'stock' | 'commissions' | 'expenses' | 'dashboard' | 'config'
  >('jobs');

  const [isQuoterModalOpen, setIsQuoterModalOpen] = useState(false);
  const [isCompanyJobModalOpen, setIsCompanyJobModalOpen] = useState(false);
  const [showNewJobMenu, setShowNewJobMenu] = useState(false);

  const handleManualSync = async () => {
    try {
      await refreshData();
      showToast('Datos sincronizados con éxito desde la nube', 'success');
    } catch {
      showToast('Error al sincronizar con la nube', 'error');
    }
  };

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* 1. Header del Módulo con Identidad y Selector de Pestañas */}
      <div className="bg-white border border-[#E5E5E3] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5E5E3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-[#D7141A]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold font-display text-[#161616]">
                  DetailVlak
                </h1>
                <span className="text-[10px] bg-red-100 text-[#D7141A] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Contable
                </span>
              </div>
              <p className="text-xs text-[#6B6B6B]">
                Registro de trabajos confirmados, cobros, comprobantes y comisiones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              title="Sincronizar datos con Supabase"
              className="bg-white hover:bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616] font-medium px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60 min-h-[38px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#6B6B6B] ${isSyncing ? 'animate-spin text-[#D7141A]' : ''}`} />
              <span className="text-[11px] font-semibold">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
            </button>

            {/* Selector de Nuevo Trabajo: Particular o Empresa */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNewJobMenu(!showNewJobMenu)}
                className="bg-[#D7141A] hover:bg-[#b01015] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer min-h-[38px]"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nuevo trabajo</span>
                <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
              </button>

              {showNewJobMenu && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowNewJobMenu(false)}
                  />
                  <div className="absolute right-0 mt-1 w-52 bg-white border border-[#E5E5E3] rounded-xl shadow-lg z-30 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewJobMenu(false);
                        setIsQuoterModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-50 flex items-center gap-2.5 transition-colors"
                    >
                      <Car className="w-4 h-4 text-neutral-500" />
                      <div>
                        <div className="text-neutral-900">Particular</div>
                        <div className="text-[10px] text-neutral-400 font-normal">Cotizador y cliente estándar</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowNewJobMenu(false);
                        setIsCompanyJobModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-neutral-800 hover:bg-red-50 flex items-center gap-2.5 transition-colors border-t border-neutral-100"
                    >
                      <Building2 className="w-4 h-4 text-[#D7141A]" />
                      <div>
                        <div className="text-[#D7141A]">Empresa</div>
                        <div className="text-[10px] text-neutral-500 font-normal">Preparación preventa y tarifas</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 2. Barra de Navegación de Pestañas */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('jobs')}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
              activeTab === 'jobs'
                ? 'bg-[#161616] text-white shadow-xs'
                : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] hover:bg-gray-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Trabajos del mes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-[#161616] text-white shadow-xs'
                : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] hover:bg-gray-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendario</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('companies')}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
              activeTab === 'companies'
                ? 'bg-[#161616] text-white shadow-xs'
                : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] hover:bg-gray-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Empresas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('receipts')}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
              activeTab === 'receipts'
                ? 'bg-[#161616] text-white shadow-xs'
                : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] hover:bg-gray-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Comprobantes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
              activeTab === 'stock'
                ? 'bg-[#161616] text-white shadow-xs'
                : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] hover:bg-gray-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Inventario</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('commissions')}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
              activeTab === 'commissions'
                ? 'bg-[#161616] text-white shadow-xs'
                : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] hover:bg-gray-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Comisiones</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                activeTab === 'expenses'
                  ? 'bg-[#161616] text-white shadow-xs'
                  : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] hover:bg-gray-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Gastos</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#161616] text-white shadow-xs'
                : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] hover:bg-gray-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Métricas</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                activeTab === 'config'
                  ? 'bg-[#161616] text-white shadow-xs'
                : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] hover:bg-gray-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configuración</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Renderizado de Contenido según Pestaña Activa */}
      {activeTab === 'jobs' && <DetailingMonthJobsSection />}

      {activeTab === 'calendar' && <DetailingCalendarView />}

      {activeTab === 'companies' && <DetailingCompaniesSection />}

      {activeTab === 'receipts' && <DetailingReceiptsSection />}

      {activeTab === 'stock' && <DetailingStockSection />}

      {activeTab === 'commissions' && <DetailingCommissionsSection />}

      {activeTab === 'expenses' && isAdmin && <DetailingExpensesSection />}

      {activeTab === 'dashboard' && <DetailingDashboardSection />}

      {activeTab === 'config' && isAdmin && (
        <DetailingConfigTab
          config={detailingConfig}
          onSaveConfig={updateDetailingConfig}
        />
      )}

      {/* Modal Nuevo Trabajo Particular */}
      {isQuoterModalOpen && (
        <DetailingQuoterModal
          isOpen={isQuoterModalOpen}
          onClose={() => setIsQuoterModalOpen(false)}
        />
      )}

      {/* Modal Nuevo Trabajo Empresa */}
      {isCompanyJobModalOpen && (
        <DetailingCompanyJobModal
          isOpen={isCompanyJobModalOpen}
          onClose={() => setIsCompanyJobModalOpen(false)}
        />
      )}
    </div>
  );
};
