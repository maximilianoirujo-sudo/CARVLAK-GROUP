import React, { useState } from 'react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { VehicleInspection, InspectionChecklistItem } from '../../../types';
import { CarPanelsDiagram } from './CarPanelsDiagram';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Share2,
  Printer,
  Copy,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Phone,
  Layers,
  FileText,
  Cpu,
  User,
  Car,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { sanitizePhoneForWhatsApp } from '../../../lib/formatters';

interface InspectionReportViewProps {
  inspection: VehicleInspection;
  onBack?: () => void;
  onNavigateToDetailing?: (quoteId: string) => void;
}

export const InspectionReportView: React.FC<InspectionReportViewProps> = ({
  inspection,
  onBack,
  onNavigateToDetailing
}) => {
  const { createDetailingQuoteFromInspection, detailingQuotes } = useData();
  const { profile } = useAuth();

  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [createdQuoteId, setCreatedQuoteId] = useState<string | null>(
    inspection.detailing_quote_id || null
  );
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const publicUrl = `${window.location.origin}/?informe=${inspection.token}`;

  const toggleSection = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Compartir por WhatsApp con el cliente o comprador (+598)
  const handleShareWhatsApp = () => {
    const phone = inspection.buyer_phone || '';
    const cleanPhone = sanitizePhoneForWhatsApp(phone);
    const targetPhone = cleanPhone || '59899267964';

    const msg = `🔍 *INFORME DE PERITAJE VEHICULAR CARVLAK*\n` +
      `🚗 *Vehículo:* ${inspection.vehicle_info} (${inspection.vehicle_plate})\n` +
      `📊 *Puntaje General:* ${inspection.score}/100\n` +
      `🚥 *Dictamen:* ${inspection.traffic_light.toUpperCase()}\n` +
      `💰 *Costo estimado de reparaciones:* $U ${inspection.estimated_repair_cost.toLocaleString('es-UY')}\n` +
      (inspection.sucive_debt ? `⚠️ *Deuda SUCIVE:* $U ${inspection.sucive_debt.toLocaleString('es-UY')}\n` : '') +
      `📋 *Conclusión:* ${inspection.inspector_conclusion || 'Inspección completada con éxito.'}\n\n` +
      `🔗 *Ver Informe Completo y Fotos Online:*\n${publicUrl}\n\n` +
      `_CARVLAK Group • Peritaje Técnico Profesional_`;

    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Enviar a Jonathan Kaitazoff (+598 99 267 964) para decisión de compra de Automotora
  const handleSendToJonathan = () => {
    const jonathanPhone = '59899267964';
    const msg = `🚨 *EVALUACIÓN DE PATIO PARA CARVLAK AUTOMOTORA*\n` +
      `🚗 *Auto:* ${inspection.vehicle_info} (${inspection.vehicle_plate})\n` +
      `🎯 *Dictamen Perito:* ${inspection.traffic_light.toUpperCase()} (Puntaje: ${inspection.score}/100)\n` +
      `💼 *Decisión sugerida:* ${inspection.automotora_decision?.toUpperCase() || 'EVALUAR'}\n` +
      (inspection.automotora_suggested_price ? `💵 *Precio sugerido:* ${inspection.automotora_currency || 'USD'} ${inspection.automotora_suggested_price.toLocaleString('es-UY')}\n` : '') +
      `🛠️ *Arreglos a contemplar:* $U ${inspection.estimated_repair_cost.toLocaleString('es-UY')}\n` +
      `📝 *Detalles:* ${inspection.repair_details || 'Sin observaciones mayores'}\n\n` +
      `🔗 *Ver peritaje online:*\n${publicUrl}`;

    window.open(`https://wa.me/${jonathanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Generar Cross-Selling a DetailVlak en 1 toque
  const handleGenerateDetailing = () => {
    const newQuoteId = createDetailingQuoteFromInspection(inspection.id);
    if (newQuoteId) {
      setCreatedQuoteId(newQuoteId);
      if (onNavigateToDetailing) {
        onNavigateToDetailing(newQuoteId);
      }
    }
  };

  // Agrupar items del checklist por sección
  const checklistBySection = (inspection.checklist || []).reduce((acc, item) => {
    acc[item.section] = acc[item.section] || [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, InspectionChecklistItem[]>);

  // Fallas u observaciones críticas
  const flaggedItems = (inspection.checklist || []).filter(
    (item) => item.status === 'falla' || item.status === 'observacion'
  );

  return (
    <div className="space-y-6 animate-fade-in pb-16 print:p-0 print:space-y-4">
      {/* BARRA SUPERIOR DE ACCIONES (NO IMPRIMIBLE) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-[#0F1420] border border-slate-800 print:hidden">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white"
            >
              ← Volver
            </button>
          )}
          <span className="text-xs font-bold text-slate-400">
            Peritaje #{inspection.id.slice(-6)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* WhatsApp Cliente */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-xs font-bold text-emerald-300 hover:bg-emerald-600/30 flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartir WhatsApp</span>
          </button>

          {/* Enviar a Jonathan (Automotora) */}
          <button
            type="button"
            onClick={handleSendToJonathan}
            className="px-3.5 py-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-xs font-bold text-blue-300 hover:bg-blue-600/30 flex items-center gap-1.5"
          >
            <span>📱 Enviar a Jonathan (+598)</span>
          </button>

          {/* Copiar Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3.5 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-700 flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedLink ? '¡Link Copiado!' : 'Copiar Link'}</span>
          </button>

          {/* Imprimir / PDF */}
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-700 flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* BANNER DE CROSS-SELLING DETAILVLAK (1 TOQUE) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#111A24] to-blue-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
              Cross-Selling DetailVlak Pro
            </span>
          </div>
          <h4 className="text-sm font-black text-white">
            ¿Mejora estética sugerida para este vehículo?
          </h4>
          <p className="text-xs text-slate-300">
            Crea una cotización en DetailVlak pre-cargada con el cliente, el vehículo y los servicios sugeridos (Tratamiento cerámico, Limpieza de tapizados, Ópticas).
          </p>
        </div>

        {createdQuoteId ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/30 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Cotización #{createdQuoteId.slice(-6)} Creada
            </span>
            {onNavigateToDetailing && (
              <button
                type="button"
                onClick={() => onNavigateToDetailing(createdQuoteId)}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 flex items-center gap-1"
              >
                <span>Ver en Detailing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleGenerateDetailing}
            className="shrink-0 px-5 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Crear Cotización en DetailVlak (1 Toque)</span>
          </button>
        )}
      </div>

      {/* DOCUMENTO FORMAL DE INFORME TÉCNICO (APTO PARA PRINT) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0F1420] border border-slate-800 space-y-6 print:bg-white print:text-black print:border-none print:shadow-none">
        {/* ENCABEZADO DEL INFORME */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 print:border-slate-300 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-500 print:text-emerald-700">
                CARVLAK GROUP • DEPARTAMENTO PERICIAL
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 print:bg-slate-200 print:text-slate-800">
                {inspection.type === 'precompra' ? 'Peritaje Precompra' : 'Inspección Interna Automotora'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white print:text-black">
              Informe Técnico de Inspección
            </h1>
            <p className="text-xs text-slate-400 print:text-slate-600">
              Emitido el {new Date(inspection.completed_at || inspection.scheduled_at || inspection.created_at).toLocaleDateString('es-UY', { day: '2-digit', month: 'long', year: 'numeric' })} • Taller Shangrilá (Av. Calcagno)
            </p>
          </div>

          {/* Puntaje y Semáforo */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[11px] font-bold uppercase text-slate-400 print:text-slate-600 block">
                Dictamen
              </span>
              <span
                className={`text-sm sm:text-base font-black px-3 py-1 rounded-xl uppercase tracking-wider inline-block ${
                  inspection.traffic_light === 'Recomendable'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 print:bg-emerald-100 print:text-emerald-800'
                    : inspection.traffic_light === 'Con reparos'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 print:bg-amber-100 print:text-amber-800'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30 print:bg-red-100 print:text-red-800'
                }`}
              >
                {inspection.traffic_light}
              </span>
            </div>

            <div
              className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black border shadow-lg ${
                inspection.traffic_light === 'Recomendable'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 print:bg-emerald-50 print:text-emerald-800'
                  : inspection.traffic_light === 'Con reparos'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 print:bg-amber-50 print:text-amber-800'
                  : 'bg-red-500/20 border-red-500/40 text-red-400 print:bg-red-50 print:text-red-800'
              }`}
            >
              <span className="text-2xl leading-none">{inspection.score}</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400">/ 100</span>
            </div>
          </div>
        </div>

        {/* FICHA TÉCNICA DEL VEHÍCULO & INTERVINIENTES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Vehículo */}
          <div className="p-4 rounded-2xl bg-[#090D14] border border-slate-800/80 print:bg-slate-50 print:border-slate-300 space-y-2">
            <span className="text-[10px] font-black uppercase text-emerald-400 print:text-emerald-700 tracking-wider flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5" /> Vehículo Verificado
            </span>
            <div className="space-y-1">
              <div className="text-base font-black text-white print:text-black">
                {inspection.vehicle_info}
              </div>
              <div className="font-mono text-sm font-bold text-emerald-400 print:text-emerald-700">
                {inspection.vehicle_plate}
              </div>
              <div className="text-xs text-slate-400 print:text-slate-600">
                Categoría: <strong>{inspection.vehicle_category}</strong>
              </div>
            </div>
          </div>

          {/* Comprador / Solicitante */}
          <div className="p-4 rounded-2xl bg-[#090D14] border border-slate-800/80 print:bg-slate-50 print:border-slate-300 space-y-2">
            <span className="text-[10px] font-black uppercase text-emerald-400 print:text-emerald-700 tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Solicitante / Cliente
            </span>
            <div className="space-y-1">
              <div className="text-sm font-bold text-white print:text-black">
                {inspection.buyer_name || 'Automotora CARVLAK'}
              </div>
              {inspection.buyer_phone && (
                <div className="text-xs font-mono text-slate-400 print:text-slate-600">
                  Tel: {inspection.buyer_phone}
                </div>
              )}
              {inspection.seller_name && (
                <div className="text-xs text-slate-400 print:text-slate-600 pt-1 border-t border-slate-800/50 print:border-slate-200">
                  Vendedor: {inspection.seller_name} ({inspection.seller_phone || 'S/D'})
                </div>
              )}
            </div>
          </div>

          {/* Odómetro & Documentación */}
          <div className="p-4 rounded-2xl bg-[#090D14] border border-slate-800/80 print:bg-slate-50 print:border-slate-300 space-y-2">
            <span className="text-[10px] font-black uppercase text-emerald-400 print:text-emerald-700 tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Odómetro & SUCIVE
            </span>
            <div className="space-y-1 text-xs">
              <div className="text-white print:text-black">
                Km Tablero:{' '}
                <strong>
                  {inspection.mileage_observed
                    ? `${inspection.mileage_observed.toLocaleString('es-UY')} km`
                    : 'No registrado'}
                </strong>
                {inspection.mileage_tampered && (
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-red-600/30 text-red-300 text-[10px] font-bold">
                    Sospecha Adulteración
                  </span>
                )}
              </div>
              <div className="text-slate-400 print:text-slate-600">
                SUCIVE:{' '}
                <strong>
                  {inspection.sucive_debt === 0
                    ? 'Al día ($0 deuda)'
                    : `$U ${inspection.sucive_debt?.toLocaleString('es-UY') || 0} de deuda`}
                </strong>
              </div>
              <div className="text-slate-400 print:text-slate-600 truncate">
                {inspection.sucive_status || 'Sin multas detectadas'}
              </div>
            </div>
          </div>
        </div>

        {/* CONCLUSIÓN PRINCIPAL & COSTO DE ARREGLOS */}
        <div className="p-5 rounded-2xl bg-[#090D14] border border-slate-800 print:bg-slate-50 print:border-slate-300 space-y-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 print:text-emerald-700">
            Conclusión del Perito
          </span>
          <p className="text-xs sm:text-sm text-slate-200 print:text-slate-800 leading-relaxed italic">
            "{inspection.inspector_conclusion || 'Inspección completada con éxito sin observaciones críticas.'}"
          </p>

          {/* Arreglos requeridos */}
          <div className="pt-3 border-t border-slate-800 print:border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-bold text-slate-400 print:text-slate-600">
                Costo Estimado de Reparaciones Inmediatas:
              </span>{' '}
              <span className="font-mono font-black text-amber-400 print:text-amber-800 text-sm">
                $U {inspection.estimated_repair_cost.toLocaleString('es-UY')}
              </span>
              {inspection.repair_details && (
                <span className="text-slate-400 print:text-slate-600 ml-2">
                  ({inspection.repair_details})
                </span>
              )}
            </div>

            {/* Dictamen Automotora */}
            {inspection.automotora_decision && (
              <div className="flex items-center gap-1.5 font-bold">
                <span className="text-slate-400 print:text-slate-600">Decisión de Compra:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] uppercase ${
                    inspection.automotora_decision === 'comprar'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : inspection.automotora_decision === 'negociar'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {inspection.automotora_decision}
                </span>
                {inspection.automotora_suggested_price && (
                  <span className="font-mono text-emerald-400">
                    ({inspection.automotora_currency || 'USD'} {inspection.automotora_suggested_price.toLocaleString('es-UY')})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MAPA DE PINTURA (15 PANELES) */}
        <div className="space-y-3">
          <h3 className="text-sm font-black text-white print:text-black flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400 print:text-emerald-700" />
            Mapeo de Carrocería y Espesor de Pintura (Micrones µm)
          </h3>
          <CarPanelsDiagram panels={inspection.panels} readOnly={true} />
        </div>

        {/* RESUMEN OBD-II */}
        <div className="p-4 rounded-2xl bg-[#090D14] border border-slate-800 print:bg-slate-50 print:border-slate-300 space-y-2">
          <span className="text-[10px] font-black uppercase text-emerald-400 print:text-emerald-700 tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" /> Diagnóstico Electrónico OBD-II
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {inspection.obd_codes && inspection.obd_codes.length > 0 ? (
              inspection.obd_codes.map((c, i) => (
                <span
                  key={i}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                    c.includes('Sin')
                      ? 'bg-emerald-500/20 text-emerald-300 print:bg-emerald-100 print:text-emerald-800'
                      : 'bg-red-500/20 text-red-300 print:bg-red-100 print:text-red-800'
                  }`}
                >
                  {c}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 print:text-slate-600">
                Sin códigos de falla registrados en módulos ECM/ABS/Airbag.
              </span>
            )}
          </div>
          {inspection.obd_notes && (
            <p className="text-xs text-slate-400 print:text-slate-600 italic">
              {inspection.obd_notes}
            </p>
          )}
        </div>

        {/* DESGLOSE POR SECCIONES DEL CHECKLIST */}
        <div className="space-y-3">
          <h3 className="text-sm font-black text-white print:text-black">
            Detalle de Puntos Inspeccionados
          </h3>

          <div className="space-y-2">
            {Object.entries(checklistBySection).map(([sectionName, items]) => {
              const fails = items.filter((i) => i.status === 'falla');
              const obs = items.filter((i) => i.status === 'observacion');
              const oks = items.filter((i) => i.status === 'ok');
              const isOpen = openSections[sectionName] ?? (fails.length > 0 || obs.length > 0);

              return (
                <div
                  key={sectionName}
                  className="rounded-2xl border border-slate-800/80 bg-[#090D14] print:bg-slate-50 print:border-slate-300 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleSection(sectionName)}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/30 print:hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white print:text-black">
                        {sectionName}
                      </span>
                      <span className="text-[10px] text-slate-400 print:text-slate-600">
                        ({items.length} puntos)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {fails.length > 0 && (
                        <span className="px-2 py-0.5 rounded bg-red-600/30 text-red-300 text-[10px] font-bold">
                          {fails.length} falla{fails.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {obs.length > 0 && (
                        <span className="px-2 py-0.5 rounded bg-amber-600/30 text-amber-300 text-[10px] font-bold">
                          {obs.length} obs.
                        </span>
                      )}
                      {fails.length === 0 && obs.length === 0 && (
                        <span className="px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-300 text-[10px] font-bold">
                          OK ({oks.length})
                        </span>
                      )}
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="p-3.5 pt-0 border-t border-slate-800/50 print:border-slate-200 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between ${
                              item.status === 'falla'
                                ? 'bg-red-950/20 border-red-500/40 text-red-200 print:bg-red-50 print:text-red-900'
                                : item.status === 'observacion'
                                ? 'bg-amber-950/20 border-amber-500/40 text-amber-200 print:bg-amber-50 print:text-amber-900'
                                : 'bg-[#0D121D] border-slate-800/80 text-slate-300 print:bg-white print:text-slate-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-medium">{item.name}</span>
                              <span
                                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                  item.status === 'falla'
                                    ? 'bg-red-600 text-white'
                                    : item.status === 'observacion'
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'bg-emerald-500/20 text-emerald-400'
                                }`}
                              >
                                {item.status?.toUpperCase() || 'OK'}
                              </span>
                            </div>
                            {item.comment && (
                              <p className="mt-1 text-[11px] text-slate-400 italic">
                                Nota: {item.comment}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* FIRMA Y RESPONSABLE TÉCNICO */}
        <div className="pt-6 border-t border-slate-800 print:border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-slate-400 print:text-slate-600">
              Inspector Responsable:
            </span>
            <div className="font-bold text-white print:text-black">
              {inspection.inspector_signature || 'Diego Silva (Perito Técnico CARVLAK)'}
            </div>
            <div className="text-[11px] text-slate-400 print:text-slate-600">
              Av. Giannattasio & Calcagno, Shangrilá, Canelones
            </div>
          </div>

          <div className="text-right">
            <span className="font-mono text-[10px] text-slate-500">
              Token de verificación: {inspection.token}
            </span>
            <p className="text-[10px] text-emerald-400 print:text-emerald-700 font-bold">
              ✓ Documento Oficial CARVLAK Group
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
