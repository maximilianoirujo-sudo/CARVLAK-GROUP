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
      
      {/* Header y Filtros */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-[#2A2A2A] space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0 border border-[#2A2A2A]">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-title font-bold text-white">Tareas del Equipo</h2>
              <p className="text-xs text-[#8A8A8A]">Control operativo interno y seguimiento en 1 toque</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setTaskToEdit(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#D7141A] hover:bg-[#B51015] text-white font-title font-bold text-xs uppercase tracking-wider shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Tarea</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#2A2A2A]">
          {/* Filtro por estado */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#D7141A] text-white border-[#D7141A]'
                  : 'bg-black border-[#2A2A2A] text-[#8A8A8A] hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Pendiente')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                statusFilter === 'Pendiente'
                  ? 'bg-[#D7141A] text-white border-[#D7141A]'
                  : 'bg-black border-[#2A2A2A] text-[#8A8A8A] hover:text-white'
              }`}
            >
              Pendientes
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('En curso')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                statusFilter === 'En curso'
                  ? 'bg-[#D7141A] text-white border-[#D7141A]'
                  : 'bg-black border-[#2A2A2A] text-[#8A8A8A] hover:text-white'
              }`}
            >
              En Curso
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Hecha')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                statusFilter === 'Hecha'
                  ? 'bg-[#D7141A] text-white border-[#D7141A]'
                  : 'bg-black border-[#2A2A2A] text-[#8A8A8A] hover:text-white'
              }`}
            >
              Hechas
            </button>
          </div>

          {/* Filtro por negocio y sólo mías */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyMine(!onlyMine)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                onlyMine
                  ? 'bg-transparent text-white border-white'
                  : 'bg-black text-[#8A8A8A] border-[#2A2A2A] hover:text-white'
              }`}
            >
              {onlyMine ? '👤 Solo mis tareas' : '👥 Todo el equipo'}
            </button>

            <select
              value={businessFilter}
              onChange={(e) => setBusinessFilter(e.target.value as any)}
              className="bg-black border border-[#2A2A2A] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-[#D7141A] cursor-pointer"
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

      {/* Lista de Tareas */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#141414] border border-[#2A2A2A] text-center text-[#8A8A8A]">
          <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-25 text-white" />
          <p className="text-base font-bold text-white">No hay tareas pendientes en esta categoría</p>
          <p className="text-xs text-[#8A8A8A] mt-1">¡Buen trabajo! Podés crear nuevas tareas en "+ Nueva Tarea".</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((t) => {
            const assignee = availableProfiles.find((p) => p.id === t.assigned_to);
            const isDone = t.status === 'Hecha';

            const bName = t.business === 'general' ? 'General' : BUSINESS_CONFIG[t.business]?.name || t.business;

            return (
              <div
                key={t.id}
                className={`p-4 rounded-2xl bg-[#141414] border border-[#2A2A2A] hover:border-white/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                  isDone ? 'opacity-60' : ''
                }`}
              >
                {/* Cuerpo de la tarea */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => updateTaskStatus(t.id, isDone ? 'Pendiente' : 'Hecha')}
                    className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      isDone
                        ? 'bg-white border-white text-black font-black'
                        : 'border-[#2A2A2A] bg-black text-transparent hover:border-white'
                    }`}
                  >
                    ✓
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-black text-white border border-[#2A2A2A]">
                        {bName}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-black text-[#8A8A8A] border border-[#2A2A2A]">
                        {t.status}
                      </span>
                    </div>

                    <h3 className={`text-sm font-bold mt-1 ${isDone ? 'line-through text-[#8A8A8A]' : 'text-white'}`}>
                      {t.title}
                    </h3>

                    {t.description && (
                      <p className="text-xs text-[#8A8A8A] mt-0.5 line-clamp-2">{t.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8A8A8A] mt-2">
                      {assignee && (
                        <span className="flex items-center gap-1 font-semibold text-white">
                          <User className="w-3 h-3 text-[#8A8A8A]" /> {assignee.full_name}
                        </span>
                      )}
                      {t.due_date && (
                        <span className="flex items-center gap-1 text-[#8A8A8A]">
                          <Calendar className="w-3 h-3 text-[#8A8A8A]" /> Límite: {t.due_date}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      setTaskToEdit(t);
                      setIsFormOpen(true);
                    }}
                    className="p-2 rounded-xl bg-black border border-[#2A2A2A] hover:border-white text-[#8A8A8A] hover:text-white transition-colors cursor-pointer"
                    title="Editar Tarea"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => updateTaskStatus(t.id, isDone ? 'En curso' : 'Hecha')}
                    className="px-3 py-1.5 rounded-xl font-semibold text-xs transition-all bg-transparent hover:bg-white/10 text-white border border-white cursor-pointer"
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
