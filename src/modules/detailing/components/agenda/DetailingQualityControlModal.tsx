import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { DetailingQuote, DetailingConfig, DetailingQualityControlData } from '../../../../types';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/ui/Button';

interface DetailingQualityControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: DetailingQuote | null;
  config: DetailingConfig;
  onConfirmQualityControl: (quoteId: string, qcData: DetailingQualityControlData) => void;
  onOpenWhatsAppReady?: (quote: DetailingQuote) => void;
}

export const DetailingQualityControlModal: React.FC<DetailingQualityControlModalProps> = ({
  isOpen,
  onClose,
  quote,
  config,
  onConfirmQualityControl,
  onOpenWhatsAppReady
}) => {
  const [itemsState, setItemsState] = useState<{ id: string; label: string; passed: boolean; required: boolean }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!quote || !isOpen) return;

    // Obtener checklist según los servicios de la cotización
    const activeServiceIds = (quote.selected_services || []).map((s) => s.serviceId);
    let checklistItems: { id: string; label: string; required?: boolean }[] = [];

    // Buscar si hay listas de control para alguno de los servicios
    const qChecklists = config.quality_checklists_by_service || config.quality_checklists;
    if (qChecklists) {
      for (const sId of activeServiceIds) {
        if (qChecklists[sId] && qChecklists[sId].length > 0) {
          checklistItems = [...checklistItems, ...qChecklists[sId]];
        }
      }
      // Si no hay específica, usar 'default' o 'srv-ceramic'
      if (checklistItems.length === 0) {
        checklistItems = qChecklists['default'] || qChecklists['srv-ceramic'] || [
          { id: 'qc-1', label: 'Sin marcas de pasta o restos de pulido en colisas', is_required: true },
          { id: 'qc-2', label: 'Inspección de pintura con lámpara scangrip (0 hologramas)', is_required: true },
          { id: 'qc-3', label: 'Vidrios interiores y exteriores desengrasados y limpios', is_required: true },
          { id: 'qc-4', label: 'Cubiertas acondicionadas y llantas sin polvo de pastillas', is_required: true },
          { id: 'qc-5', label: 'Aspirado exhaustivo y alfombras colocadas correctamente', is_required: true },
          { id: 'qc-6', label: 'Aroma ambiental CARVLAK aplicado', is_required: false }
        ];
      }
    }

    // Deduplicar por id
    const uniqueMap = new Map();
    checklistItems.forEach((item) => {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, {
          id: item.id,
          label: item.label,
          passed: false,
          required: (item as any).is_required !== false && item.required !== false
        });
      }
    });

    setItemsState(Array.from(uniqueMap.values()));
    setErrorMsg('');
  }, [quote, config, isOpen]);

  if (!quote) return null;

  const handleToggle = (id: string) => {
    setItemsState((prev) =>
      prev.map((item) => (item.id === id ? { ...item, passed: !item.passed } : item))
    );
    setErrorMsg('');
  };

  const handleSelectAll = () => {
    setItemsState((prev) => prev.map((item) => ({ ...item, passed: true })));
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar si falta algún item obligatorio
    const missingRequired = itemsState.filter((item) => item.required && !item.passed);
    if (missingRequired.length > 0) {
      setErrorMsg(`No se puede aprobar: faltan ${missingRequired.length} punto(s) obligatorios de control.`);
      return;
    }

    const qcPayload: DetailingQualityControlData = {
      checklist: itemsState.map((i) => ({ id: i.id, label: i.label, passed: i.passed })),
      completed_at: new Date().toISOString()
    };

    onConfirmQualityControl(quote.id, qcPayload);
    onClose();

    if (onOpenWhatsAppReady) {
      onOpenWhatsAppReady(quote);
    }
  };

  const allChecked = itemsState.length > 0 && itemsState.every((i) => i.passed);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Control de Calidad (QC)"
      subtitle="Verificá los puntos de control antes de declarar el vehículo listo para entregar."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3]">
          <div>
            <p className="text-sm font-bold text-[#161616] font-display">{quote.vehicle_info}</p>
            <p className="text-xs text-[#6B6B6B]">
              Servicios: {quote.selected_services.map((s) => s.serviceName).join(', ')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs font-semibold text-[#D7141A] hover:underline"
          >
            Marcar todos como OK
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {itemsState.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggle(item.id)}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                item.passed
                  ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                  : 'bg-white border-[#E5E5E3] hover:border-gray-400 text-[#161616]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                    item.passed ? 'bg-emerald-600 text-white' : 'border border-[#E5E5E3] bg-white'
                  }`}
                >
                  {item.passed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div>
                  <span className="text-xs font-medium block">{item.label}</span>
                  {item.required && (
                    <span className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider">
                      Obligatorio
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5E3]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Aprobar y Marcar "Listo para retirar"
          </Button>
        </div>
      </form>
    </Modal>
  );
};
