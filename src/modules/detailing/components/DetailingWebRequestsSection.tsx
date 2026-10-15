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
  Share2
} from 'lucide-react';
import { DetailingWebRequest, DetailingWebRequestStatus, DetailingQuote } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { PublicBudgetPrintView } from './public/PublicBudgetPrintView';
import { formatCurrency, getLocalDateString } from '../../../lib/formatters';

export const DetailingWebRequestsSection: React.FC = () => {
  const {
    detailingWebRequests,
    updateDetailingWebRequestStatus,
    deleteDetailingWebRequest,
    convertWebRequestToQuote,
    detailingConfig
  } = useData();
  const { availableProfiles, profile } = useAuth();
  const { showToast } = useToast();

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

  // Filtrado
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
  const contactedCount = detailingWebRequests.filter((r) => r.status === 'contactado').length;
  const confirmedCount = detailingWebRequests.filter((r) => r.status === 'confirmado').length;
  const discardedCount = detailingWebRequests.filter((r) => r.status === 'descartado').length;
  const adsCount = detailingWebRequests.filter((r) => r.is_paid_ad || r.origin === 'Anuncios pagos').length;

  // Cambiar estado
  const handleStatusChange = (id: string, newStatus: DetailingWebRequestStatus) => {
    updateDetailingWebRequestStatus(id, newStatus);
    showToast(`Solicitud actualizada a estado "${newStatus}"`, 'info');
  };

  // Abrir WhatsApp con cliente
  const handleOpenWhatsApp = (req: DetailingWebRequest) => {
    let cleanPhone = req.client_phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('09')) cleanPhone = '598' + cleanPhone.substring(1);
    else if (cleanPhone.startsWith('9') && cleanPhone.length === 8) cleanPhone = '598' + cleanPhone;

    const message = `¡Hola ${req.client_name}! 👋 Te escribo de DetailVlak respecto a tu presupuesto #${req.code} para tu ${req.vehicle_brand} ${req.vehicle_model}. ¿Cómo estás? Quería consultarte si tenías alguna duda o si te gustaría coordinar la fecha para recibir el auto en el taller.`;

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`, '_blank');

    // Si estaba nueva, sugerir pasar a contactado
    if (req.status === 'nueva') {
      updateDetailingWebRequestStatus(req.id, 'contactado');
    }
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
      {/* 1. Header & Métricas de la Bandeja */}
      <div className="bg-[#161616] border border-[#262626] rounded-2xl p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0066FF]/20 border border-[#0066FF]/30 flex items-center justify-center text-[#3B82F6]">
                <Inbox className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">Bandeja de Solicitudes Web</h2>
              {newCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0066FF] text-white animate-pulse">
                  {newCount} nueva{newCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400">
              Presupuestos armados por clientes desde la web pública y campañas publicitarias. Al confirmarlas podés convertirlas a trabajos del calendario.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/presupuesto"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-[#222] hover:bg-[#2A2A2A] text-neutral-300 hover:text-white border border-[#333] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Armador Web</span>
            </a>
          </div>
        </div>

        {/* Badges de Resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 mt-5 pt-4 border-t border-[#262626]">
          <div
            onClick={() => setStatusFilter('all')}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              statusFilter === 'all'
                ? 'bg-[#222] border-[#444] text-white'
                : 'bg-[#1A1A1A] border-[#262626] text-neutral-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Total</span>
            <span className="text-lg font-bold text-white">{totalCount}</span>
          </div>

          <div
            onClick={() => setStatusFilter('nueva')}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              statusFilter === 'nueva'
                ? 'bg-[#0066FF]/20 border-[#0066FF] text-white'
                : 'bg-[#1A1A1A] border-[#262626] text-neutral-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-[#3B82F6] block flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF]" /> Nuevas
            </span>
            <span className="text-lg font-bold text-[#3B82F6]">{newCount}</span>
          </div>

          <div
            onClick={() => setStatusFilter('contactado')}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              statusFilter === 'contactado'
                ? 'bg-amber-950/40 border-amber-600/50 text-white'
                : 'bg-[#1A1A1A] border-[#262626] text-neutral-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Contactadas</span>
            <span className="text-lg font-bold text-amber-300">{contactedCount}</span>
          </div>

          <div
            onClick={() => setStatusFilter('confirmado')}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              statusFilter === 'confirmado'
                ? 'bg-emerald-950/40 border-emerald-600/50 text-white'
                : 'bg-[#1A1A1A] border-[#262626] text-neutral-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Confirmadas</span>
            <span className="text-lg font-bold text-emerald-300">{confirmedCount}</span>
          </div>

          <div
            onClick={() => setStatusFilter('descartado')}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              statusFilter === 'descartado'
                ? 'bg-neutral-800 border-neutral-600 text-white'
                : 'bg-[#1A1A1A] border-[#262626] text-neutral-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Descartadas</span>
            <span className="text-lg font-bold text-neutral-400">{discardedCount}</span>
          </div>

          <div
            onClick={() => setOriginFilter(originFilter === 'ads' ? 'all' : 'ads')}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              originFilter === 'ads'
                ? 'bg-purple-950/40 border-purple-500 text-white'
                : 'bg-[#1A1A1A] border-[#262626] text-neutral-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-purple-400 block flex items-center gap-1">
              <Megaphone className="w-3 h-3" /> De Anuncios
            </span>
            <span className="text-lg font-bold text-purple-300">{adsCount}</span>
          </div>
        </div>
      </div>

      {/* 2. Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, teléfono, auto, matrícula o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#161616] border border-neutral-300 dark:border-[#2D2D2D] rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:border-[#0066FF]"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          <span className="text-[11px] text-neutral-500 font-medium hidden sm:inline">Origen:</span>
          <button
            type="button"
            onClick={() => setOriginFilter('all')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer text-xs ${
              originFilter === 'all'
                ? 'bg-[#161616] text-white dark:bg-white dark:text-black font-bold'
                : 'bg-neutral-200 dark:bg-[#202020] text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setOriginFilter('ads')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer text-xs flex items-center gap-1 ${
              originFilter === 'ads'
                ? 'bg-purple-600 text-white font-bold'
                : 'bg-neutral-200 dark:bg-[#202020] text-neutral-600 dark:text-neutral-400'
            }`}
          >
            <Megaphone className="w-3 h-3" />
            <span>Anuncios (12.5%)</span>
          </button>
          <button
            type="button"
            onClick={() => setOriginFilter('direct')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer text-xs flex items-center gap-1 ${
              originFilter === 'direct'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-neutral-200 dark:bg-[#202020] text-neutral-600 dark:text-neutral-400'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>Directo (30%)</span>
          </button>
        </div>
      </div>

      {/* 3. Lista de Solicitudes */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white dark:bg-[#161616] border border-neutral-200 dark:border-[#2D2D2D] rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-[#222] text-neutral-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-neutral-900 dark:text-white text-base">
            No hay solicitudes que coincidan
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
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

            return (
              <div
                key={req.id}
                className={`bg-white dark:bg-[#161616] border rounded-2xl p-4 sm:p-5 transition-all shadow-xs space-y-4 ${
                  req.status === 'nueva'
                    ? 'border-[#0066FF]/60 dark:border-[#0066FF]/40 shadow-[#0066FF]/5 ring-1 ring-[#0066FF]/30'
                    : req.status === 'confirmado'
                    ? 'border-emerald-500/40 dark:border-emerald-600/30'
                    : req.status === 'descartado'
                    ? 'border-neutral-300 dark:border-[#242424] opacity-70'
                    : 'border-neutral-200 dark:border-[#262626]'
                }`}
              >
                {/* Fila Superior: Código, Fecha, Origen y Estado */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-neutral-100 dark:border-[#262626] pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs bg-neutral-100 dark:bg-[#222] text-neutral-800 dark:text-white px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-[#333]">
                      #{req.code}
                    </span>

                    <span className="text-[11px] text-neutral-500 flex items-center gap-1 font-mono">
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
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                        <Megaphone className="w-3 h-3" /> Anuncio Pago • Comisión 12,5%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <Globe className="w-3 h-3" /> Directo / Web • Comisión 30%
                      </span>
                    )}

                    {isConverted && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-[#3B82F6] border border-blue-500/30">
                        <Check className="w-3 h-3" /> Trabajo Agendado
                      </span>
                    )}
                  </div>

                  {/* Selector de Estado */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-[11px] text-neutral-400">Estado:</span>
                    <select
                      value={req.status}
                      onChange={(e) =>
                        handleStatusChange(req.id, e.target.value as DetailingWebRequestStatus)
                      }
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-hidden cursor-pointer ${
                        req.status === 'nueva'
                          ? 'bg-[#0066FF] text-white border-[#0066FF]'
                          : req.status === 'contactado'
                          ? 'bg-amber-500/20 text-amber-500 border-amber-500/40'
                          : req.status === 'confirmado'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700'
                      }`}
                    >
                      <option value="nueva" className="bg-[#161616] text-white">Nueva</option>
                      <option value="contactado" className="bg-[#161616] text-white">Contactado</option>
                      <option value="confirmado" className="bg-[#161616] text-white">Confirmado</option>
                      <option value="descartado" className="bg-[#161616] text-white">Descartado</option>
                    </select>
                  </div>
                </div>

                {/* Cuerpo: Datos Cliente + Auto + Tratamientos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Columna 1: Cliente & Contacto */}
                  <div className="space-y-1.5 bg-neutral-50 dark:bg-[#1A1A1A] p-3.5 rounded-xl border border-neutral-200 dark:border-[#282828]">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                      Cliente
                    </span>
                    <div className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0066FF]" />
                      <span>{req.client_name}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsApp(req)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>{req.client_phone}</span>
                      </button>
                    </div>

                    {req.client_email && (
                      <div className="text-[11px] text-neutral-500 truncate pt-0.5">
                        Email: {req.client_email}
                      </div>
                    )}

                    {req.preferred_date && (
                      <div className="text-[11px] text-neutral-600 dark:text-neutral-300 pt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#3B82F6]" />
                        <span>Fecha deseada: <strong>{req.preferred_date}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Columna 2: Vehículo */}
                  <div className="space-y-1.5 bg-neutral-50 dark:bg-[#1A1A1A] p-3.5 rounded-xl border border-neutral-200 dark:border-[#282828]">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                      Vehículo
                    </span>
                    <div className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-[#0066FF]" />
                      <span>
                        {req.vehicle_brand} {req.vehicle_model}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 pt-0.5">
                      <span className="px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-[#252525] text-neutral-700 dark:text-neutral-300 font-bold">
                        {req.vehicle_category}
                      </span>
                      {req.vehicle_year && <span>Año {req.vehicle_year}</span>}
                    </div>

                    {req.vehicle_plate && (
                      <div className="font-mono uppercase font-bold text-xs text-neutral-800 dark:text-neutral-200 pt-1">
                        Matrícula: {req.vehicle_plate}
                      </div>
                    )}

                    {req.comments && (
                      <div className="text-[11px] text-neutral-500 italic pt-1 line-clamp-2">
                        "{req.comments}"
                      </div>
                    )}
                  </div>

                  {/* Columna 3: Tratamientos & Total */}
                  <div className="space-y-2 bg-neutral-50 dark:bg-[#1A1A1A] p-3.5 rounded-xl border border-neutral-200 dark:border-[#282828] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider mb-1">
                        Tratamientos ({req.selected_services.length})
                      </span>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {req.selected_services.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-[11px] text-neutral-700 dark:text-neutral-300"
                          >
                            <span className="truncate pr-2">• {item.serviceName}</span>
                            <span className="font-mono font-bold shrink-0">
                              ${item.price.toLocaleString('es-UY')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-200 dark:border-[#2D2D2D] flex items-center justify-between">
                      <span className="font-bold text-xs text-neutral-600 dark:text-neutral-400">
                        TOTAL ESTIMADO:
                      </span>
                      <span className="font-mono font-extrabold text-base text-[#0066FF] dark:text-[#3B82F6]">
                        ${req.total_amount.toLocaleString('es-UY')} <span className="text-[10px] text-neutral-500 font-normal">UYU</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Barra Inferior: Botonera de Acción */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-neutral-100 dark:border-[#242424]">
                  <div className="flex items-center gap-2">
                    {/* Botón Ver PDF */}
                    <button
                      type="button"
                      onClick={() => setPreviewPdfRequest(req)}
                      className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#202020] hover:bg-neutral-200 dark:hover:bg-[#2A2A2A] text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#0066FF]" />
                      <span>Ver Presupuesto PDF</span>
                    </button>

                    {/* Botón WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(req)}
                      className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#202020] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-neutral-700 dark:text-neutral-300 hover:text-emerald-500 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>WhatsApp</span>
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
                        className="px-4 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0055DD] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-[#0066FF]/25 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Pasar a trabajo</span>
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        <span>Convertido a Trabajo</span>
                      </span>
                    )}

                    {/* Botón Eliminar */}
                    <button
                      type="button"
                      onClick={() => handleDelete(req)}
                      title="Eliminar solicitud"
                      className="p-2 rounded-xl bg-neutral-100 dark:bg-[#202020] hover:bg-red-50 dark:hover:bg-red-950/40 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Pasar a Trabajo (Confirmar fecha y box) */}
      {convertingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#161616] border border-[#2D2D2D] rounded-2xl w-full max-w-lg p-6 text-white shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#282828] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0066FF]/20 text-[#3B82F6] flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Pasar Solicitud a Trabajo Real</h3>
                  <span className="text-xs text-neutral-400">
                    Solicitud #{convertingRequest.code} de {convertingRequest.client_name}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Resumen */}
              <div className="p-3.5 bg-[#1F1F1F] rounded-xl border border-[#2D2D2D] space-y-1.5">
                <div className="flex items-center justify-between font-bold text-neutral-200">
                  <span>{convertingRequest.vehicle_brand} {convertingRequest.vehicle_model}</span>
                  <span className="text-[#3B82F6] font-mono">${convertingRequest.total_amount.toLocaleString('es-UY')} UYU</span>
                </div>
                <div className="text-neutral-400 text-[11px]">
                  Origen:{' '}
                  <strong className={convertingRequest.is_paid_ad ? 'text-purple-400' : 'text-emerald-400'}>
                    {convertingRequest.is_paid_ad ? 'Anuncios pagos (12,5% comisión)' : 'Directo / Web (30% comisión)'}
                  </strong>
                </div>
              </div>

              {/* Fecha de Trabajo */}
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Fecha de inicio en el taller</span>
                </label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full bg-[#222] border border-[#333] rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-hidden focus:border-[#0066FF]"
                />
              </div>

              {/* Asignado a */}
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Responsable / Detailer asignado</span>
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-[#222] border border-[#333] rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-hidden focus:border-[#0066FF]"
                >
                  {availableProfiles.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#161616]">
                      {p.full_name} ({p.roles.join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Box de trabajo */}
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-300">Box de trabajo</label>
                <select
                  value={workBayId}
                  onChange={(e) => setWorkBayId(e.target.value)}
                  className="w-full bg-[#222] border border-[#333] rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-hidden focus:border-[#0066FF]"
                >
                  {(detailingConfig?.work_bays || [
                    { id: 'box-1', name: 'Box 1 (Lavado & Prep)' },
                    { id: 'box-2', name: 'Box 2 (Pulido & Cerámico)' },
                    { id: 'box-3', name: 'Box 3 (Interiores & Detalle)' }
                  ]).map((box) => (
                    <option key={box.id} value={box.id} className="bg-[#161616]">
                      {box.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#282828]">
              <button
                type="button"
                onClick={() => setConvertingRequest(null)}
                className="px-4 py-2 rounded-xl bg-[#252525] hover:bg-[#303030] text-neutral-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmConvertToJob}
                className="px-5 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0055DD] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#0066FF]/25 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar y agendar en calendario</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Vista previa e impresión de PDF */}
      {previewPdfRequest && (
        <PublicBudgetPrintView
          request={previewPdfRequest}
          onClose={() => setPreviewPdfRequest(null)}
        />
      )}
    </div>
  );
};
