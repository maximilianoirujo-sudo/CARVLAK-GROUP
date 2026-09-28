import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  Plus,
  Search,
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
import { Button } from '../../components/ui/Button';
import { UruguayanPlate } from '../../components/ui/UruguayanPlate';

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

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

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
    <div className="space-y-5 animate-fade-in pb-16">
      {/* CABECERA PRINCIPAL CON IDENTIDAD CARVLAK */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-[#E5E5E3] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-title font-bold uppercase tracking-wider text-[#6B6B6B]">
                Módulo peritajes • Taller central
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]">
                15 Paneles • OBD-II • SUCIVE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-title font-bold text-[#161616]">
              Inspección técnica
            </h1>
            <p className="text-xs text-[#6B6B6B] max-w-2xl leading-relaxed">
              Peritaje técnico precompra para clientes e inspección interna para adquisición de stock automotora. Checklist táctil mobile-first y reporte con semáforo pericial.
            </p>
          </div>

          {/* Botones de Cabecera */}
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsTariffModalOpen(true)}
              >
                <Settings className="w-3.5 h-3.5 text-[#6B6B6B]" />
                <span>Tarifario</span>
              </Button>
            )}

            {/* UNICO BOTÓN PRINCIPAL EN ROJO #D7141A */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setInspectionToEdit(null);
                setIsModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Nueva inspección</span>
            </Button>
          </div>
        </div>
      </div>

      {/* PESTAÑAS DEL MÓDULO CON LÍNEA ROJA INFERIOR PARA LA PESTAÑA ACTIVA */}
      <div className="border-b border-[#E5E5E3] flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`pb-3 pt-2 px-3 text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] border-b-2 ${
            activeTab === 'list'
              ? 'text-[#161616] border-[#D7141A]'
              : 'text-[#6B6B6B] hover:text-[#161616] border-transparent'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Inspecciones</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F5F5F4] text-[#6B6B6B] font-bold border border-[#E5E5E3]">
            {inspections.length}
          </span>
        </button>

        {activeInspection && activeTab === 'peritaje_live' && (
          <button
            type="button"
            className="pb-3 pt-2 px-3 text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] border-b-2 text-[#161616] border-[#D7141A]"
          >
            <Clock className="w-4 h-4 text-[#D7141A]" />
            <span>Peritaje en curso: {activeInspection.vehicle_plate}</span>
          </button>
        )}

        {activeInspection && activeTab === 'report_view' && (
          <button
            type="button"
            className="pb-3 pt-2 px-3 text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] border-b-2 text-[#161616] border-[#D7141A]"
          >
            <ShieldCheck className="w-4 h-4 text-[#D7141A]" />
            <span>Informe: {activeInspection.vehicle_plate}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 pt-2 px-3 text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] border-b-2 ${
            activeTab === 'expenses'
              ? 'text-[#161616] border-[#D7141A]'
              : 'text-[#6B6B6B] hover:text-[#161616] border-transparent'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Gastos inspección</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('commissions')}
          className={`pb-3 pt-2 px-3 text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] border-b-2 ${
            activeTab === 'commissions'
              ? 'text-[#161616] border-[#D7141A]'
              : 'text-[#6B6B6B] hover:text-[#161616] border-transparent'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Comisiones</span>
        </button>

        {isEncargado && (
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`pb-3 pt-2 px-3 text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] border-b-2 ${
            activeTab === 'dashboard'
              ? 'text-[#161616] border-[#D7141A]'
              : 'text-[#6B6B6B] hover:text-[#161616] border-transparent'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Métricas</span>
          </button>
        )}
      </div>

      {/* CONTENIDO SEGÚN PESTAÑA ACTIVA */}
      {activeTab === 'peritaje_live' && activeInspection && (
        <div className="space-y-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab('list')}
          >
            ← Volver al listado
          </Button>
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
          <div className="p-4 rounded-xl bg-white border border-[#E5E5E3] space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Buscador */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar matrícula, cliente o modelo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616] placeholder-[#9A9A9A] text-xs focus:bg-white focus:border-[#161616] outline-none transition-colors"
                />
              </div>

              {/* Selector Tipo */}
              <div className="flex items-center gap-1 bg-[#F5F5F4] p-1 rounded-xl border border-[#E5E5E3] w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    typeFilter === 'all'
                      ? 'bg-white text-[#161616] shadow-sm'
                      : 'text-[#6B6B6B] hover:text-[#161616]'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('precompra')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    typeFilter === 'precompra'
                      ? 'bg-white text-[#161616] shadow-sm'
                      : 'text-[#6B6B6B] hover:text-[#161616]'
                  }`}
                >
                  Precompra
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('interna')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    typeFilter === 'interna'
                      ? 'bg-white text-[#161616] shadow-sm'
                      : 'text-[#6B6B6B] hover:text-[#161616]'
                  }`}
                >
                  Interna automotora
                </button>
              </div>
            </div>

            {/* Filtro de Estados */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-2 border-t border-[#E5E5E3]">
              <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider shrink-0 mr-1">
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
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                    statusFilter === st.key
                      ? 'bg-[#161616] text-white shadow-sm'
                      : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] border border-[#E5E5E3]'
                  }`}
                >
                  <span>{st.label}</span>
                  <span className={`text-[9px] px-1 rounded font-mono ${statusFilter === st.key ? 'bg-white/20 text-white' : 'bg-white text-[#6B6B6B]'}`}>
                    {st.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* LISTADO DE TARJETAS DE INSPECCIÓN */}
          {filteredInspections.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-white border border-[#E5E5E3] space-y-3 shadow-sm">
              <ClipboardCheck className="w-12 h-12 text-[#9A9A9A] mx-auto" />
              <h3 className="text-base font-bold text-[#161616]">No hay inspecciones que coincidan</h3>
              <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
                No encontramos peritajes con los filtros seleccionados. Crea una nueva inspección para iniciar un peritaje.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setInspectionToEdit(null);
                  setIsModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
                <span>Crear inspección</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInspections.map((insp) => {
                const isCompleted = insp.status === 'Completada';
                const isInProgress = insp.status === 'En curso';

                return (
                  <div
                    key={insp.id}
                    className="p-5 rounded-xl bg-white border border-[#E5E5E3] hover:border-[#D0D0CD] transition-all flex flex-col justify-between space-y-4 shadow-sm group"
                  >
                    {/* ENCABEZADO DE TARJETA */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md inline-block mb-1.5 bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]">
                            {insp.type === 'precompra' ? 'Precompra' : 'Interna automotora'}
                          </span>
                          <h3 className="text-base font-title font-bold text-[#161616] group-hover:text-[#000000] transition-colors">
                            {insp.vehicle_info}
                          </h3>
                        </div>

                        {/* Estado */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isCompleted
                              ? 'bg-[#EEF7F2] text-[#1E6B43]'
                              : isInProgress
                              ? 'bg-[#FEF7EC] text-[#945B0E]'
                              : 'bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]'
                          }`}
                        >
                          {insp.status}
                        </span>
                      </div>

                      {/* Matrícula y Categoría */}
                      <div className="flex items-center gap-2.5">
                        <UruguayanPlate plate={insp.vehicle_plate} size="sm" />
                        <span className="text-[11px] text-[#6B6B6B]">
                          {insp.vehicle_category}
                        </span>
                        {insp.is_home_visit && (
                          <span className="text-[10px] text-[#6B6B6B] font-medium bg-[#F5F5F4] border border-[#E5E5E3] px-1.5 py-0.5 rounded">
                            A domicilio
                          </span>
                        )}
                      </div>

                      {/* Solicitante y Vendedor */}
                      <div className="text-xs text-[#6B6B6B] space-y-0.5 pt-1">
                        <div>
                          Solicitante: <strong className="text-[#161616]">{insp.buyer_name || 'Automotora'}</strong>
                        </div>
                        {insp.seller_name && (
                          <div className="text-[11px] text-[#6B6B6B]">
                            Vendedor: {insp.seller_name}
                          </div>
                        )}
                      </div>

                      {/* Puntaje y Semáforo (Si está completada o evaluada) */}
                      {isCompleted && (
                        <div className="p-2.5 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg font-title font-bold text-sm flex items-center justify-center bg-white border border-[#E5E5E3] text-[#161616] shadow-sm">
                              {insp.score}
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-[#6B6B6B] block leading-tight">
                                Semáforo
                              </span>
                              <span
                                className={`text-[11px] font-title font-bold ${
                                  insp.traffic_light === 'Recomendable'
                                    ? 'text-[#1E6B43]'
                                    : insp.traffic_light === 'Con reparos'
                                    ? 'text-[#945B0E]'
                                    : 'text-[#B80E14]'
                                }`}
                              >
                                {insp.traffic_light}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[9px] font-bold text-[#6B6B6B] block leading-tight">
                              Reparaciones
                            </span>
                            <span className="font-mono text-xs font-bold text-[#161616]">
                              $U {insp.estimated_repair_cost.toLocaleString('es-UY')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* PIE DE TARJETA & ACCIONES */}
                    <div className="pt-3 border-t border-[#E5E5E3] space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#6B6B6B]">Monto:</span>
                        <span className="font-title font-bold text-[#161616] text-sm">
                          $U {insp.total_price.toLocaleString('es-UY')}
                        </span>
                      </div>

                      {/* Botones de Acción */}
                      <div className="grid grid-cols-2 gap-2">
                        {isCompleted ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleViewReport(insp)}
                            className="w-full"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-[#6B6B6B]" />
                            <span>Ver informe</span>
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStartPeritaje(insp)}
                            className="w-full"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            <span>{isInProgress ? 'Continuar' : 'Peritar'}</span>
                          </Button>
                        )}

                        <div className="flex items-center gap-1 justify-end">
                          <button
                            type="button"
                            onClick={() => handleEdit(insp)}
                            className="p-2 rounded-lg bg-white border border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616] hover:border-[#D0D0CD] transition-colors"
                            title="Editar datos"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => archiveInspection(insp.id)}
                            className="p-2 rounded-lg bg-white border border-[#E5E5E3] text-[#6B6B6B] hover:text-[#D7141A] hover:border-[#D7141A]/30 transition-colors"
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
