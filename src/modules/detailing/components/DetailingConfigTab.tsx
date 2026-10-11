import React, { useState } from 'react';
import {
  Settings,
  Clock,
  Layers,
  Users,
  Calendar,
  MessageCircle,
  CheckSquare,
  AlertTriangle,
  DollarSign,
  Plus,
  Trash2,
  Save,
  Check,
  Package
} from 'lucide-react';
import { DetailingConfig, DetailingWorkBay, DetailingHoliday } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../context/ToastContext';

interface DetailingConfigTabProps {
  config: DetailingConfig;
  onSaveConfig: (updatedConfig: DetailingConfig) => void;
}

export const DetailingConfigTab: React.FC<DetailingConfigTabProps> = ({
  config,
  onSaveConfig
}) => {
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState<
    'bays' | 'schedule' | 'holidays' | 'whatsapp' | 'thresholds' | 'flow' | 'checklists'
  >('bays');

  // Copia local para edición
  const [formData, setFormData] = useState<DetailingConfig>(JSON.parse(JSON.stringify(config)));

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
            Personalizá horarios, boxes, plantillas, estados y umbrales de alerta.
          </p>
        </div>
        <Button variant="primary" onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" />
          Guardar Cambios
        </Button>
      </div>

      {/* Navegación interna de configuración */}
      <div className="flex border-b border-[#E5E5E3] overflow-x-auto gap-2 pb-1">
        {[
          { id: 'bays', label: 'Puestos de Trabajo (Boxes)', icon: Layers },
          { id: 'schedule', label: 'Horarios de Taller', icon: Clock },
          { id: 'holidays', label: 'Feriados y Días No Laborables', icon: Calendar },
          { id: 'whatsapp', label: 'Plantillas WhatsApp', icon: MessageCircle },
          { id: 'flow', label: 'Estados y Colores', icon: CheckSquare },
          { id: 'thresholds', label: 'Umbrales de Alertas', icon: AlertTriangle }
        ].map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id as any)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
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

      {/* SECCIÓN 4: WHATSAPP */}
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

      {/* SECCIÓN 5: ESTADOS Y COLORES */}
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
        </div>
      )}

      {/* SECCIÓN 6: UMBRALES DE ALERTA */}
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
    </div>
  );
};
