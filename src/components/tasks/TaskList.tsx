import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Calendar,
  User,
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
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5F5F4] text-[#161616] flex items-center justify-center shrink-0 border border-[#E5E5E3]">
              <CheckSquare className="w-5 h-5 text-[#161616]" />
            </div>
            <div>
              <h2 className="text-lg font-title font-bold text-[#161616]">Tareas del equipo</h2>
              <p className="text-xs text-[#6B6B6B]">Control operativo interno y seguimiento en un toque</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setTaskToEdit(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#D7141A] hover:bg-[#B80E14] text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva tarea</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E5E5E3]">
          {/* Filtro por estado */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#161616] text-white border-[#161616] font-semibold shadow-xs'
                  : 'bg-white border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4]'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Pendiente')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                statusFilter === 'Pendiente'
                  ? 'bg-[#161616] text-white border-[#161616] font-semibold shadow-xs'
                  : 'bg-white border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4]'
              }`}
            >
              Pendientes
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('En curso')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                statusFilter === 'En curso'
                  ? 'bg-[#161616] text-white border-[#161616] font-semibold shadow-xs'
                  : 'bg-white border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4]'
              }`}
            >
              En curso
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Hecha')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                statusFilter === 'Hecha'
                  ? 'bg-[#161616] text-white border-[#161616] font-semibold shadow-xs'
                  : 'bg-white border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4]'
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
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                onlyMine
                  ? 'bg-[#F5F5F4] text-[#161616] border-[#D0D0CD] font-semibold shadow-xs'
                  : 'bg-white text-[#6B6B6B] border-[#E5E5E3] hover:text-[#161616] hover:bg-[#F5F5F4]'
              }`}
            >
              {onlyMine ? 'Solo mis tareas' : 'Todo el equipo'}
            </button>

            <select
              value={businessFilter}
              onChange={(e) => setBusinessFilter(e.target.value as any)}
              className="bg-white border border-[#E5E5E3] rounded-xl px-2.5 py-1.5 text-xs font-medium text-[#161616] focus:outline-none focus:border-[#D7141A] cursor-pointer"
            >
              <option value="all">Todos los negocios</option>
              <option value="detailing">DetailVlak</option>
              <option value="inspeccion">Inspección</option>
              <option value="automotora">Automotora</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Tareas */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-[#E5E5E3] text-center text-[#6B6B6B]">
          <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-25 text-[#9A9A9A]" />
          <p className="text-base font-bold text-[#161616]">No hay tareas en esta categoría</p>
          <p className="text-xs text-[#6B6B6B] mt-1">¡Buen trabajo! Podés crear nuevas tareas en "+ Nueva tarea".</p>
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
                className={`p-4 rounded-2xl bg-white border border-[#E5E5E3] hover:border-[#D0D0CD] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                  isDone ? 'opacity-60 bg-[#FAFAFA]' : ''
                }`}
              >
                {/* Cuerpo de la tarea */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => updateTaskStatus(t.id, isDone ? 'Pendiente' : 'Hecha')}
                    className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      isDone
                        ? 'bg-[#161616] border-[#161616] text-white font-bold'
                        : 'border-[#D0D0CD] bg-white text-transparent hover:border-[#161616]'
                    }`}
                  >
                    ✓
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3]">
                        {bName}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                        t.status === 'Pendiente'
                          ? 'bg-[#FEF7EC] text-[#945B0E] border-[#945B0E]/20'
                          : t.status === 'En curso'
                          ? 'bg-[#EEF7F2] text-[#1E6B43] border-[#1E6B43]/20'
                          : 'bg-[#F5F5F4] text-[#6B6B6B] border-[#E5E5E3]'
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    <h3 className={`text-sm font-semibold mt-1 ${isDone ? 'line-through text-[#9A9A9A]' : 'text-[#161616]'}`}>
                      {t.title}
                    </h3>

                    {t.description && (
                      <p className="text-xs text-[#6B6B6B] mt-0.5 line-clamp-2">{t.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#6B6B6B] mt-2">
                      {assignee && (
                        <span className="flex items-center gap-1 font-medium text-[#161616]">
                          <User className="w-3 h-3 text-[#9A9A9A]" /> {assignee.full_name}
                        </span>
                      )}
                      {t.due_date && (
                        <span className="flex items-center gap-1 text-[#6B6B6B]">
                          <Calendar className="w-3 h-3 text-[#9A9A9A]" /> Límite: {t.due_date}
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
                    className="p-2 rounded-xl bg-white border border-[#E5E5E3] hover:border-[#D0D0CD] text-[#6B6B6B] hover:text-[#161616] transition-colors cursor-pointer"
                    title="Editar tarea"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => updateTaskStatus(t.id, isDone ? 'En curso' : 'Hecha')}
                    className="px-3 py-1.5 rounded-xl font-medium text-xs transition-all bg-white hover:bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3] cursor-pointer"
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
