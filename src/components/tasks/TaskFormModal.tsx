import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Task, Business, TaskStatus } from '../../types';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  taskToEdit
}) => {
  const { addTask, updateTask } = useData();
  const { availableProfiles, profile } = useAuth();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [business, setBusiness] = useState<Business | 'general'>('general');
  const [assignedTo, setAssignedTo] = useState(profile?.id || '');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<TaskStatus>('Pendiente');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setBusiness(taskToEdit.business);
      setAssignedTo(taskToEdit.assigned_to || '');
      setDueDate(taskToEdit.due_date || new Date().toISOString().slice(0, 10));
      setStatus(taskToEdit.status);
    } else {
      setTitle('');
      setDescription('');
      setBusiness('general');
      setAssignedTo(profile?.id || '');
      setDueDate(new Date().toISOString().slice(0, 10));
      setStatus('Pendiente');
    }
  }, [taskToEdit, isOpen, profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('El título de la tarea es obligatorio', 'warning');
      return;
    }

    if (taskToEdit) {
      updateTask(taskToEdit.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        business,
        assigned_to: assignedTo || undefined,
        due_date: dueDate || undefined,
        status
      });
      showToast('Tarea actualizada', 'success');
    } else {
      addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        business,
        assigned_to: assignedTo || undefined,
        due_date: dueDate || undefined,
        status
      });
      showToast('Tarea creada exitosamente', 'success');
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Editar Tarea' : 'Nueva Tarea Operativa'}
      subtitle="Asignación y seguimiento interno del equipo"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        
        <div>
          <label className="block text-slate-400 font-bold mb-1">Título de la Tarea *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Calibrar sensor, Comprar sellador cerámico..."
            required
            className="w-full bg-[#131924] border border-slate-700 rounded-xl p-3 text-sm text-white font-semibold focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-slate-400 font-bold mb-1">Descripción / Detalles</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Indicaciones específicas para quien realice la tarea..."
            className="w-full bg-[#131924] border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-400 font-bold mb-1">Negocio</label>
            <select
              value={business}
              onChange={(e) => setBusiness(e.target.value as any)}
              className="w-full bg-[#131924] border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
            >
              <option value="general">🏢 General / Todo el grupo</option>
              <option value="detailing">✨ DetailVlak</option>
              <option value="inspeccion">🔍 Inspección</option>
              <option value="automotora">🚗 Automotora</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Asignar a Empleado</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full bg-[#131924] border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
            >
              <option value="">Sin asignar</option>
              {availableProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-400 font-bold mb-1">Fecha Límite</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-[#131924] border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full bg-[#131924] border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
            >
              <option value="Pendiente">🟡 Pendiente</option>
              <option value="En curso">🔵 En curso</option>
              <option value="Hecha">✅ Hecha / Finalizada</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20"
          >
            {taskToEdit ? 'Guardar Cambios' : 'Crear Tarea'}
          </button>
        </div>

      </form>
    </Modal>
  );
};
