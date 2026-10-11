import React, { useState } from 'react';
import {
  Settings,
  Clock,
  Layers,
  Calendar,
  MessageCircle,
  CheckSquare,
  AlertTriangle,
  DollarSign,
  Plus,
  Trash2,
  Save,
  Check,
  FileText,
  Globe,
  Database,
  Award,
  ShieldAlert,
  Percent,
  Download
} from 'lucide-react';
import {
  DetailingConfig,
  DetailingWorkBay,
  DetailingHoliday,
  DetailingCommissionEmployeeRule
} from '../../../types';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { supabase } from '../../../lib/supabase';
import { DetailingCleanTestDataModal } from './DetailingCleanTestDataModal';

interface DetailingConfigTabProps {
  config: DetailingConfig;
  onSaveConfig: (updatedConfig: DetailingConfig) => void;
}

export const DetailingConfigTab: React.FC<DetailingConfigTabProps> = ({
  config,
  onSaveConfig
}) => {
  const { showToast } = useToast();
  const { availableProfiles, profile } = useAuth();
  const { detailingQuotes, appointments, commissions, expenses, stockItems } = useData();

  const isAdmin = profile?.roles.includes('admin');

  const [activeSection, setActiveSection] = useState<
    'bays' | 'schedule' | 'holidays' | 'whatsapp' | 'flow' | 'thresholds' | 'commissions' | 'receipts' | 'origins' | 'backup'
  >('bays');

  // Copia local para edición
  const [formData, setFormData] = useState<DetailingConfig>(() => {
    const copy = JSON.parse(JSON.stringify(config)) as DetailingConfig;
    if (!copy.client_origins || copy.client_origins.length === 0) {
      copy.client_origins = [
        'Presencial',
        'WhatsApp',
        'Instagram orgánico',
        'Anuncios pagos',
        'Referido',
        'Formulario web',
        'Llamada'
      ];
    }
    if (!copy.commission_config) {
      copy.commission_config = {
        calculation_base: 'total_after_discounts',
        default_participants: [],
        employee_rules: []
      };
    }
    if (!copy.receipt_config) {
      copy.receipt_config = {
        prefix: 'DV-',
        next_number: 1,
        company_trade_name: '',
        company_legal_name: '',
        company_rut: '',
        company_address: '',
        company_phone: '',
        company_instagram: '',
        company_logo_url: '',
        footer_legend: 'Comprobante de servicio. No válido como factura electrónica (CFE).',
        service_care_warranties: {
          ceramico: 'Garantía y cuidado de sellado cerámico: No lavar con champú químico ni mojar durante las primeras 72 horas. Evitar túneles de lavado con rodillos agresivos.',
          pulido: 'Cuidado post-pulido: Mantener con cera sintética o sellador rápido cada 60 días para proteger la capa de barniz corregida.',
          interior: 'Cuidado de interiores y tapizados: No aplicar siliconas aceitosas. Limpiar con microfibra húmeda y aspirar periódicamente.',
          default: 'Recomendamos mantener el vehículo limpio, secar siempre a la sombra con microfibra suave y estacionar bajo techo.'
        }
      };
    }
    return copy;
  });

  const [isCleanModalOpen, setIsCleanModalOpen] = useState(false);
  const [newOriginText, setNewOriginText] = useState('');

  const handleSave = () => {
    onSaveConfig(formData);
    showToast('Configuración de DetailVlak guardada exitosamente.', 'success');
  };

  // 1. Boxes / Puestos de Trabajo
  const handleAddBay = () => {
    const newId = `box-${Date.now()}`;
    const newBay: DetailingWorkBay = {
      id: newId,
      name: `Box ${formData.work_bays.length + 1}`,
      color: '#2563EB',
      supported_services: ['Pulido', 'Cerámico', 'Lavado Detallado'],
      is_active: true
    };
    setFormData((prev) => ({
      ...prev,
      work_bays: [...prev.work_bays, newBay]
    }));
  };

  const handleRemoveBay = (bayId: string) => {
    setFormData((prev) => ({
      ...prev,
      work_bays: prev.work_bays.filter((b) => b.id !== bayId)
    }));
  };

  // 2. Feriados
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');

  const handleAddHoliday = () => {
    if (!newHolidayDate || !newHolidayName) return;
    const newH: DetailingHoliday = {
      date: newHolidayDate,
      name: newHolidayName,
      reason: newHolidayName,
      is_closed: true
    };
    setFormData((prev) => ({
      ...prev,
      holidays: [...(prev.holidays || []), newH]
    }));
    setNewHolidayDate('');
    setNewHolidayName('');
  };

  const handleRemoveHoliday = (date: string) => {
    setFormData((prev) => ({
      ...prev,
      holidays: (prev.holidays || []).filter((h) => h.date !== date)
    }));
  };

  // 3. Orígenes de Clientes
  const handleAddOrigin = () => {
    const val = newOriginText.trim();
    if (!val) return;
    if (formData.client_origins?.includes(val)) {
      showToast('Ese origen ya existe en el listado', 'info');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      client_origins: [...(prev.client_origins || []), val]
    }));
    setNewOriginText('');
    showToast(`Origen "${val}" agregado`, 'success');
  };

  const handleRemoveOrigin = (orig: string) => {
    setFormData((prev) => ({
      ...prev,
      client_origins: (prev.client_origins || []).filter((o) => o !== orig)
    }));
  };

  // 4. Descargar respaldo JSON de Detailing
  const handleDownloadDetailingBackupJson = () => {
    const backupData = {
      exported_at: new Date().toISOString(),
      business: 'detailing',
      quotes: detailingQuotes,
      appointments: appointments.filter((a) => a.business === 'detailing'),
      commissions: commissions.filter((c) => c.business === 'detailing'),
      expenses: expenses.filter((e) => e.business === 'detailing'),
      stock_items: stockItems.filter((s) => s.business === 'detailing' || s.business === 'general'),
      config: formData
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Respaldo_DetailVlak_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Copia de respaldo en JSON descargada.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header con botón guardar fijo */}
      <div className="bg-white border border-[#E5E5E3] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold font-display text-[#161616] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#D7141A]" />
            Configuración del Taller DetailVlak
          </h2>
          <p className="text-xs text-[#6B6B6B]">
            Personalizá horarios, boxes, comisiones dinámicas, comprobantes oficiales y orígenes.
          </p>
        </div>
        <Button variant="primary" onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" />
          Guardar Cambios
        </Button>
      </div>

      {/* Navegación interna de configuración */}
      <div className="flex border-b border-[#E5E5E3] overflow-x-auto gap-1 pb-1">
        {[
          { id: 'bays', label: 'Boxes de Trabajo', icon: Layers },
          { id: 'schedule', label: 'Horarios', icon: Clock },
          { id: 'holidays', label: 'Feriados', icon: Calendar },
          { id: 'commissions', label: 'Comisiones & Reglas', icon: Award },
          { id: 'receipts', label: 'Comprobantes Oficiales', icon: FileText },
          { id: 'origins', label: 'Orígenes de Clientes', icon: Globe },
          { id: 'whatsapp', label: 'Plantillas WhatsApp', icon: MessageCircle },
          { id: 'flow', label: 'Estados y Colores', icon: CheckSquare },
          { id: 'thresholds', label: 'Umbrales de Alertas', icon: AlertTriangle },
          { id: 'backup', label: 'Datos & Respaldo', icon: Database }
        ].map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#161616] text-white shadow-xs'
                  : 'text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECCIÓN 1: BOXES */}
      {activeSection === 'bays' && (
        <div className="bg-white border border-[#E5E5E3] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-display text-[#161616]">
                Puestos de Trabajo (Boxes de Detailing)
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                Definí cuántos vehículos se pueden atender simultáneamente y qué color los identifica.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleAddBay} className="gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" />
              Agregar Box
            </Button>
          </div>

          <div className="space-y-3">
            {formData.work_bays.map((bay, idx) => (
              <div
                key={bay.id}
                className="p-3.5 rounded-xl border border-[#E5E5E3] bg-[#F5F5F4]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="color"
                    value={bay.color}
                    onChange={(e) => {
                      const updated = [...formData.work_bays];
                      updated[idx].color = e.target.value;
                      setFormData({ ...formData, work_bays: updated });
                    }}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-[#E5E5E3]"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={bay.name}
                      onChange={(e) => {
                        const updated = [...formData.work_bays];
                        updated[idx].name = e.target.value;
                        setFormData({ ...formData, work_bays: updated });
                      }}
                      className="px-2 py-1 bg-white border border-[#E5E5E3] rounded text-xs font-bold text-[#161616] w-full max-w-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-[#161616] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bay.is_active}
                      onChange={(e) => {
                        const updated = [...formData.work_bays];
                        updated[idx].is_active = e.target.checked;
                        setFormData({ ...formData, work_bays: updated });
                      }}
                      className="rounded text-[#D7141A]"
                    />
                    <span>Activo</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleRemoveBay(bay.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                    title="Eliminar puesto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN 2: HORARIOS */}
      {activeSection === 'schedule' && (
        <div className="bg-white border border-[#E5E5E3] rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold font-display text-[#161616]">
              Horarios de Apertura y Cierre del Taller
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              Establecé qué días está abierto y el rango de turnos disponibles.
            </p>
          </div>

          <div className="space-y-2">
            {[
              { key: 'monday', label: 'Lunes' },
              { key: 'tuesday', label: 'Martes' },
              { key: 'wednesday', label: 'Miércoles' },
              { key: 'thursday', label: 'Jueves' },
              { key: 'friday', label: 'Viernes' },
              { key: 'saturday', label: 'Sábado' },
              { key: 'sunday', label: 'Domingo' }
            ].map(({ key, label }) => {
              const daySched = formData.schedule?.[key] || {
                is_open: key !== 'sunday',
                open_time: '08:00',
                close_time: '19:00'
              };

              return (
                <div
                  key={key}
                  className="p-3 rounded-xl border border-[#E5E5E3] bg-[#F5F5F4]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 w-32">
                    <input
                      type="checkbox"
                      checked={daySched.is_open}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          schedule: {
                            ...formData.schedule,
                            [key]: { ...daySched, is_open: e.target.checked }
                          }
                        });
                      }}
                      className="rounded text-[#D7141A]"
                    />
                    <span className="text-xs font-bold text-[#161616] font-display">{label}</span>
                  </div>

                  {daySched.is_open ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-[#6B6B6B]">
                        <span>Abre:</span>
                        <input
                          type="time"
                          value={daySched.open_time}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              schedule: {
                                ...formData.schedule,
                                [key]: { ...daySched, open_time: e.target.value }
                              }
                            });
                          }}
                          className="px-2 py-1 bg-white border border-[#E5E5E3] rounded text-xs text-[#161616]"
                        />
                      </div>
                      <span className="text-gray-400">—</span>
                      <div className="flex items-center gap-1 text-xs text-[#6B6B6B]">
                        <span>Cierra:</span>
                        <input
                          type="time"
                          value={daySched.close_time}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              schedule: {
                                ...formData.schedule,
                                [key]: { ...daySched, close_time: e.target.value }
                              }
                            });
                          }}
                          className="px-2 py-1 bg-white border border-[#E5E5E3] rounded text-xs text-[#161616]"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-[#6B6B6B] italic">Cerrado</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECCIÓN 3: FERIADOS */}
      {activeSection === 'holidays' && (
        <div className="bg-white border border-[#E5E5E3] rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold font-display text-[#161616]">
              Feriados y Días No Laborables
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              Estos días bloquearán automáticamente la asignación de turnos en el calendario.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="date"
              value={newHolidayDate}
              onChange={(e) => setNewHolidayDate(e.target.value)}
              className="px-3 py-2 bg-white border border-[#E5E5E3] rounded-lg text-xs text-[#161616]"
            />
            <input
              type="text"
              placeholder="Nombre del feriado (ej. Día de los Trabajadores)"
              value={newHolidayName}
              onChange={(e) => setNewHolidayName(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-[#E5E5E3] rounded-lg text-xs text-[#161616]"
            />
            <Button variant="outline" size="sm" onClick={handleAddHoliday} className="gap-1 text-xs">
              <Plus className="w-3.5 h-3.5" />
              Agregar
            </Button>
          </div>

          <div className="space-y-2">
            {(formData.holidays || []).map((h) => (
              <div
                key={h.date}
                className="p-3 rounded-xl border border-[#E5E5E3] bg-[#F5F5F4]/40 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-[#161616]">{h.name}</span>
                  <span className="text-xs text-[#6B6B6B] ml-2">({h.date})</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveHoliday(h.date)}
                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN 4: COMISIONES Y REGLAS DINÁMICAS */}
      {activeSection === 'commissions' && (
        <div className="bg-white border border-[#E5E5E3] rounded-2xl p-5 space-y-6">
          <div>
            <h3 className="text-sm font-bold font-display text-[#161616] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#D7141A]" />
              Configuración de Comisiones de Detailing
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              Definí la base de cálculo contable, los colaboradores participantes y las reglas específicas por origen de cliente (ej: Meta Ads).
            </p>
          </div>

          {/* Base de Cálculo */}
          <div className="p-4 rounded-xl border border-[#E5E5E3] bg-[#F5F5F4]/30 space-y-3">
            <label className="block text-xs font-bold text-[#161616] uppercase font-display tracking-wider">
              1. Base de Cálculo para las Comisiones
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'total_after_discounts',
                  title: 'Total cobrado final',
                  desc: 'Monto total facturado al cliente después de promociones y descuentos aplicados.'
                },
                {
                  id: 'exclude_surcharges',
                  title: 'Total sin recargos',
                  desc: 'Excluye el recargo por suciedad extrema del taller de la base comisionable.'
                },
                {
                  id: 'subtract_supplies',
                  title: 'Margen neto de insumos',
                  desc: 'Resta el costo directo de los productos químicos y pads utilizados en el trabajo.'
                }
              ].map((b) => {
                const isSelected = formData.commission_config?.calculation_base === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        commission_config: {
                          ...formData.commission_config!,
                          calculation_base: b.id as any
                        }
                      });
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#161616] bg-white ring-2 ring-[#161616]/10 shadow-xs'
                        : 'border-[#E5E5E3] bg-white hover:border-[#D0D0CD]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#161616]">{b.title}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#D7141A]" />}
                    </div>
                    <p className="text-[11px] text-[#6B6B6B] leading-tight">{b.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Participantes por defecto */}
          <div className="p-4 rounded-xl border border-[#E5E5E3] bg-[#F5F5F4]/30 space-y-3">
            <label className="block text-xs font-bold text-[#161616] uppercase font-display tracking-wider">
              2. Participantes por defecto al cotizar
            </label>
            <p className="text-xs text-[#6B6B6B]">
              Estos empleados aparecerán preseleccionados al crear un trabajo en Detailing.
            </p>
            <div className="flex flex-wrap gap-2">
              {availableProfiles
                .filter((p) => p.is_active !== false && p.businesses?.includes('detailing'))
                .map((p) => {
                  const isDefault = formData.commission_config?.default_participants?.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        const current = formData.commission_config?.default_participants || [];
                        const updated = isDefault
                          ? current.filter((id) => id !== p.id)
                          : [...current, p.id];
                        setFormData({
                          ...formData,
                          commission_config: {
                            ...formData.commission_config!,
                            default_participants: updated
                          }
                        });
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isDefault
                          ? 'bg-[#161616] text-white border-[#161616]'
                          : 'bg-white text-[#161616] border-[#E5E5E3] hover:bg-[#F5F5F4]'
                      }`}
                    >
                      <span>{p.full_name}</span>
                      {isDefault && <Check className="w-3 h-3 text-[#D7141A]" />}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Reglas de porcentaje y sobreescrituras por origen */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-[#161616] uppercase font-display tracking-wider">
                  3. Porcentajes y Reglas por Colaborador
                </label>
                <p className="text-xs text-[#6B6B6B]">
                  Porcentaje base y excepciones automáticas según de dónde provenga el cliente.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {availableProfiles
                .filter((p) => p.businesses?.includes('detailing'))
                .map((emp) => {
                  const existingRule = formData.commission_config?.employee_rules?.find((r) => r.employee_id === emp.id) || {
                    employee_id: emp.id,
                    employee_name: emp.full_name,
                    base_percentage: emp.commissions?.detailing ?? 30,
                    origin_rules: []
                  };

                  const updateThisEmployeeRule = (newRule: DetailingCommissionEmployeeRule) => {
                    const currentRules = formData.commission_config?.employee_rules || [];
                    const filtered = currentRules.filter((r) => r.employee_id !== emp.id);
                    setFormData({
                      ...formData,
                      commission_config: {
                        ...formData.commission_config!,
                        employee_rules: [...filtered, newRule]
                      }
                    });
                  };

                  return (
                    <div
                      key={emp.id}
                      className="p-4 rounded-xl border border-[#E5E5E3] bg-white shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E5E3] pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#161616]">{emp.full_name}</span>
                          <span className="text-[10px] text-[#6B6B6B]">({emp.roles.join(', ')})</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[#6B6B6B]">Porcentaje base general:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={existingRule.base_percentage}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                updateThisEmployeeRule({ ...existingRule, base_percentage: val });
                              }}
                              className="w-16 px-2 py-1 bg-[#F5F5F4] border border-[#E5E5E3] rounded text-xs font-mono font-bold text-[#161616] text-right"
                            />
                            <span className="font-bold">%</span>
                          </div>
                        </div>
                      </div>

                      {/* Reglas específicas de origen */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-[#6B6B6B]">
                          <span>Reglas por origen del cliente:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const availableOrigins = (formData.client_origins || []).filter(
                                (o) => !existingRule.origin_rules?.some((r) => r.origin === o)
                              );
                              const targetOrigin = availableOrigins[0] || 'Anuncios pagos';
                              updateThisEmployeeRule({
                                ...existingRule,
                                origin_rules: [
                                  ...(existingRule.origin_rules || []),
                                  { origin: targetOrigin, percentage: 12.5 }
                                ]
                              });
                            }}
                            className="text-[#D7141A] hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            Agregar excepción por origen
                          </button>
                        </div>

                        {(existingRule.origin_rules || []).length === 0 ? (
                          <p className="text-[11px] text-[#9A9A9A] italic">
                            Sin excepciones: cobra {existingRule.base_percentage}% para cualquier origen.
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {existingRule.origin_rules.map((or, orIdx) => (
                              <div
                                key={orIdx}
                                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#F5F5F4] text-xs"
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="text-[#6B6B6B] text-[11px]">Si el cliente viene de:</span>
                                  <select
                                    value={or.origin}
                                    onChange={(e) => {
                                      const updatedList = [...existingRule.origin_rules];
                                      updatedList[orIdx].origin = e.target.value;
                                      updateThisEmployeeRule({ ...existingRule, origin_rules: updatedList });
                                    }}
                                    className="bg-white border border-[#E5E5E3] rounded px-2 py-1 text-xs text-[#161616]"
                                  >
                                    {(formData.client_origins || []).map((o) => (
                                      <option key={o} value={o}>{o}</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[#6B6B6B] text-[11px]">Cobra:</span>
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step="0.5"
                                    value={or.percentage}
                                    onChange={(e) => {
                                      const updatedList = [...existingRule.origin_rules];
                                      updatedList[orIdx].percentage = parseFloat(e.target.value) || 0;
                                      updateThisEmployeeRule({ ...existingRule, origin_rules: updatedList });
                                    }}
                                    className="w-16 px-2 py-1 bg-white border border-[#E5E5E3] rounded text-xs font-mono font-bold text-[#161616] text-right"
                                  />
                                  <span className="font-bold">%</span>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedList = existingRule.origin_rules.filter((_, idx) => idx !== orIdx);
                                      updateThisEmployeeRule({ ...existingRule, origin_rules: updatedList });
                                    }}
                                    className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 5: COMPROBANTES OFICIALES */}
      {activeSection === 'receipts' && (
        <div className="bg-white border border-[#E5E5E3] rounded-2xl p-5 space-y-6">
          <div>
            <h3 className="text-sm font-bold font-display text-[#161616] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#D7141A]" />
              Configuración de Comprobantes de Servicio
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              Personalizá la numeración correlativa, datos de la empresa emisora, textos de garantía y cuidados posteriores.
            </p>
          </div>

          {/* Numeración Correlativa */}
          <div className="p-4 rounded-xl border border-[#E5E5E3] bg-[#F5F5F4]/30 space-y-3">
            <label className="block text-xs font-bold text-[#161616] uppercase font-display tracking-wider">
              1. Numeración Correlativa Oficial
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#6B6B6B] mb-1">Prefijo identificador</label>
                <input
                  type="text"
                  value={formData.receipt_config?.prefix || 'DV-'}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      receipt_config: { ...formData.receipt_config!, prefix: e.target.value }
                    });
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-[#E5E5E3] rounded-lg text-xs font-mono font-bold text-[#161616]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#6B6B6B] mb-1">Próximo número a emitir</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={formData.receipt_config?.next_number || 1}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        receipt_config: {
                          ...formData.receipt_config!,
                          next_number: parseInt(e.target.value, 10) || 1
                        }
                      });
                    }}
                    className="flex-1 px-3 py-1.5 bg-white border border-[#E5E5E3] rounded-lg text-xs font-mono font-bold text-[#161616]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const targetNum = formData.receipt_config?.next_number || 1;
                        const { error } = await supabase.rpc('set_detailing_receipt_seq', { p_val: targetNum });
                        if (error) {
                          showToast(`Error al fijar secuencia: ${error.message}`, 'error');
                        } else {
                          showToast(`Secuencia oficial fijada en el número ${targetNum} en la base de datos.`, 'success');
                        }
                      } catch (err: any) {
                        showToast(`Error al fijar secuencia: ${err.message}`, 'error');
                      }
                    }}
                    className="text-xs shrink-0 cursor-pointer whitespace-nowrap"
                  >
                    Fijar en BD
                  </Button>
                </div>
                <span className="text-[10px] text-[#6B6B6B] mt-1 block">
                  Próximo comprobante: {formData.receipt_config?.prefix || 'DV-'}
                  {String(formData.receipt_config?.next_number || 1).padStart(6, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Datos fiscales y de contacto de la empresa */}
          <div className="p-4 rounded-xl border border-[#E5E5E3] bg-[#F5F5F4]/30 space-y-3">
            <label className="block text-xs font-bold text-[#161616] uppercase font-display tracking-wider">
              2. Datos del Taller Emisor
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#6B6B6B] mb-1">Nombre comercial</label>
                <input
                  type="text"
                  value={formData.receipt_config?.company_trade_name || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      receipt_config: { ...formData.receipt_config!, company_trade_name: e.target.value }
                    });
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-[#E5E5E3] rounded-lg text-xs text-[#161616]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#6B6B6B] mb-1">Razón Social</label>
                <input
                  type="text"
                  value={formData.receipt_config?.company_legal_name || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      receipt_config: { ...formData.receipt_config!, company_legal_name: e.target.value }
                    });
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-[#E5E5E3] rounded-lg text-xs text-[#161616]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#6B6B6B] mb-1">RUT</label>
                <input
                  type="text"
                  value={formData.receipt_config?.company_rut || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      receipt_config: { ...formData.receipt_config!, company_rut: e.target.value }
                    });
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-[#E5E5E3] rounded-lg text-xs text-[#161616]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#6B6B6B] mb-1">Dirección del taller</label>
                <input
                  type="text"
                  value={formData.receipt_config?.company_address || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      receipt_config: { ...formData.receipt_config!, company_address: e.target.value }
                    });
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-[#E5E5E3] rounded-lg text-xs text-[#161616]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#6B6B6B] mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={formData.receipt_config?.company_phone || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      receipt_config: { ...formData.receipt_config!, company_phone: e.target.value }
                    });
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-[#E5E5E3] rounded-lg text-xs text-[#161616]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#6B6B6B] mb-1">Instagram</label>
                <input
                  type="text"
                  value={formData.receipt_config?.company_instagram || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      receipt_config: { ...formData.receipt_config!, company_instagram: e.target.value }
                    });
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-[#E5E5E3] rounded-lg text-xs text-[#161616]"
                />
              </div>
            </div>
          </div>

          {/* Cuidados posteriores automáticos por servicio */}
          <div className="p-4 rounded-xl border border-[#E5E5E3] bg-[#F5F5F4]/30 space-y-3">
            <label className="block text-xs font-bold text-[#161616] uppercase font-display tracking-wider">
              3. Textos de Cuidados Posteriores y Garantía
            </label>
            <p className="text-xs text-[#6B6B6B]">
              Se insertan automáticamente en el comprobante según los servicios realizados.
            </p>

            <div className="space-y-3">
              {[
                { key: 'ceramico', label: 'Sellado Cerámico / Vidrio Líquido' },
                { key: 'pulido', label: 'Corrección de Barniz / Pulido' },
                { key: 'interior', label: 'Limpieza de Tapizados e Interior' },
                { key: 'default', label: 'Texto por defecto (otros servicios)' }
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-[#161616] mb-1">{label}</label>
                  <textarea
                    rows={2}
                    value={formData.receipt_config?.service_care_warranties?.[key] || ''}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        receipt_config: {
                          ...formData.receipt_config!,
                          service_care_warranties: {
                            ...formData.receipt_config!.service_care_warranties,
                            [key]: e.target.value
                          }
                        }
                      });
                    }}
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-lg text-xs text-[#161616]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Leyenda al pie */}
          <div>
            <label className="block text-xs font-bold text-[#161616] mb-1">
              Leyenda legal al pie del comprobante
            </label>
            <input
              type="text"
              value={formData.receipt_config?.footer_legend || ''}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  receipt_config: { ...formData.receipt_config!, footer_legend: e.target.value }
                });
              }}
              className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-lg text-xs text-[#161616]"
            />
          </div>
        </div>
      )}

      {/* SECCIÓN 6: ORÍGENES DE CLIENTES */}
      {activeSection === 'origins' && (
        <div className="bg-white border border-[#E5E5E3] rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold font-display text-[#161616] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#D7141A]" />
              Canales y Orígenes de Clientes
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              Gestioná los canales de captación para clasificar cotizaciones y aplicar reglas de comisión (ej. Anuncios pagos).
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nuevo origen (ej. Convenio Empresa X, TikTok...)"
              value={newOriginText}
              onChange={(e) => setNewOriginText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddOrigin()}
              className="flex-1 px-3 py-2 bg-white border border-[#E5E5E3] rounded-xl text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none"
            />
            <Button variant="primary" size="sm" onClick={handleAddOrigin} className="gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Canal</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            {(formData.client_origins || []).map((orig) => (
              <div
                key={orig}
                className="p-3 rounded-xl border border-[#E5E5E3] bg-[#F5F5F4]/40 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#D7141A]" />
                  <span className="text-xs font-bold text-[#161616]">{orig}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveOrigin(orig)}
                  className="text-gray-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                  title="Eliminar origen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN 7: WHATSAPP */}
      {activeSection === 'whatsapp' && (
        <div className="bg-white border border-[#E5E5E3] rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold font-display text-[#161616]">
              Plantillas de WhatsApp de 1 Toque
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              Variables disponibles: &#123;cliente&#125;, &#123;auto&#125;, &#123;servicio&#125;, &#123;fecha&#125;, &#123;hora&#125;, &#123;monto&#125;, &#123;direccion&#125;
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#161616] mb-1 uppercase font-display">
                1. Confirmación de turno
              </label>
              <textarea
                rows={3}
                value={formData.whatsapp_templates?.confirm_appointment || ''}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    whatsapp_templates: {
                      ...formData.whatsapp_templates,
                      confirm_appointment: e.target.value
                    }
                  });
                }}
                className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-lg text-xs text-[#161616]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#161616] mb-1 uppercase font-display">
                2. Recordatorio 24 hs antes
              </label>
              <textarea
                rows={3}
                value={formData.whatsapp_templates?.day_before_reminder || ''}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    whatsapp_templates: {
                      ...formData.whatsapp_templates,
                      day_before_reminder: e.target.value
                    }
                  });
                }}
                className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-lg text-xs text-[#161616]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#161616] mb-1 uppercase font-display">
                3. Auto listo para retirar
              </label>
              <textarea
                rows={3}
                value={formData.whatsapp_templates?.car_ready || ''}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    whatsapp_templates: {
                      ...formData.whatsapp_templates,
                      car_ready: e.target.value
                    }
                  });
                }}
                className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-lg text-xs text-[#161616]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#161616] mb-1 uppercase font-display">
                4. Seguimiento post-entrega / Reprogramar
              </label>
              <textarea
                rows={3}
                value={formData.whatsapp_templates?.quote_followup || ''}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    whatsapp_templates: {
                      ...formData.whatsapp_templates,
                      quote_followup: e.target.value
                    }
                  });
                }}
                className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-lg text-xs text-[#161616]"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 8: ESTADOS Y COLORES */}
      {activeSection === 'flow' && (
        <div className="bg-white border border-[#E5E5E3] rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold font-display text-[#161616]">
              Flujo del Auto y Código de Colores
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              Personalizá el color identificador de cada etapa en el taller.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {formData.flow_statuses.map((st, idx) => (
              <div
                key={st.id}
                className="p-3 rounded-xl border border-[#E5E5E3] flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={st.color}
                    onChange={(e) => {
                      const updated = [...formData.flow_statuses];
                      updated[idx].color = e.target.value;
                      setFormData({ ...formData, flow_statuses: updated });
                    }}
                    className="w-7 h-7 rounded cursor-pointer border border-[#E5E5E3]"
                  />
                  <span className="text-xs font-bold text-[#161616]">{st.label || st.name}</span>
                </div>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                  style={{ backgroundColor: st.color }}
                >
                  Vista previa
                </span>
              </div>
            ))}
          </div>

          {/* Reglas Operativas del Taller */}
          <div className="p-4 rounded-xl border border-[#E5E5E3] bg-[#F5F5F4]/30 space-y-4 pt-4 border-t">
            <h4 className="text-xs font-bold text-[#161616] uppercase font-display tracking-wider">
              Reglas Operativas del Taller (Para 2 Personas)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-[#E5E5E3] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.require_checkin)}
                  onChange={(e) => setFormData({ ...formData, require_checkin: e.target.checked })}
                  className="mt-0.5 rounded text-[#D7141A] focus:ring-[#D7141A]"
                />
                <div>
                  <span className="text-xs font-bold text-[#161616] block">Pedir Check-in al ingresar</span>
                  <span className="text-[11px] text-[#6B6B6B]">
                    Si está desactivado (recomendado para agilidad), el check-in con fotos queda disponible como botón opcional.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-[#E5E5E3] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.require_quality_control)}
                  onChange={(e) => setFormData({ ...formData, require_quality_control: e.target.checked })}
                  className="mt-0.5 rounded text-[#D7141A] focus:ring-[#D7141A]"
                />
                <div>
                  <span className="text-xs font-bold text-[#161616] block">Pedir Control de Calidad al terminar</span>
                  <span className="text-[11px] text-[#6B6B6B]">
                    Si está desactivado, el operario pasa el auto a "Listo para retirar" en un solo toque sin checklist obligatorio.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-[#E5E5E3] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.auto_ingreso_enabled ?? true}
                  onChange={(e) => setFormData({ ...formData, auto_ingreso_enabled: e.target.checked })}
                  className="mt-0.5 rounded text-[#D7141A] focus:ring-[#D7141A]"
                />
                <div>
                  <span className="text-xs font-bold text-[#161616] block">Ingreso Automático a Taller</span>
                  <span className="text-[11px] text-[#6B6B6B]">
                    Pasa automáticamente los turnos confirmados a "En taller" al llegar su horario asignado.
                  </span>
                </div>
              </label>

              <div className="p-3 bg-white rounded-xl border border-[#E5E5E3] space-y-1.5">
                <label className="block text-xs font-bold text-[#161616]">
                  Tolerancia para ingreso automático
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={formData.auto_ingreso_tolerance_minutes ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        auto_ingreso_tolerance_minutes: parseInt(e.target.value, 10) || 0
                      })
                    }
                    className="w-20 px-2 py-1 bg-white border border-[#E5E5E3] rounded text-xs font-bold font-mono"
                  />
                  <span className="text-xs text-[#6B6B6B]">minutos (0 = a la hora del turno)</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E5E5E3] space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold text-[#161616]">
                  Ventana de horas para botón "No vino"
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={formData.no_show_window_hours ?? 3}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        no_show_window_hours: parseInt(e.target.value, 10) || 3
                      })
                    }
                    className="w-20 px-2 py-1 bg-white border border-[#E5E5E3] rounded text-xs font-bold font-mono"
                  />
                  <span className="text-xs text-[#6B6B6B]">
                    horas pasadas la hora del turno para ofrecer marcar como "No vino".
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 9: UMBRALES DE ALERTA */}
      {activeSection === 'thresholds' && (
        <div className="bg-white border border-[#E5E5E3] rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold font-display text-[#161616]">
              Umbrales del Centro de Alertas Inteligente
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              Ajustá cuándo se disparan las alertas automáticas del taller.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-xl border border-[#E5E5E3]">
              <label className="block text-xs font-bold text-[#161616] mb-1">
                Alerta de auto listo sin retirar (horas)
              </label>
              <input
                type="number"
                min={1}
                value={formData.alert_thresholds?.ready_not_notified_hours || 2}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    alert_thresholds: {
                      ...formData.alert_thresholds,
                      ready_not_notified_hours: parseInt(e.target.value, 10) || 2
                    }
                  });
                }}
                className="w-full px-3 py-1.5 bg-white border border-[#E5E5E3] rounded-lg text-xs text-[#161616]"
              />
            </div>

            <div className="p-3 rounded-xl border border-[#E5E5E3]">
              <label className="block text-xs font-bold text-[#161616] mb-1">
                Alerta de seguimiento de cotización (días)
              </label>
              <input
                type="number"
                min={1}
                value={formData.alert_thresholds?.quote_followup_days || 3}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    alert_thresholds: {
                      ...formData.alert_thresholds,
                      quote_followup_days: parseInt(e.target.value, 10) || 3
                    }
                  });
                }}
                className="w-full px-3 py-1.5 bg-white border border-[#E5E5E3] rounded-lg text-xs text-[#161616]"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 10: DATOS Y RESPALDO (EMPEZAR DE CERO) */}
      {activeSection === 'backup' && (
        <div className="bg-white border border-[#E5E5E3] rounded-2xl p-5 space-y-6">
          <div>
            <h3 className="text-sm font-bold font-display text-[#161616] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#D7141A]" />
              Gestión de Datos y Respaldo de DetailVlak
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              Descargá copias de seguridad completas o limpiá los datos de prueba cargados para iniciar operaciones reales.
            </p>
          </div>

          {/* Tarjeta de Respaldo */}
          <div className="p-4 rounded-xl border border-[#E5E5E3] bg-[#F5F5F4]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-[#161616]">Descargar Respaldo Completo (JSON)</h4>
              <p className="text-xs text-[#6B6B6B]">
                Exporta todas las cotizaciones, turnos, movimientos de stock, gastos y configuración actual.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadDetailingBackupJson}
              className="gap-1.5 text-xs shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-[#161616]" />
              <span>Descargar JSON</span>
            </Button>
          </div>

          {/* Tarjeta de Limpieza de Datos de Prueba */}
          {isAdmin && (
            <div className="p-5 rounded-xl border-2 border-[#D7141A]/30 bg-[#FEF7EC]/30 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-[#D7141A] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-[#161616]">
                    Limpiar datos de prueba de DetailVlak ("Empezar de cero")
                  </h4>
                  <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">
                    Permite borrar cotizaciones de prueba, comisiones y gastos simulados para arrancar en limpio.
                    Exige descarga obligatoria de respaldo (Excel y JSON) antes de confirmar.
                    <strong> Garantía de seguridad:</strong> los clientes y vehículos vinculados a la automotora o peritajes nunca se tocan.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCleanModalOpen(true)}
                  className="gap-1.5 bg-[#D7141A] hover:bg-[#b01015]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Abrir Herramienta de Limpieza</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Limpieza de Datos de Prueba */}
      <DetailingCleanTestDataModal
        isOpen={isCleanModalOpen}
        onClose={() => setIsCleanModalOpen(false)}
      />
    </div>
  );
};
