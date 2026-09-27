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
import { Button } from '../../../components/ui/Button';
import { UruguayanPlate } from '../../../components/ui/UruguayanPlate';

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
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white border border-[#E5E5E3] shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onBack}
            >
              ← Volver
            </Button>
          )}
          <span className="text-xs font-bold text-[#6B6B6B]">
            Peritaje #{inspection.id.slice(-6)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* WhatsApp Cliente */}
          <Button
            variant="whatsapp"
            size="sm"
            onClick={handleShareWhatsApp}
          >
            <span>Compartir WhatsApp</span>
          </Button>

          {/* Enviar a Jonathan (Automotora) */}
          <Button
            variant="whatsapp"
            size="sm"
            onClick={handleSendToJonathan}
          >
            <span>Enviar a Jonathan (+598)</span>
          </Button>

          {/* Copiar Link */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyLink}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedLink ? '¡Link copiado!' : 'Copiar link'}</span>
          </Button>

          {/* Imprimir / PDF */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </Button>
        </div>
      </div>

      {/* BANNER DE CROSS-SELLING DETAILVLAK (1 TOQUE) */}
      <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#E5E5E3] flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-title font-bold uppercase tracking-wider text-[#6B6B6B]">
              Servicio adicional sugerido
            </span>
          </div>
          <h4 className="text-sm font-title font-bold text-[#161616]">
            ¿Mejora estética recomendada para este vehículo?
          </h4>
          <p className="text-xs text-[#6B6B6B]">
            Crea una cotización en DetailVlak pre-cargada con el cliente, el vehículo y los servicios sugeridos (Tratamiento cerámico, Limpieza de tapizados, Ópticas).
          </p>
        </div>

        {createdQuoteId ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-[#161616] bg-[#F5F5F4] px-3 py-2 rounded-lg border border-[#E5E5E3] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#1E6B43]" /> Cotización #{createdQuoteId.slice(-6)} creada
            </span>
            {onNavigateToDetailing && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNavigateToDetailing(createdQuoteId)}
              >
                <span>Ver en Detailing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerateDetailing}
          >
            <Sparkles className="w-4 h-4" />
            <span>Crear cotización en DetailVlak</span>
          </Button>
        )}
      </div>

      {/* DOCUMENTO FORMAL DE INFORME TÉCNICO (APTO PARA PRINT / PDF) */}
      <div className="p-6 sm:p-8 rounded-xl bg-white border border-[#E5E5E3] shadow-sm space-y-6 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        {/* ENCABEZADO DEL INFORME CON LOGO OFICIAL */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E3] pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <img
                src="/carvlak-logo-negro.png"
                alt="CARVLAK"
                className="h-7 sm:h-8 w-auto object-contain print:h-8"
              />
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3] print:bg-[#F5F5F4] print:text-black">
                {inspection.type === 'precompra' ? 'Peritaje precompra' : 'Inspección interna automotora'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-title font-bold text-[#161616] print:text-black">
              Informe técnico de inspección
            </h1>
            <p className="text-xs text-[#6B6B6B] print:text-[#444444]">
              Emitido el {new Date(inspection.completed_at || inspection.scheduled_at || inspection.created_at).toLocaleDateString('es-UY', { day: '2-digit', month: 'long', year: 'numeric' })} • Taller Shangrilá (Av. Giannattasio)
            </p>
          </div>

          {/* Puntaje y Semáforo Pericial */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[11px] font-semibold uppercase text-[#6B6B6B] print:text-[#444444] block">
                Dictamen pericial
              </span>
              <span
                className={`text-sm sm:text-base font-title font-bold px-3 py-1 rounded-md tracking-wider inline-block ${
                  inspection.traffic_light === 'Recomendable'
                    ? 'bg-[#EEF7F2] text-[#1E6B43] border border-[#CDE9D9]'
                    : inspection.traffic_light === 'Con reparos'
                    ? 'bg-[#FEF7EC] text-[#945B0E] border border-[#FCE2B6]'
                    : 'bg-[#FDF2F2] text-[#B80E14] border border-[#FACDCD]'
                }`}
              >
                {inspection.traffic_light}
              </span>
            </div>

            <div
              className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center font-title font-bold border ${
                inspection.traffic_light === 'Recomendable'
                  ? 'bg-[#EEF7F2] border-[#CDE9D9] text-[#1E6B43]'
                  : inspection.traffic_light === 'Con reparos'
                  ? 'bg-[#FEF7EC] border-[#FCE2B6] text-[#945B0E]'
                  : 'bg-[#FDF2F2] border-[#FACDCD] text-[#B80E14]'
              }`}
            >
              <span className="text-2xl leading-none">{inspection.score}</span>
              <span className="text-[9px] uppercase tracking-wider text-[#6B6B6B]">/ 100</span>
            </div>
          </div>
        </div>

        {/* FICHA TÉCNICA DEL VEHÍCULO & INTERVINIENTES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Vehículo */}
          <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] print:bg-slate-50 print:border-slate-300 space-y-2">
            <span className="text-[10px] font-title font-bold uppercase text-[#161616] print:text-black tracking-wider flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-[#6B6B6B]" /> Vehículo verificado
            </span>
            <div className="space-y-1">
              <div className="text-base font-title font-bold text-[#161616] print:text-black">
                {inspection.vehicle_info}
              </div>
              <div className="pt-1">
                <UruguayanPlate plate={inspection.vehicle_plate} size="sm" />
              </div>
              <div className="text-xs text-[#6B6B6B] print:text-slate-600 pt-1">
                Categoría: <strong className="text-[#161616] print:text-black">{inspection.vehicle_category}</strong>
              </div>
            </div>
          </div>

          {/* Comprador / Solicitante */}
          <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] print:bg-slate-50 print:border-slate-300 space-y-2">
            <span className="text-[10px] font-title font-bold uppercase text-[#161616] print:text-black tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#6B6B6B]" /> Solicitante / Cliente
            </span>
            <div className="space-y-1">
              <div className="text-sm font-title font-bold text-[#161616] print:text-black">
                {inspection.buyer_name || 'Automotora CARVLAK'}
              </div>
              {inspection.buyer_phone && (
                <div className="text-xs font-mono text-[#6B6B6B] print:text-slate-600">
                  Tel: {inspection.buyer_phone}
                </div>
              )}
              {inspection.seller_name && (
                <div className="text-xs text-[#6B6B6B] print:text-slate-600 pt-1 border-t border-[#E5E5E3] print:border-slate-200">
                  Vendedor: {inspection.seller_name} ({inspection.seller_phone || 'S/D'})
                </div>
              )}
            </div>
          </div>

          {/* Odómetro & Documentación */}
          <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] print:bg-slate-50 print:border-slate-300 space-y-2">
            <span className="text-[10px] font-title font-bold uppercase text-[#161616] print:text-black tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#6B6B6B]" /> Odómetro y SUCIVE
            </span>
            <div className="space-y-1 text-xs">
              <div className="text-[#161616] print:text-black">
                Km Tablero:{' '}
                <strong>
                  {inspection.mileage_observed
                    ? `${inspection.mileage_observed.toLocaleString('es-UY')} km`
                    : 'No registrado'}
                </strong>
                {inspection.mileage_tampered && (
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-[#FDF2F2] text-[#B80E14] border border-[#FACDCD] text-[10px] font-bold">
                    Sospecha adulteración
                  </span>
                )}
              </div>
              <div className="text-[#6B6B6B] print:text-slate-600">
                SUCIVE:{' '}
                <strong className="text-[#161616] print:text-black">
                  {inspection.sucive_debt === 0
                    ? 'Al día ($0 deuda)'
                    : `$U ${inspection.sucive_debt?.toLocaleString('es-UY') || 0} de deuda`}
                </strong>
              </div>
              <div className="text-[#6B6B6B] print:text-slate-600 truncate">
                {inspection.sucive_status || 'Sin multas detectadas'}
              </div>
            </div>
          </div>
        </div>

        {/* CONCLUSIÓN PRINCIPAL & COSTO DE ARREGLOS */}
        <div className="p-5 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] print:bg-slate-50 print:border-slate-300 space-y-3">
          <span className="text-[10px] font-title font-bold uppercase tracking-widest text-[#6B6B6B] print:text-slate-700">
            Conclusión del perito
          </span>
          <p className="text-xs sm:text-sm text-[#161616] print:text-slate-800 leading-relaxed italic">
            "{inspection.inspector_conclusion || 'Inspección completada con éxito sin observaciones críticas.'}"
          </p>

          {/* Arreglos requeridos */}
          <div className="pt-3 border-t border-[#E5E5E3] print:border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-bold text-[#6B6B6B] print:text-slate-600">
                Costo estimado de reparaciones inmediatas:
              </span>{' '}
              <span className="font-mono font-bold text-[#161616] print:text-black text-sm">
                $U {inspection.estimated_repair_cost.toLocaleString('es-UY')}
              </span>
              {inspection.repair_details && (
                <span className="text-[#6B6B6B] print:text-slate-600 ml-2">
                  ({inspection.repair_details})
                </span>
              )}
            </div>

            {/* Dictamen Automotora */}
            {inspection.automotora_decision && (
              <div className="flex items-center gap-1.5 font-bold">
                <span className="text-[#6B6B6B] print:text-slate-600">Decisión de compra:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] uppercase ${
                    inspection.automotora_decision === 'comprar'
                      ? 'bg-[#EEF7F2] border border-[#CDE9D9] text-[#1E6B43]'
                      : inspection.automotora_decision === 'negociar'
                      ? 'bg-[#FEF7EC] border border-[#FCE2B6] text-[#945B0E]'
                      : 'bg-[#FDF2F2] text-[#B80E14] border border-[#FACDCD]'
                  }`}
                >
                  {inspection.automotora_decision}
                </span>
                {inspection.automotora_suggested_price && (
                  <span className="font-mono text-[#161616]">
                    ({inspection.automotora_currency || 'USD'} {inspection.automotora_suggested_price.toLocaleString('es-UY')})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MAPA DE PINTURA (15 PANELES) */}
        <div className="space-y-3">
          <h3 className="text-sm font-title font-bold text-[#161616] print:text-black flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#D7141A]" />
            Mapeo de carrocería y espesor de pintura (Micrones µm)
          </h3>
          <CarPanelsDiagram panels={inspection.panels} readOnly={true} />
        </div>

        {/* RESUMEN OBD-II */}
        <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] print:bg-slate-50 print:border-slate-300 space-y-2">
          <span className="text-[10px] font-title font-bold uppercase text-[#161616] print:text-black tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#6B6B6B]" /> Diagnóstico electrónico OBD-II
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {inspection.obd_codes && inspection.obd_codes.length > 0 ? (
              inspection.obd_codes.map((c, i) => (
                <span
                  key={i}
                  className={`px-2.5 py-1 rounded-md font-mono font-bold text-xs ${
                    c.includes('Sin')
                      ? 'bg-[#EEF7F2] text-[#1E6B43] border border-[#CDE9D9]'
                      : 'bg-[#FDF2F2] text-[#B80E14] border border-[#FACDCD]'
                  }`}
                >
                  {c}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#6B6B6B] print:text-slate-600">
                Sin códigos de falla registrados en módulos ECM/ABS/Airbag.
              </span>
            )}
          </div>
          {inspection.obd_notes && (
            <p className="text-xs text-[#6B6B6B] print:text-slate-600 italic">
              {inspection.obd_notes}
            </p>
          )}
        </div>

        {/* DESGLOSE POR SECCIONES DEL CHECKLIST */}
        <div className="space-y-3">
          <h3 className="text-sm font-title font-bold text-[#161616] print:text-black">
            Detalle de puntos inspeccionados
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
                  className="rounded-xl border border-[#E5E5E3] bg-[#F5F5F4] print:bg-slate-50 print:border-slate-300 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleSection(sectionName)}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white print:hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-title font-bold text-[#161616] print:text-black">
                        {sectionName}
                      </span>
                      <span className="text-[10px] text-[#6B6B6B] print:text-slate-600">
                        ({items.length} puntos)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {fails.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-[#FDF2F2] text-[#B80E14] border border-[#FACDCD] text-[10px] font-bold">
                          {fails.length} falla{fails.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {obs.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-[#FEF7EC] border border-[#FCE2B6] text-[#945B0E] text-[10px] font-bold">
                          {obs.length} obs.
                        </span>
                      )}
                      {fails.length === 0 && obs.length === 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-[#EEF7F2] border border-[#CDE9D9] text-[#1E6B43] text-[10px] font-bold">
                          OK ({oks.length})
                        </span>
                      )}
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#6B6B6B]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#6B6B6B]" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="p-3.5 pt-0 border-t border-[#E5E5E3] print:border-slate-200 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                              item.status === 'falla'
                                ? 'bg-[#FDF2F2] border-[#FACDCD] text-[#B80E14]'
                                : item.status === 'observacion'
                                ? 'bg-[#FEF7EC] border-[#FCE2B6] text-[#945B0E]'
                                : 'bg-white border-[#E5E5E3] text-[#161616]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-medium text-[#161616]">{item.name}</span>
                              <span
                                className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                  item.status === 'falla'
                                    ? 'bg-[#B80E14] text-white'
                                    : item.status === 'observacion'
                                    ? 'bg-[#FEF7EC] border border-[#FCE2B6] text-[#945B0E]'
                                    : 'bg-[#EEF7F2] border border-[#CDE9D9] text-[#1E6B43]'
                                }`}
                              >
                                {item.status?.toUpperCase() || 'OK'}
                              </span>
                            </div>
                            {item.comment && (
                              <p className="mt-1 text-[11px] text-[#6B6B6B] italic">
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
        <div className="pt-6 border-t border-[#E5E5E3] print:border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-[#6B6B6B] print:text-slate-600">
              Inspector responsable:
            </span>
            <div className="font-title font-bold text-[#161616] print:text-black">
              {inspection.inspector_signature || 'Diego Techera (Perito Técnico CARVLAK)'}
            </div>
            <div className="text-[11px] text-[#6B6B6B] print:text-slate-600">
              Av. Giannattasio & Calcagno, Shangrilá, Canelones
            </div>
          </div>

          <div className="text-right">
            <span className="font-mono text-[10px] text-[#6B6B6B]">
              Token de verificación: {inspection.token}
            </span>
            <p className="text-[10px] text-[#161616] print:text-black font-bold">
              ✓ Documento oficial CARVLAK Group
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
