import React from 'react';
import { useData } from '../../../context/DataContext';
import {
  DollarSign,
  ShieldCheck,
  Users,
  Car,
  PieChart,
  BarChart3
} from 'lucide-react';

export const InspectionDashboardSection: React.FC = () => {
  const { inspections, commissions } = useData();

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
        <div className="p-4 rounded-xl bg-panel border border-borde space-y-1">
          <div className="flex items-center justify-between text-xs text-gris-texto">
            <span>Facturación Precompra</span>
            <span className="p-1.5 rounded-xl bg-negro border border-borde text-rojo">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            $U {totalRevenuePrecompra.toLocaleString('es-UY')}
          </div>
          <p className="text-[11px] text-gris-texto">
            {precompraInspections.length} peritajes cobrados a clientes
          </p>
        </div>

        {/* Costos Internos Automotora */}
        <div className="p-4 rounded-xl bg-panel border border-borde space-y-1">
          <div className="flex items-center justify-between text-xs text-gris-texto">
            <span>Costos Internos Patio</span>
            <span className="p-1.5 rounded-xl bg-negro border border-borde text-rojo">
              <Car className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            $U {totalInternalCost.toLocaleString('es-UY')}
          </div>
          <p className="text-[11px] text-gris-texto">
            {internaInspections.length} autos evaluados para compra
          </p>
        </div>

        {/* Comisiones Peritos */}
        <div className="p-4 rounded-xl bg-panel border border-borde space-y-1">
          <div className="flex items-center justify-between text-xs text-gris-texto">
            <span>Comisiones Inspector</span>
            <span className="p-1.5 rounded-xl bg-negro border border-borde text-rojo">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-rojo font-mono">
            $U {totalCommissionsAmount.toLocaleString('es-UY')}
          </div>
          <p className="text-[11px] text-gris-texto">
            {inspectionCommissions.length} comisiones liquidadas/pendientes
          </p>
        </div>

        {/* Puntaje Promedio */}
        <div className="p-4 rounded-xl bg-panel border border-borde space-y-1">
          <div className="flex items-center justify-between text-xs text-gris-texto">
            <span>Puntaje Promedio</span>
            <span className="p-1.5 rounded-xl bg-negro border border-borde text-rojo">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {avgScore} / 100
          </div>
          <p className="text-[11px] text-gris-texto">
            Estado medio del parque evaluado
          </p>
        </div>
      </div>

      {/* GRAFICOS / DISTRIBUCIÓN OPERATIVA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribución Semáforo */}
        <div className="p-5 rounded-xl bg-panel border border-borde space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-rojo" />
              Distribución de Semáforos
            </h3>
            <span className="text-xs font-mono text-gris-texto">
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
                <span className="font-mono text-gris-texto">{pctRecomendable}%</span>
              </div>
              <div className="h-2 rounded-full bg-negro border border-borde overflow-hidden">
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
                <span className="font-mono text-gris-texto">{pctReparos}%</span>
              </div>
              <div className="h-2 rounded-full bg-negro border border-borde overflow-hidden">
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
                <span className="font-mono text-gris-texto">{pctNoRecomendable}%</span>
              </div>
              <div className="h-2 rounded-full bg-negro border border-borde overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${pctNoRecomendable}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tasa de Compra Automotora */}
        <div className="p-5 rounded-xl bg-panel border border-borde space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rojo" />
              Decisión de Compra (Automotora CARVLAK)
            </h3>
            <span className="text-xs font-mono text-gris-texto">
              {internaInspections.length} peritajes patio
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-negro border border-borde space-y-1">
              <span className="text-[10px] font-bold text-gris-texto uppercase">Comprar</span>
              <div className="text-xl font-black text-white font-mono">
                {decisionCounts.comprar}
              </div>
              <span className="text-[10px] text-gris-texto">{buyRate}%</span>
            </div>

            <div className="p-3 rounded-xl bg-negro border border-borde space-y-1">
              <span className="text-[10px] font-bold text-gris-texto uppercase">Negociar</span>
              <div className="text-xl font-black text-white font-mono">
                {decisionCounts.negociar}
              </div>
              <span className="text-[10px] text-gris-texto">
                {Math.round((decisionCounts.negociar / totalDecisions) * 100)}%
              </span>
            </div>

            <div className="p-3 rounded-xl bg-negro border border-borde space-y-1">
              <span className="text-[10px] font-bold text-rojo uppercase">Descartar</span>
              <div className="text-xl font-black text-rojo font-mono">
                {decisionCounts.no_comprar}
              </div>
              <span className="text-[10px] text-gris-texto">
                {Math.round((decisionCounts.no_comprar / totalDecisions) * 100)}%
              </span>
            </div>
          </div>

          <p className="text-xs text-gris-texto italic leading-relaxed">
            * Los costos de las revisiones internas quedan registrados para imputarse automáticamente al costo de adquisición de la unidad en el Módulo Automotora.
          </p>
        </div>
      </div>
    </div>
  );
};
