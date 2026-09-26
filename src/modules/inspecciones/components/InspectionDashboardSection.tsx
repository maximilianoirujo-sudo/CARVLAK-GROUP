import React from 'react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import {
  TrendingUp,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Users,
  Car,
  PieChart,
  BarChart3
} from 'lucide-react';

export const InspectionDashboardSection: React.FC = () => {
  const { inspections, commissions, expenses } = useData();
  const { profile } = useAuth();

  // Filtros
  const completedInspections = inspections.filter((i) => i.status === 'Completada');
  const precompraInspections = completedInspections.filter((i) => i.type === 'precompra');
  const internaInspections = completedInspections.filter((i) => i.type === 'interna');

  // Facturación precompra
  const totalRevenuePrecompra = precompraInspections.reduce((sum, i) => sum + i.total_price, 0);

  // Costo interno acumulado para automotora
  const totalInternalCost = internaInspections.reduce((sum, i) => sum + i.total_price, 0);

  // Comisiones peritos
  const inspectionCommissions = commissions.filter((c) => c.business === 'inspeccion');
  const totalCommissionsAmount = inspectionCommissions.reduce((sum, c) => sum + c.commission_amount, 0);

  // Distribución Semáforo
  const trafficCounts = completedInspections.reduce(
    (acc, i) => {
      acc[i.traffic_light] = (acc[i.traffic_light] || 0) + 1;
      return acc;
    },
    { 'Recomendable': 0, 'Con reparos': 0, 'No recomendable': 0 } as Record<string, number>
  );

  const totalEvaluated = completedInspections.length || 1;
  const pctRecomendable = Math.round((trafficCounts['Recomendable'] / totalEvaluated) * 100);
  const pctReparos = Math.round((trafficCounts['Con reparos'] / totalEvaluated) * 100);
  const pctNoRecomendable = Math.round((trafficCounts['No recomendable'] / totalEvaluated) * 100);

  // Promedio de puntaje
  const avgScore = completedInspections.length > 0
    ? Math.round(completedInspections.reduce((sum, i) => sum + (i.score || 0), 0) / completedInspections.length)
    : 100;

  // Conversión automotora (decisiones de compra)
  const decisionCounts = internaInspections.reduce(
    (acc, i) => {
      if (i.automotora_decision) {
        acc[i.automotora_decision] = (acc[i.automotora_decision] || 0) + 1;
      }
      return acc;
    },
    { comprar: 0, negociar: 0, no_comprar: 0 } as Record<string, number>
  );

  const totalDecisions = (decisionCounts.comprar + decisionCounts.negociar + decisionCounts.no_comprar) || 1;
  const buyRate = Math.round((decisionCounts.comprar / totalDecisions) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* TARJETAS KPI FINANCIERAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Facturación Precompra */}
        <div className="p-4 rounded-3xl bg-[#0F1420] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Facturación Precompra</span>
            <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            $U {totalRevenuePrecompra.toLocaleString('es-UY')}
          </div>
          <p className="text-[11px] text-slate-400">
            {precompraInspections.length} peritajes cobrados a clientes
          </p>
        </div>

        {/* Costos Internos Automotora */}
        <div className="p-4 rounded-3xl bg-[#0F1420] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Costos Internos Patio</span>
            <span className="p-1.5 rounded-xl bg-blue-500/10 text-blue-400">
              <Car className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono">
            $U {totalInternalCost.toLocaleString('es-UY')}
          </div>
          <p className="text-[11px] text-slate-400">
            {internaInspections.length} autos evaluados para compra
          </p>
        </div>

        {/* Comisiones Peritos */}
        <div className="p-4 rounded-3xl bg-[#0F1420] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Comisiones Inspector</span>
            <span className="p-1.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono">
            $U {totalCommissionsAmount.toLocaleString('es-UY')}
          </div>
          <p className="text-[11px] text-slate-400">
            {inspectionCommissions.length} comisiones liquidadas/pendientes
          </p>
        </div>

        {/* Puntaje Promedio */}
        <div className="p-4 rounded-3xl bg-[#0F1420] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Puntaje Promedio</span>
            <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {avgScore} / 100
          </div>
          <p className="text-[11px] text-slate-400">
            Estado medio del parque evaluado
          </p>
        </div>
      </div>

      {/* GRAFICOS / DISTRIBUCIÓN OPERATIVA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribución Semáforo */}
        <div className="p-5 rounded-3xl bg-[#0F1420] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              Distribución de Semáforos
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {completedInspections.length} evaluados
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Recomendable ({trafficCounts['Recomendable']})
                </span>
                <span className="font-mono text-slate-300">{pctRecomendable}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${pctRecomendable}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Con reparos ({trafficCounts['Con reparos']})
                </span>
                <span className="font-mono text-slate-300">{pctReparos}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${pctReparos}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-red-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  No recomendable ({trafficCounts['No recomendable']})
                </span>
                <span className="font-mono text-slate-300">{pctNoRecomendable}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${pctNoRecomendable}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tasa de Compra Automotora */}
        <div className="p-5 rounded-3xl bg-[#0F1420] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Decisión de Compra (Automotora CARVLAK)
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {internaInspections.length} peritajes patio
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Comprar</span>
              <div className="text-xl font-black text-white font-mono">
                {decisionCounts.comprar}
              </div>
              <span className="text-[10px] text-slate-400">{buyRate}%</span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
              <span className="text-[10px] font-bold text-amber-300 uppercase">Negociar</span>
              <div className="text-xl font-black text-white font-mono">
                {decisionCounts.negociar}
              </div>
              <span className="text-[10px] text-slate-400">
                {Math.round((decisionCounts.negociar / totalDecisions) * 100)}%
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-1">
              <span className="text-[10px] font-bold text-red-400 uppercase">Descartar</span>
              <div className="text-xl font-black text-white font-mono">
                {decisionCounts.no_comprar}
              </div>
              <span className="text-[10px] text-slate-400">
                {Math.round((decisionCounts.no_comprar / totalDecisions) * 100)}%
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 italic leading-relaxed">
            * Los costos de las revisiones internas quedan registrados para imputarse automáticamente al costo de adquisición de la unidad en la <strong>Fase 4 (Módulo Automotora)</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
