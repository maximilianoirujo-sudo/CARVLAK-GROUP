import React, { useState } from 'react';
import {
  UserCog,
  Phone,
  Shield,
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
      
      {/*  */}
      {/* Header y SubTabs */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-[#2A2A2A] space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0 border border-[#2A2A2A]">
              <UserCog className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-title font-bold text-white">Equipo &amp; Empleados</h2>
              <p className="text-xs text-[#8A8A8A]">
                Coordinación del personal de los 3 negocios y auditoría
              </p>
            </div>
          </div>

          {/* Toggle Empleados / Auditoría */}
          <div className="bg-black p-1 rounded-xl border border-[#2A2A2A] flex items-center text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveSubTab('empleados')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'empleados'
                  ? 'bg-[#D7141A] text-white font-bold'
                  : 'text-[#8A8A8A] hover:text-white'
              }`}
            >
              Empleados ({availableProfiles.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('auditoria')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'auditoria'
                  ? 'bg-[#D7141A] text-white font-bold'
                  : 'text-[#8A8A8A] hover:text-white'
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
          <div className="flex items-center justify-between px-1 text-xs text-[#8A8A8A]">
            <span>{availableProfiles.length} integrantes en el equipo</span>
            {isBossAdmin ? (
              <span className="text-white font-bold flex items-center gap-1 text-[11px]">
                <Percent className="w-3.5 h-3.5 text-[#D7141A]" /> Comisiones visibles para Maximiliano (Admin)
              </span>
            ) : (
              <span className="text-[#8A8A8A] flex items-center gap-1 text-[11px]">
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
                  className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-[#2A2A2A] flex flex-col justify-between space-y-4 shadow-lg hover:border-white/40 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">{emp.full_name}</h3>
                          {isAdminUser && (
                            <span className="text-[9px] bg-white text-black font-black px-1.5 py-0.5 rounded-md">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#8A8A8A] font-mono mt-0.5 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-[#8A8A8A]" />
                          <span>{emp.phone || 'Sin celular'}</span>
                        </p>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                        emp.is_active ? 'bg-black text-white border-white/40' : 'bg-black text-[#8A8A8A] border-[#2A2A2A]'
                      }`}>
                        {emp.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    {/* Roles y Negocios */}
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                      {emp.roles.map((r) => (
                        <span key={r} className="px-2 py-0.5 rounded-lg bg-black border border-[#2A2A2A] text-white font-bold uppercase">
                          {r}
                        </span>
                      ))}
                      {emp.businesses.map((b) => (
                        <span key={b} className="px-2 py-0.5 rounded-lg bg-black border border-[#2A2A2A] text-[#8A8A8A] font-bold uppercase">
                          {b}
                        </span>
                      ))}
                    </div>

                    {/* Comisiones */}
                    {isBossAdmin && (
                      <div className="mt-3.5 p-3 rounded-xl bg-black border border-[#2A2A2A] space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#8A8A8A] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Percent className="w-3 h-3 text-[#D7141A]" /> Comisión por Negocio
                          </span>
                          <span className="text-white font-extrabold text-[10px]">Configurada</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-1.5 rounded-lg bg-[#141414] border border-[#2A2A2A]">
                            <div className="text-[10px] text-white font-bold">DetailVlak</div>
                            <div className="font-bold text-white">{emp.commissions?.detailing || 0}%</div>
                          </div>
                          <div className="p-1.5 rounded-lg bg-[#141414] border border-[#2A2A2A]">
                            <div className="text-[10px] text-white font-bold">Inspección</div>
                            <div className="font-bold text-white">{emp.commissions?.inspeccion || 0}%</div>
                          </div>
                          <div className="p-1.5 rounded-lg bg-[#141414] border border-[#2A2A2A]">
                            <div className="text-[10px] text-white font-bold">Automotora</div>
                            <div className="font-bold text-white">{emp.commissions?.automotora || 0}%</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="pt-2 border-t border-[#2A2A2A] flex items-center justify-between">
                    <span className="text-[11px] text-[#8A8A8A]">
                      ID: {emp.id.replace('user-', '')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedEmployee(emp)}
                      className="px-3 py-1.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{isBossAdmin ? 'Editar Comisiones' : 'Ver Ficha'}</span>
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
          <div className="px-1 text-xs text-[#8A8A8A]">
            Registro automático de altas, modificaciones y estados con fecha y responsable
          </div>

          <div className="space-y-2">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-black border border-[#2A2A2A] flex items-center justify-center text-white shrink-0">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[#8A8A8A] font-semibold">
                      <strong className="text-white">{log.user_name || 'Empleado'}</strong> realizó{' '}
                      <span className="text-white font-bold">"{log.action}"</span> sobre{' '}
                      <span className="uppercase font-bold text-white">{log.entity_type}</span>
                    </div>
                    {log.details && (
                      <p className="text-[11px] text-[#8A8A8A] mt-0.5">
                        {JSON.stringify(log.details).slice(0, 100)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-[#8A8A8A] font-mono shrink-0">
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
