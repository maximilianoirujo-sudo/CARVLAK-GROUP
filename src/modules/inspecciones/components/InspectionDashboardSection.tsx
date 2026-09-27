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
        <div className="p-4 rounded-xl bg-white border border-[#E5E5E3] space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
            <span>Facturación precompra</span>
            <span className="p-1.5 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] text-[#D7141A]">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-title font-bold text-[#161616]">
            $U {totalRevenuePrecompra.toLocaleString('es-UY')}
          </div>
          <p className="text-[11px] text-[#6B6B6B]">
            {precompraInspections.length} peritajes cobrados a clientes
          </p>
        </div>

        {/* Costos Internos Automotora */}
        <div className="p-4 rounded-xl bg-white border border-[#E5E5E3] space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
            <span>Costos internos patio</span>
            <span className="p-1.5 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] text-[#D7141A]">
              <Car className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-title font-bold text-[#161616]">
            $U {totalInternalCost.toLocaleString('es-UY')}
          </div>
          <p className="text-[11px] text-[#6B6B6B]">
            {internaInspections.length} autos evaluados para compra
          </p>
        </div>

        {/* Comisiones Peritos */}
        <div className="p-4 rounded-xl bg-white border border-[#E5E5E3] space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
            <span>Comisiones inspector</span>
            <span className="p-1.5 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] text-[#D7141A]">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-title font-bold text-[#D7141A]">
            $U {totalCommissionsAmount.toLocaleString('es-UY')}
          </div>
          <p className="text-[11px] text-[#6B6B6B]">
            {inspectionCommissions.length} comisiones liquidadas/pendientes
          </p>
        </div>

        {/* Puntaje Promedio */}
        <div className="p-4 rounded-xl bg-white border border-[#E5E5E3] space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
            <span>Puntaje promedio</span>
            <span className="p-1.5 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] text-[#D7141A]">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-title font-bold text-[#161616]">
            {avgScore} / 100
          </div>
          <p className="text-[11px] text-[#6B6B6B]">
            Estado medio del parque evaluado
          </p>
        </div>
      </div>

      {/* GRAFICOS / DISTRIBUCIÓN OPERATIVA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribución Semáforo */}
        <div className="p-5 rounded-xl bg-white border border-[#E5E5E3] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-title font-bold text-[#161616] flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#D7141A]" />
              <span>Distribución de semáforos</span>
            </h3>
            <span className="text-xs font-mono text-[#6B6B6B]">
              {completedInspections.length} evaluados
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-[#1E6B43] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#1E6B43]" />
                  Recomendable ({trafficCounts['Recomendable']})
                </span>
                <span className="font-mono text-[#6B6B6B]">{pctRecomendable}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#F5F5F4] border border-[#E5E5E3] overflow-hidden">
                <div
                  className="h-full bg-[#1E6B43] rounded-full"
                  style={{ width: `${pctRecomendable}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-[#945B0E] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#945B0E]" />
                  Con reparos ({trafficCounts['Con reparos']})
                </span>
                <span className="font-mono text-[#6B6B6B]">{pctReparos}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#F5F5F4] border border-[#E5E5E3] overflow-hidden">
                <div
                  className="h-full bg-[#945B0E] rounded-full"
                  style={{ width: `${pctReparos}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-[#B80E14] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#B80E14]" />
                  No recomendable ({trafficCounts['No recomendable']})
                </span>
                <span className="font-mono text-[#6B6B6B]">{pctNoRecomendable}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#F5F5F4] border border-[#E5E5E3] overflow-hidden">
                <div
                  className="h-full bg-[#B80E14] rounded-full"
                  style={{ width: `${pctNoRecomendable}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tasa de Compra Automotora */}
        <div className="p-5 rounded-xl bg-white border border-[#E5E5E3] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-title font-bold text-[#161616] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#D7141A]" />
              <span>Decisión de compra (Automotora CARVLAK)</span>
            </h3>
            <span className="text-xs font-mono text-[#6B6B6B]">
              {internaInspections.length} peritajes patio
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] space-y-1">
              <span className="text-[10px] font-bold text-[#6B6B6B] uppercase">Comprar</span>
              <div className="text-xl font-title font-bold text-[#1E6B43]">
                {decisionCounts.comprar}
              </div>
              <span className="text-[10px] text-[#6B6B6B]">{buyRate}%</span>
            </div>

            <div className="p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] space-y-1">
              <span className="text-[10px] font-bold text-[#6B6B6B] uppercase">Negociar</span>
              <div className="text-xl font-title font-bold text-[#945B0E]">
                {decisionCounts.negociar}
              </div>
              <span className="text-[10px] text-[#6B6B6B]">
                {Math.round((decisionCounts.negociar / totalDecisions) * 100)}%
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] space-y-1">
              <span className="text-[10px] font-bold text-[#D7141A] uppercase">Descartar</span>
              <div className="text-xl font-title font-bold text-[#D7141A]">
                {decisionCounts.no_comprar}
              </div>
              <span className="text-[10px] text-[#6B6B6B]">
                {Math.round((decisionCounts.no_comprar / totalDecisions) * 100)}%
              </span>
            </div>
          </div>

          <p className="text-xs text-[#6B6B6B] italic leading-relaxed">
            * Los costos de las revisiones internas quedan registrados para imputarse automáticamente al costo de adquisición de la unidad en el módulo automotora.
          </p>
        </div>
      </div>
    </div>
  );
};
