import React, { useState } from 'react';
import {
  Settings,
  Building2,
  FileText,
  Sparkles,
  Percent,
  CreditCard,
  Users,
  Ban,
  Receipt,
  MessageCircle,
  Database,
  Plus,
  Trash2,
  Save,
  Check,
  AlertTriangle,
  Download,
  ShieldCheck,
  DollarSign
} from 'lucide-react';
import {
  DetailingConfig,
  DetailingCommissionEmployeeRule,
  DetailingOriginCommissionRule,
  DetailingTariff
} from '../../../types';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { supabase } from '../../../lib/supabase';
import { formatCurrency } from '../../../lib/formatters';
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
  const {
    detailingTariffs,
    updateDetailingTariff,
    addDetailingTariff,
    detailingQuotes,
    commissions,
    expenses,
    stockItems
  } = useData();

  const isAdmin = profile?.roles.includes('admin');

  const [activeSection, setActiveSection] = useState<
    | 'company'
    | 'receipts'
    | 'tariffs'
    | 'discounts'
    | 'payments'
    | 'origins'
    | 'void_reasons'
    | 'expenses'
    | 'commissions'
    | 'whatsapp'
    | 'backup'
  >('company');

  // Copia local para edición
  const [formData, setFormData] = useState<DetailingConfig>(() => {
    const copy = JSON.parse(JSON.stringify(config)) as DetailingConfig;
    if (!copy.origins || copy.origins.length === 0) {
      copy.origins = copy.client_origins && copy.client_origins.length > 0 ? copy.client_origins : [
        'Presencial',
        'WhatsApp',
        'Instagram orgánico',
        'Anuncios pagos',
        'Referido',
        'Formulario web',
        'Llamada'
      ];
    }
    copy.client_origins = copy.origins;
    const existingRules = copy.origin_commission_rules || [];
    copy.origin_commission_rules = copy.origins.map((orig) => {
      const found = existingRules.find((r) => r.origin.trim().toLowerCase() === orig.trim().toLowerCase());
      if (found) return found;
      return {
        origin: orig,
        maxi_percentage: orig.toLowerCase().includes('anuncio') ? 12.5 : 30,
        romina_percentage: 30
      };
    });
    if (!copy.payment_methods || copy.payment_methods.length === 0) {
      copy.payment_methods = [
        'Efectivo',
        'Transferencia Bancaria',
        'Mercado Pago',
        'Tarjeta de Débito',
        'Tarjeta de Crédito'
      ];
    }
    if (!copy.void_reasons || copy.void_reasons.length === 0) {
      copy.void_reasons = [
        'Cliente canceló turno',
        'Error de carga o duplicado',
        'Presupuesto rechazado',
        'Vehículo con problemas mecánicos',
        'Falta de repuestos / insumos'
      ];
    }
    if (!copy.expense_categories || copy.expense_categories.length === 0) {
      copy.expense_categories = [
        'Insumos y Químicos',
        'Alquiler de Taller',
        'Electricidad y Agua',
        'Herramientas y Maquinaria',
        'Publicidad y Marketing',
        'Sueldos y Adelantos',
        'Mantenimiento General'
      ];
    }
    if (!copy.discounts || copy.discounts.length === 0) {
      copy.discounts = [
        { id: 'combo_10', label: 'Combo 10%', name: 'Combo 10%', percentage: 10, amount: 0 },
        { id: 'amigo_15', label: 'Amigo / Referido 15%', name: 'Amigo / Referido 15%', percentage: 15, amount: 0 },
        { id: 'efectivo_5', label: 'Efectivo 5%', name: 'Efectivo 5%', percentage: 5, amount: 0 }
      ];
    }
    if (!copy.commission_config) {
      copy.commission_config = {
        calculation_base: 'total_after_discounts',
        default_participants: ['user-romina', 'user-maxi'],
        employee_rules: [
          {
            employee_id: 'user-romina',
            employee_name: 'Romina',
            base_percentage: 30,
            origin_rules: []
          },
          {
            employee_id: 'user-maxi',
            employee_name: 'Maximiliano',
            base_percentage: 30,
            origin_rules: [{ origin: 'Anuncios pagos', percentage: 12.5 }]
          }
        ]
      };
    }
    if (!copy.receipt_config) {
      copy.receipt_config = {
        prefix: 'DV-',
        next_number: 1,
        company_trade_name: 'DetailVlak',
        company_legal_name: 'CARVLAK Group S.R.L.',
        company_rut: '',
        company_address: 'Av. Giannattasio km 21.500, Shangrilá, Canelones',
        company_phone: '098 765 432',
        company_instagram: '@detailvlak',
        company_logo_url: '',
        footer_legend: 'Comprobante de servicio. Documento interno emitido por CARVLAK Group.',
        service_care_warranties: {
          default: 'Recomendamos secar siempre a la sombra con microfibra suave y evitar túneles de rodillos.'
        }
      };
    }
    return copy;
  });

  const [isCleanModalOpen, setIsCleanModalOpen] = useState(false);
  const [newOriginText, setNewOriginText] = useState('');
  const [newMaxiPct, setNewMaxiPct] = useState<number>(30);
  const [newRominaPct, setNewRominaPct] = useState<number>(30);
  const [newPaymentMethodText, setNewPaymentMethodText] = useState('');
  const [newVoidReasonText, setNewVoidReasonText] = useState('');
  const [newExpenseCatText, setNewExpenseCatText] = useState('');

  // Sincronización de secuencia de comprobantes en DB
  const [isSettingSeq, setIsSettingSeq] = useState(false);

  const handleUpdateOriginCommission = (originName: string, person: 'maxi' | 'romina', value: number) => {
    setFormData((prev) => {
      const currentRules = prev.origin_commission_rules || [];
      const index = currentRules.findIndex(
        (r) => r.origin.trim().toLowerCase() === originName.trim().toLowerCase()
      );
      let nextRules = [...currentRules];
      if (index >= 0) {
        nextRules[index] = {
          ...nextRules[index],
          [person === 'maxi' ? 'maxi_percentage' : 'romina_percentage']: value
        };
      } else {
        nextRules.push({
          origin: originName,
          maxi_percentage: person === 'maxi' ? value : (originName.toLowerCase().includes('anuncio') ? 12.5 : 30),
          romina_percentage: person === 'romina' ? value : 30
        });
      }
      return {
        ...prev,
        origin_commission_rules: nextRules
      };
    });
  };

  const handleDeleteOrigin = (originToDelete: string) => {
    setFormData((prev) => ({
      ...prev,
      origins: (prev.origins || []).filter((o) => o !== originToDelete),
      client_origins: (prev.client_origins || []).filter((o) => o !== originToDelete),
      origin_commission_rules: (prev.origin_commission_rules || []).filter(
        (r) => r.origin.trim().toLowerCase() !== originToDelete.trim().toLowerCase()
      )
    }));
  };

  const handleAddOrigin = () => {
    if (!newOriginText.trim()) return;
    const name = newOriginText.trim();
    if ((formData.origins || []).some((o) => o.toLowerCase() === name.toLowerCase())) {
      showToast('Este origen ya existe', 'error');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      origins: [...(prev.origins || []), name],
      client_origins: [...(prev.client_origins || []), name],
      origin_commission_rules: [
        ...(prev.origin_commission_rules || []),
        {
          origin: name,
          maxi_percentage: newMaxiPct,
          romina_percentage: newRominaPct
        }
      ]
    }));
    setNewOriginText('');
    setNewMaxiPct(30);
    setNewRominaPct(30);
    showToast(`Origen "${name}" agregado correctamente`, 'success');
  };

  const handleSetReceiptSeqInDb = async () => {
    const val = Number(formData.receipt_config?.next_number) || 1;
    try {
      setIsSettingSeq(true);
      if (supabase) {
        const { error } = await supabase.rpc('set_detailing_receipt_seq', { p_val: val });
        if (error) throw error;
        showToast(`Secuencia de comprobantes fijada en ${val} en Supabase`, 'success');
      } else {
        showToast(`Número inicial fijado localmente en ${val}`, 'info');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error al fijar secuencia en base de datos', 'error');
    } finally {
      setIsSettingSeq(false);
    }
  };

  const handleSave = () => {
    const updatedRules = formData.origin_commission_rules || [];
    const syncedEmployeeRules: DetailingCommissionEmployeeRule[] = [
      {
        employee_id: 'user-romina',
        employee_name: 'Romina',
        base_percentage: 30,
        origin_rules: updatedRules.map((r) => ({ origin: r.origin, percentage: r.romina_percentage })),
        is_default_participant: true
      },
      {
        employee_id: 'user-maxi',
        employee_name: 'Maximiliano',
        base_percentage: 30,
        origin_rules: updatedRules.map((r) => ({ origin: r.origin, percentage: r.maxi_percentage })),
        is_default_participant: true
      }
    ];

    const toSave: DetailingConfig = {
      ...formData,
      client_origins: formData.origins,
      commission_config: {
        ...(formData.commission_config || {
          calculation_base: 'total_after_discounts',
          default_participants: ['user-romina', 'user-maxi']
        }),
        calculation_base: formData.commission_config?.calculation_base || 'total_after_discounts',
        default_participants: ['user-romina', 'user-maxi'],
        employee_rules: syncedEmployeeRules
      }
    };

    onSaveConfig(toSave);
    showToast('Configuración de DetailVlak guardada correctamente en Supabase', 'success');
  };

  // Exportar copia de respaldo en CSV
  const handleDownloadBackup = () => {
    const headers = ['Tipo', 'ID', 'Referencia / Cliente', 'Vehículo', 'Monto ($UYU)', 'Fecha'];
    const rows: string[] = [];

    detailingQuotes.forEach((q) => {
      rows.push(
        [
          'Trabajo',
          q.id,
          `"${(q.client_name || '').replace(/"/g, '""')}"`,
          `"${(q.vehicle_info || '').replace(/"/g, '""')}"`,
          q.total_amount || 0,
          q.work_date || q.created_at.slice(0, 10)
        ].join(';')
      );
    });

    expenses
      .filter((e) => e.business === 'detailing')
      .forEach((e) => {
        rows.push(
          [
            'Gasto',
            e.id,
            `"${(e.description || '').replace(/"/g, '""')}"`,
            e.category || '',
            e.amount || 0,
            e.date
          ].join(';')
        );
      });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Respaldo_DetailVlak_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Respaldo descargado exitosamente', 'success');
  };

  const navItems = [
    { id: 'company', label: 'Empresa y Logo', icon: Building2 },
    { id: 'receipts', label: 'Comprobantes y Numeración', icon: FileText },
    { id: 'tariffs', label: 'Tarifario y Cuidados', icon: Sparkles },
    { id: 'discounts', label: 'Descuentos y Recargo', icon: Percent },
    { id: 'payments', label: 'Medios de Pago', icon: CreditCard },
    { id: 'origins', label: 'Orígenes de Cliente', icon: Users },
    { id: 'void_reasons', label: 'Motivos de Anulación', icon: Ban },
    { id: 'expenses', label: 'Gastos del Taller', icon: Receipt },
    { id: 'commissions', label: 'Comisiones', icon: DollarSign },
    { id: 'whatsapp', label: 'Plantilla WhatsApp', icon: MessageCircle },
    { id: 'backup', label: 'Respaldo y Limpieza', icon: Database }
  ];

  return (
    <div className="space-y-4">
      {/* Barra superior con botón Guardar */}
      <div className="bg-white border border-[#E5E5E3] rounded-2xl p-3 sm:p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#F5F5F4] flex items-center justify-center text-[#D7141A]">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#161616]">Configuración de DetailVlak</h3>
            <p className="text-[11px] text-[#6B6B6B]">Parámetros operativos y contables del taller</p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          className="bg-[#D7141A] hover:bg-[#b01015]"
        >
          <Save className="w-3.5 h-3.5 mr-1" />
          Guardar cambios
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Navegación lateral */}
        <div className="md:col-span-1 bg-white border border-[#E5E5E3] rounded-2xl p-2 shadow-xs space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id as any)}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-red-50 text-[#D7141A] border border-red-200'
                    : 'text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D7141A]' : 'text-[#6B6B6B]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Panel de Contenido */}
        <div className="md:col-span-3 bg-white border border-[#E5E5E3] rounded-2xl p-4 sm:p-5 shadow-xs text-xs space-y-4">
          {/* 1. EMPRESA Y LOGO */}
          {activeSection === 'company' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#161616]">Datos de la Empresa</h4>
                <p className="text-[#6B6B6B] mt-0.5">
                  Aparecen en el comprobante oficial entregado a clientes. Sin datos no se emiten comprobantes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#161616] block mb-1">Nombre Comercial *</label>
                  <input
                    type="text"
                    value={formData.receipt_config?.company_trade_name || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        receipt_config: { ...prev.receipt_config!, company_trade_name: e.target.value }
                      }))
                    }
                    placeholder="Ej: DetailVlak"
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="font-medium text-[#161616] block mb-1">Razón Social</label>
                  <input
                    type="text"
                    value={formData.receipt_config?.company_legal_name || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        receipt_config: { ...prev.receipt_config!, company_legal_name: e.target.value }
                      }))
                    }
                    placeholder="Ej: CARVLAK Group S.R.L."
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#161616] block mb-1">RUT *</label>
                  <input
                    type="text"
                    value={formData.receipt_config?.company_rut || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        receipt_config: { ...prev.receipt_config!, company_rut: e.target.value }
                      }))
                    }
                    placeholder="Ej: 219988770014"
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#161616] block mb-1">Teléfono / WhatsApp *</label>
                  <input
                    type="text"
                    value={formData.receipt_config?.company_phone || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        receipt_config: { ...prev.receipt_config!, company_phone: e.target.value }
                      }))
                    }
                    placeholder="Ej: 098 765 432"
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-medium text-[#161616] block mb-1">Dirección del Taller *</label>
                  <input
                    type="text"
                    value={formData.receipt_config?.company_address || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        receipt_config: { ...prev.receipt_config!, company_address: e.target.value }
                      }))
                    }
                    placeholder="Ej: Av. Giannattasio km 21.500, Shangrilá"
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#161616] block mb-1">Instagram</label>
                  <input
                    type="text"
                    value={formData.receipt_config?.company_instagram || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        receipt_config: { ...prev.receipt_config!, company_instagram: e.target.value }
                      }))
                    }
                    placeholder="Ej: @detailvlak"
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#161616] block mb-1">URL del Logo (opcional)</label>
                  <input
                    type="text"
                    value={formData.receipt_config?.company_logo_url || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        receipt_config: { ...prev.receipt_config!, company_logo_url: e.target.value }
                      }))
                    }
                    placeholder="https://..."
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. COMPROBANTES Y NUMERACIÓN ATÓMICA */}
          {activeSection === 'receipts' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#161616]">Numeración de Comprobantes</h4>
                <p className="text-[#6B6B6B] mt-0.5">
                  Numeración atómica protegida contra duplicados mediante secuencia PostgreSQL.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3]">
                <div>
                  <label className="font-medium text-[#161616] block mb-1">Prefijo</label>
                  <input
                    type="text"
                    value={formData.receipt_config?.prefix || 'DV-'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        receipt_config: { ...prev.receipt_config!, prefix: e.target.value }
                      }))
                    }
                    className="w-full bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#161616] block mb-1">Próximo correlativo numérico</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={formData.receipt_config?.next_number || 1}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          receipt_config: { ...prev.receipt_config!, next_number: Number(e.target.value) }
                        }))
                      }
                      className="w-full bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs font-mono"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={handleSetReceiptSeqInDb}
                      disabled={isSettingSeq}
                      className="shrink-0"
                    >
                      {isSettingSeq ? 'Fijando...' : 'Fijar en BD'}
                    </Button>
                  </div>
                  <span className="text-[10px] text-[#6B6B6B] mt-1 block">
                    Al tocar "Fijar en BD" se reinicia la secuencia atómica en Supabase con este valor.
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-medium text-[#161616] block mb-1">Leyenda legal al pie</label>
                  <input
                    type="text"
                    value={formData.receipt_config?.footer_legend || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        receipt_config: { ...prev.receipt_config!, footer_legend: e.target.value }
                      }))
                    }
                    className="w-full bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. TARIFARIO Y CUIDADOS POSTERIORES */}
          {activeSection === 'tariffs' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#161616]">Tarifario y Cuidados Posteriores</h4>
                <p className="text-[#6B6B6B] mt-0.5">
                  Precios por categoría de vehículo y texto de cuidados que se incluye automáticamente en el comprobante.
                </p>
              </div>

              <div className="space-y-3">
                {detailingTariffs.map((t) => (
                  <div key={t.id} className="p-3.5 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#161616]">{t.name}</span>
                      <span className="text-[10px] text-[#6B6B6B] bg-white px-2 py-0.5 rounded border border-[#E5E5E3]">
                        {t.durationHours || 2}h estimadas
                      </span>
                    </div>

                    {/* Precios por Categoría */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <div>
                        <span className="text-[10px] text-[#6B6B6B] block">Chico ($)</span>
                        <input
                          type="number"
                          value={t.prices.chico || 0}
                          onChange={(e) =>
                            updateDetailingTariff(t.id, {
                              prices: { ...t.prices, chico: Number(e.target.value) }
                            })
                          }
                          className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2 py-1 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6B6B6B] block">Mediano ($)</span>
                        <input
                          type="number"
                          value={t.prices.mediano || 0}
                          onChange={(e) =>
                            updateDetailingTariff(t.id, {
                              prices: { ...t.prices, mediano: Number(e.target.value) }
                            })
                          }
                          className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2 py-1 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6B6B6B] block">SUV ($)</span>
                        <input
                          type="number"
                          value={t.prices.suv || 0}
                          onChange={(e) =>
                            updateDetailingTariff(t.id, {
                              prices: { ...t.prices, suv: Number(e.target.value) }
                            })
                          }
                          className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2 py-1 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6B6B6B] block">Pick-up ($)</span>
                        <input
                          type="number"
                          value={t.prices.pickup || 0}
                          onChange={(e) =>
                            updateDetailingTariff(t.id, {
                              prices: { ...t.prices, pickup: Number(e.target.value) }
                            })
                          }
                          className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2 py-1 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6B6B6B] block">Moto ($)</span>
                        <input
                          type="number"
                          value={t.prices.moto || 0}
                          onChange={(e) =>
                            updateDetailingTariff(t.id, {
                              prices: { ...t.prices, moto: Number(e.target.value) }
                            })
                          }
                          className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2 py-1 font-mono text-xs"
                        />
                      </div>
                    </div>

                    {/* Cuidados posteriores específicos del servicio */}
                    <div>
                      <span className="text-[10px] font-bold text-[#161616] block mb-0.5">
                        Cuidados posteriores y garantías para el comprobante:
                      </span>
                      <textarea
                        rows={2}
                        value={t.care_text || ''}
                        onChange={(e) => updateDetailingTariff(t.id, { care_text: e.target.value })}
                        placeholder="Ej: No mojar durante las primeras 72h. Lavar a mano con shampoo de pH neutro..."
                        className="w-full bg-white border border-[#E5E5E3] rounded-lg p-2 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. DESCUENTOS Y RECARGOS */}
          {activeSection === 'discounts' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#161616]">Descuentos y Recargos</h4>
                <p className="text-[#6B6B6B] mt-0.5">
                  Descuentos con nombre legible para el cliente y comprobante, y recargo por suciedad extrema.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-xs text-[#161616] block">Opciones de descuento preconfiguradas:</span>
                {(formData.discounts || []).map((d) => (
                  <div key={d.id} className="p-2.5 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-[#161616]">{d.label || d.name}</span>
                    <span className="font-mono text-xs text-[#6B6B6B]">
                      {d.percentage > 0 ? `${d.percentage}%` : d.amount ? `$${d.amount}` : ''}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#E5E5E3]">
                <label className="font-medium text-[#161616] block mb-1">
                  Recargo sugerido por suciedad extrema / adicional ($UYU)
                </label>
                <input
                  type="number"
                  value={formData.extreme_dirt_surcharge_default || 1500}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      extreme_dirt_surcharge_default: Number(e.target.value)
                    }))
                  }
                  className="w-full sm:w-48 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* 5. MEDIOS DE PAGO */}
          {activeSection === 'payments' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#161616]">Medios de Pago</h4>
                <p className="text-[#6B6B6B] mt-0.5">
                  Formas de cobro disponibles en el registro rápido.
                </p>
              </div>

              <div className="space-y-2">
                {(formData.payment_methods || []).map((method, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] flex items-center justify-between"
                  >
                    <span className="font-medium text-[#161616]">{method}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          payment_methods: (prev.payment_methods || []).filter((_, i) => i !== idx)
                        }))
                      }
                      className="text-[#6B6B6B] hover:text-[#D7141A] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#E5E5E3]">
                <input
                  type="text"
                  placeholder="Nuevo medio de pago..."
                  value={newPaymentMethodText}
                  onChange={(e) => setNewPaymentMethodText(e.target.value)}
                  className="flex-1 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => {
                    if (newPaymentMethodText.trim()) {
                      setFormData((prev) => ({
                        ...prev,
                        payment_methods: [...(prev.payment_methods || []), newPaymentMethodText.trim()]
                      }));
                      setNewPaymentMethodText('');
                    }
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
                </Button>
              </div>
            </div>
          )}

          {/* 6. ORÍGENES DE CLIENTE */}
          {activeSection === 'origins' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#161616]">Orígenes de Cliente y Comisiones</h4>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Configurá el porcentaje de comisión para Maximiliano y Romina según el canal de origen del cliente.
                </p>
              </div>

              <div className="space-y-2.5">
                {(formData.origins || []).map((orig) => {
                  const rule = (formData.origin_commission_rules || []).find(
                    (r) => r.origin.trim().toLowerCase() === orig.trim().toLowerCase()
                  ) || {
                    origin: orig,
                    maxi_percentage: orig.toLowerCase().includes('anuncio') ? 12.5 : 30,
                    romina_percentage: 30
                  };

                  return (
                    <div
                      key={orig}
                      className="p-3 bg-white rounded-xl border border-[#E5E5E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-xs text-[#161616] truncate">{orig}</span>
                        {orig.toLowerCase().includes('anuncio') && (
                          <span className="text-[10px] bg-red-50 text-[#D7141A] font-semibold px-2 py-0.5 rounded-full border border-red-100 shrink-0">
                            Pauta / Ads
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        {/* Romina */}
                        <div className="flex items-center gap-1.5 bg-[#F5F5F4] px-2.5 py-1.5 rounded-lg border border-[#E5E5E3]">
                          <span className="text-[11px] font-bold text-[#161616]">Romina:</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            value={rule.romina_percentage}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              handleUpdateOriginCommission(orig, 'romina', val);
                            }}
                            className="w-14 bg-white border border-[#E5E5E3] rounded px-1.5 py-0.5 text-xs text-center font-bold text-[#161616] focus:outline-hidden focus:border-[#161616]"
                          />
                          <span className="text-[11px] font-bold text-[#6B6B6B]">%</span>
                        </div>

                        {/* Maxi */}
                        <div className="flex items-center gap-1.5 bg-[#F5F5F4] px-2.5 py-1.5 rounded-lg border border-[#E5E5E3]">
                          <span className="text-[11px] font-bold text-[#161616]">Maxi:</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            value={rule.maxi_percentage}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              handleUpdateOriginCommission(orig, 'maxi', val);
                            }}
                            className="w-14 bg-white border border-[#E5E5E3] rounded px-1.5 py-0.5 text-xs text-center font-bold text-[#161616] focus:outline-hidden focus:border-[#161616]"
                          />
                          <span className="text-[11px] font-bold text-[#6B6B6B]">%</span>
                        </div>

                        {/* Eliminar */}
                        <button
                          type="button"
                          onClick={() => handleDeleteOrigin(orig)}
                          className="p-1.5 text-[#6B6B6B] hover:text-[#D7141A] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar este origen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Agregar nuevo origen con sus comisiones */}
              <div className="p-3.5 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] space-y-3">
                <span className="font-bold text-xs text-[#161616] block">Agregar nuevo origen de cliente:</span>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6">
                    <input
                      type="text"
                      placeholder="Nombre del canal (ej. TikTok, Referido...)"
                      value={newOriginText}
                      onChange={(e) => setNewOriginText(e.target.value)}
                      className="w-full bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] focus:outline-hidden focus:border-[#161616]"
                    />
                  </div>
                  <div className="sm:col-span-3 flex items-center justify-between sm:justify-start gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-[#E5E5E3]">
                    <span className="text-[11px] font-bold text-[#161616]">Romina:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={newRominaPct}
                      onChange={(e) => setNewRominaPct(parseFloat(e.target.value) || 0)}
                      className="w-14 text-center text-xs font-bold text-[#161616] border border-[#E5E5E3] rounded px-1 py-0.5"
                    />
                    <span className="text-[11px] font-bold text-[#6B6B6B]">%</span>
                  </div>
                  <div className="sm:col-span-3 flex items-center justify-between sm:justify-start gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-[#E5E5E3]">
                    <span className="text-[11px] font-bold text-[#161616]">Maxi:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={newMaxiPct}
                      onChange={(e) => setNewMaxiPct(parseFloat(e.target.value) || 0)}
                      className="w-14 text-center text-xs font-bold text-[#161616] border border-[#E5E5E3] rounded px-1 py-0.5"
                    />
                    <span className="text-[11px] font-bold text-[#6B6B6B]">%</span>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={handleAddOrigin}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Agregar Origen y Comisiones
                </Button>
              </div>
            </div>
          )}

          {/* 7. MOTIVOS DE ANULACIÓN */}
          {activeSection === 'void_reasons' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#161616]">Motivos de Anulación</h4>
                <p className="text-[#6B6B6B] mt-0.5">
                  Opciones rápidas al momento de anular un trabajo confirmado.
                </p>
              </div>

              <div className="space-y-2">
                {(formData.void_reasons || []).map((reason, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] flex items-center justify-between"
                  >
                    <span className="font-medium text-[#161616]">{reason}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          void_reasons: (prev.void_reasons || []).filter((_, i) => i !== idx)
                        }))
                      }
                      className="text-[#6B6B6B] hover:text-[#D7141A] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#E5E5E3]">
                <input
                  type="text"
                  placeholder="Nuevo motivo de anulación..."
                  value={newVoidReasonText}
                  onChange={(e) => setNewVoidReasonText(e.target.value)}
                  className="flex-1 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => {
                    if (newVoidReasonText.trim()) {
                      setFormData((prev) => ({
                        ...prev,
                        void_reasons: [...(prev.void_reasons || []), newVoidReasonText.trim()]
                      }));
                      setNewVoidReasonText('');
                    }
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
                </Button>
              </div>
            </div>
          )}

          {/* 8. GASTOS DEL TALLER */}
          {activeSection === 'expenses' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#161616]">Gastos del Taller</h4>
                <p className="text-[#6B6B6B] mt-0.5">
                  Categorías para clasificar egresos y costos fijos de DetailVlak.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-xs text-[#161616] block">Categorías de Gasto:</span>
                {(formData.expense_categories || []).map((cat, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-[#F5F5F4] rounded-lg border border-[#E5E5E3] flex items-center justify-between"
                  >
                    <span>{cat}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          expense_categories: (prev.expense_categories || []).filter((_, i) => i !== idx)
                        }))
                      }
                      className="text-[#6B6B6B] hover:text-[#D7141A] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#E5E5E3]">
                <input
                  type="text"
                  placeholder="Nueva categoría..."
                  value={newExpenseCatText}
                  onChange={(e) => setNewExpenseCatText(e.target.value)}
                  className="flex-1 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => {
                    if (newExpenseCatText.trim()) {
                      setFormData((prev) => ({
                        ...prev,
                        expense_categories: [...(prev.expense_categories || []), newExpenseCatText.trim()]
                      }));
                      setNewExpenseCatText('');
                    }
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
                </Button>
              </div>
            </div>
          )}

          {/* 9. COMISIONES */}
          {activeSection === 'commissions' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#161616]">Reglas de Comisión</h4>
                <p className="text-[#6B6B6B] mt-0.5">
                  Las comisiones se generan automáticamente al quedar el trabajo Cobrado.
                </p>
              </div>

              <div className="p-3.5 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] space-y-3">
                <div>
                  <label className="font-medium text-[#161616] block mb-1">Base de Cálculo</label>
                  <select
                    value={formData.commission_config?.calculation_base || 'total_after_discounts'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        commission_config: {
                          ...prev.commission_config!,
                          calculation_base: e.target.value as any
                        }
                      }))
                    }
                    className="w-full bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="total_after_discounts">Total después de descuentos (Recomendado)</option>
                    <option value="exclude_surcharges">Excluir recargos por suciedad extrema</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-[#E5E5E3] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#161616]">Porcentajes por integrante:</span>
                    <button
                      type="button"
                      onClick={() => setActiveSection('origins')}
                      className="text-[11px] text-[#D7141A] hover:underline font-bold cursor-pointer"
                    >
                      Configurar por canal →
                    </button>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-[#E5E5E3] flex justify-between items-center">
                    <div>
                      <span className="font-bold text-xs">Romina</span>
                      <span className="text-[10px] text-[#6B6B6B] block">Detailer de taller</span>
                    </div>
                    <span className="text-xs font-semibold text-[#161616]">
                      Configurada en Orígenes de Cliente
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-[#E5E5E3] flex justify-between items-center">
                    <div>
                      <span className="font-bold text-xs">Maximiliano</span>
                      <span className="text-[10px] text-[#6B6B6B] block">Dueño / Admin</span>
                    </div>
                    <span className="text-xs font-semibold text-[#161616]">
                      Configurada en Orígenes de Cliente
                    </span>
                  </div>

                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900">
                    💡 Para configurar cuánto se pone de comisión dependiendo del origen del cliente para Maximiliano y Romina, ingresá en la sección <strong>Orígenes de Cliente</strong>.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 10. WHATSAPP DEL COMPROBANTE */}
          {activeSection === 'whatsapp' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#161616]">Plantilla de WhatsApp del Comprobante</h4>
                <p className="text-[#6B6B6B] mt-0.5">
                  Mensaje que se prepara al tocar "Enviar comprobante por WhatsApp".
                </p>
              </div>

              <div>
                <textarea
                  rows={6}
                  value={
                    formData.whatsapp_receipt_template ||
                    `¡Hola {cliente}! Adjuntamos tu comprobante oficial de DetailVlak por el servicio realizado a tu {auto}.
Total: {total}
Podés ver e imprimir tu comprobante aquí:
{link}

¡Muchas gracias por confiar en CARVLAK Group!`
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      whatsapp_receipt_template: e.target.value
                    }))
                  }
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-3 text-xs font-mono"
                />
                <span className="text-[10px] text-[#6B6B6B] mt-1 block">
                  Variables automáticas: <code className="text-[#D7141A]">{'{cliente}'}</code>,{' '}
                  <code className="text-[#D7141A]">{'{auto}'}</code>,{' '}
                  <code className="text-[#D7141A]">{'{total}'}</code>,{' '}
                  <code className="text-[#D7141A]">{'{link}'}</code>.
                </span>
              </div>
            </div>
          )}

          {/* 11. RESPALDO Y LIMPIEZA */}
          {activeSection === 'backup' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#161616]">Respaldo y Limpieza Segura</h4>
                <p className="text-[#6B6B6B] mt-0.5">
                  Exportación contable completa y eliminación controlada de registros de prueba.
                </p>
              </div>

              <div className="p-4 bg-[#F5F5F4] rounded-2xl border border-[#E5E5E3] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-[#161616] block">Descargar Respaldo Completo</span>
                    <span className="text-[10px] text-[#6B6B6B] block">
                      Exporta todos los trabajos, comprobantes y gastos en formato Excel CSV con UTF-8 BOM.
                    </span>
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleDownloadBackup}>
                    <Download className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Descargar Excel
                  </Button>
                </div>

                {isAdmin && (
                  <div className="pt-3 border-t border-[#E5E5E3] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-[#D7141A] block">
                        Limpieza de Datos de Prueba
                      </span>
                      <span className="text-[10px] text-[#6B6B6B] block">
                        Borrado protegido con backup obligatorio. NUNCA borra clientes de la automotora ni Carbusters.
                      </span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsCleanModalOpen(true)}
                      className="bg-[#D7141A] hover:bg-[#b01015]"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Limpiar pruebas
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Limpieza Segura */}
      {isCleanModalOpen && (
        <DetailingCleanTestDataModal
          isOpen={isCleanModalOpen}
          onClose={() => setIsCleanModalOpen(false)}
        />
      )}
    </div>
  );
};
