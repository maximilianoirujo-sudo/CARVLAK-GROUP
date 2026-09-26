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
      <div className="p-4 sm:p-5 rounded-3xl bg-[#121721] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Equipo &amp; Empleados</h2>
              <p className="text-xs text-slate-400">
                Coordinación del personal de los 3 negocios y auditoría
              </p>
            </div>
          </div>

          {/*  */}
          <div className="bg-slate-900 p-1 rounded-2xl border border-slate-800 flex items-center text-xs font-bold">
            <button
              onClick={() => setActiveSubTab('empleados')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeSubTab === 'empleados'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Empleados ({availableProfiles.length})
            </button>
            <button
              onClick={() => setActiveSubTab('auditoria')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeSubTab === 'auditoria'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Auditoría ({activityLogs.length})
            </button>
          </div>
        </div>
      </div>

      {/*  */}
      {activeSubTab === 'empleados' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 text-xs text-slate-400">
            <span>{availableProfiles.length} integrantes en el equipo</span>
            {isBossAdmin ? (
              <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                <Percent className="w-3.5 h-3.5" /> Comisiones visibles para Maximiliano (Admin)
              </span>
            ) : (
              <span className="text-slate-500 flex items-center gap-1 text-[11px]">
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
                  className="p-4 sm:p-5 rounded-3xl bg-[#121721] border border-slate-800 flex flex-col justify-between space-y-4 shadow-lg hover:border-slate-700 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-white">{emp.full_name}</h3>
                          {isAdminUser && (
                            <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{emp.phone || 'Sin celular'}</span>
                        </p>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        emp.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {emp.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    {/*  */}
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                      {emp.roles.map((r) => (
                        <span key={r} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-bold uppercase">
                          {r}
                        </span>
                      ))}
                      {emp.businesses.map((b) => (
                        <span key={b} className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold uppercase">
                          {b}
                        </span>
                      ))}
                    </div>

                    {/*  */}
                    {isBossAdmin && (
                      <div className="mt-3.5 p-3 rounded-2xl bg-[#0F141E] border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Percent className="w-3 h-3 text-amber-400" /> Comisión por Negocio
                          </span>
                          <span className="text-amber-400 font-extrabold text-[10px]">Configurada</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                            <div className="text-[10px] text-purple-400 font-bold">DetailVlak</div>
                            <div className="font-black text-white">{emp.commissions?.detailing || 0}%</div>
                          </div>
                          <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                            <div className="text-[10px] text-emerald-400 font-bold">Inspección</div>
                            <div className="font-black text-white">{emp.commissions?.inspeccion || 0}%</div>
                          </div>
                          <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                            <div className="text-[10px] text-amber-400 font-bold">Automotora</div>
                            <div className="font-black text-white">{emp.commissions?.automotora || 0}%</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/*  */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      ID: {emp.id.replace('user-', '')}
                    </span>
                    <button
                      onClick={() => setSelectedEmployee(emp)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
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

      {/*  */}
      {activeSubTab === 'auditoria' && (
        <div className="space-y-3">
          <div className="px-1 text-xs text-slate-400">
            Registro automático de altas, modificaciones y estados con fecha y responsable
          </div>

          <div className="space-y-2">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-[#121721] border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-slate-200 font-semibold">
                      <strong className="text-white">{log.user_name || 'Empleado'}</strong> realizó{' '}
                      <span className="text-amber-400 font-bold">"{log.action}"</span> sobre{' '}
                      <span className="uppercase font-bold text-slate-300">{log.entity_type}</span>
                    </div>
                    {log.details && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {JSON.stringify(log.details).slice(0, 100)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono shrink-0">
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
