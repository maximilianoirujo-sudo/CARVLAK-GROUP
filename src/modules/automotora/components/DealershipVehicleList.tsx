import React, { useState, useMemo } from 'react';
import {
  Car,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  DollarSign,
  Clock,
  AlertTriangle,
  Sparkles,
  ClipboardCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Tag,
  Share2,
  Grid,
  List as ListIcon,
  Download,
  Zap,
  Copy,
  Layers,
  Check,
  X,
  CheckSquare,
  Square
} from 'lucide-react';
import {
  DealershipVehicle,
  DealershipVehicleStatus,
  DealershipVehicleType,
  PurchaseOrigin
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { DealershipBulkActionModal } from './DealershipBulkActionModal';
import { DealershipConfirmStatusDialog } from './DealershipConfirmStatusDialog';

interface DealershipVehicleListProps {
  onSelectVehicle: (vehicle: DealershipVehicle) => void;
  onNewVehicle: () => void;
  onEditVehicle: (vehicle: DealershipVehicle) => void;
  onOpenSaleModal: (vehicle: DealershipVehicle) => void;
  onOpenMigrationModal: () => void;
  onOpenPublicCatalog: () => void;
}

export const DealershipVehicleList: React.FC<DealershipVehicleListProps> = ({
  onSelectVehicle,
  onNewVehicle,
  onEditVehicle,
  onOpenSaleModal,
  onOpenMigrationModal,
  onOpenPublicCatalog
}) => {
  const {
    dealershipVehicles,
    dealershipConfig,
    updateDealershipVehicle,
    updateDealershipVehicleStatus,
    duplicateDealershipVehicle,
    bulkUpdateDealershipVehicles,
    bulkAdjustVehiclePrices,
    canEditDealershipStock
  } = useData();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const isAdmin = profile?.roles.includes('admin');
  const canEdit = canEditDealershipStock(profile?.roles);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState<'todos' | 'usado' | '0km' | 'incompletos'>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [brandFilter, setBrandFilter] = useState<string>('todos');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [originFilter, setOriginFilter] = useState<string>('todos');
  const [onlyOverdueStock, setOnlyOverdueStock] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Multi-selección para acciones masivas
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Edición rápida inline de precio
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceVal, setEditingPriceVal] = useState<number>(0);

  // Confirmación de cambio de estado
  const [confirmStatusVehicle, setConfirmStatusVehicle] = useState<DealershipVehicle | null>(null);
  const [confirmTargetStatus, setConfirmTargetStatus] = useState<DealershipVehicleStatus | null>(null);

  const alertDaysThreshold =
    dealershipConfig?.days_in_stock_alert_threshold || dealershipConfig?.days_alert_threshold || 60;

  // Cálculo de días en stock
  const calculateDaysInStock = (vehicle: DealershipVehicle) => {
    if (vehicle.status === 'vendido' && vehicle.sale_record?.sale_date) {
      const start = new Date(vehicle.purchase_date || vehicle.created_at).getTime();
      const end = new Date(vehicle.sale_record.sale_date).getTime();
      return Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
    }
    const start = new Date(vehicle.purchase_date || vehicle.created_at).getTime();
    return Math.max(0, Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24)));
  };

  // Filtrado
  const filteredVehicles = useMemo(() => {
    return dealershipVehicles.filter((v) => {
      const plateStr = v.plate || '';
      const vinStr = v.chassis_vin || '';
      const matchesSearch =
        plateStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vinStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.version && v.version.toLowerCase().includes(searchTerm.toLowerCase())) ||
        v.year.toString().includes(searchTerm);

      const matchesCondition =
        conditionFilter === 'todos'
          ? true
          : conditionFilter === 'usado'
          ? v.condition === 'usado'
          : conditionFilter === '0km'
          ? v.condition === '0km'
          : Boolean(v.incomplete_data);

      const matchesStatus =
        statusFilter === 'todos'
          ? true
          : statusFilter === 'en_stock'
          ? ['comprado', 'preparacion', 'publicado', 'reservado'].includes(v.status)
          : v.status === statusFilter;

      const matchesBrand =
        brandFilter === 'todos' ? true : v.brand.toLowerCase() === brandFilter.toLowerCase();

      const matchesType =
        typeFilter === 'todos'
          ? true
          : (v.vehicle_type || 'auto').toLowerCase() === typeFilter.toLowerCase();

      const matchesOrigin =
        originFilter === 'todos' ? true : v.purchase_origin === originFilter;

      const days = calculateDaysInStock(v);
      const matchesOverdue = onlyOverdueStock
        ? v.status !== 'vendido' && days >= alertDaysThreshold
        : true;

      return (
        matchesSearch &&
        matchesCondition &&
        matchesStatus &&
        matchesBrand &&
        matchesType &&
        matchesOrigin &&
        matchesOverdue
      );
    });
  }, [
    dealershipVehicles,
    searchTerm,
    conditionFilter,
    statusFilter,
    brandFilter,
    typeFilter,
    originFilter,
    onlyOverdueStock,
    alertDaysThreshold
  ]);

  // Lista de marcas y tipos disponibles en stock para filtros
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    dealershipVehicles.forEach((v) => {
      if (v.brand) set.add(v.brand);
    });
    return Array.from(set).sort();
  }, [dealershipVehicles]);

  // Contadores por estado y condición
  const counts = useMemo(() => {
    return {
      todos: dealershipVehicles.length,
      usados: dealershipVehicles.filter((v) => v.condition === 'usado').length,
      ceroKm: dealershipVehicles.filter((v) => v.condition === '0km').length,
      incompletos: dealershipVehicles.filter((v) => v.incomplete_data).length,
      en_stock: dealershipVehicles.filter((v) =>
        ['comprado', 'preparacion', 'publicado', 'reservado'].includes(v.status)
      ).length,
      evaluacion: dealershipVehicles.filter((v) => v.status === 'evaluacion').length,
      comprado: dealershipVehicles.filter((v) => v.status === 'comprado').length,
      preparacion: dealershipVehicles.filter((v) => v.status === 'preparacion').length,
      publicado: dealershipVehicles.filter((v) => v.status === 'publicado').length,
      reservado: dealershipVehicles.filter((v) => v.status === 'reservado').length,
      vendido: dealershipVehicles.filter((v) => v.status === 'vendido').length,
      overdue: dealershipVehicles.filter(
        (v) => v.status !== 'vendido' && calculateDaysInStock(v) >= alertDaysThreshold
      ).length
    };
  }, [dealershipVehicles, alertDaysThreshold]);

  // Manejo de Selección Masiva
  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    if (selectedIds.size === filteredVehicles.length && filteredVehicles.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredVehicles.map((v) => v.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Duplicar auto
  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEdit) {
      showToast('No tenés permisos para duplicar vehículos', 'error');
      return;
    }
    const dup = duplicateDealershipVehicle(id);
    if (dup) {
      showToast(`Vehículo duplicado como borrador: ${dup.brand} ${dup.model}`, 'success');
    }
  };

  // Cambio rápido inline de precio
  const startEditingPrice = (car: DealershipVehicle, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEdit) return;
    setEditingPriceId(car.id);
    setEditingPriceVal(car.sale_price);
  };

  const saveEditingPrice = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    if (editingPriceVal <= 0) return;
    updateDealershipVehicle(id, { sale_price: Number(editingPriceVal) });
    setEditingPriceId(null);
    showToast('Precio actualizado correctamente', 'success');
  };

  const cancelEditingPrice = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPriceId(null);
  };

  // Cambio de estado con confirmación
  const handleQuickStatusChange = (car: DealershipVehicle, newStatus: DealershipVehicleStatus, e: React.MouseEvent | React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    if (!canEdit) {
      showToast('No tenés permisos para cambiar el estado', 'error');
      return;
    }
    if (newStatus === car.status) return;
    setConfirmStatusVehicle(car);
    setConfirmTargetStatus(newStatus);
  };

  const handleConfirmStatusChange = () => {
    if (confirmStatusVehicle && confirmTargetStatus) {
      updateDealershipVehicleStatus(confirmStatusVehicle.id, confirmTargetStatus);
      showToast(`Estado de ${confirmStatusVehicle.brand} ${confirmStatusVehicle.model} cambiado a ${confirmTargetStatus}`, 'success');
      setConfirmStatusVehicle(null);
      setConfirmTargetStatus(null);
    }
  };

  // Bulk actions handlers
  const handleApplyBulkStatus = (newStatus: DealershipVehicleStatus) => {
    bulkUpdateDealershipVehicles(Array.from(selectedIds), { status: newStatus });
    showToast(`Estado actualizado en ${selectedIds.size} vehículos`, 'success');
    setIsBulkModalOpen(false);
    clearSelection();
  };

  const handleApplyBulkPrices = (type: 'percent' | 'fixed', amount: number) => {
    bulkAdjustVehiclePrices(Array.from(selectedIds), type, amount);
    showToast(`Ajuste de precio aplicado a ${selectedIds.size} vehículos`, 'success');
    setIsBulkModalOpen(false);
    clearSelection();
  };

  const getStatusBadge = (status: DealershipVehicleStatus) => {
    switch (status) {
      case 'evaluacion':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            🔍 En Evaluación
          </span>
        );
      case 'comprado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
            📥 Comprado
          </span>
        );
      case 'preparacion':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
            ⚙️ Preparación
          </span>
        );
      case 'publicado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            🌐 Publicado
          </span>
        );
      case 'reservado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
            🔒 Reservado
          </span>
        );
      case 'vendido':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-700 text-slate-300 border border-slate-600">
            🤝 Vendido
          </span>
        );
      case 'descartado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
            ❌ Descartado
          </span>
        );
    }
  };

  const getOriginLabel = (origin: PurchaseOrigin) => {
    switch (origin) {
      case 'particular':
        return 'Particular';
      case 'concesionaria':
        return 'Concesionaria';
      case 'parte_de_pago':
        return 'Parte de Pago / Permuta';
      case 'consignacion':
        return 'Consignación';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Alerta de autos estancados en stock (> 60 días) */}
      {counts.overdue > 0 && (
        <div
          onClick={() => setOnlyOverdueStock(!onlyOverdueStock)}
          className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between gap-3 shadow-lg ${
            onlyOverdueStock
              ? 'bg-amber-500/20 border-amber-500 text-amber-200'
              : 'bg-amber-950/20 border-amber-500/30 text-amber-300 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl shrink-0 font-bold">
              ⚠️
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-amber-400">
                Alerta de Inventario Inmovilizado
              </div>
              <div className="text-sm font-bold text-white mt-0.5">
                Hay {counts.overdue} auto{counts.overdue > 1 ? 's' : ''} con más de {alertDaysThreshold} días en stock
              </div>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {onlyOverdueStock ? 'Mostrar Todos' : 'Filtrar Estancados'}
          </span>
        </div>
      )}

      {/* Barra de Acciones Superiores */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-white flex items-center gap-2">
            Inventario de Vehículos
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {filteredVehicles.length} de {dealershipVehicles.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Administración completa de stock, fichas, fotos y sincronización web.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botón Catálogo Web */}
          <button
            onClick={onOpenPublicCatalog}
            className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
            title="Abrir catálogo público para clientes"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Catálogo Web</span>
          </button>

          {/* Botón Importar AppAuto */}
          <button
            onClick={onOpenMigrationModal}
            className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center gap-1.5 transition-all shadow-sm"
            title="Importar los 44 autos cargados en appauto oficial con fotos HD"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Importar AppAuto</span>
          </button>

          {/* Botón Nuevo Auto */}
          {canEdit && (
            <button
              onClick={onNewVehicle}
              className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Auto</span>
            </button>
          )}
        </div>
      </div>

      {/* Selector de Segmento / Condición: Usados vs 0km vs Incompletos */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <button
          onClick={() => setConditionFilter('todos')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
            conditionFilter === 'todos'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Todos</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/20">{counts.todos}</span>
        </button>

        <button
          onClick={() => setConditionFilter('usado')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
            conditionFilter === 'usado'
              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/10'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>Usados</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-950/40 text-blue-200">{counts.usados}</span>
        </button>

        <button
          onClick={() => setConditionFilter('0km')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
            conditionFilter === '0km'
              ? 'bg-purple-500 text-white shadow-md shadow-purple-500/10'
              : 'text-purple-300 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          <span>0km</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-950/40 text-purple-200">{counts.ceroKm}</span>
        </button>

        <button
          onClick={() => setConditionFilter('incompletos')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
            conditionFilter === 'incompletos'
              ? 'bg-amber-500/30 text-amber-200 border border-amber-500/60'
              : 'text-amber-400/80 hover:text-amber-300'
          }`}
        >
          <span>⚠️ Incompletos</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300">{counts.incompletos}</span>
        </button>
      </div>

      {/* Tabs de Estado de Vehículos */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/80">
        {[
          { id: 'todos', label: 'Todos', count: counts.todos },
          { id: 'en_stock', label: 'En Stock Activo', count: counts.en_stock },
          { id: 'evaluacion', label: 'Evaluación', count: counts.evaluacion },
          { id: 'comprado', label: 'Comprado', count: counts.comprado },
          { id: 'preparacion', label: 'Preparación', count: counts.preparacion },
          { id: 'publicado', label: 'Publicado', count: counts.publicado },
          { id: 'reservado', label: 'Reservado', count: counts.reservado },
          { id: 'vendido', label: 'Vendido', count: counts.vendido }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
              statusFilter === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                statusFilter === tab.id
                  ? 'bg-slate-950/20 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Barra de Filtros Adicionales y Búsqueda */}
      <div className="p-4 rounded-3xl bg-[#0E131C] border border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por matrícula, marca, modelo, versión o año..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Marca */}
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="todos">Todas las marcas</option>
            {availableBrands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Selector de Tipo */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="todos">Todos los tipos</option>
            {(dealershipConfig.vehicle_types || ['Auto', 'Moto', 'Todoterreno']).map((vt) => (
              <option key={vt} value={vt.toLowerCase().replace(/[^a-z]/g, '')}>{vt}</option>
            ))}
          </select>

          {/* Selector de Origen */}
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="todos">Todos los orígenes</option>
            <option value="particular">Particular</option>
            <option value="concesionaria">Concesionaria</option>
            <option value="parte_de_pago">Parte de Pago / Permuta</option>
            <option value="consignacion">Consignación</option>
          </select>

          {/* Seleccionar Todos Toggle */}
          {canEdit && filteredVehicles.length > 0 && (
            <button
              onClick={toggleSelectAllVisible}
              className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                selectedIds.size === filteredVehicles.length && filteredVehicles.length > 0
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Seleccionar todos los visibles"
            >
              {selectedIds.size === filteredVehicles.length && filteredVehicles.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-blue-400" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Seleccionar todo</span>
            </button>
          )}

          {/* Toggle Grid / Tabla */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Vista Cuadrícula"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Vista Tabla"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Vehículos: Modo Grid */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((car) => {
            const daysInStock = calculateDaysInStock(car);
            const isOverdue = car.status !== 'vendido' && daysInStock >= alertDaysThreshold;
            const cover = car.cover_image || (car.images && car.images[0]) || '';
            const isSelected = selectedIds.has(car.id);
            const isEditingThisPrice = editingPriceId === car.id;

            return (
              <div
                key={car.id}
                className={`group rounded-3xl bg-[#101520] border transition-all flex flex-col overflow-hidden hover:border-slate-700 shadow-xl relative ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/30'
                    : isOverdue
                    ? 'border-amber-500/40 ring-1 ring-amber-500/20'
                    : 'border-slate-800'
                }`}
              >
                {/* Portada con Imagen y Badges */}
                <div
                  onClick={() => onSelectVehicle(car)}
                  className="relative h-44 bg-slate-900 overflow-hidden cursor-pointer"
                >
                  {cover ? (
                    <img
                      src={cover}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                      <Car className="w-12 h-12" />
                      <span className="text-[11px] font-bold">Sin foto cargada</span>
                    </div>
                  )}

                  {/* Checkbox de Selección Masiva */}
                  {canEdit && (
                    <div
                      onClick={(e) => toggleSelectOne(car.id, e)}
                      className="absolute top-2.5 right-2.5 z-10"
                    >
                      <button
                        type="button"
                        className={`w-7 h-7 rounded-xl flex items-center justify-center backdrop-blur-md transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40'
                            : 'bg-black/60 text-gray-400 hover:text-white border border-gray-700'
                        }`}
                      >
                        {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : <Square className="w-4 h-4" />}
                      </button>
                    </div>
                  )}

                  {/* Estado Badge + 0km + Autonomía */}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 max-w-[70%]">
                    {getStatusBadge(car.status)}
                    {car.condition === '0km' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-950/90 text-purple-300 border border-purple-500/60 backdrop-blur-md flex items-center gap-1 shadow-sm">
                        <Zap className="w-2.5 h-2.5 text-purple-400" />
                        0KM
                      </span>
                    )}
                    {car.fuel === 'Eléctrico' && car.autonomy_km && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 backdrop-blur-md shadow-sm">
                        🔋 {car.autonomy_km} km
                      </span>
                    )}
                    {car.incomplete_data && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/90 text-amber-300 border border-amber-500/60 backdrop-blur-md shadow-sm">
                        ⚠️ Incompleto
                      </span>
                    )}
                  </div>

                  {/* Alerta de Días en Stock */}
                  <div className="absolute bottom-2.5 right-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md border flex items-center gap-1 ${
                        isOverdue
                          ? 'bg-amber-950/90 text-amber-300 border-amber-500/60 font-black animate-pulse'
                          : 'bg-slate-950/80 text-slate-300 border-slate-700'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{daysInStock} días</span>
                    </span>
                  </div>

                  {/* Matrícula o Chasis Flotante */}
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                    {car.plate ? (
                      <span className="font-mono text-xs font-black px-2 py-1 rounded-lg bg-slate-950/90 backdrop-blur-md text-amber-400 border border-slate-800 shadow-md">
                        {car.plate}
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] font-black px-2 py-1 rounded-lg bg-slate-950/90 backdrop-blur-md text-purple-300 border border-purple-500/40 shadow-md flex items-center gap-1">
                        <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-purple-500/30 text-purple-200">0km</span>
                        <span>{car.chassis_vin || 'Sin chasis'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Contenido de la Ficha */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Título y Año */}
                    <div
                      onClick={() => onSelectVehicle(car)}
                      className="cursor-pointer group-hover:text-amber-400 transition-colors"
                    >
                      <h3 className="text-sm font-black text-white leading-tight">
                        {car.brand} {car.model} {car.version || ''}
                      </h3>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>Año {car.year}</span>
                        <span>•</span>
                        <span>{car.mileage.toLocaleString()} km</span>
                        <span>•</span>
                        <span>{car.transmission}</span>
                        <span>•</span>
                        <span>{car.fuel}</span>
                      </div>
                    </div>

                    {/* Precios y Margen con Edición Rápida Inline */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-end justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          Precio de Venta
                          {canEdit && !isEditingThisPrice && (
                            <button
                              onClick={(e) => startEditingPrice(car, e)}
                              className="text-gray-500 hover:text-emerald-400 transition-colors p-0.5"
                              title="Editar precio rápido"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {isEditingThisPrice ? (
                          <div className="flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">USD</span>
                              <input
                                type="number"
                                autoFocus
                                value={editingPriceVal || ''}
                                onChange={(e) => setEditingPriceVal(parseInt(e.target.value) || 0)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditingPrice(car.id, e);
                                  if (e.key === 'Escape') cancelEditingPrice(e as any);
                                }}
                                className="w-28 pl-9 pr-2 py-1 bg-zinc-900 border border-emerald-500 rounded-lg text-xs font-mono font-bold text-white focus:outline-none"
                              />
                            </div>
                            <button
                              onClick={(e) => saveEditingPrice(car.id, e)}
                              className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white"
                              title="Guardar precio"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={cancelEditingPrice}
                              className="p-1 rounded-md bg-zinc-800 text-gray-400 hover:text-white"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={(e) => canEdit && startEditingPrice(car, e)}
                            className={`text-base font-black text-emerald-400 ${canEdit ? 'cursor-pointer hover:underline' : ''}`}
                            title={canEdit ? 'Click para editar precio rápidamente' : undefined}
                          >
                            USD {car.sale_price.toLocaleString('es-UY')}
                          </div>
                        )}
                      </div>

                      {isAdmin && (
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Costo / Margen
                          </div>
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-[11px] text-slate-400 font-bold">
                              ${Math.round(car.total_real_cost_usd || 0).toLocaleString()}
                            </span>
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                                (car.estimated_margin_usd || 0) >= 0
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              +${Math.round(car.estimated_margin_usd || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones de la Ficha */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                    <button
                      onClick={() => onSelectVehicle(car)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1 transition-colors"
                      title="Ver Ficha y Alistamiento"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ficha</span>
                    </button>

                    {canEdit && (
                      <button
                        onClick={() => onEditVehicle(car)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                        title="Editar Ficha Completa"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {canEdit && (
                      <button
                        onClick={(e) => handleDuplicate(car.id, e)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                        title="Duplicar unidad"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {car.status !== 'vendido' && (
                      <button
                        onClick={() => onOpenSaleModal(car)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-black flex items-center gap-1 transition-all"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{car.status === 'reservado' ? 'Liquidar Venta' : 'Vender'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lista de Vehículos: Modo Tabla */}
      {viewMode === 'table' && (
        <div className="rounded-3xl bg-[#101520] border border-slate-800 overflow-x-auto shadow-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-wider bg-slate-900/50">
                {canEdit && (
                  <th className="p-3 w-8">
                    <button
                      onClick={toggleSelectAllVisible}
                      className="text-gray-400 hover:text-white transition-colors"
                      title="Seleccionar todos"
                    >
                      {selectedIds.size === filteredVehicles.length && filteredVehicles.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                )}
                <th className="p-3">Auto / Matrícula</th>
                <th className="p-3">Año / Km</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Días Stock</th>
                <th className="p-3">Origen</th>
                <th className="p-3 text-right">Precio Venta</th>
                {isAdmin && <th className="p-3 text-right">Costo Real</th>}
                {isAdmin && <th className="p-3 text-right">Margen Proy.</th>}
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredVehicles.map((car) => {
                const days = calculateDaysInStock(car);
                const isOverdue = car.status !== 'vendido' && days >= alertDaysThreshold;
                const isSelected = selectedIds.has(car.id);
                const isEditingThisPrice = editingPriceId === car.id;

                return (
                  <tr
                    key={car.id}
                    className={`transition-colors ${isSelected ? 'bg-blue-600/10' : 'hover:bg-slate-900/40'}`}
                  >
                    {canEdit && (
                      <td className="p-3 w-8">
                        <button
                          type="button"
                          onClick={(e) => toggleSelectOne(car.id, e)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    )}

                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-800">
                          {car.cover_image || (car.images && car.images[0]) ? (
                            <img
                              src={car.cover_image || car.images[0]}
                              alt={car.plate}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <Car className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div
                            onClick={() => onSelectVehicle(car)}
                            className="font-bold text-white cursor-pointer hover:text-amber-400"
                          >
                            {car.brand} {car.model} {car.version || ''}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] text-amber-400">
                              {car.plate || car.chassis_vin || 'Sin matrícula'}
                            </span>
                            {car.condition === '0km' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-500/20 text-purple-300">
                                0KM
                              </span>
                            )}
                            {car.fuel === 'Eléctrico' && car.autonomy_km && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                                🔋 {car.autonomy_km}km
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-slate-300">
                      <div>Año {car.year}</div>
                      <div className="text-[10px] text-slate-500">{car.mileage.toLocaleString()} km</div>
                    </td>

                    <td className="p-3">
                      {canEdit ? (
                        <select
                          value={car.status}
                          onChange={(e) => handleQuickStatusChange(car, e.target.value as DealershipVehicleStatus, e)}
                          className="bg-zinc-900 border border-gray-700 text-xs rounded-lg px-2 py-1 text-white focus:outline-none focus:border-amber-500"
                        >
                          <option value="evaluacion">En evaluación</option>
                          <option value="comprado">Comprado</option>
                          <option value="preparacion">En preparación</option>
                          <option value="publicado">Publicado</option>
                          <option value="reservado">Reservado</option>
                          <option value="vendido">Vendido</option>
                          <option value="descartado">Descartado</option>
                        </select>
                      ) : (
                        getStatusBadge(car.status)
                      )}
                    </td>

                    <td className="p-3">
                      <span
                        className={`font-bold ${
                          isOverdue ? 'text-amber-400 font-black' : 'text-slate-400'
                        }`}
                      >
                        {days} días
                      </span>
                    </td>

                    <td className="p-3 text-slate-400 text-[11px]">
                      {getOriginLabel(car.purchase_origin)}
                    </td>

                    <td className="p-3 text-right">
                      {isEditingThisPrice ? (
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="number"
                            autoFocus
                            value={editingPriceVal || ''}
                            onChange={(e) => setEditingPriceVal(parseInt(e.target.value) || 0)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditingPrice(car.id, e);
                              if (e.key === 'Escape') cancelEditingPrice(e as any);
                            }}
                            className="w-24 px-2 py-0.5 bg-zinc-900 border border-emerald-500 rounded text-xs font-mono font-bold text-white focus:outline-none"
                          />
                          <button
                            onClick={(e) => saveEditingPrice(car.id, e)}
                            className="p-1 rounded bg-emerald-600 text-white"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={cancelEditingPrice}
                            className="p-1 rounded bg-zinc-800 text-gray-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={(e) => canEdit && startEditingPrice(car, e)}
                          className={`font-black text-emerald-400 flex items-center justify-end gap-1 ${
                            canEdit ? 'cursor-pointer hover:underline' : ''
                          }`}
                          title={canEdit ? 'Click para editar precio' : undefined}
                        >
                          <span>USD {car.sale_price.toLocaleString('es-UY')}</span>
                          {canEdit && <Edit className="w-3 h-3 text-gray-500 opacity-60 hover:opacity-100" />}
                        </div>
                      )}
                    </td>

                    {isAdmin && (
                      <td className="p-3 text-right text-slate-300 font-bold">
                        USD {Math.round(car.total_real_cost_usd || 0).toLocaleString()}
                      </td>
                    )}

                    {isAdmin && (
                      <td className="p-3 text-right">
                        <span
                          className={`font-black ${
                            (car.estimated_margin_usd || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          +${Math.round(car.estimated_margin_usd || 0).toLocaleString()} (
                          {car.estimated_margin_percent?.toFixed(1) || '0.0'}%)
                        </span>
                      </td>
                    )}

                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onSelectVehicle(car)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                          title="Ver Ficha"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                        </button>

                        {canEdit && (
                          <button
                            onClick={() => onEditVehicle(car)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                            title="Editar"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canEdit && (
                          <button
                            onClick={(e) => handleDuplicate(car.id, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                            title="Duplicar"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {car.status !== 'vendido' && (
                          <button
                            onClick={() => onOpenSaleModal(car)}
                            className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                            title="Vender / Reservar"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filteredVehicles.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-[#101520] border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center text-xl">
            🔍
          </div>
          <h3 className="text-sm font-black text-white">No se encontraron vehículos</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Probá ajustando los filtros de búsqueda o cargá un nuevo auto en el inventario.
          </p>
        </div>
      )}

      {/* BARRA FLOTANTE DE ACCIONES MASIVAS */}
      {canEdit && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#18181b]/95 backdrop-blur-md border border-gray-700 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              {selectedIds.size}
            </span>
            <span className="text-xs font-semibold text-white">
              vehículo{selectedIds.size === 1 ? '' : 's'} seleccionado{selectedIds.size === 1 ? '' : 's'}
            </span>
          </div>

          <div className="h-4 w-px bg-gray-700" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Acciones Masivas</span>
            </button>

            <button
              onClick={clearSelection}
              className="px-2.5 py-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-zinc-800 text-xs transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE ACCIONES MASIVAS */}
      {isBulkModalOpen && (
        <DealershipBulkActionModal
          isOpen={isBulkModalOpen}
          selectedVehicles={dealershipVehicles.filter((v) => selectedIds.has(v.id))}
          onClose={() => setIsBulkModalOpen(false)}
          onApplyStatus={handleApplyBulkStatus}
          onApplyPriceAdjustment={handleApplyBulkPrices}
        />
      )}

      {/* MODAL DE CONFIRMACIÓN DE CAMBIO DE ESTADO INDIVIDUAL */}
      {confirmStatusVehicle && confirmTargetStatus && (
        <DealershipConfirmStatusDialog
          isOpen={Boolean(confirmStatusVehicle && confirmTargetStatus)}
          vehicle={confirmStatusVehicle}
          targetStatus={confirmTargetStatus}
          onConfirm={handleConfirmStatusChange}
          onCancel={() => {
            setConfirmStatusVehicle(null);
            setConfirmTargetStatus(null);
          }}
        />
      )}
    </div>
  );
};
