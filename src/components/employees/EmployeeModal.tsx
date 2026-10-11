import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Profile, Role, Business } from '../../types';
import { canViewCommissions } from '../../lib/permissions';
import { Button } from '../ui/Button';
import { UserPlus, UserCheck, Shield, Briefcase, Phone, Mail, Percent, Power } from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Profile | null;
}

const AVAILABLE_ROLES: { id: Role; label: string }[] = [
  { id: 'admin', label: 'Admin (Acceso total)' },
  { id: 'encargado', label: 'Encargado general' },
  { id: 'encargado_detailing', label: 'Encargado Detailing' },
  { id: 'detailer', label: 'Detailer / Operador' },
  { id: 'vendedor', label: 'Vendedor / Asesor' },
  { id: 'inspector', label: 'Inspector técnico' }
];

const AVAILABLE_BUSINESSES: { id: Business; label: string }[] = [
  { id: 'detailing', label: 'DetailVlak (Detailing)' },
  { id: 'automotora', label: 'Automotora' },
  { id: 'inspeccion', label: 'Carbusters (Inspección)' }
];

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  employee
}) => {
  const { profile, updateProfileCommissions, addProfile, updateProfile, toggleProfileActive } = useAuth();
  const { showToast } = useToast();

  const isBossAdmin = canViewCommissions(profile);
  const isCreating = !employee;

  const [fullName, setFullName] = useState(employee?.full_name || '');
  const [email, setEmail] = useState(employee?.email || '');
  const [phone, setPhone] = useState(employee?.phone || '');
  const [isActive, setIsActive] = useState<boolean>(employee ? employee.is_active : true);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(employee?.roles || ['detailer']);
  const [selectedBusinesses, setSelectedBusinesses] = useState<Business[]>(employee?.businesses || ['detailing']);

  const [commAuto, setCommAuto] = useState<number>(employee?.commissions?.automotora || 0);
  const [commDetail, setCommDetail] = useState<number>(employee?.commissions?.detailing || 0);
  const [commInspect, setCommInspect] = useState<number>(employee?.commissions?.inspeccion || 0);

  useEffect(() => {
    if (employee) {
      setFullName(employee.full_name);
      setEmail(employee.email || '');
      setPhone(employee.phone || '');
      setIsActive(employee.is_active);
      setSelectedRoles(employee.roles || ['detailer']);
      setSelectedBusinesses(employee.businesses || ['detailing']);
      setCommAuto(employee.commissions?.automotora || 0);
      setCommDetail(employee.commissions?.detailing || 0);
      setCommInspect(employee.commissions?.inspeccion || 0);
    } else {
      setFullName('');
      setEmail('');
      setPhone('');
      setIsActive(true);
      setSelectedRoles(['detailer']);
      setSelectedBusinesses(['detailing']);
      setCommAuto(0);
      setCommDetail(0);
      setCommInspect(0);
    }
  }, [employee, isOpen]);

  const toggleRole = (r: Role) => {
    if (selectedRoles.includes(r)) {
      if (selectedRoles.length === 1) return; // al menos 1 rol
      setSelectedRoles(selectedRoles.filter((item) => item !== r));
    } else {
      setSelectedRoles([...selectedRoles, r]);
    }
  };

  const toggleBusiness = (b: Business) => {
    if (selectedBusinesses.includes(b)) {
      if (selectedBusinesses.length === 1) return;
      setSelectedBusinesses(selectedBusinesses.filter((item) => item !== b));
    } else {
      setSelectedBusinesses([...selectedBusinesses, b]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      showToast('Por favor ingresá el nombre completo del colaborador.', 'error');
      return;
    }

    if (isCreating) {
      if (!email.trim()) {
        showToast('El email es requerido para invitar al colaborador.', 'error');
        return;
      }
      const res = await addProfile({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        roles: selectedRoles,
        businesses: selectedBusinesses,
        is_active: isActive,
        commissions: {
          automotora: Number(commAuto) || 0,
          detailing: Number(commDetail) || 0,
          inspeccion: Number(commInspect) || 0
        }
      });
      if (res.error) {
        showToast(`Error al crear usuario: ${res.error}`, 'error');
        return;
      }
      showToast(`Usuario ${fullName} creado e invitado exitosamente`, 'success');
    } else if (employee) {
      const updates: Partial<Profile> = {
        full_name: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        roles: selectedRoles,
        businesses: selectedBusinesses,
        is_active: isActive,
        commissions: {
          automotora: Number(commAuto) || 0,
          detailing: Number(commDetail) || 0,
          inspeccion: Number(commInspect) || 0
        }
      };

      const res = await updateProfile(employee.id, updates);
      if (res.error) {
        showToast(`Error al actualizar usuario: ${res.error}`, 'error');
        return;
      }

      if (isBossAdmin) {
        updateProfileCommissions(employee.id, {
          automotora: Number(commAuto) || 0,
          detailing: Number(commDetail) || 0,
          inspeccion: Number(commInspect) || 0
        });
      }
      showToast(`Colaborador ${fullName} actualizado exitosamente`, 'success');
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreating ? 'Nuevo Integrante del Equipo' : `Ficha de Colaborador: ${fullName}`}
      subtitle={isCreating ? 'Creá un nuevo acceso con roles y negocios asignados' : `ID: ${employee?.id?.replace('user-', '')}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        
        {/* Datos Personales */}
        <div className="p-3.5 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
            <span className="font-bold text-[#161616]">Datos de contacto y acceso</span>
            {!isCreating && (
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#EEF7F2] text-[#1E6B43] border-[#1E6B43]/20 hover:bg-emerald-100'
                    : 'bg-[#F5F5F4] text-[#6B6B6B] border-[#E5E5E3] hover:bg-gray-200'
                }`}
              >
                <Power className="w-3 h-3" />
                <span>{isActive ? 'Activo' : 'Inactivo'}</span>
              </button>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#6B6B6B] mb-1">Nombre y Apellido *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej: Romina Pérez"
              className="w-full bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] font-medium focus:border-[#D7141A] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#6B6B6B] mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-[#9A9A9A]" /> Email (Login) {isCreating && '*'}
              </label>
              <input
                type="email"
                required={isCreating}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colaborador@carvlak.com"
                className="w-full bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] focus:border-[#D7141A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#6B6B6B] mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#9A9A9A]" /> Teléfono
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+598 99 123 456"
                className="w-full bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] font-mono focus:border-[#D7141A] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Roles */}
        <div className="p-3.5 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] space-y-2">
          <label className="block font-bold text-[#161616] flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#D7141A]" />
            <span>Roles del sistema</span>
          </label>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {AVAILABLE_ROLES.map((r) => {
              const isChecked = selectedRoles.includes(r.id);
              return (
                <label
                  key={r.id}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-white border-[#161616] font-semibold text-[#161616] shadow-xs'
                      : 'bg-white/60 border-[#E5E5E3] text-[#6B6B6B] hover:bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleRole(r.id)}
                    className="w-3.5 h-3.5 rounded text-[#D7141A] accent-[#D7141A]"
                  />
                  <span>{r.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Negocios asignados */}
        <div className="p-3.5 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] space-y-2">
          <label className="block font-bold text-[#161616] flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-[#6B6B6B]" />
            <span>Negocios asignados</span>
          </label>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {AVAILABLE_BUSINESSES.map((b) => {
              const isChecked = selectedBusinesses.includes(b.id);
              return (
                <label
                  key={b.id}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-white border-[#161616] font-semibold text-[#161616] shadow-xs'
                      : 'bg-white/60 border-[#E5E5E3] text-[#6B6B6B] hover:bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleBusiness(b.id)}
                    className="w-3.5 h-3.5 rounded text-[#D7141A] accent-[#D7141A]"
                  />
                  <span>{b.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Comisiones (solo admin) */}
        {isBossAdmin && (
          <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#161616] text-xs flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-[#D7141A]" />
                <span>Configuración de comisiones por negocio (%)</span>
              </span>
              <span className="text-[10px] bg-[#161616] text-white px-2 py-0.5 rounded-md font-semibold">
                Solo Admin
              </span>
            </div>
            <p className="text-[11px] text-[#6B6B6B]">
              Porcentaje base percibido sobre la facturación de cada unidad operativa:
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-[#6B6B6B] font-medium mb-1">DetailVlak</label>
                <div className="flex items-center gap-1 bg-white border border-[#E5E5E3] rounded-xl p-2 focus-within:border-[#D7141A]">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={commDetail}
                    onChange={(e) => setCommDetail(Number(e.target.value))}
                    className="w-full bg-transparent text-[#161616] font-semibold text-center outline-none text-xs"
                  />
                  <span className="text-[#6B6B6B] font-medium">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#6B6B6B] font-medium mb-1">Carbusters</label>
                <div className="flex items-center gap-1 bg-white border border-[#E5E5E3] rounded-xl p-2 focus-within:border-[#D7141A]">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
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
                    step="0.5"
                    value={commAuto}
                    onChange={(e) => setCommAuto(Number(e.target.value))}
                    className="w-full bg-transparent text-[#161616] font-semibold text-center outline-none text-xs"
                  />
                  <span className="text-[#6B6B6B] font-medium">%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E5E3]">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
          >
            {isCreating ? 'Crear Colaborador' : 'Guardar Cambios'}
          </Button>
        </div>

      </form>
    </Modal>
  );
};
