import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  MessageCircle,
  Car,
  Droplets,
  DollarSign,
  Package,
  Layers,
  Award,
  Globe,
  UploadCloud,
  Settings,
  Phone,
  Calendar,
  Ban,
  RotateCcw,
  Trash2,
  FileText,
  CheckSquare,
  Square,
  AlertTriangle,
  X
} from 'lucide-react';
import { DetailingQuote, DetailingQuoteStatus } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, getLocalDateString } from '../../lib/formatters';
import { Button } from '../../components/ui/Button';
import { UruguayanPlate } from '../../components/ui/UruguayanPlate';

// Componentes modulares
import { DetailingQuoterModal } from './components/DetailingQuoterModal';
import { DetailingWhatsAppModal } from './components/DetailingWhatsAppModal';
import { DetailingTariffManagerModal } from './components/DetailingTariffManagerModal';
import { DetailingStockSection } from './components/DetailingStockSection';
import { DetailingExpensesSection } from './components/DetailingExpensesSection';
import { DetailingCommissionsSection } from './components/DetailingCommissionsSection';
import { DetailingDashboardSection } from './components/DetailingDashboardSection';
import { DetailingMigrationModal } from './components/DetailingMigrationModal';
import { DetailingReceiptsSection } from './components/receipts/DetailingReceiptsSection';

// Componentes de Agenda y Detailing Pro
import { DetailingCalendarView } from './components/agenda/DetailingCalendarView';
import { DetailingTodayPanel } from './components/agenda/DetailingTodayPanel';
import { DetailingConfigTab } from './components/DetailingConfigTab';
import { DetailingVoidModal } from './components/DetailingVoidModal';
import { DetailingWhatsAppQuickModal } from './components/agenda/DetailingWhatsAppQuickModal';
import { computeDetailingAlerts, DetailingAlert } from './services/detailingAlertsService';

interface DetailingModuleProps {
  onOpenPublicForm?: () => void;
}

export const DetailingModule: React.FC<DetailingModuleProps> = ({
  onOpenPublicForm
}) => {
  const {
    detailingQuotes,
    allDetailingQuotes,
    updateDetailingQuoteStatus,
    voidDetailingQuote,
    restoreDetailingQuote,
    deleteDetailingQuotePermanent,
    bulkVoidDetailingQuotes,
    bulkDeleteDetailingQuotes,
    recordDetailingPayment,
    recordDetailingCheckin,
    recordDetailingQualityControl,
    logDetailingWhatsAppSent,
    appointments,
    addAppointment,
    updateAppointment,
    stockItems,
    detailingConfig,
    updateDetailingConfig,
    detailingReceipts
  } = useData();

  const { profile, availableProfiles } = useAuth();

  const isAdmin = profile?.roles.includes('admin');
  const isManagerOrAdmin = isAdmin || profile?.roles.includes('encargado_detailing');

  // Pestañas principales: 'agenda' primera!
  const [activeTab, setActiveTab] = useState<
    'agenda' | 'quotes' | 'receipts' | 'stock' | 'expenses' | 'commissions' | 'dashboard' | 'config'
  >('agenda');

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Alertas inteligentes y estado de posponer
  const [snoozedAlertIds, setSnoozedAlertIds] = useState<string[]>([]);
  const alerts = useMemo(() => {
    return computeDetailingAlerts(
      allDetailingQuotes || detailingQuotes,
      appointments,
      stockItems,
      detailingConfig,
      snoozedAlertIds
    );
  }, [allDetailingQuotes, detailingQuotes, appointments, stockItems, detailingConfig, snoozedAlertIds]);

  const handleSnoozeAlert = (alertId: string) => {
    setSnoozedAlertIds((prev) => [...prev, alertId]);
  };

  // KPIs de Hoy en el Taller
  const todayStr = getLocalDateString(new Date());

  const entriesTodayCount = useMemo(() => {
    return appointments.filter(
      (a) =>
        a.business === 'detailing' &&
        !a.voided_at &&
        !a.is_blocked &&
        getLocalDateString(a.start_time) === todayStr
    ).length;
  }, [appointments, todayStr]);

  const inWorkshopNowCount = useMemo(() => {
    return detailingQuotes.filter((q) =>
      ['Recibido', 'En proceso', 'Control de calidad'].includes(q.status)
    ).length;
  }, [detailingQuotes]);

  const deliveriesTodayCount = useMemo(() => {
    return detailingQuotes.filter((q) =>
      ['Listo para retirar', 'Entregado y cobrado'].includes(q.status)
    ).length;
  }, [detailingQuotes]);

  const availableBaysCount = useMemo(() => {
    const totalActive = (detailingConfig?.work_bays || []).filter((b) => b.is_active).length;
    return Math.max(0, totalActive - inWorkshopNowCount);
  }, [detailingConfig?.work_bays, inWorkshopNowCount]);

  // Filtros de Cotizaciones
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showVoidedQuotes, setShowVoidedQuotes] = useState<boolean>(false);

  // Selección múltiple para cotizaciones
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);

  // Modales
  const [isQuoterModalOpen, setIsQuoterModalOpen] = useState(false);
  const [quoteToEdit, setQuoteToEdit] = useState<DetailingQuote | null>(null);

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [quoteForWhatsApp, setQuoteForWhatsApp] = useState<DetailingQuote | null>(null);

  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);

  // Modal de anulación y borrado definitivo (individual o múltiple)
  const [voidModalState, setVoidModalState] = useState<{
    isOpen: boolean;
    mode: 'void' | 'permanent_delete';
    quote: DetailingQuote | null;
    bulkIds?: string[];
  }>({
    isOpen: false,
    mode: 'void',
    quote: null
  });

  // Modal de WhatsApp rápido desde alertas
  const [quickWhatsAppState, setQuickWhatsAppState] = useState<{
    isOpen: boolean;
    quote: DetailingQuote | null;
    templateKey: 'confirm_appointment' | 'day_before_reminder' | 'car_ready' | 'quote_followup';
  }>({
    isOpen: false,
    quote: null,
    templateKey: 'confirm_appointment'
  });

  // Base de cotizaciones a mostrar (activas o incluir anuladas)
  const baseQuotes = showVoidedQuotes ? allDetailingQuotes : detailingQuotes;

  // Filtrado de Cotizaciones
  const filteredQuotes = useMemo(() => {
    return baseQuotes.filter((q) => {
      const isVoided = !!q.voided_at;
      if (!showVoidedQuotes && isVoided) return false;
      if (showVoidedQuotes && !isVoided) return false;

      const matchStatus = statusFilter === 'all' || q.status === statusFilter;
      const term = searchTerm.toLowerCase();
      const matchSearch =
        q.client_name.toLowerCase().includes(term) ||
        q.client_phone.includes(term) ||
        q.vehicle_info.toLowerCase().includes(term) ||
        (q.vehicle_plate && q.vehicle_plate.toLowerCase().includes(term));
      return matchStatus && matchSearch;
    });
  }, [baseQuotes, statusFilter, searchTerm, showVoidedQuotes]);

  // Contadores por estado
  const countsByStatus = useMemo(() => {
    const counts: Record<string, number> = {
      'Por Cotizar': 0,
      'Presupuesto Enviado': 0,
      'Turno Confirmado': 0,
      'Trabajo Completado': 0
    };
    detailingQuotes.forEach((q) => {
      if (counts[q.status] !== undefined) {
        counts[q.status]++;
      }
    });
    return counts;
  }, [detailingQuotes]);

  const handleOpenWhatsApp = (quote: DetailingQuote) => {
    setQuoteForWhatsApp(quote);
    setIsWhatsAppModalOpen(true);
  };

  const handleEditQuote = (quote: DetailingQuote) => {
    setQuoteToEdit(quote);
    setIsQuoterModalOpen(true);
  };

  const handleActionClickAlert = (alert: DetailingAlert) => {
    if (alert.quoteId) {
      const q = (allDetailingQuotes || detailingQuotes).find((item) => item.id === alert.quoteId);
      if (q) {
        if (alert.actionType === 'whatsapp') {
          setQuickWhatsAppState({
            isOpen: true,
            quote: q,
            templateKey:
              alert.type === 'unconfirmed_tomorrow'
                ? 'day_before_reminder'
                : alert.type === 'ready_not_notified'
                ? 'car_ready'
                : 'quote_followup'
          });
        } else {
          setActiveTab('agenda');
        }
      }
    } else {
      setActiveTab('agenda');
    }
  };

  // Manejadores de selección múltiple
  const handleToggleSelectQuote = (id: string) => {
    setSelectedQuoteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedQuoteIds.length === filteredQuotes.length) {
      setSelectedQuoteIds([]);
    } else {
      setSelectedQuoteIds(filteredQuotes.map((q) => q.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* ── CABECERA DEL MÓDULO ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#E5E5E3] rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D7141A] font-display">
              CARVLAK GROUP
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-[11px] font-semibold text-[#6B6B6B]">
              Taller & Estética Automotriz Pro
            </span>
          </div>
          <h1 className="text-2xl font-bold font-display text-[#161616] tracking-tight">
            DetailVlak Hub
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Agenda del taller por boxes, flujo de trabajos, comprobantes oficiales, gastos y comisiones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenPublicForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenPublicForm}
              title="Abrir formulario web público"
            >
              <Globe className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span>Cotizador web</span>
            </Button>
          )}

          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTariffModalOpen(true)}
              title="Tarifas base"
            >
              <Settings className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span>Tarifario</span>
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsMigrationModalOpen(true)}
            title="Importar datos"
          >
            <UploadCloud className="w-3.5 h-3.5 text-[#6B6B6B]" />
            <span>Migrar datos</span>
          </Button>

          {/* BOTÓN PRINCIPAL EN ROJO #D7141A */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setQuoteToEdit(null);
              setIsQuoterModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Nueva cotización</span>
          </Button>
        </div>
      </div>

      {/* ── NAVEGACIÓN POR PESTAÑAS (AGENDA PRIMERA) ── */}
      <div className="border-b border-[#E5E5E3] flex items-center gap-2 overflow-x-auto no-scrollbar">
        {/* PESTAÑA 1: AGENDA DEL TALLER */}
        <button
          onClick={() => setActiveTab('agenda')}
          className={`pb-3 pt-2 px-3 text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] border-b-2 -mb-[1px] cursor-pointer ${
            activeTab === 'agenda'
              ? 'text-[#161616] border-[#D7141A]'
              : 'text-[#6B6B6B] hover:text-[#161616] border-transparent'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Agenda del taller</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F5F5F4] text-[#6B6B6B] font-bold border border-[#E5E5E3]">
            {appointments.filter((a) => a.business === 'detailing' && !a.voided_at).length}
          </span>
        </button>

        {/* PESTAÑA 2: COTIZACIONES Y TRABAJOS */}
        <button
          onClick={() => setActiveTab('quotes')}
          className={`pb-3 pt-2 px-3 text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] border-b-2 -mb-[1px] cursor-pointer ${
            activeTab === 'quotes'
              ? 'text-[#161616] border-[#D7141A]'
              : 'text-[#6B6B6B] hover:text-[#161616] border-transparent'
          }`}
        >
          <Droplets className="w-4 h-4" />
          <span>Cotizaciones y trabajos</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F5F5F4] text-[#6B6B6B] font-bold border border-[#E5E5E3]">
            {detailingQuotes.length}
          </span>
        </button>

        {/* PESTAÑA 3: COMPROBANTES DE SERVICIO */}
        <button
          onClick={() => setActiveTab('receipts')}
          className={`pb-3 pt-2 px-3 text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] border-b-2 -mb-[1px] cursor-pointer ${
            activeTab === 'receipts'
              ? 'text-[#161616] border-[#D7141A]'
              : 'text-[#6B6B6B] hover:text-[#161616] border-transparent'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Comprobantes</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F5F5F4] text-[#6B6B6B] font-bold border border-[#E5E5E3]">
            {detailingReceipts.length}
          </span>
        </button>

        {/* PESTAÑA 4: INSUMOS Y STOCK */}
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 pt-2 px-3 text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] border-b-2 -mb-[1px] cursor-pointer ${
            activeTab === 'stock'
              ? 'text-[#161616] border-[#D7141A]'
              : 'text-[#6B6B6B] hover:text-[#161616] border-transparent'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Insumos y stock</span>
        </button>

        {/* PESTAÑA 5: GASTOS Y CAJA */}
        {isManagerOrAdmin && (
          <button
            onClick={() => setActiveTab('expenses')}
            className={`pb-3 pt-2 px-3 text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] border-b-2 -mb-[1px] cursor-pointer ${
              activeTab === 'expenses'
                ? 'text-[#161616] border-[#D7141A]'
                : 'text-[#6B6B6B] hover:text-[#161616] border-transparent'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Gastos operativos</span>
          </button>
        )}

        {/* PESTAÑA 6: COMISIONES */}
        <button
          onClick={() => setActiveTab('commissions')}
          className={`pb-3 pt-2 px-3 text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] border-b-2 -mb-[1px] cursor-pointer ${
            activeTab === 'commissions'
              ? 'text-[#161616] border-[#D7141A]'
              : 'text-[#6B6B6B] hover:text-[#161616] border-transparent'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Comisiones</span>
        </button>

        {/* PESTAÑA 7: MÉTRICAS (ADMIN) */}
        {isAdmin && (
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-3 pt-2 px-3 text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] border-b-2 -mb-[1px] cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-[#161616] border-[#D7141A]'
                : 'text-[#6B6B6B] hover:text-[#161616] border-transparent'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Métricas</span>
          </button>
        )}

        {/* PESTAÑA 8: CONFIGURACIÓN (ADMIN / ENCARGADO) */}
        {isManagerOrAdmin && (
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-3 pt-2 px-3 text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] border-b-2 -mb-[1px] cursor-pointer ${
              activeTab === 'config'
                ? 'text-[#161616] border-[#D7141A]'
                : 'text-[#6B6B6B] hover:text-[#161616] border-transparent'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configuración</span>
          </button>
        )}
      </div>

      {/* ── CONTENIDO SEGÚN PESTAÑA ── */}

      {/* 1. AGENDA DEL TALLER */}
      {activeTab === 'agenda' && (
        <div className="space-y-6 animate-fade-in">
          {/* Panel Hoy en el Taller (4 KPIs + Centro de Alertas) */}
          <DetailingTodayPanel
            entriesTodayCount={entriesTodayCount}
            inWorkshopNowCount={inWorkshopNowCount}
            deliveriesTodayCount={deliveriesTodayCount}
            availableBaysCount={availableBaysCount}
            alerts={alerts}
            onActionClick={handleActionClickAlert}
            onSnoozeAlert={handleSnoozeAlert}
          />

          {/* Grilla y Vistas del Calendario */}
          <DetailingCalendarView
            appointments={appointments}
            detailingQuotes={detailingQuotes}
            config={detailingConfig}
            profiles={availableProfiles || []}
            onUpdateQuoteStatus={updateDetailingQuoteStatus}
            onUpdateAppointment={updateAppointment}
            onAddAppointment={addAppointment}
            onOpenQuoterModal={(quote) => {
              setQuoteToEdit(quote || null);
              setIsQuoterModalOpen(true);
            }}
            onRecordCheckin={recordDetailingCheckin}
            onRecordQualityControl={recordDetailingQualityControl}
            onRecordPayment={recordDetailingPayment}
            onLogWhatsAppSent={logDetailingWhatsAppSent}
          />
        </div>
      )}

      {/* 2. COTIZACIONES Y TRABAJOS */}
      {activeTab === 'quotes' && (
        <div className="space-y-4 animate-fade-in">
          {/* Subfiltro de Estados Rápidos */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'all', label: 'Todas', count: detailingQuotes.length },
              { id: 'Por Cotizar', label: 'Por cotizar', count: countsByStatus['Por Cotizar'] },
              { id: 'Presupuesto Enviado', label: 'Enviados', count: countsByStatus['Presupuesto Enviado'] },
              { id: 'Turno Confirmado', label: 'En turno', count: countsByStatus['Turno Confirmado'] },
              { id: 'Trabajo Completado', label: 'Completados', count: countsByStatus['Trabajo Completado'] }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setStatusFilter(f.id);
                  setShowVoidedQuotes(false);
                  setSelectedQuoteIds([]);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer shadow-xs ${
                  statusFilter === f.id && !showVoidedQuotes
                    ? 'bg-white border-[#161616] ring-1 ring-[#161616]'
                    : 'bg-white border-[#E5E5E3] hover:border-[#D0D0CD]'
                }`}
              >
                <div className="text-[11px] text-[#6B6B6B] font-medium">{f.label}</div>
                <div className="text-xl font-bold font-display mt-0.5 text-[#161616] tabular-nums">
                  {f.count}
                </div>
              </button>
            ))}
          </div>

          {/* Barra de Búsqueda y Switch de Anulados */}
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#6B6B6B] pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente, teléfono, auto o matrícula..."
                className="w-full bg-white border border-[#E5E5E3] rounded-md pl-10 pr-4 py-2 text-xs text-[#161616] placeholder-[#9A9A9A] focus:border-[#161616] focus:ring-1 focus:ring-[#161616]/10 focus:outline-none h-10"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setShowVoidedQuotes(!showVoidedQuotes);
                  setSelectedQuoteIds([]);
                }}
                className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showVoidedQuotes
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-white text-[#6B6B6B] border-[#E5E5E3] hover:text-[#161616]'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{showVoidedQuotes ? 'Viendo Anulados' : 'Ver Anulados'}</span>
              </button>
            </div>
          </div>

          {/* BARRA FLOTANTE DE ACCIONES POR SELECCIÓN MÚLTIPLE */}
          {selectedQuoteIds.length > 0 && (
            <div className="bg-[#161616] text-white p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-fade-in">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold font-mono px-2 py-0.5 bg-[#D7141A] rounded-full text-white text-[11px]">
                  {selectedQuoteIds.length}
                </span>
                <span>cotizaciones seleccionadas</span>
              </div>

              <div className="flex items-center gap-2">
                {!showVoidedQuotes ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setVoidModalState({
                        isOpen: true,
                        mode: 'void',
                        quote: null,
                        bulkIds: selectedQuoteIds
                      });
                    }}
                    className="gap-1.5 text-xs bg-[#D7141A] hover:bg-[#b01015]"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Anular seleccionadas</span>
                  </Button>
                ) : (
                  isAdmin && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setVoidModalState({
                          isOpen: true,
                          mode: 'permanent_delete',
                          quote: null,
                          bulkIds: selectedQuoteIds
                        });
                      }}
                      className="gap-1.5 text-xs bg-red-700 hover:bg-red-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Borrar definitivamente</span>
                    </Button>
                  )
                )}

                <button
                  type="button"
                  onClick={() => setSelectedQuoteIds([])}
                  className="text-xs text-gray-300 hover:text-white px-2 py-1 cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Deseleccionar</span>
                </button>
              </div>
            </div>
          )}

          {/* Selector de Seleccionar Todos */}
          {filteredQuotes.length > 0 && isManagerOrAdmin && (
            <div className="flex items-center justify-between text-xs text-[#6B6B6B] px-1">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="flex items-center gap-1.5 hover:text-[#161616] cursor-pointer font-medium"
              >
                {selectedQuoteIds.length === filteredQuotes.length ? (
                  <CheckSquare className="w-4 h-4 text-[#D7141A]" />
                ) : (
                  <Square className="w-4 h-4 text-[#9A9A9A]" />
                )}
                <span>
                  {selectedQuoteIds.length === filteredQuotes.length
                    ? 'Deseleccionar todas'
                    : 'Seleccionar todas las visibles'}
                </span>
              </button>

              <span>
                Mostrando {filteredQuotes.length} cotizaciones
              </span>
            </div>
          )}

          {/* Tarjetas de Cotizaciones */}
          {filteredQuotes.length === 0 ? (
            <div className="p-8 rounded-xl bg-white border border-[#E5E5E3] text-center text-[#6B6B6B] shadow-xs">
              <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#6B6B6B]" />
              <p className="text-sm font-semibold text-[#161616]">
                {showVoidedQuotes
                  ? 'No hay cotizaciones anuladas en el historial.'
                  : 'No hay cotizaciones con este filtro.'}
              </p>
              <p className="text-xs text-[#6B6B6B] mt-1">
                {showVoidedQuotes
                  ? 'Las cotizaciones anuladas aparecerán aquí con su motivo y auditoría.'
                  : 'Podés crear una nueva con el botón superior.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredQuotes.map((quote) => {
                const isVoided = !!quote.voided_at;
                const isSelected = selectedQuoteIds.includes(quote.id);
                const statusClasses = isVoided
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : quote.status === 'Trabajo Completado' || quote.status === 'Entregado y cobrado'
                  ? 'bg-[#EEF7F2] text-[#1E6B43] border-[#D4EBDC]'
                  : quote.status === 'Turno Confirmado' || quote.status === 'Confirmado'
                  ? 'bg-[#FEF7EC] text-[#945B0E] border-[#FDE5C3]'
                  : quote.status === 'Presupuesto Enviado'
                  ? 'bg-[#EEF2F6] text-[#002B7A] border-[#D3DFEE]'
                  : quote.status === 'Cancelado' || quote.status === 'No vino'
                  ? 'bg-[#F5F5F4] text-[#9A9A9A] border-[#E5E5E3]'
                  : 'bg-[#FEF7EC] text-[#945B0E] border-[#FDE5C3]';

                return (
                  <div
                    key={quote.id}
                    className={`p-4 rounded-xl bg-white border transition-all flex flex-col justify-between space-y-3 shadow-xs ${
                      isSelected
                        ? 'border-[#161616] ring-2 ring-[#161616]/10'
                        : isVoided
                        ? 'border-red-200 bg-red-50/10'
                        : 'border-[#E5E5E3] hover:border-[#D0D0CD]'
                    }`}
                  >
                    <div>
                      {/* Cabecera Tarjeta: Checkbox, Estado y Origen */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isManagerOrAdmin && (
                            <button
                              type="button"
                              onClick={() => handleToggleSelectQuote(quote.id)}
                              className="text-[#161616] cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#D7141A]" />
                              ) : (
                                <Square className="w-4 h-4 text-[#9A9A9A]" />
                              )}
                            </button>
                          )}
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${statusClasses}`}>
                            {isVoided ? 'Anulada' : quote.status}
                          </span>
                        </div>

                        <span className="text-[10px] font-medium text-[#6B6B6B] bg-[#F5F5F4] px-2 py-0.5 rounded border border-[#E5E5E3]">
                          {quote.origin}
                        </span>
                      </div>

                      {/* Motivo de anulación si aplica */}
                      {isVoided && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-[11px] text-red-800">
                          <strong>Motivo de anulación:</strong> {quote.void_reason || 'Sin motivo especificado'}
                        </div>
                      )}

                      {/* Cliente y Vehículo */}
                      <div className="mt-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-[#161616] leading-tight">
                            {quote.client_name}
                          </h3>
                          {quote.vehicle_plate && (
                            <UruguayanPlate plate={quote.vehicle_plate} size="sm" />
                          )}
                        </div>

                        <div className="text-xs text-[#6B6B6B] mt-1 flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-[#161616] shrink-0" />
                          <span className="truncate text-[#161616]">{quote.vehicle_info}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F5F5F4] text-[#6B6B6B] font-medium border border-[#E5E5E3] shrink-0">
                            {quote.vehicle_category}
                          </span>
                        </div>

                        <div className="text-[11px] text-[#6B6B6B] mt-1 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#6B6B6B]" />
                          <span>{quote.client_phone}</span>
                        </div>
                      </div>

                      {/* Lista de Servicios */}
                      <div className="mt-3 pt-2.5 border-t border-[#E5E5E3] space-y-1">
                        <div className="text-[10px] text-[#6B6B6B] font-semibold">
                          Servicios ({quote.selected_services.length}):
                        </div>
                        <div className="text-xs text-[#161616] font-medium line-clamp-2">
                          {quote.selected_services.map((s) => s.serviceName).join(' + ')}
                        </div>
                      </div>

                      {/* Monto y Tiempo */}
                      <div className="mt-3 pt-2 border-t border-[#E5E5E3] flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-[#6B6B6B] font-semibold">Total final</div>
                          <div className="text-base font-bold font-display text-[#000000] tabular-nums">
                            {formatCurrency(quote.total_amount, 'UYU')}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-[#6B6B6B] font-semibold">Tiempo</div>
                          <div className="text-xs font-semibold text-[#6B6B6B]">
                            {quote.estimated_time || 'A coordinar'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Acciones Rápidas de la Tarjeta */}
                    <div className="pt-2 border-t border-[#E5E5E3] flex items-center justify-between gap-2">
                      {isVoided ? (
                        <div className="flex items-center justify-between w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => restoreDetailingQuote(quote.id)}
                            className="gap-1.5 text-xs text-emerald-700 hover:bg-emerald-50"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restaurar</span>
                          </Button>

                          {isAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setVoidModalState({
                                  isOpen: true,
                                  mode: 'permanent_delete',
                                  quote
                                });
                              }}
                              className="text-xs text-red-600 hover:bg-red-50 p-1.5"
                              title="Borrado definitivo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <>
                          <Button
                            variant="whatsapp"
                            size="sm"
                            onClick={() => handleOpenWhatsApp(quote)}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </Button>

                          <div className="flex items-center gap-1.5">
                            <select
                              value={quote.status}
                              onChange={(e) =>
                                updateDetailingQuoteStatus(quote.id, e.target.value as DetailingQuoteStatus)
                              }
                              className="bg-white border border-[#E5E5E3] rounded-md px-2 py-1 text-xs text-[#161616] font-medium focus:border-[#161616] focus:outline-none cursor-pointer"
                            >
                              <option value="Por Cotizar">Por cotizar</option>
                              <option value="Presupuesto Enviado">Enviado</option>
                              <option value="Turno Confirmado">Turno</option>
                              <option value="Trabajo Completado">Completado</option>
                              <option value="Cancelado">Cancelado</option>
                            </select>

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEditQuote(quote)}
                            >
                              Editar
                            </Button>

                            <button
                              type="button"
                              onClick={() => {
                                setVoidModalState({
                                  isOpen: true,
                                  mode: 'void',
                                  quote
                                });
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                              title="Anular cotización con motivo"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. COMPROBANTES DE SERVICIO OFICIALES */}
      {activeTab === 'receipts' && (
        <DetailingReceiptsSection />
      )}

      {/* 4. INSUMOS & STOCK */}
      {activeTab === 'stock' && <DetailingStockSection businessFilter="detailing" />}

      {/* 5. GASTOS */}
      {activeTab === 'expenses' && isManagerOrAdmin && <DetailingExpensesSection businessFilter="detailing" />}

      {/* 6. COMISIONES */}
      {activeTab === 'commissions' && <DetailingCommissionsSection businessFilter="detailing" />}

      {/* 7. BALANCE & MÉTRICAS (SOLO ADMIN) */}
      {activeTab === 'dashboard' && isAdmin && <DetailingDashboardSection />}

      {/* 8. CONFIGURACIÓN (ADMIN / ENCARGADO) */}
      {activeTab === 'config' && isManagerOrAdmin && (
        <DetailingConfigTab
          config={detailingConfig}
          onSaveConfig={updateDetailingConfig}
        />
      )}

      {/* ── MODALES ── */}
      {isQuoterModalOpen && (
        <DetailingQuoterModal
          isOpen={isQuoterModalOpen}
          onClose={() => setIsQuoterModalOpen(false)}
          quoteToEdit={quoteToEdit}
          onOpenWhatsApp={handleOpenWhatsApp}
        />
      )}

      {isWhatsAppModalOpen && (
        <DetailingWhatsAppModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => setIsWhatsAppModalOpen(false)}
          quote={quoteForWhatsApp}
        />
      )}

      {isTariffModalOpen && (
        <DetailingTariffManagerModal
          isOpen={isTariffModalOpen}
          onClose={() => setIsTariffModalOpen(false)}
        />
      )}

      {isMigrationModalOpen && (
        <DetailingMigrationModal
          isOpen={isMigrationModalOpen}
          onClose={() => setIsMigrationModalOpen(false)}
        />
      )}

      {/* Modal de Anulación / Borrado Definitivo (individual y múltiple) */}
      <DetailingVoidModal
        isOpen={voidModalState.isOpen}
        onClose={() => setVoidModalState({ isOpen: false, mode: 'void', quote: null, bulkIds: undefined })}
        title={
          voidModalState.bulkIds
            ? voidModalState.mode === 'void'
              ? `Anular ${voidModalState.bulkIds.length} Cotizaciones`
              : `Borrado Definitivo de ${voidModalState.bulkIds.length} Cotizaciones`
            : voidModalState.mode === 'void'
            ? 'Anular Cotización de Detailing'
            : 'Borrado Definitivo'
        }
        itemDescription={
          voidModalState.bulkIds
            ? `${voidModalState.bulkIds.length} cotizaciones seleccionadas para procesar en lote.`
            : voidModalState.quote
            ? `${voidModalState.quote.client_name} - ${voidModalState.quote.vehicle_info} (${formatCurrency(
                voidModalState.quote.total_amount
              )})`
            : ''
        }
        mode={voidModalState.mode}
        onConfirm={(reason) => {
          if (voidModalState.bulkIds && voidModalState.bulkIds.length > 0) {
            if (voidModalState.mode === 'void') {
              bulkVoidDetailingQuotes(voidModalState.bulkIds, reason);
            } else {
              bulkDeleteDetailingQuotes(voidModalState.bulkIds);
            }
            setSelectedQuoteIds([]);
          } else if (voidModalState.quote) {
            if (voidModalState.mode === 'void') {
              voidDetailingQuote(voidModalState.quote.id, reason);
            } else {
              deleteDetailingQuotePermanent(voidModalState.quote.id);
            }
          }
        }}
      />

      {/* Modal de WhatsApp Rápido disparado desde Alertas */}
      <DetailingWhatsAppQuickModal
        isOpen={quickWhatsAppState.isOpen}
        onClose={() => setQuickWhatsAppState({ isOpen: false, quote: null, templateKey: 'confirm_appointment' })}
        config={detailingConfig}
        defaultTemplateKey={quickWhatsAppState.templateKey}
        quote={quickWhatsAppState.quote}
        onLoggedSend={(targetId, templateKey, phone) => {
          logDetailingWhatsAppSent(targetId, templateKey, phone);
        }}
      />
    </div>
  );
};
