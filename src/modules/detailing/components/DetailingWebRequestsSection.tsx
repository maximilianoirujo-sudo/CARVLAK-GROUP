import React, { useState, useMemo } from 'react';
import {
  Inbox,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MessageCircle,
  Phone,
  Car,
  User,
  Calendar,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Trash2,
  Eye,
  FileText,
  AlertCircle,
  Check,
  Megaphone,
  Globe,
  Share2,
  TrendingUp,
  BarChart3,
  Percent,
  History,
  StickyNote,
  MessageSquare,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Send,
  Plus
} from 'lucide-react';
import {
  DetailingWebRequest,
  DetailingWebRequestStatus,
  DetailingQuote
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { PublicBudgetPrintView } from './public/PublicBudgetPrintView';
import { formatCurrency, getLocalDateString } from '../../../lib/formatters';

export const DetailingWebRequestsSection: React.FC = () => {
  const {
    detailingWebRequests,
    updateDetailingWebRequestStatus,
    addDetailingWebRequestNote,
    deleteDetailingWebRequest,
    convertWebRequestToQuote,
    detailingConfig
  } = useData();
  const { availableProfiles, profile } = useAuth();
  const { showToast } = useToast();

  // Vista principal: Bandeja o Métricas
  const [activeMainView, setActiveMainView] = useState<'solicitudes' | 'metricas'>('solicitudes');

  // Filtros de la bandeja
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DetailingWebRequestStatus>('all');
  const [originFilter, setOriginFilter] = useState<'all' | 'ads' | 'direct'>('all');

  // Modal para pasar a trabajo
  const [convertingRequest, setConvertingRequest] = useState<DetailingWebRequest | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<string>(getLocalDateString());
  const [assignedTo, setAssignedTo] = useState<string>(profile?.id || 'user-maxi');
  const [workBayId, setWorkBayId] = useState<string>('box-1');

  // Modal para ver PDF
  const [previewPdfRequest, setPreviewPdfRequest] = useState<DetailingWebRequest | null>(null);

  // Modal de Plantillas WhatsApp
  const [templateModalRequest, setTemplateModalRequest] = useState<DetailingWebRequest | null>(null);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<'recupero' | 'presupuesto' | 'turno' | 'promo'>('presupuesto');

  // Desplegables de tarjeta: Historial y Notas
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState<Record<string, string>>({});

  // Filtrado de solicitudes
  const filteredRequests = useMemo(() => {
    return detailingWebRequests.filter((req) => {
      // 1. Texto de búsqueda
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        req.client_name.toLowerCase().includes(term) ||
        req.client_phone.includes(term) ||
        req.vehicle_brand.toLowerCase().includes(term) ||
        req.vehicle_model.toLowerCase().includes(term) ||
        (req.vehicle_plate && req.vehicle_plate.toLowerCase().includes(term)) ||
        req.code.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      // 2. Filtro de estado
      if (statusFilter !== 'all' && req.status !== statusFilter) return false;

      // 3. Filtro de origen
      if (originFilter === 'ads' && !req.is_paid_ad && req.origin !== 'Anuncios pagos') return false;
      if (originFilter === 'direct' && (req.is_paid_ad || req.origin === 'Anuncios pagos')) return false;

      return true;
    });
  }, [detailingWebRequests, searchTerm, statusFilter, originFilter]);

  // Contadores
  const totalCount = detailingWebRequests.length;
  const newCount = detailingWebRequests.filter((r) => r.status === 'nueva').length;
  const incompleteCount = detailingWebRequests.filter((r) => r.status === 'incompleta').length;
  const contactedCount = detailingWebRequests.filter((r) => r.status === 'contactado').length;
  const confirmedCount = detailingWebRequests.filter((r) => r.status === 'confirmado').length;
  const discardedCount = detailingWebRequests.filter((r) => r.status === 'descartado').length;
  const adsCount = detailingWebRequests.filter((r) => r.is_paid_ad || r.origin === 'Anuncios pagos').length;

  // Métricas avanzadas para la pestaña Métricas
  const metrics = useMemo(() => {
    const total = detailingWebRequests.length;
    if (total === 0) {
      return {
        total,
        completedCount: 0,
        incompleteCount: 0,
        completionRate: 0,
        convertedCount: 0,
        conversionRate: 0,
        averageTicket: 0,
        potentialTotal: 0,
        confirmedTotal: 0,
        adsMetrics: { count: 0, totalAmount: 0, commission12: 0 },
        directMetrics: { count: 0, totalAmount: 0, commission30: 0 },
        servicesRanking: [],
        sizesDistribution: []
      };
    }

    const completed = detailingWebRequests.filter((r) => r.status !== 'incompleta').length;
    const incomplete = detailingWebRequests.filter((r) => r.status === 'incompleta').length;
    const completionRate = Math.round((completed / total) * 100);

    const converted = detailingWebRequests.filter(
      (r) => r.status === 'confirmado' || Boolean(r.converted_to_quote_id)
    ).length;
    const conversionRate = Math.round((converted / total) * 100);

    const potentialTotal = detailingWebRequests.reduce((sum, r) => sum + (r.total_amount || 0), 0);
    const averageTicket = Math.round(potentialTotal / total);

    const confirmedTotal = detailingWebRequests
      .filter((r) => r.status === 'confirmado' || Boolean(r.converted_to_quote_id))
      .reduce((sum, r) => sum + (r.total_amount || 0), 0);

    // Origen: Anuncios vs Directo
    const adsList = detailingWebRequests.filter((r) => r.is_paid_ad || r.origin === 'Anuncios pagos');
    const adsTotal = adsList.reduce((sum, r) => sum + (r.total_amount || 0), 0);
    const adsCommission = Math.round(adsTotal * 0.125);

    const directList = detailingWebRequests.filter((r) => !r.is_paid_ad && r.origin !== 'Anuncios pagos');
    const directTotal = directList.reduce((sum, r) => sum + (r.total_amount || 0), 0);
    const directCommission = Math.round(directTotal * 0.30);

    // Ranking de tratamientos más solicitados
    const serviceCounts: Record<string, { name: string; count: number; totalRevenue: number }> = {};
    detailingWebRequests.forEach((req) => {
      req.selected_services.forEach((s) => {
        if (!serviceCounts[s.serviceId]) {
          serviceCounts[s.serviceId] = { name: s.serviceName, count: 0, totalRevenue: 0 };
        }
        serviceCounts[s.serviceId].count += 1;
        serviceCounts[s.serviceId].totalRevenue += s.price;
      });
    });

    const servicesRanking = Object.values(serviceCounts).sort((a, b) => b.count - a.count);

    // Distribución por tamaños de vehículos
    const sizeCounts: Record<string, number> = {};
    detailingWebRequests.forEach((req) => {
      const cat = req.vehicle_category || 'Mediano';
      sizeCounts[cat] = (sizeCounts[cat] || 0) + 1;
    });

    const sizesDistribution = Object.entries(sizeCounts)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    return {
      total,
      completedCount: completed,
      incompleteCount: incomplete,
      completionRate,
      convertedCount: converted,
      conversionRate,
      averageTicket,
      potentialTotal,
      confirmedTotal,
      adsMetrics: { count: adsList.length, totalAmount: adsTotal, commission12: adsCommission },
      directMetrics: { count: directList.length, totalAmount: directTotal, commission30: directCommission },
      servicesRanking,
      sizesDistribution
    };
  }, [detailingWebRequests]);

  // Cambiar estado con registro de autor
  const handleStatusChange = (id: string, newStatus: DetailingWebRequestStatus) => {
    updateDetailingWebRequestStatus(id, newStatus);
    showToast(`Solicitud actualizada a estado "${newStatus}"`, 'info');
  };

  // Agregar nota interna
  const handleAddNote = (requestId: string) => {
    const text = newNoteText[requestId] || '';
    if (!text.trim()) return;

    addDetailingWebRequestNote(requestId, text, profile?.full_name || 'Administración');
    setNewNoteText((prev) => ({ ...prev, [requestId]: '' }));
    showToast('Nota interna guardada', 'success');
  };

  // Abrir WhatsApp con cliente utilizando plantilla seleccionada
  const handleSendWhatsAppTemplate = (req: DetailingWebRequest, templateKey: 'recupero' | 'presupuesto' | 'turno' | 'promo') => {
    let cleanPhone = req.client_phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('09')) cleanPhone = '598' + cleanPhone.substring(1);
    else if (cleanPhone.startsWith('9') && cleanPhone.length === 8) cleanPhone = '598' + cleanPhone;

    let message = '';
    const carName = `${req.vehicle_brand} ${req.vehicle_model}`.trim();

    switch (templateKey) {
      case 'recupero':
        message = `¡Hola ${req.client_name}! 👋 Te escribo de DetailVlak. Vimos que estuviste armando un presupuesto para tu ${carName} en nuestra web. ¿Cómo estás? Te escribíamos por si te había quedado alguna duda o si te podemos ayudar a coordinar la fecha para recibir el auto en el taller.`;
        break;
      case 'presupuesto':
        message = `¡Hola ${req.client_name}! 👋 Te escribo de DetailVlak respecto a tu presupuesto #${req.code} para tu ${carName}. ¿Cómo estás? Quería consultarte si tenías alguna duda sobre los tratamientos incluidos o si te gustaría coordinar la fecha para recibir el vehículo en el taller.`;
        break;
      case 'turno':
        message = `¡Hola ${req.client_name}! 👋 Te escribo de DetailVlak. Vimos tu solicitud para tu ${carName} con fecha estimada ${req.preferred_date || 'esta semana'}. ¿Te quedaría bien ese día para ingresar el auto a las 08:30 hs?`;
        break;
      case 'promo':
        message = `¡Hola ${req.client_name}! 👋 Te escribo de DetailVlak. Respecto a tu cotización para tu ${carName}, queríamos avisarte que si confirmás esta semana tu tratamiento tenés un beneficio especial de regalo para el cuidado de tu auto. ¿Te gustaría coordinar el ingreso?`;
        break;
    }

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`, '_blank');

    // Registrar en el historial de la solicitud
    if (req.status === 'nueva' || req.status === 'incompleta') {
      updateDetailingWebRequestStatus(req.id, 'contactado', `Contactado por WhatsApp (${templateKey})`);
    }

    setTemplateModalRequest(null);
  };

  // Confirmar y Pasar a Trabajo
  const handleConfirmConvertToJob = () => {
    if (!convertingRequest) return;

    try {
      const createdQuote = convertWebRequestToQuote(convertingRequest.id, {
        date: appointmentDate,
        assigned_to: assignedTo,
        work_bay_id: workBayId
      });

      if (createdQuote) {
        showToast(
          `¡Solicitud #${convertingRequest.code} convertida a trabajo en calendario para el ${appointmentDate}!`,
          'success'
        );
      }
    } catch (e) {
      console.error(e);
      showToast('Ocurrió un error al convertir la solicitud a trabajo.', 'error');
    } finally {
      setConvertingRequest(null);
    }
  };

  // Eliminar
  const handleDelete = (req: DetailingWebRequest) => {
    if (window.confirm(`¿Estás seguro de eliminar la solicitud #${req.code} de ${req.client_name}?`)) {
      deleteDetailingWebRequest(req.id);
      showToast('Solicitud eliminada.', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header con Toggle de Vistas: Bandeja vs Métricas */}
      <div className="bg-white border border-[#E5E5E3] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#6B6B6B] font-medium block">
              DetailVlak • Solicitudes Online
            </span>
            <h2 className="text-lg sm:text-xl font-bold font-display text-[#161616] flex items-center gap-2">
              <Inbox className="w-5 h-5 text-[#D7141A]" />
              Bandeja de Solicitudes Web
              {newCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#D7141A] text-white">
                  {newCount} nueva{newCount > 1 ? 's' : ''}
                </span>
              )}
              {incompleteCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  {incompleteCount} para recuperar
                </span>
              )}
            </h2>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Gestión de presupuestos recibidos, seguimiento por WhatsApp y conversión a trabajos en taller.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Toggle de Vista */}
            <div className="bg-[#F5F5F4] p-1 rounded-xl border border-[#E5E5E3] flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveMainView('solicitudes')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeMainView === 'solicitudes'
                    ? 'bg-[#161616] text-white shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#161616]'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>Bandeja ({totalCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMainView('metricas')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeMainView === 'metricas'
                    ? 'bg-[#161616] text-white shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#161616]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Métricas & Conversión</span>
              </button>
            </div>

            <a
              href="/presupuesto"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer hidden sm:flex shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span>Ver Armador</span>
            </a>
          </div>
        </div>

        {/* Badges / Tarjetas de Resumen en el formato de Trabajos del mes */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 pt-3 border-t border-[#E5E5E3]">
          <div
            onClick={() => {
              setActiveMainView('solicitudes');
              setStatusFilter('all');
            }}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              statusFilter === 'all' && activeMainView === 'solicitudes'
                ? 'bg-[#161616] text-white border-[#161616]'
                : 'bg-white border-[#E5E5E3] text-[#161616] hover:bg-[#F5F5F4]'
            }`}
          >
            <span className={`text-[10px] uppercase font-bold block ${statusFilter === 'all' && activeMainView === 'solicitudes' ? 'text-neutral-400' : 'text-[#6B6B6B]'}`}>Total</span>
            <span className="text-lg font-bold font-mono">{totalCount}</span>
            <span className={`text-[10px] block ${statusFilter === 'all' && activeMainView === 'solicitudes' ? 'text-neutral-400' : 'text-[#6B6B6B]'}`}>solicitudes</span>
          </div>

          <div
            onClick={() => {
              setActiveMainView('solicitudes');
              setStatusFilter('nueva');
            }}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              statusFilter === 'nueva' && activeMainView === 'solicitudes'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white border-[#E5E5E3] text-[#161616] hover:bg-[#F5F5F4]'
            }`}
          >
            <span className={`text-[10px] uppercase font-bold block flex items-center gap-1 ${statusFilter === 'nueva' && activeMainView === 'solicitudes' ? 'text-blue-100' : 'text-blue-600'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Nuevas
            </span>
            <span className={`text-lg font-bold font-mono ${statusFilter === 'nueva' && activeMainView === 'solicitudes' ? 'text-white' : 'text-blue-600'}`}>{newCount}</span>
            <span className={`text-[10px] block ${statusFilter === 'nueva' && activeMainView === 'solicitudes' ? 'text-blue-100' : 'text-[#6B6B6B]'}`}>sin contactar</span>
          </div>

          <div
            onClick={() => {
              setActiveMainView('solicitudes');
              setStatusFilter('incompleta');
            }}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              statusFilter === 'incompleta' && activeMainView === 'solicitudes'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white border-[#E5E5E3] text-[#161616] hover:bg-[#F5F5F4]'
            }`}
          >
            <span className={`text-[10px] uppercase font-bold block flex items-center gap-1 ${statusFilter === 'incompleta' && activeMainView === 'solicitudes' ? 'text-amber-100' : 'text-amber-600'}`}>
              <AlertTriangle className="w-3 h-3" /> Incompletas
            </span>
            <span className={`text-lg font-bold font-mono ${statusFilter === 'incompleta' && activeMainView === 'solicitudes' ? 'text-white' : 'text-amber-600'}`}>{incompleteCount}</span>
            <span className={`text-[10px] block ${statusFilter === 'incompleta' && activeMainView === 'solicitudes' ? 'text-amber-100' : 'text-[#6B6B6B]'}`}>recuperables</span>
          </div>

          <div
            onClick={() => {
              setActiveMainView('solicitudes');
              setStatusFilter('contactado');
            }}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              statusFilter === 'contactado' && activeMainView === 'solicitudes'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white border-[#E5E5E3] text-[#161616] hover:bg-[#F5F5F4]'
            }`}
          >
            <span className={`text-[10px] uppercase font-bold block ${statusFilter === 'contactado' && activeMainView === 'solicitudes' ? 'text-indigo-100' : 'text-indigo-600'}`}>Contactadas</span>
            <span className={`text-lg font-bold font-mono ${statusFilter === 'contactado' && activeMainView === 'solicitudes' ? 'text-white' : 'text-indigo-600'}`}>{contactedCount}</span>
            <span className={`text-[10px] block ${statusFilter === 'contactado' && activeMainView === 'solicitudes' ? 'text-indigo-100' : 'text-[#6B6B6B]'}`}>en conversación</span>
          </div>

          <div
            onClick={() => {
              setActiveMainView('solicitudes');
              setStatusFilter('confirmado');
            }}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              statusFilter === 'confirmado' && activeMainView === 'solicitudes'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white border-[#E5E5E3] text-[#161616] hover:bg-[#F5F5F4]'
            }`}
          >
            <span className={`text-[10px] uppercase font-bold block ${statusFilter === 'confirmado' && activeMainView === 'solicitudes' ? 'text-emerald-100' : 'text-emerald-600'}`}>Confirmadas</span>
            <span className={`text-lg font-bold font-mono ${statusFilter === 'confirmado' && activeMainView === 'solicitudes' ? 'text-white' : 'text-emerald-600'}`}>{confirmedCount}</span>
            <span className={`text-[10px] block ${statusFilter === 'confirmado' && activeMainView === 'solicitudes' ? 'text-emerald-100' : 'text-[#6B6B6B]'}`}>pasadas a taller</span>
          </div>

          <div
            onClick={() => {
              setActiveMainView('solicitudes');
              setOriginFilter(originFilter === 'ads' ? 'all' : 'ads');
            }}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              originFilter === 'ads' && activeMainView === 'solicitudes'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white border-[#E5E5E3] text-[#161616] hover:bg-[#F5F5F4]'
            }`}
          >
            <span className={`text-[10px] uppercase font-bold block flex items-center gap-1 ${originFilter === 'ads' && activeMainView === 'solicitudes' ? 'text-purple-100' : 'text-purple-600'}`}>
              <Megaphone className="w-3 h-3" /> De Anuncios
            </span>
            <span className={`text-lg font-bold font-mono ${originFilter === 'ads' && activeMainView === 'solicitudes' ? 'text-white' : 'text-purple-600'}`}>{adsCount}</span>
            <span className={`text-[10px] block ${originFilter === 'ads' && activeMainView === 'solicitudes' ? 'text-purple-100' : 'text-[#6B6B6B]'}`}>comisión 12,5%</span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* VISTA 1: BANDEJA DE SOLICITUDES                                       */}
      {/* ===================================================================== */}
      {activeMainView === 'solicitudes' && (
        <div className="space-y-4">
          {/* Filtros y Búsqueda */}
          <div className="bg-white border border-[#E5E5E3] p-3 rounded-2xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
              <input
                type="text"
                placeholder="Buscar por cliente, teléfono, auto, matrícula o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl text-xs text-[#161616] placeholder-[#9A9A9A] focus:outline-none focus:border-[#D7141A]"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs flex-wrap">
              <span className="text-[11px] text-[#6B6B6B] font-medium hidden sm:inline">Origen:</span>
              <button
                type="button"
                onClick={() => setOriginFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer text-xs ${
                  originFilter === 'all'
                    ? 'bg-[#161616] text-white font-bold'
                    : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616]'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setOriginFilter('ads')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer text-xs flex items-center gap-1 ${
                  originFilter === 'ads'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'bg-[#F5F5F4] text-purple-700 hover:bg-purple-50'
                }`}
              >
                <Megaphone className="w-3 h-3" />
                <span>Anuncios (12.5%)</span>
              </button>
              <button
                type="button"
                onClick={() => setOriginFilter('direct')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer text-xs flex items-center gap-1 ${
                  originFilter === 'direct'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-[#F5F5F4] text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>Directo (30%)</span>
              </button>
            </div>
          </div>

          {/* Lista de Solicitudes */}
          {filteredRequests.length === 0 ? (
            <div className="bg-white border border-[#E5E5E3] rounded-2xl p-12 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#F5F5F4] text-[#6B6B6B] flex items-center justify-center mx-auto">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-[#161616] text-base font-display">
                No hay solicitudes que coincidan
              </h3>
              <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
                {searchTerm || statusFilter !== 'all' || originFilter !== 'all'
                  ? 'Probá modificando los filtros para ver otras solicitudes.'
                  : 'Cuando los clientes armen su presupuesto en /presupuesto aparecerán automáticamente acá.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredRequests.map((req) => {
                const isAds = req.is_paid_ad || req.origin === 'Anuncios pagos';
                const isConverted = Boolean(req.converted_to_quote_id);
                const isIncomplete = req.status === 'incompleta';
                const isHistoryOpen = expandedHistoryId === req.id;
                const isNotesOpen = expandedNotesId === req.id;

                return (
                  <div
                    key={req.id}
                    className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all shadow-xs space-y-4 ${
                      isIncomplete
                        ? 'border-l-4 border-l-amber-500 border-[#E5E5E3]'
                        : req.status === 'nueva'
                        ? 'border-l-4 border-l-[#D7141A] border-[#E5E5E3]'
                        : req.status === 'confirmado'
                        ? 'border-l-4 border-l-emerald-600 border-[#E5E5E3]'
                        : req.status === 'descartado'
                        ? 'border-[#E5E5E3] opacity-60'
                        : 'border-[#E5E5E3]'
                    }`}
                  >
                    {/* Alerta si es incompleta (Recupero) */}
                    {isIncomplete && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-900">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="font-bold">
                            Lead Incompleto: El cliente cargó sus datos pero no tocó "Confirmar por WhatsApp".
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setTemplateModalRequest(req);
                            setSelectedTemplateKey('recupero');
                          }}
                          className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow-xs"
                        >
                          Recuperar Lead
                        </button>
                      </div>
                    )}

                    {/* Fila Superior: Código, Fecha, Origen y Estado */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#E5E5E3] pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs bg-[#F5F5F4] text-[#161616] px-2.5 py-1 rounded-lg border border-[#E5E5E3]">
                          #{req.code}
                        </span>

                        <span className="text-[11px] text-[#6B6B6B] flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {new Date(req.created_at).toLocaleDateString('es-UY', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>

                        {/* Origen Pill para Comisiones */}
                        {isAds ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <Megaphone className="w-3 h-3" /> Anuncio Pago • Comisión 12,5%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Globe className="w-3 h-3" /> Directo / Web • Comisión 30%
                          </span>
                        )}

                        {isConverted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Check className="w-3 h-3" /> Trabajo Agendado
                          </span>
                        )}
                      </div>

                      {/* Selector de Estado */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-[11px] text-[#6B6B6B]">Estado:</span>
                        <select
                          value={req.status}
                          onChange={(e) =>
                            handleStatusChange(req.id, e.target.value as DetailingWebRequestStatus)
                          }
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                            req.status === 'incompleta'
                              ? 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold'
                              : req.status === 'nueva'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : req.status === 'contactado'
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                              : req.status === 'confirmado'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-[#F5F5F4] text-[#6B6B6B] border-[#E5E5E3]'
                          }`}
                        >
                          <option value="incompleta">Incompleta (Recupero)</option>
                          <option value="nueva">Nueva</option>
                          <option value="contactado">Contactado</option>
                          <option value="confirmado">Confirmado</option>
                          <option value="descartado">Descartado</option>
                        </select>
                      </div>
                    </div>

                    {/* Cuerpo: Datos Cliente + Auto + Tratamientos */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {/* Columna 1: Cliente & Contacto */}
                      <div className="space-y-1.5 bg-[#F5F5F4] p-3.5 rounded-xl border border-[#E5E5E3]">
                        <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block tracking-wider">
                          Cliente
                        </span>
                        <div className="font-bold text-sm text-[#161616] flex items-center gap-1.5 font-display">
                          <User className="w-3.5 h-3.5 text-[#D7141A]" />
                          <span>{req.client_name}</span>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setTemplateModalRequest(req);
                              setSelectedTemplateKey(isIncomplete ? 'recupero' : 'presupuesto');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>{req.client_phone}</span>
                          </button>
                        </div>

                        {req.client_email && (
                          <div className="text-[11px] text-[#6B6B6B] truncate pt-0.5">
                            Email: {req.client_email}
                          </div>
                        )}

                        {req.preferred_date && (
                          <div className="text-[11px] text-[#161616] pt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#D7141A]" />
                            <span>
                              Fecha deseada: <strong>{req.preferred_date}</strong>{' '}
                              {req.preferred_time_slot ? `(${req.preferred_time_slot})` : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Columna 2: Vehículo */}
                      <div className="space-y-1.5 bg-[#F5F5F4] p-3.5 rounded-xl border border-[#E5E5E3]">
                        <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block tracking-wider">
                          Vehículo
                        </span>
                        <div className="font-bold text-sm text-[#161616] flex items-center gap-1.5 font-display">
                          <Car className="w-3.5 h-3.5 text-[#D7141A]" />
                          <span>
                            {req.vehicle_brand} {req.vehicle_model}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-[#6B6B6B] pt-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E5E3] text-[#161616] font-bold">
                            {req.vehicle_category}
                          </span>
                          {req.vehicle_year && <span>Año {req.vehicle_year}</span>}
                        </div>

                        {req.vehicle_plate && (
                          <div className="font-mono uppercase font-bold text-xs text-[#161616] pt-1">
                            Matrícula: {req.vehicle_plate}
                          </div>
                        )}

                        {req.comments && (
                          <div className="text-[11px] text-[#6B6B6B] italic pt-1 line-clamp-2">
                            "{req.comments}"
                          </div>
                        )}
                      </div>

                      {/* Columna 3: Tratamientos & Total */}
                      <div className="space-y-2 bg-[#F5F5F4] p-3.5 rounded-xl border border-[#E5E5E3] flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block tracking-wider mb-1">
                            Tratamientos ({req.selected_services.length})
                          </span>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {req.selected_services.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-[11px] text-[#161616]"
                              >
                                <span className="truncate pr-2">• {item.serviceName}</span>
                                <span className="font-mono font-bold shrink-0">
                                  ${item.price.toLocaleString('es-UY')}
                                </span>
                              </div>
                            ))}

                            {req.selected_products &&
                              req.selected_products.map((p, idx) => (
                                <div
                                  key={`prod-${idx}`}
                                  className="flex items-center justify-between text-[11px] text-[#6B6B6B] italic"
                                >
                                  <span className="truncate pr-2">+ {p.productName}</span>
                                  <span className="font-mono font-bold shrink-0">
                                    ${p.price.toLocaleString('es-UY')}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#E5E5E3] flex items-center justify-between">
                          <span className="font-bold text-xs text-[#6B6B6B]">
                            TOTAL ESTIMADO:
                          </span>
                          <span className="font-mono font-bold text-base text-[#161616]">
                            ${req.total_amount.toLocaleString('es-UY')}{' '}
                            <span className="text-[10px] text-[#6B6B6B] font-normal">UYU</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Barra Inferior: Botonera de Acción */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-[#E5E5E3]">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Botón WhatsApp con Plantillas */}
                        <button
                          type="button"
                          onClick={() => {
                            setTemplateModalRequest(req);
                            setSelectedTemplateKey(isIncomplete ? 'recupero' : 'presupuesto');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-[#E5E5E3] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Chat WhatsApp</span>
                        </button>

                        {/* Botón Ver PDF */}
                        <button
                          type="button"
                          onClick={() => setPreviewPdfRequest(req)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#6B6B6B]" />
                          <span>Ver PDF</span>
                        </button>

                        {/* Toggle Historial de Estados */}
                        <button
                          type="button"
                          onClick={() => setExpandedHistoryId(isHistoryOpen ? null : req.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] border border-[#E5E5E3] text-xs font-medium flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <History className="w-3 h-3" />
                          <span>Historial ({req.status_history?.length || 1})</span>
                          {isHistoryOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {/* Toggle Notas Internas */}
                        <button
                          type="button"
                          onClick={() => setExpandedNotesId(isNotesOpen ? null : req.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] border border-[#E5E5E3] text-xs font-medium flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <StickyNote className="w-3 h-3" />
                          <span>Notas ({req.internal_notes?.length || 0})</span>
                          {isNotesOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {/* Botón PASAR A TRABAJO */}
                        {!isConverted ? (
                          <button
                            type="button"
                            onClick={() => {
                              setConvertingRequest(req);
                              setAppointmentDate(req.preferred_date || getLocalDateString());
                              setAssignedTo(profile?.id || 'user-maxi');
                              setWorkBayId('box-1');
                            }}
                            className="px-4 py-2 rounded-xl bg-[#D7141A] hover:bg-[#b01015] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Pasar a trabajo</span>
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
                            <Check className="w-4 h-4" />
                            <span>Convertido a Trabajo</span>
                          </span>
                        )}

                        {/* Botón Eliminar */}
                        <button
                          type="button"
                          onClick={() => handleDelete(req)}
                          title="Eliminar solicitud"
                          className="p-2 rounded-xl bg-white hover:bg-rose-50 text-[#6B6B6B] hover:text-[#D7141A] border border-[#E5E5E3] transition-colors cursor-pointer shadow-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Historial Desplegable */}
                    {isHistoryOpen && (
                      <div className="p-3 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] space-y-2 text-xs">
                        <span className="font-bold text-[11px] text-[#6B6B6B] uppercase tracking-wider block">
                          Línea de tiempo de estados:
                        </span>
                        <div className="space-y-1.5">
                          {(
                            req.status_history || [
                              {
                                status: req.status,
                                changed_at: req.created_at,
                                changed_by: 'Cliente (Web)',
                                note: 'Solicitud creada'
                              }
                            ]
                          ).map((h, i) => (
                            <div key={i} className="flex items-center justify-between text-[#161616]">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#D7141A]" />
                                <span className="font-bold uppercase text-[10px] bg-white border border-[#E5E5E3] px-1.5 py-0.5 rounded">
                                  {h.status}
                                </span>
                                {h.note && <span>• {h.note}</span>}
                              </div>
                              <span className="text-[10px] text-[#6B6B6B] font-mono">
                                {new Date(h.changed_at).toLocaleString('es-UY')} ({h.changed_by || 'Sistema'})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notas Internas Desplegables */}
                    {isNotesOpen && (
                      <div className="p-3 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] space-y-3 text-xs">
                        <span className="font-bold text-[11px] text-[#6B6B6B] uppercase tracking-wider block">
                          Notas del equipo sobre este cliente:
                        </span>

                        {req.internal_notes && req.internal_notes.length > 0 ? (
                          <div className="space-y-1.5">
                            {req.internal_notes.map((note) => (
                              <div
                                key={note.id}
                                className="p-2.5 rounded-lg bg-white border border-[#E5E5E3] space-y-1 shadow-2xs"
                              >
                                <p className="text-[#161616]">{note.text}</p>
                                <span className="text-[10px] text-[#6B6B6B] block font-mono">
                                  {new Date(note.created_at).toLocaleString('es-UY')} • Por {note.author}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[#6B6B6B] text-xs italic">No hay notas internas todavía.</p>
                        )}

                        {/* Input para agregar nota */}
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Escribí una nota interna (ej: Llamar después de las 18hs)..."
                            value={newNoteText[req.id] || ''}
                            onChange={(e) =>
                              setNewNoteText((prev) => ({ ...prev, [req.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddNote(req.id);
                            }}
                            className="flex-1 bg-white border border-[#E5E5E3] rounded-xl px-3 py-1.5 text-xs text-[#161616] placeholder-[#9A9A9A] focus:outline-none focus:border-[#D7141A]"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddNote(req.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#161616] hover:bg-black text-white font-bold text-xs cursor-pointer flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Guardar</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* VISTA 2: MÉTRICAS & CONVERSIÓN COMERCIAL                              */}
      {/* ===================================================================== */}
      {activeMainView === 'metricas' && (
        <div className="space-y-4 animate-fade-in">
          {/* 1. KPIs Principales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-3 sm:p-4 rounded-2xl bg-white border border-[#E5E5E3] space-y-1 shadow-xs">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#6B6B6B] block">
                Presupuestos Armados
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#161616]">
                {metrics.total}
              </div>
              <span className="text-[10px] text-[#6B6B6B] block">
                Total cotizaciones registradas
              </span>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-white border border-[#E5E5E3] space-y-1 shadow-xs">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 block">
                Completadas vs Incompletas
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600">
                {metrics.completionRate}%
              </div>
              <span className="text-[10px] text-[#6B6B6B] block">
                {metrics.completedCount} completadas • {metrics.incompleteCount} abandonadas
              </span>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-white border border-[#E5E5E3] space-y-1 shadow-xs">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#D7141A] block">
                Tasa de Conversión a Trabajos
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#D7141A]">
                {metrics.conversionRate}%
              </div>
              <span className="text-[10px] text-[#6B6B6B] block">
                {metrics.convertedCount} pasadas a trabajo real
              </span>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-white border border-[#E5E5E3] space-y-1 shadow-xs">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-700 block">
                Ticket Promedio
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#161616]">
                ${metrics.averageTicket.toLocaleString('es-UY')}
              </div>
              <span className="text-[10px] text-[#6B6B6B] block">
                Monto promedio por presupuesto
              </span>
            </div>
          </div>

          {/* 2. Comparativa de Canales de Origen (Anuncios vs Directo) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="font-bold text-sm text-[#161616] font-display flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-[#D7141A]" />
                  <span>Rendimiento por Canal de Adquisición (Comisiones)</span>
                </h3>
                <p className="text-xs text-[#6B6B6B]">
                  Comisión diferenciada: 12,5% si proviene de publicidad paga y 30% si es orgánico/directo.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Canal Anuncios Pagos */}
              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-purple-900 flex items-center gap-1.5 font-display">
                    <Megaphone className="w-3.5 h-3.5 text-purple-600" /> Anuncios Pagos (Meta / Google)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-200 text-purple-900">
                    Comisión: 12,5%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div>
                    <span className="text-[10px] text-[#6B6B6B] block">Solicitudes</span>
                    <span className="font-bold font-mono text-base text-[#161616]">
                      {metrics.adsMetrics.count}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B6B6B] block">Facturación Total</span>
                    <span className="font-mono font-bold text-xs text-[#161616]">
                      ${metrics.adsMetrics.totalAmount.toLocaleString('es-UY')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B6B6B] block">Comisión Est.</span>
                    <span className="font-mono font-bold text-xs text-purple-700">
                      ${metrics.adsMetrics.commission12.toLocaleString('es-UY')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Canal Directo / Web */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-900 flex items-center gap-1.5 font-display">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" /> Directo / Web / Referidos
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                    Comisión: 30%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div>
                    <span className="text-[10px] text-[#6B6B6B] block">Solicitudes</span>
                    <span className="font-bold font-mono text-base text-[#161616]">
                      {metrics.directMetrics.count}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B6B6B] block">Facturación Total</span>
                    <span className="font-mono font-bold text-xs text-[#161616]">
                      ${metrics.directMetrics.totalAmount.toLocaleString('es-UY')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B6B6B] block">Comisión Est.</span>
                    <span className="font-mono font-bold text-xs text-emerald-700">
                      ${metrics.directMetrics.commission30.toLocaleString('es-UY')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Ranking de Servicios y Distribución de Tamaños */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tratamientos más pedidos */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-3 shadow-xs">
              <h3 className="font-bold text-sm text-[#161616] font-display flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#D7141A]" />
                <span>Tratamientos Más Solicitados</span>
              </h3>

              {metrics.servicesRanking.length === 0 ? (
                <p className="text-xs text-[#6B6B6B] italic">Aún no hay servicios registrados.</p>
              ) : (
                <div className="space-y-2.5">
                  {metrics.servicesRanking.slice(0, 5).map((srv, idx) => (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[#161616]">
                        <span className="font-semibold truncate">
                          {idx + 1}. {srv.name}
                        </span>
                        <span className="font-mono font-bold">{srv.count} veces</span>
                      </div>
                      <div className="w-full bg-[#F5F5F4] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#D7141A] h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.round((srv.count / (metrics.total || 1)) * 100))}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Distribución por Tamaños */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-3 shadow-xs">
              <h3 className="font-bold text-sm text-[#161616] font-display flex items-center gap-2">
                <Car className="w-4 h-4 text-[#D7141A]" />
                <span>Tamaños de Vehículos Cotizados</span>
              </h3>

              {metrics.sizesDistribution.length === 0 ? (
                <p className="text-xs text-[#6B6B6B] italic">Aún no hay categorías registradas.</p>
              ) : (
                <div className="space-y-2.5">
                  {metrics.sizesDistribution.map((sz, idx) => (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[#161616]">
                        <span className="font-semibold">{sz.name}</span>
                        <span className="font-mono">
                          {sz.count} ({sz.percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#F5F5F4] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#161616] h-full rounded-full"
                          style={{ width: `${sz.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CHAT DE WHATSAPP CON PLANTILLAS                                */}
      {/* ===================================================================== */}
      {templateModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E5E5E3] rounded-2xl w-full max-w-lg p-5 sm:p-6 text-[#161616] shadow-xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base font-display text-[#161616]">
                    Enviar WhatsApp a {templateModalRequest.client_name}
                  </h3>
                  <span className="text-xs text-[#6B6B6B]">
                    Celular: {templateModalRequest.client_phone} • Presupuesto #{templateModalRequest.code}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <span className="font-bold text-[#161616] block">Elegí la plantilla de mensaje:</span>

              <div className="space-y-2">
                {[
                  {
                    key: 'recupero' as const,
                    title: '1. Recupero de Lead Incompleto',
                    preview:
                      'Vimos que estuviste armando un presupuesto para tu auto y queríamos ver si te quedó alguna duda...'
                  },
                  {
                    key: 'presupuesto' as const,
                    title: '2. Presupuesto Formal Listo',
                    preview:
                      'Te escribo respecto a tu presupuesto para coordinar la inspección en el taller...'
                  },
                  {
                    key: 'turno' as const,
                    title: '3. Turno en Agenda Disponible',
                    preview:
                      'Tenemos disponible el turno para recibir tu vehículo a las 08:30 hs...'
                  },
                  {
                    key: 'promo' as const,
                    title: '4. Promoción Especial de Cierre',
                    preview:
                      'Bonificación especial si confirmás tu servicio durante esta semana...'
                  }
                ].map((tpl) => (
                  <div
                    key={tpl.key}
                    onClick={() => setSelectedTemplateKey(tpl.key)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedTemplateKey === tpl.key
                        ? 'bg-emerald-50 border-emerald-500 text-[#161616]'
                        : 'bg-[#F5F5F4] border-[#E5E5E3] text-[#161616] hover:bg-gray-200'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>{tpl.title}</span>
                      {selectedTemplateKey === tpl.key && (
                        <Check className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#6B6B6B] mt-1 line-clamp-2">
                      {tpl.preview}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E5E3]">
              <button
                type="button"
                onClick={() => setTemplateModalRequest(null)}
                className="px-4 py-2 rounded-xl bg-[#F5F5F4] hover:bg-[#E5E5E3] text-[#161616] text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSendWhatsAppTemplate(templateModalRequest, selectedTemplateKey)}
                className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Abrir WhatsApp con esta plantilla</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: PASAR A TRABAJO EN CALENDARIO                                  */}
      {/* ===================================================================== */}
      {convertingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E5E5E3] rounded-2xl w-full max-w-lg p-5 sm:p-6 text-[#161616] shadow-xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-[#D7141A] flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base font-display text-[#161616]">Pasar Solicitud a Trabajo Real</h3>
                  <span className="text-xs text-[#6B6B6B]">
                    Solicitud #{convertingRequest.code} de {convertingRequest.client_name}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Resumen */}
              <div className="p-3.5 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] space-y-1.5">
                <div className="flex items-center justify-between font-bold text-[#161616]">
                  <span>{convertingRequest.vehicle_brand} {convertingRequest.vehicle_model}</span>
                  <span className="text-[#D7141A] font-mono">${convertingRequest.total_amount.toLocaleString('es-UY')} UYU</span>
                </div>
                <div className="text-[#6B6B6B] text-[11px]">
                  Origen:{' '}
                  <strong className={convertingRequest.is_paid_ad ? 'text-purple-700' : 'text-emerald-700'}>
                    {convertingRequest.is_paid_ad ? 'Anuncios pagos (12,5% comisión)' : 'Directo / Web (30% comisión)'}
                  </strong>
                </div>
              </div>

              {/* Fecha de Trabajo */}
              <div className="space-y-1.5">
                <label className="font-semibold text-[#161616] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#D7141A]" />
                  <span>Fecha de inicio en el taller</span>
                </label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3.5 py-2.5 text-[#161616] text-xs focus:outline-none focus:border-[#D7141A]"
                />
              </div>

              {/* Asignado a */}
              <div className="space-y-1.5">
                <label className="font-semibold text-[#161616] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#D7141A]" />
                  <span>Responsable / Detailer asignado</span>
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3.5 py-2.5 text-[#161616] text-xs focus:outline-none focus:border-[#D7141A]"
                >
                  {availableProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.roles.join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Box de trabajo */}
              <div className="space-y-1.5">
                <label className="font-semibold text-[#161616]">Box de trabajo</label>
                <select
                  value={workBayId}
                  onChange={(e) => setWorkBayId(e.target.value)}
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3.5 py-2.5 text-[#161616] text-xs focus:outline-none focus:border-[#D7141A]"
                >
                  {(detailingConfig?.work_bays || [
                    { id: 'box-1', name: 'Box 1 (Lavado & Prep)' },
                    { id: 'box-2', name: 'Box 2 (Pulido & Cerámico)' },
                    { id: 'box-3', name: 'Box 3 (Interiores & Detalle)' }
                  ]).map((box) => (
                    <option key={box.id} value={box.id}>
                      {box.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E5E3]">
              <button
                type="button"
                onClick={() => setConvertingRequest(null)}
                className="px-4 py-2 rounded-xl bg-[#F5F5F4] hover:bg-[#E5E5E3] text-[#161616] text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmConvertToJob}
                className="px-5 py-2.5 rounded-xl bg-[#D7141A] hover:bg-[#b01015] text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar y agendar en calendario</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: VISTA PREVIA E IMPRESIÓN DE PDF                                */}
      {/* ===================================================================== */}
      {previewPdfRequest && (
        <PublicBudgetPrintView
          request={previewPdfRequest}
          onClose={() => setPreviewPdfRequest(null)}
        />
      )}
    </div>
  );
};
