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
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/20 text-emerald-300',
    dotColor: 'bg-emerald-500'
  },
  repintado: {
    label: 'Repintado',
    bg: 'bg-amber-500/15 hover:bg-amber-500/25',
    border: 'border-amber-500/50',
    text: 'text-amber-300',
    badgeBg: 'bg-amber-500/25 text-amber-300',
    dotColor: 'bg-amber-500'
  },
  masillado: {
    label: 'Masillado',
    bg: 'bg-purple-600/20 hover:bg-purple-600/30',
    border: 'border-purple-500/50',
    text: 'text-purple-300',
    badgeBg: 'bg-purple-600/30 text-purple-200',
    dotColor: 'bg-purple-500'
  },
  danado: {
    label: 'Dañado',
    bg: 'bg-red-600/20 hover:bg-red-600/30',
    border: 'border-red-500/60',
    text: 'text-red-300',
    badgeBg: 'bg-red-600/30 text-red-200',
    dotColor: 'bg-red-500'
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
          <span className="text-[11px] font-bold text-white line-clamp-1 leading-tight">
            {displayName}
          </span>
          {!readOnly && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditingPanel(panel);
              }}
              className="p-1 rounded-md bg-black/40 text-gris-texto hover:text-white transition-colors"
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
            <span className="font-mono text-gris-texto font-semibold">
              {panel.thicknessMicrons} µm
            </span>
          ) : null}
        </div>

        {panel.notes && (
          <p className="mt-1 text-[9px] text-gris-texto italic truncate" title={panel.notes}>
            {panel.notes}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Barra de Resumen / Leyenda */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-panel border border-borde text-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-white" />
          <span className="font-title font-bold text-white">Mapa de Pintura y Paneles</span>
          {!readOnly && (
            <span className="text-[10px] text-gris-texto">
              (Toca para cambiar estado)
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-negro border border-borde text-white text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-white" />
            Original: <strong>{counts.original}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-negro border border-borde text-gris-texto text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-gris-texto" />
            Repintado: <strong>{counts.repintado}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-negro border border-borde text-gris-texto text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-gris-texto" />
            Masillado: <strong>{counts.masillado}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rojo/20 border border-rojo/40 text-rojo text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-rojo" />
            Dañado: <strong>{counts.danado}</strong>
          </span>
        </div>
      </div>

      {/* Disposición táctil del vehículo: Frontal / Lateral Izq / Centro / Lateral Der / Trasera */}
      <div className="p-4 sm:p-5 rounded-xl bg-panel border border-borde space-y-3">
        {/* PARAGOLPE DELANTERO */}
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            {renderPanelButton('paragolpe_del', 'Paragolpe Delantero', 'h-16 text-center')}
          </div>
        </div>

        {/* FRENTE: Guardabarro Izq | Capot | Guardabarro Der */}
        <div className="grid grid-cols-3 gap-2.5">
          {renderPanelButton('guardabarro_del_izq', 'G.barro Del. Izq.')}
          {renderPanelButton('capot', 'Capot', 'col-span-1 min-h-[72px]')}
          {renderPanelButton('guardabarro_del_der', 'G.barro Del. Der.')}
        </div>

        {/* MEDIO / HABITÁCULO: Puertas y Techo */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* LADO IZQUIERDO: Puertas Del y Tras */}
          <div className="space-y-2.5">
            {renderPanelButton('puerta_del_izq', 'Puerta Del. Izq.')}
            {renderPanelButton('puerta_tras_izq', 'Puerta Tras. Izq.')}
            {renderPanelButton('zocalo_izq', 'Zócalo Izquierdo')}
          </div>

          {/* CENTRO: Techo */}
          <div className="flex items-center">
            {renderPanelButton('techo', 'Techo', 'w-full h-full min-h-[140px] flex items-center justify-center')}
          </div>

          {/* LADO DERECHO: Puertas Del y Tras */}
          <div className="space-y-2.5">
            {renderPanelButton('puerta_del_der', 'Puerta Del. Der.')}
            {renderPanelButton('puerta_tras_der', 'Puerta Tras. Der.')}
            {renderPanelButton('zocalo_der', 'Zócalo Derecho')}
          </div>
        </div>

        {/* TRASERA: Guardabarro Tras. Izq | Baúl / Portón | Guardabarro Tras. Der */}
        <div className="grid grid-cols-3 gap-2.5">
          {renderPanelButton('guardabarro_tras_izq', 'G.barro Tras. Izq.')}
          {renderPanelButton('baul', 'Portón / Baúl', 'col-span-1 min-h-[72px]')}
          {renderPanelButton('guardabarro_tras_der', 'G.barro Tras. Der.')}
        </div>

        {/* PARAGOLPE TRASERO */}
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            {renderPanelButton('paragolpe_tras', 'Paragolpe Trasero', 'h-16 text-center')}
          </div>
        </div>
      </div>

      {/* MODAL DETALLES DEL PANEL (MICRONES Y NOTAS) */}
      {editingPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-xl bg-panel border border-borde p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-borde pb-3">
              <div>
                <span className="text-[10px] font-title font-bold text-gris-texto uppercase tracking-wider">
                  Panel Seleccionado
                </span>
                <h3 className="text-base font-title font-bold text-white">{editingPanel.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPanel(null)}
                className="p-1.5 rounded-lg bg-negro border border-borde text-gris-texto hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de Estado */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gris-texto">Estado del Panel</label>
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
                          ? 'bg-rojo text-white border-rojo'
                          : 'bg-negro border-borde text-gris-texto hover:text-white'
                      }`}
                    >
                      <span>{cfg.label}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-white' : 'bg-gris-texto'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Micrones (µm) con Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gris-texto">
                Espesor de Pintura (Micrones µm)
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
                  className="flex-1 px-3 py-2 rounded-lg bg-negro border border-borde text-white font-mono text-sm focus:border-rojo focus:ring-1 focus:ring-rojo outline-none"
                />
                <span className="text-xs text-gris-texto font-bold">µm</span>
              </div>

              {/* Botones de preset rápido */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingPanel({ ...editingPanel, thicknessMicrons: 115, state: 'original' })}
                  className="flex-1 py-1 px-2 rounded-md bg-negro border border-borde text-[10px] font-bold text-white hover:border-gris-texto transition-colors"
                >
                  115 µm (Orig)
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPanel({ ...editingPanel, thicknessMicrons: 230, state: 'repintado' })}
                  className="flex-1 py-1 px-2 rounded-md bg-negro border border-borde text-[10px] font-bold text-gris-texto hover:text-white transition-colors"
                >
                  230 µm (Rep)
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPanel({ ...editingPanel, thicknessMicrons: 480, state: 'masillado' })}
                  className="flex-1 py-1 px-2 rounded-md bg-negro border border-borde text-[10px] font-bold text-gris-texto hover:text-white transition-colors"
                >
                  480 µm (Mas)
                </button>
              </div>
            </div>

            {/* Observaciones del panel */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gris-texto">Notas / Hallazgo</label>
              <input
                type="text"
                value={editingPanel.notes || ''}
                onChange={(e) => setEditingPanel({ ...editingPanel, notes: e.target.value })}
                placeholder="Ej: Raspón de estacionamiento sin masilla"
                className="w-full px-3 py-2 rounded-lg bg-negro border border-borde text-white placeholder-gris-texto text-xs focus:border-rojo focus:ring-1 focus:ring-rojo outline-none"
              />
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-borde">
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
                Guardar Panel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
