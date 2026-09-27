import React, { useState, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  User,
  Car,
  Calendar,
  Filter,
  DollarSign
} from 'lucide-react';
import { CommissionRecord, Business } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { formatCurrency } from '../../../lib/formatters';
import { Button } from '../../../components/ui/Button';

interface DetailingCommissionsSectionProps {
  businessFilter?: Business;
}

export const DetailingCommissionsSection: React.FC<DetailingCommissionsSectionProps> = ({
  businessFilter = 'detailing'
}) => {
  const { commissions, markCommissionPaid } = useData();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const isAdmin = profile?.roles.includes('admin');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pendiente' | 'Pagada'>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  // Filtrar según rol: empleado solo ve sus propias comisiones, Admin ve todas
  const userCommissions = useMemo(() => {
    return commissions
      .filter((c) => c.business === businessFilter)
      .filter((c) => (isAdmin ? true : c.employee_id === profile?.id));
  }, [commissions, businessFilter, isAdmin, profile]);

  const filteredCommissions = useMemo(() => {
    return userCommissions.filter((c) => {
      const matchMonth = c.created_at.startsWith(selectedMonth);
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchEmp = employeeFilter === 'all' || c.employee_id === employeeFilter;
      return matchMonth && matchStatus && matchEmp;
    });
  }, [userCommissions, selectedMonth, statusFilter, employeeFilter]);

  // Totales
  const totalPending = useMemo(() => {
    return filteredCommissions
      .filter((c) => c.status === 'Pendiente')
      .reduce((acc, curr) => acc + curr.commission_amount, 0);
  }, [filteredCommissions]);

  const totalPaid = useMemo(() => {
    return filteredCommissions
      .filter((c) => c.status === 'Pagada')
      .reduce((acc, curr) => acc + curr.commission_amount, 0);
  }, [filteredCommissions]);

  const totalBilled = useMemo(() => {
    return filteredCommissions.reduce((acc, curr) => acc + curr.amount_charged, 0);
  }, [filteredCommissions]);

  const handleTogglePaid = (comm: CommissionRecord) => {
    if (!isAdmin) return;
    markCommissionPaid(comm.id);
    showToast(`Comisión de ${comm.employee_name} marcada como pagada`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Banner de resumen de comisiones */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-panel border border-rojo">
          <div className="flex items-center justify-between text-[11px] font-bold text-gris-texto">
            <span>Comisiones Pendientes</span>
            <Clock className="w-4 h-4 text-rojo" />
          </div>
          <div className="text-2xl font-black text-rojo font-mono mt-0.5">
            {formatCurrency(totalPending, 'UYU')}
          </div>
          <p className="text-[10px] text-gris-texto mt-0.5">
            Por liquidar ({filteredCommissions.filter((c) => c.status === 'Pendiente').length} trabajos)
          </p>
        </div>

        <div className="p-4 rounded-xl bg-panel border border-borde">
          <div className="flex items-center justify-between text-[11px] font-bold text-gris-texto">
            <span>Comisiones Pagadas</span>
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-0.5">
            {formatCurrency(totalPaid, 'UYU')}
          </div>
          <p className="text-[10px] text-gris-texto mt-0.5">Liquidadas este mes</p>
        </div>

        <div className="p-4 rounded-xl bg-panel border border-borde">
          <div className="text-[11px] font-bold text-gris-texto">Total Facturado en Trabajos</div>
          <div className="text-2xl font-black text-white font-mono mt-0.5">
            {formatCurrency(totalBilled, 'UYU')}
          </div>
          <p className="text-[10px] text-gris-texto mt-0.5">
            Base sobre la cual se calculan comisiones
          </p>
        </div>
      </div>

      {/* Controles de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-negro border border-borde rounded-xl px-3 py-1.5 text-xs text-white">
            <Calendar className="w-3.5 h-3.5 text-gris-texto" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-negro border border-borde rounded-xl px-3 py-2 text-xs text-white focus:border-rojo focus:outline-none"
          >
            <option value="all">Todos los estados</option>
            <option value="Pendiente">Pendientes de cobro</option>
            <option value="Pagada">Pagadas</option>
          </select>

          {isAdmin && (
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="bg-negro border border-borde rounded-xl px-3 py-2 text-xs text-white focus:border-rojo focus:outline-none"
            >
              <option value="all">Todos los colaboradores</option>
              <option value="user-maxi">Maximiliano Irujo (30%)</option>
              <option value="user-matias">Matías Pereyra</option>
            </select>
          )}
        </div>

        <div className="text-xs text-gris-texto">
          Mostrando <strong>{filteredCommissions.length}</strong> liquidaciones
        </div>
      </div>

      {/* Lista de Comisiones */}
      {filteredCommissions.length === 0 ? (
        <div className="p-8 rounded-xl bg-panel border border-borde text-center text-gris-texto">
          <Award className="w-10 h-10 mx-auto mb-2 opacity-30 text-white" />
          <p className="text-sm font-bold text-white">No hay comisiones en este período</p>
          <p className="text-xs text-gris-texto mt-1">
            Las comisiones se generan automáticamente al marcar una cotización como "Trabajo Completado".
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredCommissions.map((comm) => {
            const isPending = comm.status === 'Pendiente';

            return (
              <div
                key={comm.id}
                className="p-4 rounded-xl bg-panel border border-borde hover:border-rojo/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-negro border border-borde text-white flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-rojo" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{comm.employee_name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-negro border border-borde text-gris-texto font-bold">
                        {comm.commission_rate}% comisión
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isPending ? 'bg-rojo/10 text-rojo border border-rojo/30' : 'bg-negro text-white border border-borde'
                      }`}>
                        {comm.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-gris-texto mt-1">
                      <span>Cliente: <strong className="text-white">{comm.client_name}</strong></span>
                      <span>•</span>
                      <span>Auto: <strong className="text-white">{comm.vehicle_description}</strong></span>
                      <span>•</span>
                      <span>Cobrado: {formatCurrency(comm.amount_charged, 'UYU')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-borde">
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] text-gris-texto uppercase font-bold">Monto Comisión</div>
                    <div className="text-base font-black font-mono text-white">
                      {formatCurrency(comm.commission_amount, 'UYU')}
                    </div>
                  </div>

                  {isAdmin && isPending && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleTogglePaid(comm)}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>Marcar Pagada</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
