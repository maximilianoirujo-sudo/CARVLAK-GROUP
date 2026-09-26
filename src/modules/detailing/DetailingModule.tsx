import React from 'react';
import { Sparkles, Calendar, DollarSign, Award, Clock } from 'lucide-react';

export const DetailingModule: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1C1628] to-[#100D1A] border border-purple-500/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-purple-400">
                Fase 2 • Próximamente
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                Taller Shangrilá
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              DetailVlak Pro (Estética Automotriz)
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Módulo especializado en presupuestos por porte de auto, gestión de bahías en Shangrilá y cálculo automático de la <strong>comisión del 30% para Maximiliano</strong> y porcentajes de los detailers.
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 text-2xl">
            ✨
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-[#121721] border border-slate-800 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">1</div>
          <h3 className="text-sm font-black text-white">Tarifario Paramétrico</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Precios en $UYU adaptados automáticamente según categoría (Chico, Mediano, SUV, Pickup, Moto) y combos de servicios.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#121721] border border-slate-800 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">2</div>
          <h3 className="text-sm font-black text-white">Comisiones Automáticas</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Liquidación automática con el 30% asignado a Maximiliano por servicio terminado y porcentajes de operadores.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#121721] border border-slate-800 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">3</div>
          <h3 className="text-sm font-black text-white">Plantillas WhatsApp Maxi / Romi</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Envío de cotizaciones formales con desglose de servicios y fotos de inspección de pintura en 1 toque.
          </p>
        </div>
      </div>
    </div>
  );
};
