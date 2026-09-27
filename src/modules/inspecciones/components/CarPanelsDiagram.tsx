import React, { useState } from 'react';
import { CarPanelInspection, CarPanelId, CarPanelState } from '../../../types';
import { Layers, CheckCircle2, AlertTriangle, AlertCircle, Wrench, Edit3, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface CarPanelsDiagramProps {
  panels: CarPanelInspection[];
  onChange?: (updatedPanels: CarPanelInspection[]) => void;
  readOnly?: boolean;
}

const STATE_CONFIG: Record<
  CarPanelState,
  { label: string; bg: string; border: string; text: string; badgeBg: string; dotColor: string }
> = {
  original: {
    label: 'Original',
    bg: 'bg-[#EEF7F2] hover:bg-[#D9EFE3]',
    border: 'border-[#CDE9D9]',
    text: 'text-[#1E6B43]',
    badgeBg: 'bg-[#CDE9D9] text-[#1E6B43]',
    dotColor: 'bg-[#1E6B43]'
  },
  repintado: {
    label: 'Repintado',
    bg: 'bg-[#FEF7EC] hover:bg-[#FDE7C9]',
    border: 'border-[#FCE2B6]',
    text: 'text-[#945B0E]',
    badgeBg: 'bg-[#FCE2B6] text-[#945B0E]',
    dotColor: 'bg-[#945B0E]'
  },
  masillado: {
    label: 'Masillado',
    bg: 'bg-purple-50 hover:bg-purple-100',
    border: 'border-purple-200',
    text: 'text-purple-800',
    badgeBg: 'bg-purple-100 text-purple-800',
    dotColor: 'bg-purple-600'
  },
  danado: {
    label: 'Dañado',
    bg: 'bg-[#FDF2F2] hover:bg-[#FAD8D8]',
    border: 'border-[#FACDCD]',
    text: 'text-[#B80E14]',
    badgeBg: 'bg-[#FACDCD] text-[#B80E14]',
    dotColor: 'bg-[#B80E14]'
  }
};

const NEXT_STATE: Record<CarPanelState, CarPanelState> = {
  original: 'repintado',
  repintado: 'masillado',
  masillado: 'danado',
  danado: 'original'
};

export const CarPanelsDiagram: React.FC<CarPanelsDiagramProps> = ({
  panels,
  onChange,
  readOnly = false
}) => {
  const [editingPanel, setEditingPanel] = useState<CarPanelInspection | null>(null);

  const getPanel = (id: CarPanelId): CarPanelInspection => {
    return panels.find((p) => p.panelId === id) || {
      panelId: id,
      name: id,
      state: 'original',
      thicknessMicrons: 110
    };
  };

  const handleCycleState = (id: CarPanelId) => {
    if (readOnly || !onChange) return;
    const current = getPanel(id);
    const nextState = NEXT_STATE[current.state];
    
    // Auto sugerir espesor típico al rotar
    let defaultThickness = current.thicknessMicrons;
    if (nextState === 'original') defaultThickness = 115;
    else if (nextState === 'repintado') defaultThickness = 230;
    else if (nextState === 'masillado') defaultThickness = 480;

    const updated = panels.map((p) =>
      p.panelId === id ? { ...p, state: nextState, thicknessMicrons: defaultThickness } : p
    );
    onChange(updated);
  };

  const handleSaveModal = (updatedPanel: CarPanelInspection) => {
    if (readOnly || !onChange) return;
    const updated = panels.map((p) => (p.panelId === updatedPanel.panelId ? updatedPanel : p));
    onChange(updated);
    setEditingPanel(null);
  };

  // Contadores
  const counts = panels.reduce(
    (acc, p) => {
      acc[p.state] = (acc[p.state] || 0) + 1;
      return acc;
    },
    { original: 0, repintado: 0, masillado: 0, danado: 0 } as Record<CarPanelState, number>
  );

  const renderPanelButton = (
    id: CarPanelId,
    displayName: string,
    extraClasses: string = ''
  ) => {
    const panel = getPanel(id);
    const cfg = STATE_CONFIG[panel.state];

    return (
      <div
        className={`relative flex flex-col justify-between p-2.5 rounded-xl border transition-all select-none ${cfg.bg} ${cfg.border} ${extraClasses} ${
          !readOnly ? 'cursor-pointer active:scale-95' : ''
        }`}
        onClick={() => handleCycleState(id)}
      >
        <div className="flex items-start justify-between gap-1">
          <span className="text-[11px] font-bold text-[#161616] line-clamp-1 leading-tight">
            {displayName}
          </span>
          {!readOnly && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditingPanel(panel);
              }}
              className="p-1 rounded-md bg-white/80 hover:bg-white text-[#6B6B6B] hover:text-[#161616] transition-colors border border-[#E5E5E3]"
              title="Ajustar micrones y notas"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px]">
          <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${cfg.badgeBg}`}>
            {cfg.label}
          </span>
          {panel.thicknessMicrons ? (
            <span className="font-mono text-[#6B6B6B] font-semibold">
              {panel.thicknessMicrons} µm
            </span>
          ) : null}
        </div>

        {panel.notes && (
          <p className="mt-1 text-[9px] text-[#6B6B6B] italic truncate" title={panel.notes}>
            {panel.notes}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Barra de Resumen / Leyenda */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-white border border-[#E5E5E3] text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#D7141A]" />
          <span className="font-title font-bold text-[#161616]">Mapa de pintura y paneles</span>
          {!readOnly && (
            <span className="text-[10px] text-[#6B6B6B]">
              (Toca para cambiar estado)
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#EEF7F2] border border-[#CDE9D9] text-[#1E6B43] text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#1E6B43]" />
            Original: <strong>{counts.original}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FEF7EC] border border-[#FCE2B6] text-[#945B0E] text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#945B0E]" />
            Repintado: <strong>{counts.repintado}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-purple-600" />
            Masillado: <strong>{counts.masillado}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FDF2F2] border border-[#FACDCD] text-[#B80E14] text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#B80E14]" />
            Dañado: <strong>{counts.danado}</strong>
          </span>
        </div>
      </div>

      {/* Disposición táctil del vehículo */}
      <div className="p-3 sm:p-4 rounded-xl bg-white border border-[#E5E5E3] space-y-2.5 shadow-sm">
        {/* PARAGOLPE DELANTERO */}
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            {renderPanelButton('paragolpe_del', 'Paragolpe delantero', 'h-16 text-center')}
          </div>
        </div>

        {/* FRENTE: Guardabarro Izq | Capot | Guardabarro Der */}
        <div className="grid grid-cols-3 gap-2">
          {renderPanelButton('guardabarro_del_izq', 'G.barro del. izq.')}
          {renderPanelButton('capot', 'Capot', 'col-span-1 min-h-[72px]')}
          {renderPanelButton('guardabarro_del_der', 'G.barro del. der.')}
        </div>

        {/* MEDIO / HABITÁCULO: Puertas y Techo */}
        <div className="grid grid-cols-3 gap-2">
          {/* LADO IZQUIERDO: Puertas Del y Tras */}
          <div className="space-y-2">
            {renderPanelButton('puerta_del_izq', 'Puerta del. izq.')}
            {renderPanelButton('puerta_tras_izq', 'Puerta tras. izq.')}
            {renderPanelButton('zocalo_izq', 'Zócalo izquierdo')}
          </div>

          {/* CENTRO: Techo */}
          <div className="flex items-center">
            {renderPanelButton('techo', 'Techo', 'w-full h-full min-h-[140px] flex items-center justify-center')}
          </div>

          {/* LADO DERECHO: Puertas Del y Tras */}
          <div className="space-y-2">
            {renderPanelButton('puerta_del_der', 'Puerta del. der.')}
            {renderPanelButton('puerta_tras_der', 'Puerta tras. der.')}
            {renderPanelButton('zocalo_der', 'Zócalo derecho')}
          </div>
        </div>

        {/* TRASERA: Guardabarro Tras. Izq | Baúl / Portón | Guardabarro Tras. Der */}
        <div className="grid grid-cols-3 gap-2">
          {renderPanelButton('guardabarro_tras_izq', 'G.barro tras. izq.')}
          {renderPanelButton('baul', 'Portón / baúl', 'col-span-1 min-h-[72px]')}
          {renderPanelButton('guardabarro_tras_der', 'G.barro tras. der.')}
        </div>

        {/* PARAGOLPE TRASERO */}
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            {renderPanelButton('paragolpe_tras', 'Paragolpe trasero', 'h-16 text-center')}
          </div>
        </div>
      </div>

      {/* MODAL DETALLES DEL PANEL (MICRONES Y NOTAS) */}
      {editingPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-xl bg-white border border-[#E5E5E3] p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
              <div>
                <span className="text-[10px] font-title font-bold text-[#6B6B6B] uppercase tracking-wider">
                  Panel seleccionado
                </span>
                <h3 className="text-base font-title font-bold text-[#161616]">{editingPanel.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPanel(null)}
                className="p-1.5 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de Estado */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6B6B6B]">Estado del panel</label>
              <div className="grid grid-cols-2 gap-2">
                {(['original', 'repintado', 'masillado', 'danado'] as CarPanelState[]).map((st) => {
                  const cfg = STATE_CONFIG[st];
                  const isSelected = editingPanel.state === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditingPanel({ ...editingPanel, state: st })}
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-left flex items-center justify-between ${
                        isSelected
                          ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-1 ring-[#161616]`
                          : 'bg-[#F5F5F4] border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616]'
                      }`}
                    >
                      <span>{cfg.label}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? cfg.dotColor : 'bg-[#9A9A9A]'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Micrones (µm) con Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6B6B6B]">
                Espesor de pintura (Micrones µm)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={editingPanel.thicknessMicrons || ''}
                  onChange={(e) =>
                    setEditingPanel({
                      ...editingPanel,
                      thicknessMicrons: Number(e.target.value) || undefined
                    })
                  }
                  placeholder="Ej: 115"
                  className="flex-1 px-3 py-2 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616] font-mono text-sm focus:bg-white focus:border-[#161616] outline-none"
                />
                <span className="text-xs text-[#6B6B6B] font-bold">µm</span>
              </div>

              {/* Botones de preset rápido */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingPanel({ ...editingPanel, thicknessMicrons: 115, state: 'original' })}
                  className="flex-1 py-1 px-2 rounded-md bg-[#F5F5F4] border border-[#E5E5E3] text-[10px] font-bold text-[#161616] hover:bg-white transition-colors"
                >
                  115 µm (Orig)
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPanel({ ...editingPanel, thicknessMicrons: 230, state: 'repintado' })}
                  className="flex-1 py-1 px-2 rounded-md bg-[#F5F5F4] border border-[#E5E5E3] text-[10px] font-bold text-[#6B6B6B] hover:text-[#161616] transition-colors"
                >
                  230 µm (Rep)
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPanel({ ...editingPanel, thicknessMicrons: 480, state: 'masillado' })}
                  className="flex-1 py-1 px-2 rounded-md bg-[#F5F5F4] border border-[#E5E5E3] text-[10px] font-bold text-[#6B6B6B] hover:text-[#161616] transition-colors"
                >
                  480 µm (Mas)
                </button>
              </div>
            </div>

            {/* Observaciones del panel */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6B6B6B]">Notas / Hallazgo</label>
              <input
                type="text"
                value={editingPanel.notes || ''}
                onChange={(e) => setEditingPanel({ ...editingPanel, notes: e.target.value })}
                placeholder="Ej: Raspón de estacionamiento sin masilla"
                className="w-full px-3 py-2 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616] placeholder-[#9A9A9A] text-xs focus:bg-white focus:border-[#161616] outline-none"
              />
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E5E3]">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setEditingPanel(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleSaveModal(editingPanel)}
              >
                Guardar panel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
