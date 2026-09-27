import React, { useState, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Calendar
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
        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E3] shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-medium text-[#6B6B6B]">
            <span>Comisiones pendientes</span>
            <Clock className="w-4 h-4 text-[#D7141A]" />
          </div>
          <div className="text-2xl font-bold text-[#D7141A] font-mono mt-0.5">
            {formatCurrency(totalPending, 'UYU')}
          </div>
          <p className="text-[11px] text-[#6B6B6B] mt-0.5">
            Por liquidar ({filteredCommissions.filter((c) => c.status === 'Pendiente').length} trabajos)
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E3] shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-medium text-[#6B6B6B]">
            <span>Comisiones pagadas</span>
            <CheckCircle2 className="w-4 h-4 text-[#1E6B43]" />
          </div>
          <div className="text-2xl font-bold text-[#161616] font-mono mt-0.5">
            {formatCurrency(totalPaid, 'UYU')}
          </div>
          <p className="text-[11px] text-[#6B6B6B] mt-0.5">Liquidadas este mes</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E3] shadow-xs">
          <div className="text-[11px] font-medium text-[#6B6B6B]">Total facturado en trabajos</div>
          <div className="text-2xl font-bold text-[#161616] font-mono mt-0.5">
            {formatCurrency(totalBilled, 'UYU')}
          </div>
          <p className="text-[11px] text-[#6B6B6B] mt-0.5">
            Base sobre la cual se calculan comisiones
          </p>
        </div>
      </div>

      {/* Controles de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-[#E5E5E3] rounded-xl px-3 py-1.5 text-xs text-[#161616]">
            <Calendar className="w-3.5 h-3.5 text-[#9A9A9A]" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-[#161616] font-medium focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="Pendiente">Pendientes de cobro</option>
            <option value="Pagada">Pagadas</option>
          </select>

          {isAdmin && (
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none cursor-pointer"
            >
              <option value="all">Todos los colaboradores</option>
              <option value="user-maxi">Maximiliano Irujo (30%)</option>
              <option value="user-matias">Matías Pereyra</option>
            </select>
          )}
        </div>

        <div className="text-xs text-[#6B6B6B]">
          Mostrando <strong>{filteredCommissions.length}</strong> liquidaciones
        </div>
      </div>

      {/* Lista de Comisiones */}
      {filteredCommissions.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-[#E5E5E3] text-center text-[#6B6B6B]">
          <Award className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#9A9A9A]" />
          <p className="text-sm font-semibold text-[#161616]">No hay comisiones en este período</p>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Las comisiones se generan automáticamente al marcar una cotización como "Trabajo completado".
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredCommissions.map((comm) => {
            const isPending = comm.status === 'Pendiente';

            return (
              <div
                key={comm.id}
                className="p-4 rounded-2xl bg-white border border-[#E5E5E3] hover:border-[#D0D0CD] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] text-[#D7141A] flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#161616] text-xs">{comm.employee_name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F5F4] border border-[#E5E5E3] text-[#6B6B6B] font-medium">
                        {comm.commission_rate}% comisión
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                        isPending ? 'bg-[#FEF7EC] text-[#945B0E] border-[#945B0E]/20' : 'bg-[#EEF7F2] text-[#1E6B43] border-[#1E6B43]/20'
                      }`}>
                        {comm.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6B6B6B] mt-1">
                      <span>Cliente: <strong className="text-[#161616]">{comm.client_name}</strong></span>
                      <span>•</span>
                      <span>Auto: <strong className="text-[#161616]">{comm.vehicle_description}</strong></span>
                      <span>•</span>
                      <span>Cobrado: {formatCurrency(comm.amount_charged, 'UYU')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-[#E5E5E3]">
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] text-[#6B6B6B] font-medium">Monto comisión</div>
                    <div className="text-base font-bold font-mono text-[#161616]">
                      {formatCurrency(comm.commission_amount, 'UYU')}
                    </div>
                  </div>

                  {isAdmin && isPending && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleTogglePaid(comm)}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1E6B43]" />
                      <span>Marcar pagada</span>
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
