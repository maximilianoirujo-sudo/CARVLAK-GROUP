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
        <div className="p-4 rounded-2xl bg-[#121826] border border-amber-500/30">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span>Comisiones Pendientes</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
            {formatCurrency(totalPending, 'UYU')}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Por liquidar ({filteredCommissions.filter((c) => c.status === 'Pendiente').length} trabajos)
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#121826] border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span>Comisiones Pagadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
            {formatCurrency(totalPaid, 'UYU')}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Liquidadas este mes</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#121826] border border-slate-800">
          <div className="text-[11px] font-bold text-slate-400">Total Facturado en Trabajos</div>
          <div className="text-2xl font-black text-white font-mono mt-0.5">
            {formatCurrency(totalBilled, 'UYU')}
          </div>
          <p className="text-[10px] text-purple-400 mt-0.5">
            Base sobre la cual se calculan comisiones
          </p>
        </div>
      </div>

      {/* Controles de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#121826] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
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
            className="bg-[#121826] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">Todos los estados</option>
            <option value="Pendiente">Pendientes de cobro</option>
            <option value="Pagada">Pagadas</option>
          </select>

          {isAdmin && (
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="bg-[#121826] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">Todos los colaboradores</option>
              <option value="user-maxi">Maximiliano Irujo (30%)</option>
              <option value="user-matias">Matías Pereyra</option>
            </select>
          )}
        </div>

        <div className="text-xs text-slate-400">
          Mostrando <strong>{filteredCommissions.length}</strong> liquidaciones
        </div>
      </div>

      {/* Lista de Comisiones */}
      {filteredCommissions.length === 0 ? (
        <div className="p-8 rounded-3xl bg-[#121826] border border-slate-800 text-center text-slate-400">
          <Award className="w-10 h-10 mx-auto mb-2 opacity-30 text-purple-400" />
          <p className="text-sm font-bold text-slate-300">No hay comisiones en este período</p>
          <p className="text-xs text-slate-500 mt-1">
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
                className="p-4 rounded-2xl bg-[#121826] border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isPending ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>
                    <Award className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{comm.employee_name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                        {comm.commission_rate}% comisión
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isPending ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {comm.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span>Cliente: <strong className="text-slate-200">{comm.client_name}</strong></span>
                      <span>•</span>
                      <span>Auto: <strong className="text-slate-200">{comm.vehicle_description}</strong></span>
                      <span>•</span>
                      <span>Cobrado: {formatCurrency(comm.amount_charged, 'UYU')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-800">
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Monto Comisión</div>
                    <div className="text-base font-black font-mono text-amber-400">
                      {formatCurrency(comm.commission_amount, 'UYU')}
                    </div>
                  </div>

                  {isAdmin && isPending && (
                    <button
                      onClick={() => handleTogglePaid(comm)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Marcar Pagada</span>
                    </button>
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
