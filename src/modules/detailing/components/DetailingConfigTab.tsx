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
  DollarSign,
  Pause,
  Play
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
import { formatCurrency, normalizeDetailingCommissionConfig } from '../../../lib/formatters';
import { DetailingCleanTestDataModal } from './DetailingCleanTestDataModal';
import { DetailingPreventaTariffConfigSection } from './config/DetailingPreventaTariffConfigSection';
import { DetailingCompanySpecialServicesConfigSection } from './config/DetailingCompanySpecialServicesConfigSection';

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
    deleteDetailingTariff,
    saveAllDetailingTariffs,
    detailingQuotes,
    commissions,
    expenses,
    stockItems
  } = useData();

  const isAdmin = profile?.roles.includes('admin');

  const [activeSection, setActiveSection] = useState<
    | 'company'
    | 'tarifa_empresas'
    | 'servicios_empresas'
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
  >(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('config_section') || new URLSearchParams(window.location.search).get('cfg');
      if (p && ['company', 'tarifa_empresas', 'servicios_empresas', 'receipts', 'tariffs', 'discounts', 'payments', 'origins', 'void_reasons', 'expenses', 'commissions', 'whatsapp', 'backup'].includes(p)) {
        return p as any;
      }
    }
    return 'tariffs';
  });

  // Opciones avanzadas plegadas para que la configuración sea más simple
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Copia local para edición del tarifario
  const [localTariffs, setLocalTariffs] = useState<DetailingTariff[]>(() =>
    JSON.parse(JSON.stringify(detailingTariffs))
  );
  const [isTariffsDirty, setIsTariffsDirty] = useState(false);

  // Sincronizar tarifario local si detailingTariffs cambia externamente y no hay cambios sucios
  React.useEffect(() => {
    if (!isTariffsDirty) {
      setLocalTariffs(JSON.parse(JSON.stringify(detailingTariffs)));
    }
  }, [detailingTariffs, isTariffsDirty]);

  // Aviso del navegador si hay cambios sin guardar al cerrar la pestaña o recargar
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isTariffsDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isTariffsDirty]);

  // Handlers para edición de tarifario
  const updateLocalTariff = (id: string, updates: Partial<DetailingTariff>) => {
    setLocalTariffs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    setIsTariffsDirty(true);
  };

  const handleTogglePause = (id: string) => {
    setLocalTariffs((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const nextState = t.isActive === false ? true : false;
        return { ...t, isActive: nextState };
      })
    );
    setIsTariffsDirty(true);
  };

  const hasLoadedJobs = (tariffId: string) => {
    return detailingQuotes.some((q) =>
      (q.selected_services || []).some((s) => s.serviceId === tariffId)
    );
  };

  const handleDeleteTariff = (tariff: DetailingTariff) => {
    if (hasLoadedJobs(tariff.id)) {
      showToast(
        `El servicio "${tariff.name}" tiene trabajos cargados en el sistema y no puede eliminarse. Podés pausarlo para que no aparezca en nuevas cotizaciones.`,
        'error'
      );
      return;
    }

    if (
      window.confirm(
        `¿Estás seguro de que deseás eliminar el servicio "${tariff.name}"? Esta acción se aplicará al hacer clic en "Guardar cambios".`
      )
    ) {
      setLocalTariffs((prev) => prev.filter((t) => t.id !== tariff.id));
      setIsTariffsDirty(true);
      showToast(`Servicio "${tariff.name}" marcado para eliminar. Guardá los cambios para confirmar.`, 'info');
    }
  };

  const handleAddNewTariff = () => {
    const newId = `tariff-${crypto.randomUUID()}`;
    const nextOrder = (localTariffs.length > 0 ? Math.max(...localTariffs.map((t) => t.order || 0)) : 0) + 1;
    const newTariff: DetailingTariff = {
      id: newId,
      name: '',
      shortName: '',
      description: '',
      durationHours: 2,
      prices: {
        chico: 0,
        mediano: 0,
        suv: 0,
        pickup: 0,
        moto: 0
      },
      isActive: true,
      care_text: '',
      order: nextOrder
    };
    setLocalTariffs((prev) => [...prev, newTariff]);
    setIsTariffsDirty(true);
  };

  const validateTariffs = (tariffs: DetailingTariff[]): { isValid: boolean; error?: string } => {
    if (tariffs.length === 0) {
      return { isValid: false, error: 'Debe haber al menos un servicio en el tarifario.' };
    }

    for (let i = 0; i < tariffs.length; i++) {
      const t = tariffs[i];
      const nameTrimmed = (t.name || '').trim();
      if (!nameTrimmed) {
        return {
          isValid: false,
          error: `El servicio #${i + 1} no tiene nombre. El "Nombre del servicio" es obligatorio.`
        };
      }
    }

    // Validar nombres duplicados (case-insensitive)
    const namesSeen = new Set<string>();
    for (let i = 0; i < tariffs.length; i++) {
      const key = tariffs[i].name.trim().toLowerCase();
      if (namesSeen.has(key)) {
        return {
          isValid: false,
          error: `Existe más de un servicio con el nombre "${tariffs[i].name.trim()}". No se permiten nombres duplicados.`
        };
      }
      namesSeen.add(key);
    }

    return { isValid: true };
  };

  // Copia local para edición
  const [formData, setFormData] = useState<DetailingConfig>(() => {
    const copy = normalizeDetailingCommissionConfig(JSON.parse(JSON.stringify(config)) as DetailingConfig);
    if (!copy.origins || copy.origins.length === 0) {
      copy.origins = copy.client_origins && copy.client_origins.length > 0 ? copy.client_origins : [
        'Presencial',
        'WhatsApp',
        'Instagram orgánico',
        'Anuncios pagos',
        'Referido',
        'Formulario web',
        'Llamada',
        'Empresa'
      ];
    }
    if (!copy.origins.includes('Empresa')) {
      copy.origins.push('Empresa');
    }
    copy.client_origins = copy.origins;
    const existingRules = copy.origin_commission_rules || [];
    copy.origin_commission_rules = copy.origins.map((orig) => {
      const isAds = orig.toLowerCase().includes('anuncio');
      const found = existingRules.find((r) => r.origin.trim().toLowerCase() === orig.trim().toLowerCase());
      if (found) {
        return {
          ...found,
          romina_percentage: isAds ? 30 : found.romina_percentage
        };
      }
      return {
        origin: orig,
        maxi_percentage: isAds ? 12.5 : 30,
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

  const handleSave = async () => {
    // 1. Validar tarifario si hay cambios pendientes o si estamos en la sección de tarifario
    if (isTariffsDirty || activeSection === 'tariffs') {
      const validation = validateTariffs(localTariffs);
      if (!validation.isValid) {
        showToast(validation.error || 'Por favor revisá los datos del tarifario', 'error');
        return;
      }
    }

    // 2. Si hubo modificaciones en el tarifario, sincronizar con Supabase y DataContext
    if (isTariffsDirty) {
      const sanitizedTariffs = localTariffs.map((t, idx) => ({
        ...t,
        name: t.name.trim(),
        shortName: (t.shortName && t.shortName.trim()) ? t.shortName.trim() : t.name.trim(),
        durationHours: Number(t.durationHours) || 2,
        order: t.order || idx + 1
      }));
      await saveAllDetailingTariffs(sanitizedTariffs);
      setIsTariffsDirty(false);
    }

    const existingEmpRules = formData.commission_config?.employee_rules || [];
    const rominaEmp = existingEmpRules.find((r) => r.employee_id === 'user-romina');
    const maxiEmp = existingEmpRules.find((r) => r.employee_id === 'user-maxi');
    const rominaBase = typeof rominaEmp?.base_percentage === 'number' ? rominaEmp.base_percentage : 30;
    const maxiBase = typeof maxiEmp?.base_percentage === 'number' ? maxiEmp.base_percentage : 30;

    const updatedRules = (formData.origin_commission_rules || []).map((r) => {
      const isAds = r.origin.trim().toLowerCase().includes('anuncio');
      return {
        ...r,
        // La regla de 'Anuncios pagos' es solo de Maximiliano, nunca a Romina
        romina_percentage: isAds ? rominaBase : r.romina_percentage
      };
    });

    const syncedEmployeeRules: DetailingCommissionEmployeeRule[] = [
      {
        employee_id: 'user-romina',
        employee_name: 'Romina',
        base_percentage: rominaBase,
        origin_rules: updatedRules
          .filter((r) => !r.origin.trim().toLowerCase().includes('anuncio'))
          .map((r) => ({ origin: r.origin, percentage: r.romina_percentage })),
        is_default_participant: true
      },
      {
        employee_id: 'user-maxi',
        employee_name: 'Maximiliano',
        base_percentage: maxiBase,
        origin_rules: updatedRules.map((r) => ({ origin: r.origin, percentage: r.maxi_percentage })),
        is_default_participant: true
      }
    ];

    const toSave: DetailingConfig = normalizeDetailingCommissionConfig({
      ...formData,
      client_origins: formData.origins,
      origin_commission_rules: updatedRules,
      commission_config: {
        ...(formData.commission_config || {
          calculation_base: 'total_after_discounts',
          default_participants: ['user-romina', 'user-maxi']
        }),
        calculation_base: formData.commission_config?.calculation_base || 'total_after_discounts',
        default_participants: ['user-romina', 'user-maxi'],
        employee_rules: syncedEmployeeRules
      }
    });

    onSaveConfig(toSave);
    showToast('Configuración y tarifario guardados correctamente', 'success');
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

  // Lo esencial, siempre a la vista
  const mainNavItems = [
    { id: 'tariffs', label: 'Servicios', icon: Sparkles },
    { id: 'commissions', label: 'Comisiones', icon: DollarSign },
    { id: 'origins', label: 'Orígenes de cliente', icon: Users },
    { id: 'payments', label: 'Medios de pago', icon: CreditCard },
    { id: 'company', label: 'Datos del taller y logo', icon: Building2 }
  ];
  // Lo que se toca poco, plegado en "Más opciones"
  const advancedNavItems = [
    { id: 'servicios_empresas', label: 'Servicios para empresas', icon: Sparkles },
    { id: 'receipts', label: 'Comprobantes', icon: FileText },
    { id: 'discounts', label: 'Descuentos y recargo', icon: Percent },
    { id: 'expenses', label: 'Categorías de gastos', icon: Receipt },
    { id: 'void_reasons', label: 'Motivos de anulación', icon: Ban },
    { id: 'whatsapp', label: 'Mensaje de WhatsApp', icon: MessageCircle },
    { id: 'backup', label: 'Respaldo y limpieza', icon: Database }
  ];
  const isAdvancedActive = advancedNavItems.some((i) => i.id === activeSection);
  const navItems = [...mainNavItems, ...(showAdvanced || isAdvancedActive ? advancedNavItems : [])];

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
          className="bg-[#D7141A] hover:bg-[#b01015] relative inline-flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5 mr-1" />
          <span>Guardar cambios</span>
          {isTariffsDirty && (
            <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse ml-0.5" title="Cambios sin guardar en el tarifario" />
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Navegación lateral */}
        <div className="md:col-span-1 bg-white border border-[#E5E5E3] rounded-2xl p-2 shadow-xs space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const hasUnsavedInThisItem = item.id === 'tariffs' && isTariffsDirty;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (activeSection === 'tariffs' && isTariffsDirty && item.id !== 'tariffs') {
                    const confirmLeave = window.confirm(
                      'Tenés cambios sin guardar en "Tarifario y Cuidados". Si salís de esta sección, perderás las modificaciones.\n\n¿Deseás salir sin guardar?'
                    );
                    if (!confirmLeave) return;
                    setLocalTariffs(JSON.parse(JSON.stringify(detailingTariffs)));
                    setIsTariffsDirty(false);
                  }
                  setActiveSection(item.id as any);
                }}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-red-50 text-[#D7141A] border border-red-200'
                    : 'text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D7141A]' : 'text-[#6B6B6B]'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {hasUnsavedInThisItem && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Cambios sin guardar" />
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="w-full p-2.5 mt-1 rounded-xl text-left text-xs font-bold text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] border-t border-[#E5E5E3] cursor-pointer"
          >
            {showAdvanced || isAdvancedActive ? '− Menos opciones' : '+ Más opciones'}
          </button>
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

          {/* TARIFA PREVENTA EMPRESAS (SOLO ADMIN) */}
          {activeSection === 'tarifa_empresas' && (
            <div className="space-y-4">
              <DetailingPreventaTariffConfigSection
                tariff={formData.preventa_tariff}
                onChange={(updated) => setFormData((prev) => ({ ...prev, preventa_tariff: updated }))}
              />
            </div>
          )}

          {/* SERVICIOS ESPECIALES EMPRESAS (SOLO ADMIN) */}
          {activeSection === 'servicios_empresas' && (
            <div className="space-y-4">
              <DetailingCompanySpecialServicesConfigSection />
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-[#161616]">Tarifario y Cuidados Posteriores</h4>
                  <p className="text-[#6B6B6B] mt-0.5">
                    Precios por tamaño de vehículo, nombres y recomendaciones de cuidados que se incluyen automáticamente en los comprobantes y en la web de presupuestos.
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-[11px] text-[#6B7079] bg-[#F5F5F4] px-2.5 py-1 rounded-lg border border-[#E5E5E3] font-medium">
                    {localTariffs.length} {localTariffs.length === 1 ? 'servicio' : 'servicios'}
                  </span>
                </div>
              </div>

              {/* Aviso de cambios sin guardar en el tarifario */}
              {isTariffsDirty && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs shadow-xs animate-fade-in">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Tenés <strong>cambios sin guardar</strong> en el tarifario. Tocá <strong>"Guardar cambios"</strong> para aplicarlos en todo el sistema.
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    className="bg-[#D7141A] hover:bg-[#b01015] shrink-0 text-xs py-1.5 h-auto self-end sm:self-auto"
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    Guardar ahora
                  </Button>
                </div>
              )}

              {/* Lista de Tarjetas de Servicios Editables */}
              <div className="space-y-3.5">
                {localTariffs.map((t, index) => {
                  const hasJobs = hasLoadedJobs(t.id);
                  const isPaused = t.isActive === false;

                  return (
                    <div
                      key={t.id}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all space-y-3.5 ${
                        isPaused
                          ? 'bg-[#FAFAFA] border-[#E5E5E3] opacity-80'
                          : 'bg-[#F5F5F4] border-[#E5E5E3] hover:border-[#D4D4D8]'
                      }`}
                    >
                      {/* Cabecera de la tarjeta: Identificador, Estado y Acciones (Pausar / Eliminar) */}
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E5E5E3]">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="text-[10px] font-bold text-[#6B7079] bg-white px-2 py-0.5 rounded border border-[#E5E5E3] shrink-0">
                            #{index + 1}
                          </span>
                          <span className="font-bold text-xs text-[#161616] truncate max-w-[160px] sm:max-w-[280px]">
                            {t.name.trim() || 'Nuevo servicio sin nombre'}
                          </span>
                          {isPaused ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded shrink-0">
                              Pausado
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded shrink-0">
                              Activo
                            </span>
                          )}
                          {hasJobs && (
                            <span className="text-[10px] text-[#6B7079] bg-white px-2 py-0.5 rounded border border-[#E5E5E3] hidden sm:inline-block shrink-0">
                              Con trabajos vinculados
                            </span>
                          )}
                        </div>

                        {/* Botones de acción: Pausar / Reactivar y Eliminar */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleTogglePause(t.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                              isPaused
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-white text-[#6B7079] border-[#E5E5E3] hover:text-[#161616] hover:bg-[#F5F5F4]'
                            }`}
                            title={isPaused ? 'Reactivar servicio' : 'Pausar servicio'}
                          >
                            {isPaused ? (
                              <>
                                <Play className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Reactivar</span>
                              </>
                            ) : (
                              <>
                                <Pause className="w-3.5 h-3.5 text-[#6B7079]" />
                                <span>Pausar</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteTariff(t)}
                            disabled={hasJobs}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              hasJobs
                                ? 'bg-zinc-100 text-zinc-300 border-zinc-200 cursor-not-allowed'
                                : 'bg-white text-zinc-400 hover:text-rose-600 hover:bg-rose-50 border-[#E5E5E3] hover:border-rose-200 cursor-pointer'
                            }`}
                            title={
                              hasJobs
                                ? 'Este servicio tiene trabajos asociados en el sistema y no puede eliminarse (podés pausarlo).'
                                : 'Eliminar servicio'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Campos principales: Nombre, Nombre corto y Duración estimada */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <div className="sm:col-span-5">
                          <label className="text-[10px] font-bold text-[#6B7079] block mb-1">
                            Nombre del servicio *
                          </label>
                          <input
                            type="text"
                            value={t.name}
                            onChange={(e) => updateLocalTariff(t.id, { name: e.target.value })}
                            placeholder="Ej: Tratamiento Cerámico 9H"
                            className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2.5 py-1.5 font-bold text-xs text-[#161616] placeholder-[#9CA3AF] focus:outline-none focus:border-[#1E5EFF] focus:ring-1 focus:ring-[#1E5EFF]"
                            required
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="text-[10px] font-bold text-[#6B7079] block mb-1">
                            Nombre corto (web, comprobante y chips) *
                          </label>
                          <input
                            type="text"
                            value={t.shortName || ''}
                            onChange={(e) => updateLocalTariff(t.id, { shortName: e.target.value })}
                            placeholder="Ej: Cerámico 9H"
                            className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2.5 py-1.5 font-medium text-xs text-[#161616] placeholder-[#9CA3AF] focus:outline-none focus:border-[#1E5EFF] focus:ring-1 focus:ring-[#1E5EFF]"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="text-[10px] font-bold text-[#6B7079] block mb-1">
                            Duración estimada
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              min="0.5"
                              step="0.5"
                              value={t.durationHours || ''}
                              onChange={(e) =>
                                updateLocalTariff(t.id, { durationHours: parseFloat(e.target.value) || 0 })
                              }
                              placeholder="2"
                              className="w-full bg-white border border-[#E5E5E3] rounded-lg pl-2.5 pr-12 py-1.5 font-mono text-xs text-[#161616] focus:outline-none focus:border-[#1E5EFF] focus:ring-1 focus:ring-[#1E5EFF]"
                            />
                            <span className="absolute right-2.5 text-[10px] font-medium text-[#6B7079] pointer-events-none select-none">
                              horas
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Precios por Categoría */}
                      {/* Ya no se usan precios predeterminados: el precio se carga a mano en cada trabajo */}
                      {false && (
                      <div>
                        <label className="text-[10px] font-bold text-[#6B7079] block mb-1">
                          Precios por categoría de vehículo ($)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <div>
                            <span className="text-[10px] text-[#6B7079] block mb-0.5">Chico ($)</span>
                            <input
                              type="number"
                              value={t.prices.chico || 0}
                              onChange={(e) =>
                                updateLocalTariff(t.id, {
                                  prices: { ...t.prices, chico: Number(e.target.value) || 0 }
                                })
                              }
                              className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2 py-1 font-mono text-xs text-[#161616] focus:outline-none focus:border-[#1E5EFF]"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#6B7079] block mb-0.5">Mediano ($)</span>
                            <input
                              type="number"
                              value={t.prices.mediano || 0}
                              onChange={(e) =>
                                updateLocalTariff(t.id, {
                                  prices: { ...t.prices, mediano: Number(e.target.value) || 0 }
                                })
                              }
                              className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2 py-1 font-mono text-xs text-[#161616] focus:outline-none focus:border-[#1E5EFF]"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#6B7079] block mb-0.5">SUV ($)</span>
                            <input
                              type="number"
                              value={t.prices.suv || 0}
                              onChange={(e) =>
                                updateLocalTariff(t.id, {
                                  prices: { ...t.prices, suv: Number(e.target.value) || 0 }
                                })
                              }
                              className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2 py-1 font-mono text-xs text-[#161616] focus:outline-none focus:border-[#1E5EFF]"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#6B7079] block mb-0.5">Pick-up ($)</span>
                            <input
                              type="number"
                              value={t.prices.pickup || 0}
                              onChange={(e) =>
                                updateLocalTariff(t.id, {
                                  prices: { ...t.prices, pickup: Number(e.target.value) || 0 }
                                })
                              }
                              className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2 py-1 font-mono text-xs text-[#161616] focus:outline-none focus:border-[#1E5EFF]"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#6B7079] block mb-0.5">Moto ($)</span>
                            <input
                              type="number"
                              value={t.prices.moto || 0}
                              onChange={(e) =>
                                updateLocalTariff(t.id, {
                                  prices: { ...t.prices, moto: Number(e.target.value) || 0 }
                                })
                              }
                              className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2 py-1 font-mono text-xs text-[#161616] focus:outline-none focus:border-[#1E5EFF]"
                            />
                          </div>
                        </div>
                      </div>
                      )}

                      {/* Cuidados posteriores específicos del servicio */}
                      <div>
                        <span className="text-[10px] font-bold text-[#161616] block mb-1">
                          Cuidados posteriores y garantías para el comprobante:
                        </span>
                        <textarea
                          rows={2}
                          value={t.care_text || ''}
                          onChange={(e) => updateLocalTariff(t.id, { care_text: e.target.value })}
                          placeholder="Ej: No mojar durante las primeras 72h. Lavar a mano con shampoo de pH neutro..."
                          className="w-full bg-white border border-[#E5E5E3] rounded-lg p-2 text-xs text-[#161616] placeholder-[#9CA3AF] focus:outline-none focus:border-[#1E5EFF]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botón "+ Agregar servicio" al final de la lista */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAddNewTariff}
                  className="w-full py-3.5 px-4 rounded-xl border-2 border-dashed border-[#E5E5E3] hover:border-[#1E5EFF] bg-white hover:bg-[#EEF3FF] text-[#161616] hover:text-[#1E5EFF] font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs group"
                >
                  <Plus className="w-4 h-4 text-[#6B7079] group-hover:text-[#1E5EFF] transition-colors" />
                  <span>+ Agregar servicio</span>
                </button>
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
          {activeSection === 'commissions' && (() => {
            const empRules = formData.commission_config?.employee_rules || [];
            const rominaEmp = empRules.find((r) => r.employee_id === 'user-romina');
            const maxiEmp = empRules.find((r) => r.employee_id === 'user-maxi');
            const rominaBase = typeof rominaEmp?.base_percentage === 'number' ? rominaEmp.base_percentage : 30;
            const maxiBase = typeof maxiEmp?.base_percentage === 'number' ? maxiEmp.base_percentage : 30;

            const adsRule = (formData.origin_commission_rules || []).find((r) => r.origin.trim().toLowerCase().includes('anuncio'));
            const companyRule = (formData.origin_commission_rules || []).find((r) => r.origin.trim().toLowerCase() === 'empresa');

            const maxiAdsPct = typeof adsRule?.maxi_percentage === 'number' ? adsRule.maxi_percentage : 12.5;
            const rominaCompanyPct = typeof companyRule?.romina_percentage === 'number' ? companyRule.romina_percentage : 12.5;
            const maxiCompanyPct = typeof companyRule?.maxi_percentage === 'number' ? companyRule.maxi_percentage : 12.5;

            const updateBasePct = (empId: 'user-romina' | 'user-maxi', val: number) => {
              setFormData((prev) => {
                const currentEmpRules = prev.commission_config?.employee_rules || [];
                const nextEmpRules = currentEmpRules.map((er) =>
                  er.employee_id === empId ? { ...er, base_percentage: val } : er
                );
                const nextOriginRules = (prev.origin_commission_rules || []).map((or) => {
                  const oNorm = or.origin.trim().toLowerCase();
                  if (empId === 'user-romina') {
                    if (oNorm !== 'empresa') return { ...or, romina_percentage: val };
                  } else {
                    if (!oNorm.includes('anuncio') && oNorm !== 'empresa') return { ...or, maxi_percentage: val };
                  }
                  return or;
                });
                return {
                  ...prev,
                  origin_commission_rules: nextOriginRules,
                  commission_config: {
                    ...(prev.commission_config || { calculation_base: 'total_after_discounts', default_participants: ['user-romina', 'user-maxi'], employee_rules: [] }),
                    employee_rules: nextEmpRules
                  }
                };
              });
            };

            return (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-[#161616]">Reglas de Comisión</h4>
                  <p className="text-[#6B6B6B] mt-0.5">
                    Las comisiones se generan automáticamente al quedar el trabajo Cobrado. Cuando trabajan &quot;Los dos&quot;, cada uno cobra su porcentaje completo sobre el total (no se divide).
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

                  <div className="pt-2 border-t border-[#E5E5E3] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#161616]">Porcentajes automáticos por persona:</span>
                      <button
                        type="button"
                        onClick={() => setActiveSection('origins')}
                        className="text-[11px] text-[#D7141A] hover:underline font-bold cursor-pointer"
                      >
                        Ver tabla de canales →
                      </button>
                    </div>

                    {/* Romina */}
                    <div className="p-3 bg-white rounded-xl border border-[#E5E5E3] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-[#161616]">Romina</span>
                          <span className="text-[10px] text-[#6B6B6B] block">Detailer • Su % particular aplica siempre (incluido Anuncios pagos)</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="flex items-center justify-between bg-[#F5F5F4] px-3 py-2 rounded-lg border border-[#E5E5E3]">
                          <span className="text-[11px] font-semibold text-[#161616]">% Particulares (Siempre):</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={rominaBase}
                              onChange={(e) => updateBasePct('user-romina', parseFloat(e.target.value) || 0)}
                              className="w-16 bg-white border border-[#E5E5E3] rounded px-1.5 py-0.5 text-xs text-center font-bold text-[#161616]"
                            />
                            <span className="text-[11px] font-bold text-[#6B6B6B]">%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-[#F5F5F4] px-3 py-2 rounded-lg border border-[#E5E5E3]">
                          <span className="text-[11px] font-semibold text-[#161616]">% Empresas:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={rominaCompanyPct}
                              onChange={(e) => handleUpdateOriginCommission('Empresa', 'romina', parseFloat(e.target.value) || 0)}
                              className="w-16 bg-white border border-[#E5E5E3] rounded px-1.5 py-0.5 text-xs text-center font-bold text-[#161616]"
                            />
                            <span className="text-[11px] font-bold text-[#6B6B6B]">%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Maximiliano */}
                    <div className="p-3 bg-white rounded-xl border border-[#E5E5E3] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-[#161616]">Maximiliano</span>
                          <span className="text-[10px] text-[#6B6B6B] block">Dueño / Admin • Tiene regla propia para Anuncios pagos</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="flex items-center justify-between bg-[#F5F5F4] px-3 py-2 rounded-lg border border-[#E5E5E3]">
                          <span className="text-[11px] font-semibold text-[#161616]">% General:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={maxiBase}
                              onChange={(e) => updateBasePct('user-maxi', parseFloat(e.target.value) || 0)}
                              className="w-14 bg-white border border-[#E5E5E3] rounded px-1.5 py-0.5 text-xs text-center font-bold text-[#161616]"
                            />
                            <span className="text-[11px] font-bold text-[#6B6B6B]">%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-red-50/60 px-3 py-2 rounded-lg border border-red-200">
                          <span className="text-[11px] font-semibold text-[#D7141A]">% Anuncios pagos:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={maxiAdsPct}
                              onChange={(e) => handleUpdateOriginCommission('Anuncios pagos', 'maxi', parseFloat(e.target.value) || 0)}
                              className="w-14 bg-white border border-red-200 rounded px-1.5 py-0.5 text-xs text-center font-bold text-[#161616]"
                            />
                            <span className="text-[11px] font-bold text-[#6B6B6B]">%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-[#F5F5F4] px-3 py-2 rounded-lg border border-[#E5E5E3]">
                          <span className="text-[11px] font-semibold text-[#161616]">% Empresas:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={maxiCompanyPct}
                              onChange={(e) => handleUpdateOriginCommission('Empresa', 'maxi', parseFloat(e.target.value) || 0)}
                              className="w-14 bg-white border border-[#E5E5E3] rounded px-1.5 py-0.5 text-xs text-center font-bold text-[#161616]"
                            />
                            <span className="text-[11px] font-bold text-[#6B6B6B]">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

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
