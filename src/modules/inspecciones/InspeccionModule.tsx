import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  Car,
  User,
  Settings,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Share2,
  Trash2,
  Edit3,
  BarChart3,
  Receipt,
  Award
} from 'lucide-react';
import { VehicleInspection, InspectionType, InspectionStatus } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/formatters';

// Componentes del Módulo Inspecciones
import { CarPanelsDiagram } from './components/CarPanelsDiagram';
import { InspectionModal } from './components/InspectionModal';
import { InspectionChecklistLive } from './components/InspectionChecklistLive';
import { InspectionReportView } from './components/InspectionReportView';
import { InspectionTariffModal } from './components/InspectionTariffModal';
import { InspectionDashboardSection } from './components/InspectionDashboardSection';
import { DetailingExpensesSection } from '../detailing/components/DetailingExpensesSection';
import { DetailingCommissionsSection } from '../detailing/components/DetailingCommissionsSection';

interface InspeccionModuleProps {
  onNavigateToDetailing?: (quoteId?: string) => void;
}

export const InspeccionModule: React.FC<InspeccionModuleProps> = ({
  onNavigateToDetailing
}) => {
  const {
    inspections,
    updateInspectionStatus,
    archiveInspection
  } = useData();
  const { profile } = useAuth();

  const isAdmin = profile?.roles.includes('admin');
  const isEncargado = profile?.roles.includes('encargado') || isAdmin;

  // Pestañas
  const [activeTab, setActiveTab] = useState<
    'list' | 'peritaje_live' | 'report_view' | 'expenses' | 'commissions' | 'dashboard'
  >('list');

  // Filtros
  const [typeFilter, setTypeFilter] = useState<'all' | InspectionType>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados de Inspección Activa para Checklist o Informe
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inspectionToEdit, setInspectionToEdit] = useState<VehicleInspection | null>(null);
  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);

  // Inspección actualmente seleccionada
  const activeInspection = useMemo(() => {
    return inspections.find((i) => i.id === selectedInspectionId) || null;
  }, [inspections, selectedInspectionId]);

  // Filtrado de Inspecciones
  const filteredInspections = useMemo(() => {
    return inspections.filter((i) => {
      // Filtrar por rol: inspector solo ve sus inspecciones a menos que sea Admin o Encargado
      if (!isEncargado && i.assigned_to && i.assigned_to !== profile?.id) {
        return false;
      }

      const matchType = typeFilter === 'all' || i.type === typeFilter;
      const matchStatus = statusFilter === 'all' || i.status === statusFilter;
      const term = searchTerm.toLowerCase();
      const matchSearch =
        i.vehicle_plate.toLowerCase().includes(term) ||
        i.vehicle_info.toLowerCase().includes(term) ||
        (i.buyer_name && i.buyer_name.toLowerCase().includes(term)) ||
        (i.seller_name && i.seller_name.toLowerCase().includes(term));

      return matchType && matchStatus && matchSearch;
    });
  }, [inspections, typeFilter, statusFilter, searchTerm, isEncargado, profile]);

  // Contadores por estado
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Solicitada: 0,
      Agendada: 0,
      'En curso': 0,
      Completada: 0,
      Cancelada: 0
    };
    inspections.forEach((i) => {
      if (counts[i.status] !== undefined) counts[i.status]++;
    });
    return counts;
  }, [inspections]);

  // Handlers para abrir peritaje en vivo o informe
  const handleStartPeritaje = (insp: VehicleInspection) => {
    setSelectedInspectionId(insp.id);
    if (insp.status === 'Solicitada' || insp.status === 'Agendada') {
      updateInspectionStatus(insp.id, 'En curso');
    }
    setActiveTab('peritaje_live');
  };

  const handleViewReport = (insp: VehicleInspection) => {
    setSelectedInspectionId(insp.id);
    setActiveTab('report_view');
  };

  const handleEdit = (insp: VehicleInspection) => {
    setInspectionToEdit(insp);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* CABECERA PRINCIPAL CON IDENTIDAD FASE 3 */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0F241C] via-[#0A1813] to-[#080D14] border border-emerald-500/30 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
                Fase 3 Activa • Peritaje Vehicular
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                15 Paneles • OBD-II • SUCIVE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              CARVLAK Inspección & Patio
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Peritaje técnico precompra para clientes e inspección interna para adquisición de stock automotora. Checklist táctil mobile-first (&lt; 3 min) y reporte con semáforo automático.
            </p>
          </div>

          {/* Botones de Cabecera */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsTariffModalOpen(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-700 text-xs font-bold text-slate-200 hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <Settings className="w-4 h-4 text-emerald-400" />
                <span>Tarifario</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setInspectionToEdit(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Inspección</span>
            </button>
          </div>
        </div>
      </div>

      {/* PESTAÑAS DEL MÓDULO */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${
            activeTab === 'list'
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
              : 'bg-[#0E1420] border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Inspecciones ({inspections.length})</span>
        </button>

        {activeInspection && activeTab === 'peritaje_live' && (
          <button
            type="button"
            className="shrink-0 px-4 py-2.5 rounded-2xl text-xs font-bold bg-amber-500/20 border border-amber-500 text-amber-300 shadow-md flex items-center gap-2"
          >
            <Clock className="w-4 h-4 animate-spin" />
            <span>Peritaje en Curso: {activeInspection.vehicle_plate}</span>
          </button>
        )}

        {activeInspection && activeTab === 'report_view' && (
          <button
            type="button"
            className="shrink-0 px-4 py-2.5 rounded-2xl text-xs font-bold bg-blue-500/20 border border-blue-500 text-blue-300 shadow-md flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Informe: {activeInspection.vehicle_plate}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${
            activeTab === 'expenses'
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
              : 'bg-[#0E1420] border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Gastos de Inspección</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('commissions')}
          className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${
            activeTab === 'commissions'
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
              : 'bg-[#0E1420] border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Comisiones Peritos</span>
        </button>

        {isEncargado && (
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'dashboard'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                : 'bg-[#0E1420] border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard Pericial</span>
          </button>
        )}
      </div>

      {/* CONTENIDO SEGÚN PESTAÑA ACTIVA */}
      {activeTab === 'peritaje_live' && activeInspection && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white inline-flex items-center gap-1.5"
          >
            ← Volver al listado
          </button>
          <InspectionChecklistLive
            inspection={activeInspection}
            onFinish={() => setActiveTab('report_view')}
          />
        </div>
      )}

      {activeTab === 'report_view' && activeInspection && (
        <InspectionReportView
          inspection={activeInspection}
          onBack={() => setActiveTab('list')}
          onNavigateToDetailing={(qId) => {
            if (onNavigateToDetailing) {
              onNavigateToDetailing(qId);
            }
          }}
        />
      )}

      {activeTab === 'expenses' && (
        <DetailingExpensesSection businessFilter="inspeccion" />
      )}

      {activeTab === 'commissions' && (
        <DetailingCommissionsSection businessFilter="inspeccion" />
      )}

      {activeTab === 'dashboard' && (
        <InspectionDashboardSection />
      )}

      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* BARRA DE FILTROS & BÚSQUEDA */}
          <div className="p-4 rounded-3xl bg-[#0F1420] border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Buscador */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar matrícula, cliente o modelo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Selector Tipo */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    typeFilter === 'all'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('precompra')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    typeFilter === 'precompra'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Precompra
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('interna')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    typeFilter === 'interna'
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Interna Automotora
                </button>
              </div>
            </div>

            {/* Filtro de Estados */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
                Estado:
              </span>
              {[
                { key: 'all', label: 'Todos', count: inspections.length },
                { key: 'Solicitada', label: 'Solicitadas', count: statusCounts.Solicitada },
                { key: 'Agendada', label: 'Agendadas', count: statusCounts.Agendada },
                { key: 'En curso', label: 'En curso', count: statusCounts['En curso'] },
                { key: 'Completada', label: 'Completadas', count: statusCounts.Completada }
              ].map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setStatusFilter(st.key)}
                  className={`shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                    statusFilter === st.key
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{st.label}</span>
                  <span className="text-[9px] px-1 rounded bg-black/40 font-mono">
                    {st.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* LISTADO DE TARJETAS DE INSPECCIÓN */}
          {filteredInspections.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#0F1420] border border-slate-800 space-y-3">
              <ClipboardCheck className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No hay inspecciones que coincidan</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No encontramos peritajes con los filtros seleccionados. Crea una nueva inspección para iniciar un peritaje.
              </p>
              <button
                type="button"
                onClick={() => {
                  setInspectionToEdit(null);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Inspección</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInspections.map((insp) => {
                const isCompleted = insp.status === 'Completada';
                const isInProgress = insp.status === 'En curso';

                return (
                  <div
                    key={insp.id}
                    className="p-5 rounded-3xl bg-[#0F1420] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-lg group"
                  >
                    {/* ENCABEZADO DE TARJETA */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md inline-block mb-1 ${
                              insp.type === 'precompra'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                                : 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                            }`}
                          >
                            {insp.type === 'precompra' ? 'Precompra' : 'Interna Automotora'}
                          </span>
                          <h3 className="text-base font-black text-white group-hover:text-emerald-400 transition-colors">
                            {insp.vehicle_info}
                          </h3>
                        </div>

                        {/* Estado */}
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isInProgress
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {insp.status}
                        </span>
                      </div>

                      {/* Matrícula y Categoría */}
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-400">
                          {insp.vehicle_plate}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          • {insp.vehicle_category}
                        </span>
                        {insp.is_home_visit && (
                          <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                            A domicilio
                          </span>
                        )}
                      </div>

                      {/* Solicitante y Vendedor */}
                      <div className="text-xs text-slate-400 space-y-0.5 pt-1">
                        <div>
                          Solicitante: <strong className="text-slate-200">{insp.buyer_name || 'Automotora'}</strong>
                        </div>
                        {insp.seller_name && (
                          <div className="text-[11px] text-slate-500">
                            Vendedor: {insp.seller_name}
                          </div>
                        )}
                      </div>

                      {/* Puntaje y Semáforo (Si está completada o evaluada) */}
                      {isCompleted && (
                        <div className="p-2.5 rounded-2xl bg-[#090D14] border border-slate-800/80 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center ${
                                insp.traffic_light === 'Recomendable'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : insp.traffic_light === 'Con reparos'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {insp.score}
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">
                                Semáforo
                              </span>
                              <span
                                className={`text-[11px] font-black uppercase ${
                                  insp.traffic_light === 'Recomendable'
                                    ? 'text-emerald-400'
                                    : insp.traffic_light === 'Con reparos'
                                    ? 'text-amber-300'
                                    : 'text-red-400'
                                }`}
                              >
                                {insp.traffic_light}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">
                              Reparaciones
                            </span>
                            <span className="font-mono text-xs font-bold text-amber-400">
                              $U {insp.estimated_repair_cost.toLocaleString('es-UY')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* PIE DE TARJETA & ACCIONES */}
                    <div className="pt-3 border-t border-slate-800/80 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Monto:</span>
                        <span className="font-mono font-black text-white text-sm">
                          $U {insp.total_price.toLocaleString('es-UY')}
                        </span>
                      </div>

                      {/* Botones de Acción */}
                      <div className="grid grid-cols-2 gap-2">
                        {isCompleted ? (
                          <button
                            type="button"
                            onClick={() => handleViewReport(insp)}
                            className="w-full py-2 px-3 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 font-bold text-xs hover:bg-blue-500/30 flex items-center justify-center gap-1.5"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Ver Informe</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartPeritaje(insp)}
                            className="w-full py-2 px-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            <span>{isInProgress ? 'Continuar' : 'Peritar'}</span>
                          </button>
                        )}

                        <div className="flex items-center gap-1 justify-end">
                          <button
                            type="button"
                            onClick={() => handleEdit(insp)}
                            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
                            title="Editar datos"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => archiveInspection(insp.id)}
                            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-red-400"
                            title="Archivar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL CREAR / EDITAR INSPECCIÓN */}
      <InspectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        inspectionToEdit={inspectionToEdit}
      />

      {/* MODAL TARIFARIO (ADMIN) */}
      <InspectionTariffModal
        isOpen={isTariffModalOpen}
        onClose={() => setIsTariffModalOpen(false)}
      />
    </div>
  );
};
