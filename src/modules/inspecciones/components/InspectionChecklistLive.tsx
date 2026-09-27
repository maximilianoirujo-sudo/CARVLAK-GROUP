import React, { useState, useEffect } from 'react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import {
  VehicleInspection,
  InspectionChecklistSection,
  InspectionChecklistItem,
  InspectionItemStatus,
  CarPanelInspection,
  AutomotoraDecision,
  Currency
} from '../../../types';
import { CarPanelsDiagram } from './CarPanelsDiagram';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Camera,
  MessageSquare,
  Cpu,
  FileText,
  Save,
  CheckCheck,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface InspectionChecklistLiveProps {
  inspection: VehicleInspection;
  onFinish?: () => void;
}

const SECTIONS: InspectionChecklistSection[] = [
  'Documentación',
  'Carrocería y pintura',
  'Motor',
  'Transmisión',
  'Suspensión y dirección',
  'Frenos',
  'Neumáticos',
  'Interior',
  'Electricidad',
  'Prueba de manejo'
];

export const InspectionChecklistLive: React.FC<InspectionChecklistLiveProps> = ({
  inspection,
  onFinish
}) => {
  const { updateInspection, updateInspectionStatus, createDetailingQuoteFromInspection } = useData();
  const { profile } = useAuth();

  // Estados locales con auto-recuperación desde localStorage
  const draftKey = `carvlak_insp_draft_${inspection.id}`;
  
  const [checklist, setChecklist] = useState<InspectionChecklistItem[]>(() => {
    const s = localStorage.getItem(draftKey);
    if (s) {
      try {
        const parsed = JSON.parse(s);
        if (parsed.checklist) return parsed.checklist;
      } catch (e) {}
    }
    return inspection.checklist || [];
  });

  const [panels, setPanels] = useState<CarPanelInspection[]>(() => {
    const s = localStorage.getItem(draftKey);
    if (s) {
      try {
        const parsed = JSON.parse(s);
        if (parsed.panels) return parsed.panels;
      } catch (e) {}
    }
    return inspection.panels || [];
  });

  const [activeSection, setActiveSection] = useState<InspectionChecklistSection>('Documentación');
  const [obdCodeInput, setObdCodeInput] = useState<string>('');
  const [obdCodes, setObdCodes] = useState<string[]>(inspection.obd_codes || []);
  const [obdNotes, setObdNotes] = useState<string>(inspection.obd_notes || '');

  const [suciveDebt, setSuciveDebt] = useState<number>(inspection.sucive_debt || 0);
  const [suciveStatus, setSuciveStatus] = useState<string>(inspection.sucive_status || 'Al día');

  const [mileageDeclared, setMileageDeclared] = useState<number | undefined>(inspection.mileage_declared);
  const [mileageObserved, setMileageObserved] = useState<number | undefined>(inspection.mileage_observed);
  const [mileageTampered, setMileageTampered] = useState<boolean>(inspection.mileage_tampered || false);

  const [repairCost, setRepairCost] = useState<number>(inspection.estimated_repair_cost || 0);
  const [repairDetails, setRepairDetails] = useState<string>(inspection.repair_details || '');

  const [conclusion, setConclusion] = useState<string>(inspection.inspector_conclusion || '');
  const [decision, setDecision] = useState<AutomotoraDecision | undefined>(inspection.automotora_decision);
  const [suggestedPrice, setSuggestedPrice] = useState<number | undefined>(inspection.automotora_suggested_price);
  const [suggestedCurrency, setSuggestedCurrency] = useState<Currency>(inspection.automotora_currency || 'USD');

  const [autoSaveToast, setAutoSaveToast] = useState<boolean>(false);

  // Auto-guardado en localStorage cada vez que hay cambios
  useEffect(() => {
    const draftPayload = {
      checklist,
      panels,
      obdCodes,
      obdNotes,
      suciveDebt,
      suciveStatus,
      mileageDeclared,
      mileageObserved,
      mileageTampered,
      repairCost,
      repairDetails,
      conclusion,
      decision,
      suggestedPrice,
      suggestedCurrency
    };
    localStorage.setItem(draftKey, JSON.stringify(draftPayload));
    
    // Guardar también en contexto de DataContext
    updateInspection(inspection.id, {
      checklist,
      panels,
      obd_codes: obdCodes,
      obd_notes: obdNotes,
      sucive_debt: suciveDebt,
      sucive_status: suciveStatus,
      mileage_declared: mileageDeclared,
      mileage_observed: mileageObserved,
      mileage_tampered: mileageTampered,
      estimated_repair_cost: repairCost,
      repair_details: repairDetails,
      inspector_conclusion: conclusion,
      automotora_decision: decision,
      automotora_suggested_price: suggestedPrice,
      automotora_currency: suggestedCurrency
    });

    setAutoSaveToast(true);
    const t = setTimeout(() => setAutoSaveToast(false), 1200);
    return () => clearTimeout(t);
  }, [
    checklist,
    panels,
    obdCodes,
    obdNotes,
    suciveDebt,
    suciveStatus,
    mileageDeclared,
    mileageObserved,
    mileageTampered,
    repairCost,
    repairDetails,
    conclusion,
    decision,
    suggestedPrice,
    suggestedCurrency
  ]);

  // Actualizar ítem del checklist
  const handleItemStatus = (itemId: string, status: InspectionItemStatus) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status } : item))
    );
  };

  const handleItemComment = (itemId: string, comment: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, comment } : item))
    );
  };

  const handleAddObdCode = () => {
    if (!obdCodeInput.trim()) return;
    setObdCodes((prev) => [...prev, obdCodeInput.trim().toUpperCase()]);
    setObdCodeInput('');
  };

  const handleRemoveObdCode = (index: number) => {
    setObdCodes((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Cálculo de puntaje actual en vivo
  let currentScore = 100;
  let hasCriticalFail = false;

  checklist.forEach((item) => {
    if (item.status === 'falla') {
      if (item.isCritical) {
        currentScore -= 15;
        hasCriticalFail = true;
      } else {
        currentScore -= 6;
      }
    } else if (item.status === 'observacion') {
      currentScore -= 2.5;
    }
  });

  panels.forEach((p) => {
    if (p.state === 'repintado') currentScore -= 2;
    else if (p.state === 'masillado') currentScore -= 4;
    else if (p.state === 'danado') currentScore -= 5;
  });

  currentScore = Math.max(0, Math.min(100, Math.round(currentScore)));
  let currentTraffic: 'Recomendable' | 'Con reparos' | 'No recomendable' = 'Recomendable';
  if (currentScore < 65 || hasCriticalFail) {
    currentTraffic = 'No recomendable';
  } else if (currentScore < 85) {
    currentTraffic = 'Con reparos';
  }

  // Items de la sección activa
  const sectionItems = checklist.filter((item) => item.section === activeSection);
  const totalItemsCount = checklist.length;
  const answeredItemsCount = checklist.filter((item) => item.status !== undefined).length;
  const progressPercent = Math.round((answeredItemsCount / (totalItemsCount || 1)) * 100);

  // Finalizar inspección
  const handleCompleteInspection = () => {
    updateInspection(inspection.id, {
      checklist,
      panels,
      obd_codes: obdCodes,
      obd_notes: obdNotes,
      sucive_debt: suciveDebt,
      sucive_status: suciveStatus,
      mileage_declared: mileageDeclared,
      mileage_observed: mileageObserved,
      mileage_tampered: mileageTampered,
      score: currentScore,
      traffic_light: currentTraffic,
      estimated_repair_cost: repairCost,
      repair_details: repairDetails,
      inspector_conclusion: conclusion,
      automotora_decision: decision,
      automotora_suggested_price: suggestedPrice,
      automotora_currency: suggestedCurrency,
      inspector_signature: profile?.full_name || 'Inspector CARVLAK'
    });

    updateInspectionStatus(inspection.id, 'Completada');
    localStorage.removeItem(draftKey);
    if (onFinish) onFinish();
  };

  return (
    <div className="space-y-5 animate-fade-in pb-16">
      {/* BARRA SUPERIOR FIJA / RESUMEN EN VIVO */}
      <div className="sticky top-2 z-30 p-4 rounded-xl bg-panel/95 backdrop-blur-md border border-borde shadow-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-title font-bold text-xl border ${
              currentTraffic === 'No recomendable'
                ? 'bg-rojo/20 text-rojo border-rojo/50'
                : 'bg-negro text-white border-borde'
            }`}
          >
            {currentScore}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-title font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  currentTraffic === 'No recomendable'
                    ? 'bg-rojo/20 text-rojo border-rojo/40'
                    : 'bg-negro text-white border-borde'
                }`}
              >
                {currentTraffic}
              </span>
              <span className="text-[10px] font-mono text-gris-texto">
                {inspection.vehicle_plate} • {inspection.vehicle_info}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-gris-texto">
                Progreso: {answeredItemsCount}/{totalItemsCount} ({progressPercent}%)
              </span>
              {autoSaveToast && (
                <span className="text-[10px] text-white font-bold flex items-center gap-1 animate-pulse">
                  <Save className="w-3 h-3 text-rojo" /> Auto-guardado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Botón Finalizar */}
        <Button
          type="button"
          variant="primary"
          onClick={handleCompleteInspection}
        >
          <CheckCheck className="w-4 h-4" />
          <span>Completar Peritaje</span>
        </Button>
      </div>

      {/* TABS DE SECCIONES (HORIZONTAL SCROLL MOBILE-FIRST) */}
      <div className="border-b border-borde flex items-center gap-2 overflow-x-auto no-scrollbar">
        {SECTIONS.map((sec) => {
          const itemsInSec = checklist.filter((i) => i.section === sec);
          const hasFails = itemsInSec.some((i) => i.status === 'falla');
          const hasObs = itemsInSec.some((i) => i.status === 'observacion');
          const isCurrent = activeSection === sec;

          return (
            <button
              key={sec}
              type="button"
              onClick={() => setActiveSection(sec)}
              className={`pb-3 pt-2 px-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 whitespace-nowrap min-h-[40px] border-b-2 ${
                isCurrent
                  ? 'text-white border-rojo'
                  : 'text-gris-texto hover:text-white border-transparent'
              }`}
            >
              <span>{sec}</span>
              {hasFails && <span className="w-2 h-2 rounded-full bg-rojo" />}
              {!hasFails && hasObs && <span className="w-2 h-2 rounded-full bg-gris-texto" />}
            </button>
          );
        })}
      </div>

      {/* CONTENIDO DE LA SECCIÓN ACTIVA */}
      <div className="p-4 sm:p-6 rounded-xl bg-panel border border-borde space-y-6">
        <div className="flex items-center justify-between border-b border-borde pb-3">
          <div>
            <span className="text-[10px] font-title font-bold text-gris-texto uppercase tracking-widest">
              Sección Activa
            </span>
            <h3 className="text-base sm:text-lg font-title font-bold text-white">{activeSection}</h3>
          </div>
          <span className="text-xs font-mono text-gris-texto">
            {sectionItems.filter((i) => i.status !== undefined).length}/{sectionItems.length} verificados
          </span>
        </div>

        {/* SI ESTAMOS EN CARROCERÍA Y PINTURA -> MOSTRAR TAMBIÉN EL DIAGRAMA DE 15 PANELES */}
        {activeSection === 'Carrocería y pintura' && (
          <div className="space-y-4 p-4 rounded-xl bg-negro border border-borde">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-white" />
              Mapeo Táctil de Paneles (15 piezas)
            </h4>
            <CarPanelsDiagram panels={panels} onChange={(newPanels) => setPanels(newPanels)} />
          </div>
        )}

        {/* SI ESTAMOS EN DOCUMENTACIÓN -> WIDGET SUCIVE & KILOMETRAJE */}
        {activeSection === 'Documentación' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-negro border border-borde">
            {/* Chequeo SUCIVE */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-gris-texto" />
                Chequeo SUCIVE (Montevideo / Canelones)
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={suciveDebt || ''}
                    onChange={(e) => setSuciveDebt(Number(e.target.value) || 0)}
                    placeholder="Deuda patente / multas ($UYU)"
                    className="flex-1 px-3 py-2 rounded-lg bg-panel border border-borde text-white font-mono text-xs focus:border-rojo focus:ring-1 focus:ring-rojo outline-none"
                  />
                  <span className="text-xs font-mono text-gris-texto">$U</span>
                </div>
                <input
                  type="text"
                  value={suciveStatus}
                  onChange={(e) => setSuciveStatus(e.target.value)}
                  placeholder="Estado general (ej: Al día con cuotas 2026)"
                  className="w-full px-3 py-2 rounded-lg bg-panel border border-borde text-white text-xs focus:border-rojo focus:ring-1 focus:ring-rojo outline-none"
                />
              </div>
            </div>

            {/* Verificación Kilometraje */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>⚡</span>
                Odómetro & Consistencia
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={mileageDeclared || ''}
                  onChange={(e) => setMileageDeclared(Number(e.target.value) || undefined)}
                  placeholder="Km declarados"
                  className="px-3 py-2 rounded-lg bg-panel border border-borde text-white font-mono text-xs focus:border-rojo focus:ring-1 focus:ring-rojo outline-none"
                />
                <input
                  type="number"
                  value={mileageObserved || ''}
                  onChange={(e) => setMileageObserved(Number(e.target.value) || undefined)}
                  placeholder="Km tablero"
                  className="px-3 py-2 rounded-lg bg-panel border border-borde text-white font-mono text-xs focus:border-rojo focus:ring-1 focus:ring-rojo outline-none"
                />
              </div>
              <label className="flex items-center gap-2 pt-1 text-xs text-gris-texto cursor-pointer">
                <input
                  type="checkbox"
                  checked={mileageTampered}
                  onChange={(e) => setMileageTampered(e.target.checked)}
                  className="w-4 h-4 rounded text-rojo focus:ring-rojo bg-panel border border-borde"
                />
                <span className={mileageTampered ? 'text-rojo font-bold' : ''}>
                  Sospecha de alteración / odómetro bajado
                </span>
              </label>
            </div>
          </div>
        )}

        {/* SI ESTAMOS EN ELECTRICIDAD -> WIDGET OBD-II SCANNER */}
        {activeSection === 'Electricidad' && (
          <div className="p-4 rounded-xl bg-negro border border-borde space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-gris-texto" />
                Escaneo Electrónico OBD-II (Launch / Autel)
              </label>
              <button
                type="button"
                onClick={() => {
                  setObdCodes(['Sin códigos de falla']);
                  setObdNotes('Escaneo Launch X431 completado: 0 errores en todos los módulos.');
                }}
                className="text-[11px] text-white font-bold hover:underline"
              >
                + Marcar 0 Falla (Limpio)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={obdCodeInput}
                onChange={(e) => setObdCodeInput(e.target.value)}
                placeholder="Código DTC (ej: P0300, P0420...)"
                className="flex-1 px-3 py-2 rounded-lg bg-panel border border-borde text-white font-mono text-xs uppercase focus:border-rojo focus:ring-1 focus:ring-rojo outline-none"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddObdCode}
              >
                Agregar Código
              </Button>
            </div>

            {obdCodes.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {obdCodes.map((c, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold ${
                      c.includes('Sin')
                        ? 'bg-panel text-white border border-borde'
                        : 'bg-rojo/20 text-rojo border border-rojo/40'
                    }`}
                  >
                    <span>{c}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveObdCode(i)}
                      className="hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <input
              type="text"
              value={obdNotes}
              onChange={(e) => setObdNotes(e.target.value)}
              placeholder="Notas del escáner (módulos verificados, reseteo, etc.)"
              className="w-full px-3 py-2 rounded-lg bg-panel border border-borde text-white text-xs focus:border-rojo focus:ring-1 focus:ring-rojo outline-none"
            />
          </div>
        )}

        {/* LISTA TÁCTIL DE ÍTEMS DE LA SECCIÓN */}
        <div className="space-y-3">
          {sectionItems.map((item) => {
            const isOk = item.status === 'ok';
            const isObs = item.status === 'observacion';
            const isFalla = item.status === 'falla';

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isFalla
                    ? 'bg-rojo/10 border-rojo/40'
                    : isObs
                    ? 'bg-panel border-borde'
                    : 'bg-negro border-borde'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{item.name}</span>
                      {item.isCritical && (
                        <span className="text-[10px] font-title font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rojo/20 text-rojo border border-rojo/40">
                          Crítico
                        </span>
                      )}
                      {item.isCosmetic && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-panel text-gris-texto border border-borde">
                          Estético
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botones de 3 Estados (Mobile-first, táctiles grandes) */}
                  <div className="grid grid-cols-3 gap-1.5 sm:w-72 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleItemStatus(item.id, 'ok')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 border ${
                        isOk
                          ? 'bg-white text-black border-white shadow-sm'
                          : 'bg-panel border-borde text-gris-texto hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>OK</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleItemStatus(item.id, 'observacion')}
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 border ${
                        isObs
                          ? 'bg-negro text-white border-white shadow-sm'
                          : 'bg-panel border-borde text-gris-texto hover:text-white'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Obs.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleItemStatus(item.id, 'falla')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 border ${
                        isFalla
                          ? 'bg-rojo text-white border-rojo shadow-sm'
                          : 'bg-panel border-borde text-gris-texto hover:text-rojo'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Falla</span>
                    </button>
                  </div>
                </div>

                {/* Comentario si está observado o fallado */}
                {(isObs || isFalla) && (
                  <div className="mt-2.5 pt-2 border-t border-borde flex items-center gap-2 animate-fade-in">
                    <MessageSquare className="w-3.5 h-3.5 text-gris-texto shrink-0" />
                    <input
                      type="text"
                      value={item.comment || ''}
                      onChange={(e) => handleItemComment(item.id, e.target.value)}
                      placeholder="Detalle de la falla o zona afectada..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-negro border border-borde text-white placeholder-gris-texto text-xs focus:border-rojo focus:ring-1 focus:ring-rojo outline-none"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* NAVEGACIÓN ENTRE SECCIONES */}
        <div className="flex items-center justify-between pt-4 border-t border-borde">
          {(() => {
            const currentIndex = SECTIONS.indexOf(activeSection);
            const prevSection = currentIndex > 0 ? SECTIONS[currentIndex - 1] : null;
            const nextSection = currentIndex < SECTIONS.length - 1 ? SECTIONS[currentIndex + 1] : null;

            return (
              <>
                {prevSection ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveSection(prevSection)}
                  >
                    ← {prevSection}
                  </Button>
                ) : (
                  <div />
                )}

                {nextSection && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveSection(nextSection)}
                  >
                    <span>{nextSection}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* CONCLUSIÓN & ESTIMACIÓN DE REPARACIONES */}
      <div className="p-4 sm:p-6 rounded-xl bg-panel border border-borde space-y-4">
        <h3 className="text-sm font-title font-bold text-white flex items-center gap-2">
          <span>📋</span> Dictamen Pericial & Costos de Reparación
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gris-texto">
              Costo Estimado de Reparaciones ($UYU)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={repairCost || ''}
                onChange={(e) => setRepairCost(Number(e.target.value) || 0)}
                placeholder="Ej: 8500"
                className="flex-1 px-3 py-2 rounded-lg bg-negro border border-borde text-white font-mono text-sm focus:border-rojo focus:ring-1 focus:ring-rojo outline-none"
              />
              <span className="text-xs font-bold text-gris-texto">$U</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gris-texto">
              Detalle de arreglos requeridos
            </label>
            <input
              type="text"
              value={repairDetails}
              onChange={(e) => setRepairDetails(e.target.value)}
              placeholder="Ej: Cambio de pastillas delanteras y detalle estético"
              className="w-full px-3 py-2 rounded-lg bg-negro border border-borde text-white placeholder-gris-texto text-xs focus:border-rojo focus:ring-1 focus:ring-rojo outline-none"
            />
          </div>
        </div>

        {/* DECISIÓN AUTOMOTORA (SI ES INTERNA O EVALUACIÓN) */}
        {(inspection.type === 'interna' || profile?.roles.includes('admin') || profile?.roles.includes('encargado')) && (
          <div className="p-4 rounded-xl bg-negro border border-borde space-y-3">
            <span className="text-[10px] font-title font-bold uppercase tracking-wider text-gris-texto">
              Evaluación para Stock CARVLAK (Fase 4 Ready)
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['comprar', 'negociar', 'no_comprar'] as AutomotoraDecision[]).map((dec) => {
                const isSelected = decision === dec;
                return (
                  <button
                    key={dec}
                    type="button"
                    onClick={() => setDecision(dec)}
                    className={`py-2 px-2 rounded-lg text-xs font-bold uppercase transition-all ${
                      isSelected
                        ? dec === 'comprar'
                          ? 'bg-white text-black'
                          : dec === 'negociar'
                          ? 'bg-panel border border-borde text-white'
                          : 'bg-rojo text-white'
                        : 'bg-panel border border-borde text-gris-texto hover:text-white'
                    }`}
                  >
                    {dec === 'comprar' ? 'Comprar' : dec === 'negociar' ? 'Negociar' : 'Descartar'}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-gris-texto">Precio Sugerido</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={suggestedPrice || ''}
                    onChange={(e) => setSuggestedPrice(Number(e.target.value) || undefined)}
                    placeholder="Ej: 18500"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-panel border border-borde text-white font-mono text-xs focus:border-rojo focus:ring-1 focus:ring-rojo outline-none"
                  />
                  <select
                    value={suggestedCurrency}
                    onChange={(e) => setSuggestedCurrency(e.target.value as Currency)}
                    className="px-2 py-1.5 rounded-lg bg-panel border border-borde text-white font-mono text-xs outline-none"
                  >
                    <option value="USD">USD</option>
                    <option value="UYU">UYU</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conclusión del perito */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gris-texto">
            Conclusión Final del Inspector / Perito
          </label>
          <textarea
            rows={3}
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
            placeholder="Resumen del peritaje, observaciones determinantes y recomendación para el cliente o la automotora..."
            className="w-full px-3 py-2 rounded-lg bg-negro border border-borde text-white placeholder-gris-texto text-xs focus:border-rojo focus:ring-1 focus:ring-rojo outline-none"
          />
        </div>
      </div>
    </div>
  );
};
