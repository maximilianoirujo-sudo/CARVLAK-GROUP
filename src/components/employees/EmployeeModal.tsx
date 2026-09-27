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
      title={`Ficha de empleado: ${employee.full_name}`}
      subtitle={`Roles: ${employee.roles.join(', ')}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        
        {/* Datos generales */}
        <div className="p-3.5 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[#6B6B6B]">Teléfono:</span>
            <span className="font-semibold text-[#161616] font-mono">{employee.phone || 'Sin teléfono'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#6B6B6B]">Email:</span>
            <span className="font-semibold text-[#161616]">{employee.email || 'Sin email'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#6B6B6B]">Estado:</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
              employee.is_active 
                ? 'bg-[#EEF7F2] text-[#1E6B43] border-[#1E6B43]/20' 
                : 'border-[#E5E5E3] text-[#6B6B6B] bg-[#F5F5F4]'
            }`}>
              {employee.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#6B6B6B]">Negocios asignados:</span>
            <span className="font-semibold text-[#161616] capitalize">{employee.businesses.join(' • ')}</span>
          </div>
        </div>

        {/* Comisiones */}
        {isBossAdmin ? (
          <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#161616] text-xs">
                Configuración de comisión (%)
              </span>
              <span className="text-[11px] text-[#6B6B6B]">Visible solo admin</span>
            </div>
            <p className="text-[11px] text-[#6B6B6B]">
              Porcentaje que percibe sobre la facturación de cada negocio:
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-[#6B6B6B] font-medium mb-1">DetailVlak</label>
                <div className="flex items-center gap-1 bg-white border border-[#E5E5E3] rounded-xl p-2 focus-within:border-[#D7141A]">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commDetail}
                    onChange={(e) => setCommDetail(Number(e.target.value))}
                    className="w-full bg-transparent text-[#161616] font-semibold text-center outline-none text-xs"
                  />
                  <span className="text-[#6B6B6B] font-medium">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#6B6B6B] font-medium mb-1">Inspección</label>
                <div className="flex items-center gap-1 bg-white border border-[#E5E5E3] rounded-xl p-2 focus-within:border-[#D7141A]">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commInspect}
                    onChange={(e) => setCommInspect(Number(e.target.value))}
                    className="w-full bg-transparent text-[#161616] font-semibold text-center outline-none text-xs"
                  />
                  <span className="text-[#6B6B6B] font-medium">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#6B6B6B] font-medium mb-1">Automotora</label>
                <div className="flex items-center gap-1 bg-white border border-[#E5E5E3] rounded-xl p-2 focus-within:border-[#D7141A]">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commAuto}
                    onChange={(e) => setCommAuto(Number(e.target.value))}
                    className="w-full bg-transparent text-[#161616] font-semibold text-center outline-none text-xs"
                  />
                  <span className="text-[#6B6B6B] font-medium">%</span>
                </div>
              </div>
            </div>

            {employee.id === 'user-maxi' && (
              <p className="text-[11px] text-[#6B6B6B]">
                Maximiliano tiene preconfigurado 30% en DetailVlak según los requerimientos.
              </p>
            )}
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] text-center text-[#6B6B6B] text-xs">
            Las comisiones y márgenes están restringidos al Administrador General.
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E5E3]">
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
              Guardar comisiones
            </Button>
          )}
        </div>

      </form>
    </Modal>
  );
};
