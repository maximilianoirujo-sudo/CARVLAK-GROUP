import React, { useState, useMemo } from 'react';
import {
  Car,
  Plus,
  Settings,
  DollarSign,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Truck,
  Eye,
  Edit,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileCheck,
  BadgePercent,
  X
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import {
  ZeroKmOrder,
  ZeroKmDeliveryStatus,
  ZeroKmPaymentStatus,
  ZeroKmImporterPaymentStatus,
  ZeroKmCashMovement
} from '../../../types';
import { ZeroKmOrderModal } from './ZeroKmOrderModal';
import { ZeroKmBrandConfigModal } from './ZeroKmBrandConfigModal';

export const ZeroKmSection: React.FC = () => {
  const {
    zeroKmOrders,
    zeroKmCashMovements,
    totalFondosARendir0km,
    totalZeroKmProfit,
    zeroKmAlerts,
    registerClient0kmPayment,
    registerImporterPayment,
    collectImporterCommission,
    updateZeroKmDeliveryStatus
  } = useData();

  // Sub-pestañas
  const [activeSubTab, setActiveSubTab] = useState<'ordenes' | 'pagar' | 'comisiones' | 'caja'>('ordenes');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('todos');
  const [brandFilter, setBrandFilter] = useState<string>('todos');

  // Modales
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<ZeroKmOrder | null>(null);
  const [isBrandConfigOpen, setIsBrandConfigOpen] = useState(false);

  // Modales de Acción Rápida
  const [clientPaymentModalOrder, setClientPaymentModalOrder] = useState<ZeroKmOrder | null>(null);
  const [clientPaymentType, setClientPaymentType] = useState<'sena' | 'saldo'>('saldo');
  const [clientPaymentAmount, setClientPaymentAmount] = useState<number>(0);
  const [clientPaymentAccount, setClientPaymentAccount] = useState('Santander USD');
  const [clientPaymentDate, setClientPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientPaymentRef, setClientPaymentRef] = useState('');

  const [importerPaymentModalOrder, setImporterPaymentModalOrder] = useState<ZeroKmOrder | null>(null);
  const [importerPaymentAmount, setImporterPaymentAmount] = useState<number>(0);
  const [importerPaymentAccount, setImporterPaymentAccount] = useState('Santander USD');
  const [importerPaymentDate, setImporterPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [importerPaymentRef, setImporterPaymentRef] = useState('');

  const [commissionModalOrder, setCommissionModalOrder] = useState<ZeroKmOrder | null>(null);
  const [commissionAccount, setCommissionAccount] = useState('Santander USD');
  const [commissionDate, setCommissionDate] = useState(new Date().toISOString().split('T')[0]);

  // Cuentas por pagar al importador
  const totalCuentasPorPagar = useMemo(() => {
    return zeroKmOrders
      .filter((o) => o.unit_delivery_status !== 'cancelado')
      .reduce((sum, o) => {
        const pending = Math.max(0, o.amount_to_pay_importer - (o.amount_paid_to_importer || 0));
        return sum + pending;
      }, 0);
  }, [zeroKmOrders]);

  // Comisiones por cobrar pendientes (Opción B)
  const totalComisionesPorCobrar = useMemo(() => {
    return zeroKmOrders
      .filter(
        (o) =>
          o.unit_delivery_status !== 'cancelado' &&
          o.importer_scheme === 'comision_aparte' &&
          o.commission_status_from_importer !== 'cobrado'
      )
      .reduce((sum, o) => sum + (o.commission_from_importer || 0), 0);
  }, [zeroKmOrders]);

  // Flujo total de caja 0km
  const cashStats = useMemo(() => {
    const totalIngresos = zeroKmCashMovements
      .filter((m) => m.type === 'ingreso')
      .reduce((s, m) => s + m.amount, 0);
    const totalEgresos = zeroKmCashMovements
      .filter((m) => m.type === 'egreso')
      .reduce((s, m) => s + m.amount, 0);
    return {
      totalIngresos,
      totalEgresos,
      saldoCaja: totalIngresos - totalEgresos
    };
  }, [zeroKmCashMovements]);

  // Filtrado de órdenes
  const filteredOrders = useMemo(() => {
    return zeroKmOrders.filter((order) => {
      if (order.is_archived) return false;
      const term = searchTerm.toLowerCase();
      const matchSearch =
        order.brand.toLowerCase().includes(term) ||
        order.model.toLowerCase().includes(term) ||
        order.client_name.toLowerCase().includes(term) ||
        order.importer_name.toLowerCase().includes(term) ||
        (order.chassis_vin && order.chassis_vin.toLowerCase().includes(term));

      const matchDelivery =
        deliveryFilter === 'todos' || order.unit_delivery_status === deliveryFilter;

      const matchBrand =
        brandFilter === 'todos' || order.brand.toLowerCase() === brandFilter.toLowerCase();

      return matchSearch && matchDelivery && matchBrand;
    });
  }, [zeroKmOrders, searchTerm, deliveryFilter, brandFilter]);

  // Handlers para abrir modales
  const handleOpenClientPayment = (order: ZeroKmOrder) => {
    const collected = order.client_total_collected || (order.client_deposit_amount || 0);
    const pending = Math.max(0, order.sale_price_client - collected);
    setClientPaymentModalOrder(order);
    setClientPaymentType(collected === 0 ? 'sena' : 'saldo');
    setClientPaymentAmount(pending);
    setClientPaymentAccount('Santander USD');
    setClientPaymentDate(new Date().toISOString().split('T')[0]);
    setClientPaymentRef('');
  };

  const handleOpenImporterPayment = (order: ZeroKmOrder) => {
    const pending = Math.max(0, order.amount_to_pay_importer - (order.amount_paid_to_importer || 0));
    setImporterPaymentModalOrder(order);
    setImporterPaymentAmount(pending);
    setImporterPaymentAccount('Santander USD');
    setImporterPaymentDate(new Date().toISOString().split('T')[0]);
    setImporterPaymentRef('');
  };

  const handleOpenCommissionCollection = (order: ZeroKmOrder) => {
    setCommissionModalOrder(order);
    setCommissionAccount('Santander USD');
    setCommissionDate(new Date().toISOString().split('T')[0]);
  };

  // Submit de cobro cliente
  const handleConfirmClientPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientPaymentModalOrder || clientPaymentAmount <= 0) return;
    registerClient0kmPayment(
      clientPaymentModalOrder.id,
      clientPaymentType,
      clientPaymentAmount,
      clientPaymentAccount,
      clientPaymentDate,
      clientPaymentRef.trim() || undefined
    );
    setClientPaymentModalOrder(null);
  };

  // Submit de pago importador
  const handleConfirmImporterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importerPaymentModalOrder || importerPaymentAmount <= 0) return;
    registerImporterPayment(
      importerPaymentModalOrder.id,
      importerPaymentAmount,
      importerPaymentAccount,
      importerPaymentDate,
      importerPaymentRef.trim() || undefined
    );
    setImporterPaymentModalOrder(null);
  };

  // Submit de cobro comisión
  const handleConfirmCommissionCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commissionModalOrder) return;
    collectImporterCommission(
      commissionModalOrder.id,
      commissionModalOrder.commission_from_importer || commissionModalOrder.resulting_profit,
      commissionAccount,
      commissionDate
    );
    setCommissionModalOrder(null);
  };

  // Helper estado de entrega
  const getDeliveryStatusBadge = (status: ZeroKmDeliveryStatus) => {
    switch (status) {
      case 'pedido_confirmado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Pedido Confirmado</span>
          </span>
        );
      case 'en_transito':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
            <Truck className="w-3 h-3" />
            <span>En Tránsito</span>
          </span>
        );
      case 'en_salon_preparacion':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
            <Car className="w-3 h-3" />
            <span>En Salón / Alistamiento</span>
          </span>
        );
      case 'entregado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Entregado al Cliente</span>
          </span>
        );
      case 'cancelado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Cancelado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. SECCIÓN DE KPIS SUPERIORES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD DESTACADA: FONDOS DE 0KM A RENDIR */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-950/40 via-[#181D26] to-[#12161F] border-2 border-amber-500/60 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-wider uppercase text-amber-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Fondos 0km a Rendir</span>
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
              CUSTODIA
            </span>
          </div>

          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ${totalFondosARendir0km.toLocaleString()} <span className="text-sm font-bold text-amber-400">USD</span>
            </div>
            <p className="text-[11px] text-amber-200/80 mt-1 font-medium leading-tight">
              Cobrado a clientes que debe pagarse al importador.{' '}
              <strong className="text-amber-300 underline underline-offset-2">NO es liquidez disponible</strong>.
            </p>
          </div>
        </div>

        {/* GANANCIA REAL DE CARVLAK (P&L COMPUTABLE) */}
        <div className="p-4 rounded-3xl bg-[#12161F] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Ganancia 0km Computable</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
              P&amp;L
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-400">
              ${totalZeroKmProfit.toLocaleString()} <span className="text-sm font-bold text-slate-400">USD</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Ingreso real de la empresa (solo márgenes netos y comisiones cobradas).
            </p>
          </div>
        </div>

        {/* CUENTAS POR PAGAR A IMPORTADORES */}
        <div className="p-4 rounded-3xl bg-[#12161F] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-rose-400" />
              <span>Cuentas por Pagar Imp.</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400">
              Pasivo
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-400">
              ${totalCuentasPorPagar.toLocaleString()} <span className="text-sm font-bold text-slate-400">USD</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Deuda comercial exigible por los importadores oficiales.
            </p>
          </div>
        </div>

        {/* COMISIONES POR COBRAR (OPCIÓN B) */}
        <div className="p-4 rounded-3xl bg-[#12161F] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
              <BadgePercent className="w-4 h-4 text-cyan-400" />
              <span>Comisiones por Cobrar</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
              Activo
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-cyan-400">
              ${totalComisionesPorCobrar.toLocaleString()} <span className="text-sm font-bold text-slate-400">USD</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Comisiones generadas en Opción B a liquidar por importadores.
            </p>
          </div>
        </div>
      </div>

      {/* 2. ALERTAS DE DISCREPANCIA Y VENCIMIENTOS */}
      {zeroKmAlerts.length > 0 && (
        <div className="space-y-2">
          {zeroKmAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 shadow-sm ${
                alert.type === 'danger'
                  ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                  : 'bg-amber-950/30 border-amber-500/50 text-amber-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl mt-0.5 ${
                    alert.type === 'danger' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {alert.type === 'danger' ? (
                    <AlertOctagon className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    {alert.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{alert.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. BARRA DE CONTROL Y SUB-PESTAÑAS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveSubTab('ordenes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'ordenes'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Órdenes y Ventas ({zeroKmOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('pagar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'pagar'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Cuentas por Pagar al Importador</span>
          </button>

          <button
            onClick={() => setActiveSubTab('comisiones')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'comisiones'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BadgePercent className="w-3.5 h-3.5" />
            <span>Comisiones por Cobrar</span>
          </button>

          <button
            onClick={() => setActiveSubTab('caja')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'caja'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Flujo de Caja 0km</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBrandConfigOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Configurar Marcas</span>
          </button>

          <button
            onClick={() => {
              setOrderToEdit(null);
              setIsOrderModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Venta 0km</span>
          </button>
        </div>
      </div>

      {/* 4. CONTENIDO SEGÚN SUB-PESTAÑA */}

      {/* SUB-PESTAÑA 1: ÓRDENES Y VENTAS 0KM */}
      {activeSubTab === 'ordenes' && (
        <div className="space-y-4">
          {/* Filtros de búsqueda */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por cliente, marca, modelo, importador o VIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={deliveryFilter}
                onChange={(e) => setDeliveryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none"
              >
                <option value="todos">Todos los estados de entrega</option>
                <option value="pedido_confirmado">Pedido Confirmado</option>
                <option value="en_transito">En Tránsito</option>
                <option value="en_salon_preparacion">En Salón / Alistamiento</option>
                <option value="entregado">Entregado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Listado de Órdenes */}
          {filteredOrders.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#12161F] border border-slate-800 text-center text-slate-500">
              <Car className="w-12 h-12 mx-auto mb-2 text-slate-600 stroke-[1.5]" />
              <p className="text-sm font-bold text-slate-400">No se encontraron ventas 0km</p>
              <p className="text-xs text-slate-500 mt-1">Crea una nueva orden de venta para comenzar.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const collected = order.client_total_collected || (order.client_deposit_amount || 0);
                const clientPending = Math.max(0, order.sale_price_client - collected);
                const importerPaid = order.amount_paid_to_importer || 0;
                const importerPending = Math.max(0, order.amount_to_pay_importer - importerPaid);

                return (
                  <div
                    key={order.id}
                    className="p-5 rounded-3xl bg-[#12161F] border border-slate-800 hover:border-slate-700 transition-all shadow-md space-y-4"
                  >
                    {/* Header de la tarjeta */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/70">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-sm">
                          0km
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-white">
                              {order.brand} {order.model} {order.version} ({order.year})
                            </h3>
                            {order.color && (
                              <span className="text-[10px] text-slate-400">({order.color})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                            <span className="flex items-center gap-1 text-slate-300 font-semibold">
                              <User className="w-3 h-3 text-amber-400" />
                              {order.client_name} ({order.client_phone})
                            </span>
                            <span>•</span>
                            <span>Imp: {order.importer_name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {getDeliveryStatusBadge(order.unit_delivery_status)}
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            order.importer_scheme === 'margen'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {order.importer_scheme === 'margen' ? 'Opción A: Margen' : 'Opción B: Comisión'}
                        </span>
                      </div>
                    </div>

                    {/* Fila Financiera: 3 Bloques (Cliente, Importador, Ganancia) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Bloque Cliente */}
                      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-slate-400">Cobro al Cliente</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              order.client_payment_status === 'cobrado_total'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {order.client_payment_status === 'cobrado_total'
                              ? '100% Cobrado'
                              : order.client_payment_status === 'sena_cobrada'
                              ? 'Seña Cobrada'
                              : 'Saldo Pendiente'}
                          </span>
                        </div>
                        <div className="text-base font-black text-white">
                          ${order.sale_price_client.toLocaleString()} USD
                        </div>
                        <div className="text-[11px] text-slate-400 flex justify-between">
                          <span>Cobrado a rendir:</span>
                          <span className="font-bold text-amber-400">${collected.toLocaleString()}</span>
                        </div>
                        {clientPending > 0 && (
                          <div className="text-[11px] text-slate-400 flex justify-between">
                            <span>Saldo adeudado:</span>
                            <span className="font-bold text-rose-400">${clientPending.toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Bloque Importador */}
                      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-slate-400">Pago a Importador</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              order.importer_payment_status === 'pagado_total'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {order.importer_payment_status === 'pagado_total' ? 'Pagado Total' : 'Pendiente'}
                          </span>
                        </div>
                        <div className="text-base font-black text-white">
                          ${order.amount_to_pay_importer.toLocaleString()} USD
                        </div>
                        <div className="text-[11px] text-slate-400 flex justify-between">
                          <span>Pagado:</span>
                          <span className="font-bold text-emerald-400">${importerPaid.toLocaleString()}</span>
                        </div>
                        {importerPending > 0 && (
                          <div className="text-[11px] text-slate-400 flex justify-between">
                            <span>Deuda pendiente:</span>
                            <span className="font-bold text-rose-400">${importerPending.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Vence: {order.importer_payment_due_date}</span>
                        </div>
                      </div>

                      {/* Bloque Ganancia CARVLAK */}
                      <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-emerald-400">
                              Ganancia Neta CARVLAK
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                              {order.importer_scheme === 'margen' ? 'Margen' : 'Comisión'}
                            </span>
                          </div>
                          <div className="text-xl font-black text-emerald-400 mt-1">
                            ${order.resulting_profit.toLocaleString()} USD
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {order.importer_scheme === 'margen'
                              ? 'Diferencia retenida en caja'
                              : order.commission_status_from_importer === 'cobrado'
                              ? 'Comisión ya liquidada por importador'
                              : 'Comisión en Cuentas por Cobrar'}
                          </p>
                        </div>

                        {order.importer_scheme === 'comision_aparte' && (
                          <div className="mt-2 pt-2 border-t border-emerald-500/20 flex items-center justify-between text-xs">
                            <span className="text-[10px] text-slate-400">Estado Comisión:</span>
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                order.commission_status_from_importer === 'cobrado'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {order.commission_status_from_importer === 'cobrado' ? 'Cobrada' : 'Pendiente'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Barra de Acciones de la Orden */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                      {/* Cambio rápido de estado de entrega */}
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-slate-400 text-[11px] mr-1">Avanzar Entrega:</span>
                        {order.unit_delivery_status === 'pedido_confirmado' && (
                          <button
                            onClick={() => updateZeroKmDeliveryStatus(order.id, 'en_transito')}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-amber-500/30 transition-colors"
                          >
                            Marcar En Tránsito
                          </button>
                        )}
                        {order.unit_delivery_status === 'en_transito' && (
                          <button
                            onClick={() => updateZeroKmDeliveryStatus(order.id, 'en_salon_preparacion')}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold border border-purple-500/30 transition-colors"
                          >
                            Marcar En Salón / Alistamiento
                          </button>
                        )}
                        {order.unit_delivery_status === 'en_salon_preparacion' && (
                          <button
                            onClick={() =>
                              updateZeroKmDeliveryStatus(
                                order.id,
                                'entregado',
                                new Date().toISOString().split('T')[0]
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-black border border-emerald-500/40 transition-colors"
                          >
                            ✓ Entregar al Cliente
                          </button>
                        )}
                      </div>

                      {/* Botones de Cobro / Pago */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Botón Cobrar al Cliente */}
                        {order.client_payment_status !== 'cobrado_total' && (
                          <button
                            onClick={() => handleOpenClientPayment(order)}
                            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1 transition-all"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>Cobrar al Cliente</span>
                          </button>
                        )}

                        {/* Botón Pagar a Importador */}
                        {order.importer_payment_status !== 'pagado_total' && (
                          <button
                            onClick={() => handleOpenImporterPayment(order)}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1 transition-all"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Pagar Importador</span>
                          </button>
                        )}

                        {/* Botón Cobrar Comisión (Opción B) */}
                        {order.importer_scheme === 'comision_aparte' &&
                          order.commission_status_from_importer !== 'cobrado' && (
                            <button
                              onClick={() => handleOpenCommissionCollection(order)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 transition-all"
                            >
                              <BadgePercent className="w-3.5 h-3.5" />
                              <span>Cobrar Comisión Imp.</span>
                            </button>
                          )}

                        {/* Botón Editar */}
                        <button
                          onClick={() => {
                            setOrderToEdit(order);
                            setIsOrderModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-PESTAÑA 2: CUENTAS POR PAGAR AL IMPORTADOR */}
      {activeSubTab === 'pagar' && (
        <div className="p-5 rounded-3xl bg-[#12161F] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-rose-400" />
                <span>Obligaciones Comerciales con Importadores Oficiales</span>
              </h3>
              <p className="text-xs text-slate-400">
                Unidades reservadas o facturadas pendientes de liquidación a los importadores.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Adeudado</span>
              <span className="text-lg font-black text-rose-400">${totalCuentasPorPagar.toLocaleString()} USD</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Unidad 0km</th>
                  <th className="p-3">Importador</th>
                  <th className="p-3">Vencimiento</th>
                  <th className="p-3">Total a Pagar</th>
                  <th className="p-3">Pagado</th>
                  <th className="p-3">Saldo Pendiente</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {zeroKmOrders
                  .filter((o) => o.importer_payment_status !== 'pagado_total' && o.unit_delivery_status !== 'cancelado')
                  .map((order) => {
                    const paid = order.amount_paid_to_importer || 0;
                    const pending = Math.max(0, order.amount_to_pay_importer - paid);
                    return (
                      <tr key={order.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 font-bold text-white">
                          {order.brand} {order.model}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Cliente: {order.client_name}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{order.importer_name}</td>
                        <td className="p-3 text-amber-300 font-medium">{order.importer_payment_due_date}</td>
                        <td className="p-3 font-bold text-slate-200">${order.amount_to_pay_importer.toLocaleString()}</td>
                        <td className="p-3 text-emerald-400 font-medium">${paid.toLocaleString()}</td>
                        <td className="p-3 font-black text-rose-400">${pending.toLocaleString()} USD</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleOpenImporterPayment(order)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[11px] border border-rose-500/40 transition-all"
                          >
                            Registrar Pago
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-PESTAÑA 3: COMISIONES POR COBRAR (OPCIÓN B) */}
      {activeSubTab === 'comisiones' && (
        <div className="p-5 rounded-3xl bg-[#12161F] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <BadgePercent className="w-4 h-4 text-cyan-400" />
                <span>Comisiones por Cobrar de Importadores (Opción B)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Unidades vendidas bajo esquema de comisión separada pendientes de cobro.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total a Cobrar</span>
              <span className="text-lg font-black text-cyan-400">${totalComisionesPorCobrar.toLocaleString()} USD</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Unidad 0km</th>
                  <th className="p-3">Importador</th>
                  <th className="p-3">Precio Lista</th>
                  <th className="p-3">Comisión Pactada</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {zeroKmOrders
                  .filter((o) => o.importer_scheme === 'comision_aparte' && o.unit_delivery_status !== 'cancelado')
                  .map((order) => {
                    const isCollected = order.commission_status_from_importer === 'cobrado';
                    return (
                      <tr key={order.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 font-bold text-white">
                          {order.brand} {order.model}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Cliente: {order.client_name}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{order.importer_name}</td>
                        <td className="p-3 text-slate-400">${order.sale_price_client.toLocaleString()}</td>
                        <td className="p-3 font-black text-emerald-400">
                          ${(order.commission_from_importer || order.resulting_profit).toLocaleString()} USD
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isCollected
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {isCollected ? 'Cobrada' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {!isCollected && (
                            <button
                              onClick={() => handleOpenCommissionCollection(order)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[11px] border border-emerald-500/40 transition-all"
                            >
                              Cobrar Comisión
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-PESTAÑA 4: FLUJO DE CAJA 0KM */}
      {activeSubTab === 'caja' && (
        <div className="p-5 rounded-3xl bg-[#12161F] border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-400" />
                <span>Libro Diario de Caja &amp; Fondos 0km</span>
              </h3>
              <p className="text-xs text-slate-400">
                Movimientos reales clasificados con etiquetas oficiales: <em>Cobro 0km – fondos a rendir</em>, <em>Pago a importador 0km</em> y <em>Comisión cobrada</em>.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Ingresos Totales</span>
                <span className="text-sm font-black text-emerald-400">+${cashStats.totalIngresos.toLocaleString()} USD</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Egresos a Imp.</span>
                <span className="text-sm font-black text-rose-400">-${cashStats.totalEgresos.toLocaleString()} USD</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Saldo Neto en Caja</span>
                <span className="text-sm font-black text-amber-400">${cashStats.saldoCaja.toLocaleString()} USD</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Cuenta Destino/Origen</th>
                  <th className="p-3">Etiqueta Oficial</th>
                  <th className="p-3">Concepto &amp; Unidad</th>
                  <th className="p-3">Comprobante / Ref</th>
                  <th className="p-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {zeroKmCashMovements.map((mov) => {
                  const isIngreso = mov.type === 'ingreso';
                  return (
                    <tr key={mov.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 text-slate-300 font-medium">{mov.date}</td>
                      <td className="p-3 text-slate-200 font-bold">{mov.account}</td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            mov.tag === 'Cobro 0km – fondos a rendir'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : mov.tag === 'Pago a importador 0km'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {mov.tag}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 max-w-xs truncate">
                        {mov.order_info} {mov.notes && `• ${mov.notes}`}
                      </td>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">{mov.receipt_number || '-'}</td>
                      <td className={`p-3 text-right font-black ${isIngreso ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isIngreso ? '+' : '-'}${mov.amount.toLocaleString()} {mov.currency}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL COBRAR AL CLIENTE (SEÑA / SALDO) */}
      {clientPaymentModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12161F] border border-slate-800 rounded-3xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-cyan-400" />
                <span>Registrar Cobro al Cliente</span>
              </h3>
              <button
                onClick={() => setClientPaymentModalOrder(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmClientPayment} className="space-y-4 pt-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-400 block">Unidad y Cliente:</span>
                <span className="font-bold text-white">
                  {clientPaymentModalOrder.brand} {clientPaymentModalOrder.model} • {clientPaymentModalOrder.client_name}
                </span>
                <div className="text-[11px] text-amber-400 mt-1">
                  Tag de Caja: <strong>"Cobro 0km – fondos a rendir"</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Concepto del Cobro</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setClientPaymentType('sena')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      clientPaymentType === 'sena'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Seña
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientPaymentType('saldo')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      clientPaymentType === 'saldo'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Saldo / Integración
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Monto a Cobrar (USD) *</label>
                <input
                  type="number"
                  min="1"
                  step="100"
                  required
                  value={clientPaymentAmount}
                  onChange={(e) => setClientPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Cuenta de Ingreso *</label>
                  <select
                    value={clientPaymentAccount}
                    onChange={(e) => setClientPaymentAccount(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Santander USD">Santander USD</option>
                    <option value="Itaú USD">Itaú USD</option>
                    <option value="Caja Efectivo USD">Caja Efectivo USD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={clientPaymentDate}
                    onChange={(e) => setClientPaymentDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nº Recibo / Comprobante</label>
                <input
                  type="text"
                  placeholder="Ej: REC-9921"
                  value={clientPaymentRef}
                  onChange={(e) => setClientPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClientPaymentModalOrder(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all"
                >
                  Confirmar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PAGAR AL IMPORTADOR */}
      {importerPaymentModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12161F] border border-slate-800 rounded-3xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-rose-400" />
                <span>Registrar Pago a Importador</span>
              </h3>
              <button
                onClick={() => setImporterPaymentModalOrder(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmImporterPayment} className="space-y-4 pt-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-400 block">Importador y Unidad:</span>
                <span className="font-bold text-white">
                  {importerPaymentModalOrder.importer_name} • {importerPaymentModalOrder.brand} {importerPaymentModalOrder.model}
                </span>
                <div className="text-[11px] text-rose-400 mt-1">
                  Tag de Caja: <strong>"Pago a importador 0km"</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Monto a Transferir (USD) *</label>
                <input
                  type="number"
                  min="1"
                  step="100"
                  required
                  value={importerPaymentAmount}
                  onChange={(e) => setImporterPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Cuenta Origen *</label>
                  <select
                    value={importerPaymentAccount}
                    onChange={(e) => setImporterPaymentAccount(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-400"
                  >
                    <option value="Santander USD">Santander USD</option>
                    <option value="Itaú USD">Itaú USD</option>
                    <option value="Caja Efectivo USD">Caja Efectivo USD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Fecha Transferencia</label>
                  <input
                    type="date"
                    value={importerPaymentDate}
                    onChange={(e) => setImporterPaymentDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nº Comprobante / Transferencia</label>
                <input
                  type="text"
                  placeholder="Ej: TRANS-BROU-5521"
                  value={importerPaymentRef}
                  onChange={(e) => setImporterPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setImporterPaymentModalOrder(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs transition-all"
                >
                  Confirmar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL COBRAR COMISIÓN DE IMPORTADOR (OPCIÓN B) */}
      {commissionModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12161F] border border-slate-800 rounded-3xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <BadgePercent className="w-4 h-4 text-emerald-400" />
                <span>Liquidación de Comisión Importador</span>
              </h3>
              <button
                onClick={() => setCommissionModalOrder(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCommissionCollection} className="space-y-4 pt-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-400 block">Comisión correspondiente a:</span>
                <span className="font-bold text-white">
                  {commissionModalOrder.brand} {commissionModalOrder.model} ({commissionModalOrder.importer_name})
                </span>
                <div className="text-lg font-black text-emerald-400 mt-2">
                  ${(commissionModalOrder.commission_from_importer || commissionModalOrder.resulting_profit).toLocaleString()} USD
                </div>
                <div className="text-[11px] text-emerald-300 mt-1">
                  Tag de Caja: <strong>"Comisión cobrada de importador"</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Cuenta Destino *</label>
                  <select
                    value={commissionAccount}
                    onChange={(e) => setCommissionAccount(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-400"
                  >
                    <option value="Santander USD">Santander USD</option>
                    <option value="Itaú USD">Itaú USD</option>
                    <option value="Caja Efectivo USD">Caja Efectivo USD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={commissionDate}
                    onChange={(e) => setCommissionDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCommissionModalOrder(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all"
                >
                  Registrar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURACIÓN DE MARCAS */}
      {isBrandConfigOpen && (
        <ZeroKmBrandConfigModal
          isOpen={isBrandConfigOpen}
          onClose={() => setIsBrandConfigOpen(false)}
        />
      )}

      {/* MODAL CREAR / EDITAR ORDEN */}
      {isOrderModalOpen && (
        <ZeroKmOrderModal
          isOpen={isOrderModalOpen}
          onClose={() => {
            setIsOrderModalOpen(false);
            setOrderToEdit(null);
          }}
          orderToEdit={orderToEdit}
        />
      )}
    </div>
  );
};
