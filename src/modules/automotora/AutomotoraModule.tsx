import React from 'react';
import { Building2, Sparkles, Layers, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';

export const AutomotoraModule: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#181D26] to-[#0E131C] border border-amber-500/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                Fase 4 • Próximamente
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                Arquitectura Modular Aislada
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Automotora CARVLAK (Preparada para Multi-Empresa)
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Este módulo se encuentra aislado en <code className="text-amber-400 bg-slate-900 px-1 py-0.5 rounded">src/modules/automotora/</code> para permitir que en el futuro funcione como un producto SaaS independiente, manteniendo sincronizados los clientes y vehículos de la base común.
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 text-2xl">
            🚗
          </div>
        </div>
      </div>

      {/*  */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-[#121721] border border-slate-800 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">1</div>
          <h3 className="text-sm font-black text-white">Catálogo &amp; Stock en Dólares (USD)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Gestión de unidades en consignación y stock propio en USD, con galería HD y ficha técnica conectada a la tabla común <code className="text-slate-300">vehicles</code>.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#121721] border border-slate-800 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">2</div>
          <h3 className="text-sm font-black text-white">Financiación Bancaria Uruguay</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Simulador de cuotas en tiempo real (Santander, Itaú, BBVA, Scotiabank) y módulo de señas de USD 500 con voucher QR.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#121721] border border-slate-800 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">3</div>
          <h3 className="text-sm font-black text-white">Multi-Empresa / Multi-Tenant</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Aislamiento de esquema para permitir conectar otras automotoras aliadas o sucursales con su propio inventario.
          </p>
        </div>
      </div>
    </div>
  );
};
