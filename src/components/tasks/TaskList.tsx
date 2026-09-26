import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Calendar,
  User,
  Filter,
  Check,
  Edit2
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Task, TaskStatus, Business } from '../../types';
import { BUSINESS_CONFIG } from '../../lib/formatters';
import { TaskFormModal } from './TaskFormModal';

export const TaskList: React.FC = () => {
  const { tasks, updateTaskStatus } = useData();
  const { availableProfiles, profile } = useAuth();

  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [businessFilter, setBusinessFilter] = useState<'all' | Business | 'general'>('all');
  const [onlyMine, setOnlyMine] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (businessFilter !== 'all' && t.business !== businessFilter) return false;
      if (onlyMine && t.assigned_to !== profile?.id) return false;
      return true;
    });
  }, [tasks, statusFilter, businessFilter, onlyMine, profile]);

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      
      {/*  */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#121721] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Tareas del Equipo</h2>
              <p className="text-xs text-slate-400">Control operativo interno y seguimiento en 1 toque</p>
            </div>
          </div>

          <button
            onClick={() => {
              setTaskToEdit(null);
              setIsFormOpen(true);
            }}
            className="px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Tarea</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          {/*  */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                statusFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setStatusFilter('Pendiente')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                statusFilter === 'Pendiente'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setStatusFilter('En curso')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                statusFilter === 'En curso'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              En Curso
            </button>
            <button
              onClick={() => setStatusFilter('Hecha')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                statusFilter === 'Hecha'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Hechas
            </button>
          </div>

          {/*  */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setOnlyMine(!onlyMine)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                onlyMine
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {onlyMine ? '👤 Solo mis tareas' : '👥 Todo el equipo'}
            </button>

            <select
              value={businessFilter}
              onChange={(e) => setBusinessFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">🏢 Todos los negocios</option>
              <option value="detailing">✨ DetailVlak</option>
              <option value="inspeccion">🔍 Inspección</option>
              <option value="automotora">🚗 Automotora</option>
              <option value="general">🌐 General</option>
            </select>
          </div>
        </div>
      </div>

      {/*  */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#121721] border border-slate-800 text-center text-slate-400">
          <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-25 text-purple-400" />
          <p className="text-base font-bold text-slate-300">No hay tareas pendientes en esta categoría</p>
          <p className="text-xs text-slate-500 mt-1">¡Buen trabajo! Podés crear nuevas tareas en "+ Nueva Tarea".</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((t) => {
            const assignee = availableProfiles.find((p) => p.id === t.assigned_to);
            const isDone = t.status === 'Hecha';

            const bBadge = t.business === 'general'
              ? { name: 'General', textClass: 'text-slate-400', bgLight: 'bg-slate-900', borderClass: 'border-slate-800' }
              : BUSINESS_CONFIG[t.business];

            return (
              <div
                key={t.id}
                className={`p-4 rounded-3xl bg-[#121721] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDone
                    ? 'border-slate-800/60 opacity-60'
                    : 'border-slate-800 hover:border-slate-700 shadow-md'
                }`}
              >
                {/*  */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => updateTaskStatus(t.id, isDone ? 'Pendiente' : 'Hecha')}
                    className={`mt-0.5 w-6 h-6 rounded-xl border flex items-center justify-center shrink-0 transition-all ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black'
                        : 'border-slate-700 bg-slate-900 text-transparent hover:border-amber-400'
                    }`}
                  >
                    ✓
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${bBadge.bgLight} ${bBadge.textClass} border ${bBadge.borderClass}`}>
                        {bBadge.name}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        t.status === 'Hecha' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        t.status === 'En curso' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    <h3 className={`text-sm font-bold mt-1 ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                      {t.title}
                    </h3>

                    {t.description && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{t.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-2">
                      {assignee && (
                        <span className="flex items-center gap-1 font-semibold text-slate-300">
                          <User className="w-3 h-3 text-cyan-400" /> {assignee.full_name}
                        </span>
                      )}
                      {t.due_date && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3 h-3 text-amber-400" /> Límite: {t.due_date}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/*  */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => {
                      setTaskToEdit(t);
                      setIsFormOpen(true);
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Editar Tarea"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => updateTaskStatus(t.id, isDone ? 'En curso' : 'Hecha')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      isDone
                        ? 'bg-slate-800 text-slate-400 hover:text-white'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                    }`}
                  >
                    {isDone ? 'Reabrir' : 'Completar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isFormOpen && (
        <TaskFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          taskToEdit={taskToEdit}
        />
      )}

    </div>
  );
};
