import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Profile } from '../../types';
import { canViewCommissions } from '../../lib/permissions';
import { Button } from '../ui/Button';

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
        
        {/* Datos generales */}
        <div className="p-3.5 rounded-xl bg-negro border border-borde space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gris-texto">Teléfono:</span>
            <span className="font-bold text-white font-mono">{employee.phone || 'Sin teléfono'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gris-texto">Email:</span>
            <span className="font-bold text-white">{employee.email || 'Sin email'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gris-texto">Estado:</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
              employee.is_active 
                ? 'bg-white text-black' 
                : 'border border-borde text-gris-texto'
            }`}>
              {employee.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gris-texto">Negocios Asignados:</span>
            <span className="font-bold text-white uppercase">{employee.businesses.join(' • ')}</span>
          </div>
        </div>

        {/* Comisiones */}
        {isBossAdmin ? (
          <div className="p-4 rounded-xl bg-panel border border-borde space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Configuración de Comisión (%)
              </span>
              <span className="text-[10px] text-gris-texto font-semibold">Visible solo Admin</span>
            </div>
            <p className="text-[11px] text-gris-texto">
              Porcentaje que percibe sobre la facturación de cada negocio:
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-gris-texto font-bold mb-1">DetailVlak</label>
                <div className="flex items-center gap-1 bg-negro border border-borde rounded-xl p-2 focus-within:border-rojo">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commDetail}
                    onChange={(e) => setCommDetail(Number(e.target.value))}
                    className="w-full bg-transparent text-white font-bold text-center outline-none"
                  />
                  <span className="text-gris-texto font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gris-texto font-bold mb-1">Inspección</label>
                <div className="flex items-center gap-1 bg-negro border border-borde rounded-xl p-2 focus-within:border-rojo">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commInspect}
                    onChange={(e) => setCommInspect(Number(e.target.value))}
                    className="w-full bg-transparent text-white font-bold text-center outline-none"
                  />
                  <span className="text-gris-texto font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gris-texto font-bold mb-1">Automotora</label>
                <div className="flex items-center gap-1 bg-negro border border-borde rounded-xl p-2 focus-within:border-rojo">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commAuto}
                    onChange={(e) => setCommAuto(Number(e.target.value))}
                    className="w-full bg-transparent text-white font-bold text-center outline-none"
                  />
                  <span className="text-gris-texto font-bold">%</span>
                </div>
              </div>
            </div>

            {employee.id === 'user-maxi' && (
              <p className="text-[10px] text-gris-texto font-medium">
                Maximiliano tiene preconfigurado 30% en DetailVlak según los requerimientos.
              </p>
            )}
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-panel border border-borde text-center text-gris-texto text-xs">
            Las comisiones y márgenes están restringidos al Administrador General.
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-borde">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cerrar
          </Button>
          {isBossAdmin && (
            <Button
              type="submit"
              variant="primary"
            >
              Guardar Comisiones
            </Button>
          )}
        </div>

      </form>
    </Modal>
  );
};
