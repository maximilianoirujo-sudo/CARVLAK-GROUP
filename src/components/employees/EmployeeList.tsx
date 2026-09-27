import React, { useState } from 'react';
import {
  UserCog,
  Phone,
  Percent,
  History,
  Lock,
  Edit2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Profile } from '../../types';
import { canViewCommissions } from '../../lib/permissions';
import { EmployeeModal } from './EmployeeModal';

export const EmployeeList: React.FC = () => {
  const { availableProfiles, profile } = useAuth();
  const { activityLogs } = useData();

  const [activeSubTab, setActiveSubTab] = useState<'empleados' | 'auditoria'>('empleados');
  const [selectedEmployee, setSelectedEmployee] = useState<Profile | null>(null);

  const isBossAdmin = canViewCommissions(profile);

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      
      {/* Header y SubTabs */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5F5F4] text-[#161616] flex items-center justify-center shrink-0 border border-[#E5E5E3]">
              <UserCog className="w-5 h-5 text-[#161616]" />
            </div>
            <div>
              <h2 className="text-lg font-title font-bold text-[#161616]">Equipo y empleados</h2>
              <p className="text-xs text-[#6B6B6B]">
                Coordinación del personal de los 3 negocios y auditoría
              </p>
            </div>
          </div>

          {/* Toggle Empleados / Auditoría */}
          <div className="bg-[#F5F5F4] p-1 rounded-xl border border-[#E5E5E3] flex items-center text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveSubTab('empleados')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'empleados'
                  ? 'bg-white text-[#161616] shadow-xs font-semibold'
                  : 'text-[#6B6B6B] hover:text-[#161616]'
              }`}
            >
              Empleados ({availableProfiles.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('auditoria')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'auditoria'
                  ? 'bg-white text-[#161616] shadow-xs font-semibold'
                  : 'text-[#6B6B6B] hover:text-[#161616]'
              }`}
            >
              Auditoría ({activityLogs.length})
            </button>
          </div>
        </div>
      </div>

      {/* Vista de Empleados */}
      {activeSubTab === 'empleados' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 text-xs text-[#6B6B6B]">
            <span>{availableProfiles.length} integrantes en el equipo</span>
            {isBossAdmin ? (
              <span className="text-[#161616] font-semibold flex items-center gap-1 text-[11px]">
                <Percent className="w-3.5 h-3.5 text-[#D7141A]" /> Comisiones visibles para Maximiliano (Admin)
              </span>
            ) : (
              <span className="text-[#6B6B6B] flex items-center gap-1 text-[11px]">
                <Lock className="w-3.5 h-3.5" /> Comisiones restringidas al Administrador
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableProfiles.map((emp) => {
              const isAdminUser = emp.roles.includes('admin');

              return (
                <div
                  key={emp.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] flex flex-col justify-between space-y-4 shadow-xs hover:border-[#D0D0CD] transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-[#161616]">{emp.full_name}</h3>
                          {isAdminUser && (
                            <span className="text-[10px] bg-[#161616] text-white font-semibold px-2 py-0.5 rounded-md">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6B6B6B] font-mono mt-1 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-[#9A9A9A]" />
                          <span>{emp.phone || 'Sin celular'}</span>
                        </p>
                      </div>

                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                        emp.is_active ? 'bg-[#EEF7F2] text-[#1E6B43] border-[#1E6B43]/20' : 'bg-[#F5F5F4] text-[#6B6B6B] border-[#E5E5E3]'
                      }`}>
                        {emp.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    {/* Roles y Negocios */}
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                      {emp.roles.map((r) => (
                        <span key={r} className="px-2 py-0.5 rounded-md bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616] font-medium capitalize">
                          {r}
                        </span>
                      ))}
                      {emp.businesses.map((b) => (
                        <span key={b} className="px-2 py-0.5 rounded-md bg-[#F5F5F4] border border-[#E5E5E3] text-[#6B6B6B] font-medium capitalize">
                          {b}
                        </span>
                      ))}
                    </div>

                    {/* Comisiones */}
                    {isBossAdmin && (
                      <div className="mt-3.5 p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#6B6B6B] font-medium flex items-center gap-1">
                            <Percent className="w-3 h-3 text-[#D7141A]" /> Comisión por negocio
                          </span>
                          <span className="text-[#161616] font-semibold text-[11px]">Configurada</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2 rounded-xl bg-white border border-[#E5E5E3] shadow-xs">
                            <div className="text-[11px] text-[#6B6B6B]">DetailVlak</div>
                            <div className="font-bold text-[#161616] mt-0.5">{emp.commissions?.detailing || 0}%</div>
                          </div>
                          <div className="p-2 rounded-xl bg-white border border-[#E5E5E3] shadow-xs">
                            <div className="text-[11px] text-[#6B6B6B]">Inspección</div>
                            <div className="font-bold text-[#161616] mt-0.5">{emp.commissions?.inspeccion || 0}%</div>
                          </div>
                          <div className="p-2 rounded-xl bg-white border border-[#E5E5E3] shadow-xs">
                            <div className="text-[11px] text-[#6B6B6B]">Automotora</div>
                            <div className="font-bold text-[#161616] mt-0.5">{emp.commissions?.automotora || 0}%</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="pt-3 border-t border-[#E5E5E3] flex items-center justify-between">
                    <span className="text-[11px] text-[#6B6B6B]">
                      ID: {emp.id.replace('user-', '')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedEmployee(emp)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3] hover:border-[#D0D0CD] font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#6B6B6B]" />
                      <span>{isBossAdmin ? 'Editar comisiones' : 'Ver ficha'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Auditoría */}
      {activeSubTab === 'auditoria' && (
        <div className="space-y-3">
          <div className="px-1 text-xs text-[#6B6B6B]">
            Registro automático de altas, modificaciones y estados con fecha y responsable
          </div>

          <div className="space-y-2">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-white border border-[#E5E5E3] flex items-center justify-between gap-3 text-xs shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] flex items-center justify-center text-[#161616] shrink-0">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[#6B6B6B]">
                      <strong className="text-[#161616] font-semibold">{log.user_name || 'Empleado'}</strong> realizó{' '}
                      <span className="text-[#161616] font-medium">"{log.action}"</span> sobre{' '}
                      <span className="font-semibold text-[#161616]">{log.entity_type}</span>
                    </div>
                    {log.details && (
                      <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                        {JSON.stringify(log.details).slice(0, 100)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-[#6B6B6B] font-mono shrink-0">
                  {log.created_at.slice(0, 16).replace('T', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedEmployee && (
        <EmployeeModal
          isOpen={Boolean(selectedEmployee)}
          onClose={() => setSelectedEmployee(null)}
          employee={selectedEmployee}
        />
      )}

    </div>
  );
};
