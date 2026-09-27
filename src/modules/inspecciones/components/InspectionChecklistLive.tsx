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
  RotateCcw,
  ShieldCheck,
  PauseCircle,
  Eye,
  Wrench,
  Gauge,
  UserCheck
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { UruguayanPlate } from '../../../components/ui/UruguayanPlate';

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
  const [mileageObserved, setMileageObserved] = useState<number | undefined>(inspection.mileage_observed || 34200);
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

  let conformesCount = 0;
  let observacionesCount = 0;
  let fallasCount = 0;

  checklist.forEach((item) => {
    if (item.status === 'ok') {
      conformesCount++;
    } else if (item.status === 'falla') {
      fallasCount++;
      if (item.isCritical) {
        currentScore -= 15;
        hasCriticalFail = true;
      } else {
        currentScore -= 6;
      }
    } else if (item.status === 'observacion') {
      observacionesCount++;
      currentScore -= 2.5;
    }
  });

  panels.forEach((p) => {
    if (p.state === 'repintado') currentScore -= 2;
    else if (p.state === 'masillado') currentScore -= 4;
    else if (p.state === 'danado') {
      currentScore -= 5;
      fallasCount++;
    }
  });

  currentScore = Math.max(0, Math.min(100, Math.round(currentScore)));
  let currentTraffic: 'Recomendable' | 'Con reparos' | 'No recomendable' = 'Recomendable';
  let badgeLabel = 'Apto comercial';
  if (currentScore < 65 || hasCriticalFail) {
    currentTraffic = 'No recomendable';
    badgeLabel = 'No recomendable';
  } else if (currentScore < 85) {
    currentTraffic = 'Con reparos';
    badgeLabel = 'Con observaciones';
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
      inspector_signature: profile?.full_name || 'Diego Techera'
    });

    updateInspectionStatus(inspection.id, 'Completada');
    localStorage.removeItem(draftKey);
    if (onFinish) onFinish();
  };

  return (
    <div className="space-y-4 animate-fade-in pb-20">
      {/* 1. ENCABEZADO DE CONTEXTO TÉCNICO */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-title font-bold text-[#6B6B6B] uppercase tracking-wider block">
            Módulo peritajes • Taller central
          </span>
          <h1 className="text-xl sm:text-2xl font-title font-bold text-[#161616]">
            Inspección técnica
          </h1>
          <p className="text-xs text-[#6B6B6B] -mt-0.5">
            Peritaje oficial para toma y venta garantizada
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF7F2] text-[#1E6B43] border border-[#CDE9D9] shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#1E6B43] animate-pulse"></span>
          <span className="text-xs font-semibold">En curso</span>
        </div>
      </div>

      {/* 2. TARJETA DEL VEHÍCULO EN REVISIÓN */}
      <div className="bg-white rounded-xl border border-[#E5E5E3] shadow-sm p-4 sm:p-5 flex flex-col gap-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#9A9A9A] uppercase tracking-wider block">
              Unidad peritada
            </span>
            <h2 className="text-lg sm:text-xl font-title font-bold text-[#161616] truncate">
              {inspection.vehicle_info}
            </h2>
            <span className="text-xs text-[#6B6B6B] block">
              Categoría {inspection.vehicle_category} • {inspection.type === 'precompra' ? 'Peritaje precompra' : 'Inspección de stock'}
            </span>
          </div>

          <div className="shrink-0 self-start sm:self-auto">
            <UruguayanPlate plate={inspection.vehicle_plate} size="md" />
          </div>
        </div>

        {/* Fila de Metadatos Operativos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2.5 bg-[#F5F5F4] rounded-lg p-3 border border-[#E5E5E3]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#6B6B6B] shadow-sm border border-[#E5E5E3]">
              <UserCheck className="w-4 h-4 text-[#D7141A]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#9A9A9A] uppercase leading-none block">
                Perito asignado
              </span>
              <span className="text-xs font-bold text-[#161616] leading-tight truncate block">
                {profile?.full_name || 'Diego Techera'}
              </span>
              <span className="text-[11px] text-[#6B6B6B] leading-none">
                Turno 11:00 hs
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#6B6B6B] shadow-sm border border-[#E5E5E3]">
              <Gauge className="w-4 h-4 text-[#6B6B6B]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#9A9A9A] uppercase leading-none block">
                Odómetro digital
              </span>
              <span className="font-title font-bold text-sm sm:text-base text-[#161616] leading-tight block">
                {(mileageObserved || 0).toLocaleString('es-UY')} <span className="text-xs font-normal text-[#6B6B6B]">km</span>
              </span>
              <span className={`text-[11px] leading-none flex items-center gap-1 font-semibold ${mileageTampered ? 'text-[#B80E14]' : 'text-[#1E6B43]'}`}>
                {mileageTampered ? '⚠️ Posible alteración' : '✓ Odómetro verificado'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BARRA DE PROGRESO Y SCORE TÉCNICO EN VIVO */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E5E5E3] shadow-sm flex flex-col gap-3">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B]">
              <span className="font-bold text-[#6B6B6B] uppercase text-[11px]">Auditoría global</span>
              <span className="text-[#9A9A9A]">•</span>
              <span className="font-semibold text-[#161616]">{answeredItemsCount} de {totalItemsCount} puntos</span>
            </div>
            <span className="font-title font-bold text-xl sm:text-2xl text-[#161616] leading-tight block mt-0.5">
              {progressPercent}% completado
            </span>
          </div>

          <div className="text-right flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase text-[#6B6B6B]">Score preliminar</span>
            <div className="flex items-baseline gap-1">
              <span className="font-title font-extrabold text-2xl sm:text-3xl text-[#161616] leading-none">
                {currentScore}
              </span>
              <span className="text-xs text-[#9A9A9A] font-semibold">/100</span>
            </div>
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold mt-1 ${
                currentTraffic === 'Recomendable'
                  ? 'bg-[#EEF7F2] text-[#1E6B43] border border-[#CDE9D9]'
                  : currentTraffic === 'Con reparos'
                  ? 'bg-[#FEF7EC] text-[#945B0E] border border-[#FCE2B6]'
                  : 'bg-[#FDF2F2] text-[#B80E14] border border-[#FACDCD]'
              }`}
            >
              {badgeLabel}
            </span>
          </div>
        </div>

        {/* Barra de progreso con acento rojo #D7141A */}
        <div className="w-full h-2.5 bg-[#E5E5E3] rounded-full overflow-hidden flex">
          <div
            className="bg-[#D7141A] h-full transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Chips de desglose de estado */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#EEF7F2] text-[#1E6B43] border border-[#CDE9D9]">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-bold">{conformesCount}</span>
            <span className="text-[11px] hidden xs:inline">Conformes</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#FEF7EC] text-[#945B0E] border border-[#FCE2B6]">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-bold">{observacionesCount}</span>
            <span className="text-[11px] hidden xs:inline">Obs. leves</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#FDF2F2] text-[#B80E14] border border-[#FACDCD]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-bold">{fallasCount}</span>
            <span className="text-[11px] hidden xs:inline">Fallas</span>
          </div>
        </div>
      </div>

      {/* 4. TABS HORIZONTALES DE SECCIONES */}
      <div className="border-b border-[#E5E5E3] flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
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
              className={`pb-2.5 pt-2 px-3 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap min-h-[38px] border-b-2 ${
                isCurrent
                  ? 'text-[#161616] border-[#D7141A]'
                  : 'text-[#6B6B6B] hover:text-[#161616] border-transparent'
              }`}
            >
              <span>{sec}</span>
              {hasFails && <span className="w-2 h-2 rounded-full bg-[#D7141A]" />}
              {!hasFails && hasObs && <span className="w-2 h-2 rounded-full bg-[#945B0E]" />}
            </button>
          );
        })}
      </div>

      {/* 5. CONTENIDO DE LA SECCIÓN ACTIVA */}
      <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#E5E5E3] shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
          <div>
            <span className="text-[10px] font-bold text-[#9A9A9A] uppercase tracking-wider block">
              Módulo activo
            </span>
            <h3 className="text-base sm:text-lg font-title font-bold text-[#161616]">{activeSection}</h3>
          </div>
          <span className="text-xs font-medium text-[#6B6B6B] bg-[#F5F5F4] px-2.5 py-1 rounded-md border border-[#E5E5E3]">
            {sectionItems.filter((i) => i.status !== undefined).length} de {sectionItems.length} auditados
          </span>
        </div>

        {/* SI ESTAMOS EN CARROCERÍA Y PINTURA -> MAPA DE PANELES */}
        {activeSection === 'Carrocería y pintura' && (
          <div className="space-y-3 p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3]">
            <h4 className="text-xs font-title font-bold text-[#161616] flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#D7141A]" />
              <span>Mapeo táctil de paneles (15 piezas)</span>
            </h4>
            <CarPanelsDiagram panels={panels} onChange={(newPanels) => setPanels(newPanels)} />
          </div>
        )}

        {/* SI ESTAMOS EN DOCUMENTACIÓN -> WIDGET SUCIVE & KILOMETRAJE */}
        {activeSection === 'Documentación' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3]">
            {/* Chequeo SUCIVE */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#161616] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#6B6B6B]" />
                <span>Chequeo SUCIVE (Montevideo / Interior)</span>
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={suciveDebt || ''}
                    onChange={(e) => setSuciveDebt(Number(e.target.value) || 0)}
                    placeholder="Deuda patente / multas ($U)"
                    className="flex-1 px-3 py-2 rounded-lg bg-white border border-[#E5E5E3] text-[#161616] font-mono text-xs focus:border-[#161616] outline-none"
                  />
                  <span className="text-xs font-bold text-[#6B6B6B]">$U</span>
                </div>
                <input
                  type="text"
                  value={suciveStatus}
                  onChange={(e) => setSuciveStatus(e.target.value)}
                  placeholder="Estado general (ej: Al día con cuotas)"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E5E3] text-[#161616] text-xs focus:border-[#161616] outline-none"
                />
              </div>
            </div>

            {/* Verificación Kilometraje */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#161616] flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-[#6B6B6B]" />
                <span>Odómetro y consistencia</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={mileageDeclared || ''}
                  onChange={(e) => setMileageDeclared(Number(e.target.value) || undefined)}
                  placeholder="Km declarados"
                  className="px-3 py-2 rounded-lg bg-white border border-[#E5E5E3] text-[#161616] font-mono text-xs focus:border-[#161616] outline-none"
                />
                <input
                  type="number"
                  value={mileageObserved || ''}
                  onChange={(e) => setMileageObserved(Number(e.target.value) || undefined)}
                  placeholder="Km tablero"
                  className="px-3 py-2 rounded-lg bg-white border border-[#E5E5E3] text-[#161616] font-mono text-xs focus:border-[#161616] outline-none"
                />
              </div>
              <label className="flex items-center gap-2 pt-1 text-xs text-[#6B6B6B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={mileageTampered}
                  onChange={(e) => setMileageTampered(e.target.checked)}
                  className="w-4 h-4 rounded text-[#D7141A] focus:ring-[#D7141A] border-[#E5E5E3]"
                />
                <span className={mileageTampered ? 'text-[#B80E14] font-bold' : ''}>
                  Sospecha de alteración / odómetro bajado
                </span>
              </label>
            </div>
          </div>
        )}

        {/* SI ESTAMOS EN ELECTRICIDAD -> WIDGET OBD-II SCANNER */}
        {activeSection === 'Electricidad' && (
          <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#161616] flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#6B6B6B]" />
                <span>Escaneo electrónico OBD-II (Launch / Autel)</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setObdCodes(['Sin códigos de falla']);
                  setObdNotes('Escaneo Launch X431 completado: 0 errores en todos los módulos.');
                }}
                className="text-[11px] text-[#1E6B43] font-bold hover:underline"
              >
                + Marcar 0 fallas (Limpio)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={obdCodeInput}
                onChange={(e) => setObdCodeInput(e.target.value)}
                placeholder="Código DTC (ej: P0300, P0420...)"
                className="flex-1 px-3 py-2 rounded-lg bg-white border border-[#E5E5E3] text-[#161616] font-mono text-xs uppercase focus:border-[#161616] outline-none"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddObdCode}
              >
                Agregar código
              </Button>
            </div>

            {obdCodes.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {obdCodes.map((c, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold ${
                      c.includes('Sin')
                        ? 'bg-[#EEF7F2] text-[#1E6B43] border border-[#CDE9D9]'
                        : 'bg-[#FDF2F2] text-[#B80E14] border border-[#FACDCD]'
                    }`}
                  >
                    <span>{c}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveObdCode(i)}
                      className="hover:opacity-70 ml-1"
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
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E5E3] text-[#161616] text-xs focus:border-[#161616] outline-none"
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
                    ? 'bg-[#FDF2F2]/60 border-[#FACDCD]'
                    : isObs
                    ? 'bg-[#FEF7EC]/60 border-[#FCE2B6]'
                    : 'bg-white border-[#E5E5E3]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#161616]">{item.name}</span>
                      {item.isCritical && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FDF2F2] text-[#B80E14] border border-[#FACDCD]">
                          Crítico
                        </span>
                      )}
                      {item.isCosmetic && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]">
                          Estético
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botones de 3 Estados (Selector táctil mobile-first) */}
                  <div className="grid grid-cols-3 gap-1.5 sm:w-72 shrink-0 p-1 bg-[#F5F5F4] rounded-lg border border-[#E5E5E3]">
                    <button
                      type="button"
                      onClick={() => handleItemStatus(item.id, 'ok')}
                      className={`py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        isOk
                          ? 'bg-[#EEF7F2] text-[#1E6B43] shadow-sm'
                          : 'text-[#6B6B6B] hover:text-[#161616]'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>OK</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleItemStatus(item.id, 'observacion')}
                      className={`py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        isObs
                          ? 'bg-[#FEF7EC] text-[#945B0E] shadow-sm'
                          : 'text-[#6B6B6B] hover:text-[#161616]'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Obs.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleItemStatus(item.id, 'falla')}
                      className={`py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        isFalla
                          ? 'bg-[#FDF2F2] text-[#B80E14] shadow-sm'
                          : 'text-[#6B6B6B] hover:text-[#B80E14]'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Falla</span>
                    </button>
                  </div>
                </div>

                {/* Comentario si está observado o fallado */}
                {(isObs || isFalla) && (
                  <div className="mt-2.5 pt-2 border-t border-[#E5E5E3] flex items-center gap-2 animate-fade-in">
                    <MessageSquare className="w-3.5 h-3.5 text-[#6B6B6B] shrink-0" />
                    <input
                      type="text"
                      value={item.comment || ''}
                      onChange={(e) => handleItemComment(item.id, e.target.value)}
                      placeholder="Detalle de la falla o zona afectada..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-[#E5E5E3] text-[#161616] placeholder-[#9A9A9A] text-xs focus:border-[#161616] outline-none"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* NAVEGACIÓN ENTRE SECCIONES */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E5E5E3]">
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
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* 6. CONCLUSIÓN & ESTIMACIÓN DE REPARACIONES */}
      <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#E5E5E3] shadow-sm space-y-4">
        <h3 className="text-sm font-title font-bold text-[#161616] flex items-center gap-2">
          <Wrench className="w-4 h-4 text-[#D7141A]" />
          <span>Dictamen pericial y costos de reparación</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#6B6B6B]">
              Costo estimado de reparaciones ($UYU)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={repairCost || ''}
                onChange={(e) => setRepairCost(Number(e.target.value) || 0)}
                placeholder="Ej: 8500"
                className="flex-1 px-3 py-2 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616] font-mono text-sm focus:bg-white focus:border-[#161616] outline-none"
              />
              <span className="text-xs font-bold text-[#6B6B6B]">$U</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#6B6B6B]">
              Detalle de arreglos requeridos
            </label>
            <input
              type="text"
              value={repairDetails}
              onChange={(e) => setRepairDetails(e.target.value)}
              placeholder="Ej: Cambio de pastillas delanteras y detalle estético"
              className="w-full px-3 py-2 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616] placeholder-[#9A9A9A] text-xs focus:bg-white focus:border-[#161616] outline-none"
            />
          </div>
        </div>

        {/* DECISIÓN AUTOMOTORA (SI ES INTERNA O EVALUACIÓN) */}
        {(inspection.type === 'interna' || profile?.roles.includes('admin') || profile?.roles.includes('encargado')) && (
          <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] space-y-3">
            <span className="text-[10px] font-title font-bold uppercase tracking-wider text-[#6B6B6B]">
              Evaluación para stock CARVLAK (Fase 4 Ready)
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['comprar', 'negociar', 'no_comprar'] as AutomotoraDecision[]).map((dec) => {
                const isSelected = decision === dec;
                return (
                  <button
                    key={dec}
                    type="button"
                    onClick={() => setDecision(dec)}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition-all border ${
                      isSelected
                        ? dec === 'comprar'
                          ? 'bg-[#1E6B43] text-white border-[#1E6B43]'
                          : dec === 'negociar'
                          ? 'bg-[#945B0E] text-white border-[#945B0E]'
                          : 'bg-[#D7141A] text-white border-[#D7141A]'
                        : 'bg-white border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616]'
                    }`}
                  >
                    {dec === 'comprar' ? 'Comprar' : dec === 'negociar' ? 'Negociar' : 'Descartar'}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-[#6B6B6B]">Precio sugerido</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={suggestedPrice || ''}
                    onChange={(e) => setSuggestedPrice(Number(e.target.value) || undefined)}
                    placeholder="Ej: 18500"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-[#E5E5E3] text-[#161616] font-mono text-xs focus:border-[#161616] outline-none"
                  />
                  <select
                    value={suggestedCurrency}
                    onChange={(e) => setSuggestedCurrency(e.target.value as Currency)}
                    className="px-2 py-1.5 rounded-lg bg-white border border-[#E5E5E3] text-[#161616] font-mono text-xs outline-none"
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
          <label className="text-xs font-semibold text-[#6B6B6B]">
            Conclusión final del inspector / perito
          </label>
          <textarea
            rows={3}
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
            placeholder="Resumen del peritaje, observaciones determinantes y recomendación para el cliente o la automotora..."
            className="w-full px-3 py-2 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616] placeholder-[#9A9A9A] text-xs focus:bg-white focus:border-[#161616] outline-none"
          />
        </div>
      </div>

      {/* 7. ACCIONES DE CIERRE Y CONTROL (Conforme a la captura oficial) */}
      <div className="space-y-2.5 pt-2">
        {/* Botón Primario Único Rojo #D7141A */}
        <button
          type="button"
          onClick={handleCompleteInspection}
          className="w-full h-12 rounded-lg bg-[#D7141A] hover:bg-[#B80E14] text-white font-title font-bold text-base flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
        >
          <CheckCheck className="w-5 h-5" />
          <span>Guardar avance y completar peritaje</span>
        </button>

        {/* Botones Secundarios */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onFinish && onFinish()}
            className="h-11 rounded-lg bg-white hover:bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3] font-sans font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <PauseCircle className="w-4 h-4 text-[#6B6B6B]" />
            <span>Pausar peritaje</span>
          </button>
          <button
            type="button"
            onClick={() => onFinish && onFinish()}
            className="h-11 rounded-lg bg-white hover:bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3] font-sans font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <Eye className="w-4 h-4 text-[#6B6B6B]" />
            <span>Ver borrador informe</span>
          </button>
        </div>
      </div>
    </div>
  );
};
