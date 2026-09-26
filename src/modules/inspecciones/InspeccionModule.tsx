import React from 'react';
import { ClipboardCheck, ShieldAlert, Camera, MessageSquare } from 'lucide-react';

export const InspeccionModule: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#10201A] to-[#0A1612] border border-emerald-500/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
                Fase 3 • Próximamente
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Patio Edition (&lt; 3 min)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              CARVLAK Inspección Vehicular
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Herramienta táctil mobile-first para peritaje rápido en patio con mapa de 15 paneles, alerta de chasis/airbags y reporte ejecutivo automático directo para <strong>Jonathan (+598 99 267 964)</strong> por WhatsApp.
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-2xl">
            🔍
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-[#121721] border border-slate-800 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">1</div>
          <h3 className="text-sm font-black text-white">Mapa Táctil de 15 Paneles</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Diagrama SVG del vehículo con rotación táctil entre Original, Repintada, Masillada o Dañada con cálculo de costo por panel.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#121721] border border-slate-800 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">2</div>
          <h3 className="text-sm font-black text-white">Alerta de Daño Estructural</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Chequeo de puntas de chasis, largueros arrugados y airbags detonados con penalización automática de valor.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#121721] border border-slate-800 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">3</div>
          <h3 className="text-sm font-black text-white">Botón Reporte a Jonathan</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Redacta en 1 toque el mensaje con fotos y oferta en mano sugerida directo al WhatsApp de Jonathan Kaitazoff.
          </p>
        </div>
      </div>
    </div>
  );
};
