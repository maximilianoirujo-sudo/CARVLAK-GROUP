import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Profile, Role, Business } from '../../types';
import { canViewCommissions } from '../../lib/permissions';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Profile;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  employee
}) => {
  const { profile, updateProfileCommissions } = useAuth();
  const { showToast } = useToast();

  const isBossAdmin = canViewCommissions(profile);

  const [commAuto, setCommAuto] = useState(employee.commissions?.automotora || 0);
  const [commDetail, setCommDetail] = useState(employee.commissions?.detailing || 0);
  const [commInspect, setCommInspect] = useState(employee.commissions?.inspeccion || 0);

  useEffect(() => {
    setCommAuto(employee.commissions?.automotora || 0);
    setCommDetail(employee.commissions?.detailing || 0);
    setCommInspect(employee.commissions?.inspeccion || 0);
  }, [employee]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBossAdmin) {
      onClose();
      return;
    }

    updateProfileCommissions(employee.id, {
      automotora: Number(commAuto) || 0,
      detailing: Number(commDetail) || 0,
      inspeccion: Number(commInspect) || 0
    });

    showToast(`Comisiones actualizadas para ${employee.full_name}`, 'success');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ficha de Empleado: ${employee.full_name}`}
      subtitle={`Roles: ${employee.roles.join(', ')}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        
        {/*  */}
        <div className="p-3.5 rounded-2xl bg-[#131924] border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Teléfono:</span>
            <span className="font-bold text-white font-mono">{employee.phone || 'Sin teléfono'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Email:</span>
            <span className="font-bold text-white">{employee.email || 'Sin email'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Estado:</span>
            <span className={`px-2 py-0.5 rounded-md font-bold ${employee.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {employee.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Negocios Asignados:</span>
            <span className="font-bold text-amber-400 uppercase">{employee.businesses.join(' • ')}</span>
          </div>
        </div>

        {/*  */}
        {isBossAdmin ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-amber-300 uppercase tracking-wider text-[11px]">
                💰 Configuración de Comisión (%)
              </span>
              <span className="text-[10px] text-amber-400 font-bold">Visible solo Admin</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Porcentaje que percibe sobre la facturación de cada negocio:
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">DetailVlak</label>
                <div className="flex items-center gap-1 bg-[#10151E] border border-slate-700 rounded-xl p-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commDetail}
                    onChange={(e) => setCommDetail(Number(e.target.value))}
                    className="w-full bg-transparent text-white font-black text-center outline-none"
                  />
                  <span className="text-purple-400 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Inspección</label>
                <div className="flex items-center gap-1 bg-[#10151E] border border-slate-700 rounded-xl p-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commInspect}
                    onChange={(e) => setCommInspect(Number(e.target.value))}
                    className="w-full bg-transparent text-white font-black text-center outline-none"
                  />
                  <span className="text-emerald-400 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Automotora</label>
                <div className="flex items-center gap-1 bg-[#10151E] border border-slate-700 rounded-xl p-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commAuto}
                    onChange={(e) => setCommAuto(Number(e.target.value))}
                    className="w-full bg-transparent text-white font-black text-center outline-none"
                  />
                  <span className="text-amber-400 font-bold">%</span>
                </div>
              </div>
            </div>

            {employee.id === 'user-maxi' && (
              <p className="text-[10px] text-emerald-400 font-medium">
                ✓ Maximiliano tiene preconfigurado 30% en DetailVlak según los requerimientos.
              </p>
            )}
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs">
            🔒 Las comisiones y márgenes están restringidos al Administrador General.
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
          >
            Cerrar
          </button>
          {isBossAdmin && (
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg"
            >
              Guardar Comisiones
            </button>
          )}
        </div>

      </form>
    </Modal>
  );
};
