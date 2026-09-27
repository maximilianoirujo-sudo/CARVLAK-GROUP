import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  Calendar,
  MessageCircle,
  Clock,
  Car,
  Droplets,
  CheckCircle2,
  DollarSign,
  Package,
  Layers,
  Award,
  Globe,
  UploadCloud,
  ChevronRight,
  Settings,
  Phone,
  AlertCircle
} from 'lucide-react';
import { DetailingQuote, DetailingQuoteStatus } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, normalizePlate } from '../../lib/formatters';

// Componentes modulares
import { DetailingQuoterModal } from './components/DetailingQuoterModal';
import { DetailingWhatsAppModal } from './components/DetailingWhatsAppModal';
import { DetailingTariffManagerModal } from './components/DetailingTariffManagerModal';
import { DetailingStockSection } from './components/DetailingStockSection';
import { DetailingExpensesSection } from './components/DetailingExpensesSection';
import { DetailingCommissionsSection } from './components/DetailingCommissionsSection';
import { DetailingDashboardSection } from './components/DetailingDashboardSection';
import { DetailingMigrationModal } from './components/DetailingMigrationModal';

interface DetailingModuleProps {
  onOpenPublicForm?: () => void;
}

export const DetailingModule: React.FC<DetailingModuleProps> = ({
  onOpenPublicForm
}) => {
  const { detailingQuotes, updateDetailingQuoteStatus } = useData();
  const { profile } = useAuth();

  const isAdmin = profile?.roles.includes('admin');
  const isEncargado = profile?.roles.includes('encargado') || isAdmin;

  // Pestañas principales
  const [activeTab, setActiveTab] = useState<'quotes' | 'stock' | 'expenses' | 'commissions' | 'dashboard'>('quotes');

  // Filtros de Cotizaciones
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modales
  const [isQuoterModalOpen, setIsQuoterModalOpen] = useState(false);
  const [quoteToEdit, setQuoteToEdit] = useState<DetailingQuote | null>(null);

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [quoteForWhatsApp, setQuoteForWhatsApp] = useState<DetailingQuote | null>(null);

  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);

  // Filtrado de Cotizaciones
  const filteredQuotes = useMemo(() => {
    return detailingQuotes.filter((q) => {
      const matchStatus = statusFilter === 'all' || q.status === statusFilter;
      const term = searchTerm.toLowerCase();
      const matchSearch =
        q.client_name.toLowerCase().includes(term) ||
        q.client_phone.includes(term) ||
        q.vehicle_info.toLowerCase().includes(term) ||
        (q.vehicle_plate && q.vehicle_plate.toLowerCase().includes(term));
      return matchStatus && matchSearch;
    });
  }, [detailingQuotes, statusFilter, searchTerm]);

  // Contadores por estado
  const countsByStatus = useMemo(() => {
    const counts: Record<string, number> = {
      'Por Cotizar': 0,
      'Presupuesto Enviado': 0,
      'Turno Confirmado': 0,
      'Trabajo Completado': 0
    };
    detailingQuotes.forEach((q) => {
      if (counts[q.status] !== undefined) {
        counts[q.status]++;
      }
    });
    return counts;
  }, [detailingQuotes]);

  const handleOpenWhatsApp = (quote: DetailingQuote) => {
    setQuoteForWhatsApp(quote);
    setIsWhatsAppModalOpen(true);
  };

  const handleEditQuote = (quote: DetailingQuote) => {
    setQuoteToEdit(quote);
    setIsQuoterModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      
      {/* Banner Principal DetailVlak */}
      <div className="p-5 sm:p-6 rounded-lg bg-white dark:bg-[#161616] border border-[#D9D9D9] dark:border-[#2A2A2A] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-title font-bold uppercase tracking-wider text-[#6B6B6B]">
                DetailVlak Shangrilá
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F2F2F2] dark:bg-[#222222] text-[#6B6B6B] border border-[#D9D9D9] dark:border-[#333333]">
                Taller activo
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-title font-bold text-black dark:text-white mt-1">
              Estética automotriz y presupuestos
            </h1>
            <p className="text-xs text-[#6B6B6B] mt-1 max-w-2xl leading-relaxed">
              Presupuestos paramétricos por porte de auto, WhatsApp directo (+598), stock de insumos, gastos operativos y comisiones.
            </p>
          </div>

          {/* Botones de acción de cabecera */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenPublicForm && (
              <button
                onClick={onOpenPublicForm}
                className="px-3 py-2 rounded-md bg-[#F2F2F2] dark:bg-[#222222] hover:bg-[#E5E5E5] text-black dark:text-white border border-[#D9D9D9] dark:border-[#333333] text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[40px]"
                title="Abrir formulario web público"
              >
                <Globe className="w-3.5 h-3.5 text-[#6B6B6B]" />
                <span>Formulario web</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setIsTariffModalOpen(true)}
                className="px-3 py-2 rounded-md bg-[#F2F2F2] dark:bg-[#222222] hover:bg-[#E5E5E5] text-black dark:text-white border border-[#D9D9D9] dark:border-[#333333] text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[40px]"
              >
                <Settings className="w-3.5 h-3.5 text-[#6B6B6B]" />
                <span>Tarifario</span>
              </button>
            )}

            <button
              onClick={() => setIsMigrationModalOpen(true)}
              className="px-3 py-2 rounded-md bg-[#F2F2F2] dark:bg-[#222222] hover:bg-[#E5E5E5] text-black dark:text-white border border-[#D9D9D9] dark:border-[#333333] text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[40px]"
              title="Importar datos"
            >
              <UploadCloud className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span>Migrar datos</span>
            </button>

            {/* UNICO BOTÓN PRINCIPAL EN ROJO #D7141A */}
            <button
              onClick={() => {
                setQuoteToEdit(null);
                setIsQuoterModalOpen(true);
              }}
              className="px-4 py-2 rounded-md bg-[#D7141A] hover:bg-[#B50F14] text-white font-title font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors min-h-[40px] shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Cotizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navegación por Pestañas del Módulo */}
      <div className="border-b border-[#D9D9D9] dark:border-[#2A2A2A] flex items-center gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('quotes')}
          className={`px-3.5 py-2 rounded-md text-xs font-title font-bold uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] ${
            activeTab === 'quotes'
              ? 'bg-[#D7141A] text-white shadow-sm'
              : 'text-[#6B6B6B] hover:text-black dark:hover:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#1A1A1A]'
          }`}
        >
          <Droplets className="w-4 h-4" />
          <span>Cotizaciones y trabajos</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 text-white font-bold">
            {detailingQuotes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`px-3.5 py-2 rounded-md text-xs font-title font-bold uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] ${
            activeTab === 'stock'
              ? 'bg-[#D7141A] text-white shadow-sm'
              : 'text-[#6B6B6B] hover:text-black dark:hover:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#1A1A1A]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Insumos y stock</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-3.5 py-2 rounded-md text-xs font-title font-bold uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] ${
            activeTab === 'expenses'
              ? 'bg-[#D7141A] text-white shadow-sm'
              : 'text-[#6B6B6B] hover:text-black dark:hover:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#1A1A1A]'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Gastos operativos</span>
        </button>

        <button
          onClick={() => setActiveTab('commissions')}
          className={`px-3.5 py-2 rounded-md text-xs font-title font-bold uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] ${
            activeTab === 'commissions'
              ? 'bg-[#D7141A] text-white shadow-sm'
              : 'text-[#6B6B6B] hover:text-black dark:hover:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#1A1A1A]'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Comisiones</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 rounded-md text-xs font-title font-bold uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] ${
              activeTab === 'dashboard'
                ? 'bg-[#D7141A] text-white shadow-sm'
                : 'text-[#6B6B6B] hover:text-black dark:hover:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#1A1A1A]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Métricas</span>
          </button>
        )}
      </div>

      {/* CONTENIDO SEGÚN PESTAÑA */}

      {/* 1. COTIZACIONES Y TRABAJOS */}
      {activeTab === 'quotes' && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Subfiltro de Estados Rápidos */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'all', label: 'Todas', count: detailingQuotes.length, color: 'text-slate-200' },
              { id: 'Por Cotizar', label: '🟡 Por Cotizar', count: countsByStatus['Por Cotizar'], color: 'text-amber-400' },
              { id: 'Presupuesto Enviado', label: '🟣 Enviados', count: countsByStatus['Presupuesto Enviado'], color: 'text-purple-400' },
              { id: 'Turno Confirmado', label: '🟢 En Turno', count: countsByStatus['Turno Confirmado'], color: 'text-emerald-400' },
              { id: 'Trabajo Completado', label: '✅ Completados', count: countsByStatus['Trabajo Completado'], color: 'text-blue-400' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  statusFilter === f.id
                    ? 'bg-purple-950/30 border-purple-500/60 shadow-lg shadow-purple-500/10'
                    : 'bg-[#121826] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] text-slate-400 font-bold uppercase">{f.label}</div>
                <div className={`text-xl font-black mt-0.5 ${f.color}`}>{f.count}</div>
              </button>
            ))}
          </div>

          {/* Barra de Búsqueda */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, teléfono, auto o matrícula..."
              className="w-full bg-[#121826] border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Tarjetas de Cotizaciones */}
          {filteredQuotes.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#121826] border border-slate-800 text-center text-slate-400">
              <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-30 text-purple-400" />
              <p className="text-sm font-bold text-slate-300">No hay cotizaciones con este filtro</p>
              <p className="text-xs text-slate-500 mt-1">Podés crear una nueva con el botón superior.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredQuotes.map((quote) => {
                const statusColor =
                  quote.status === 'Trabajo Completado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  quote.status === 'Turno Confirmado' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                  quote.status === 'Presupuesto Enviado' ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' :
                  quote.status === 'Cancelado' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                  'bg-amber-500/10 text-amber-400 border-amber-500/20';

                return (
                  <div
                    key={quote.id}
                    className="p-4 rounded-3xl bg-[#121826] border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-3 shadow-lg"
                  >
                    <div>
                      {/* Cabecera Tarjeta: Estado y Origen */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                          {quote.status}
                        </span>

                        <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                          {quote.origin}
                        </span>
                      </div>

                      {/* Cliente y Vehículo */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-white leading-tight">
                            {quote.client_name}
                          </h3>
                          {quote.vehicle_plate && (
                            <span className="font-mono text-purple-400 bg-slate-900 px-1.5 py-0.5 rounded text-[11px] font-bold border border-slate-800">
                              {normalizePlate(quote.vehicle_plate)}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="truncate">{quote.vehicle_info}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold shrink-0">
                            {quote.vehicle_category}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{quote.client_phone}</span>
                        </div>
                      </div>

                      {/* Lista de Servicios */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1">
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Servicios ({quote.selected_services.length}):</div>
                        <div className="text-xs text-slate-300 font-medium line-clamp-2">
                          {quote.selected_services.map((s) => s.serviceName).join(' + ')}
                        </div>
                      </div>

                      {/* Monto y Tiempo */}
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-bold">Total Final</div>
                          <div className="text-base font-black font-mono text-amber-400">
                            {formatCurrency(quote.total_amount, 'UYU')}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-slate-500 uppercase font-bold">Tiempo</div>
                          <div className="text-xs font-semibold text-slate-300">
                            {quote.estimated_time || 'A coordinar'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Acciones Rápidas de la Tarjeta */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenWhatsApp(quote)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 transition-all"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <select
                          value={quote.status}
                          onChange={(e) => updateDetailingQuoteStatus(quote.id, e.target.value as DetailingQuoteStatus)}
                          className="bg-[#090D15] border border-slate-700 rounded-xl px-2 py-1 text-[11px] text-slate-300 font-bold focus:outline-none"
                        >
                          <option value="Por Cotizar">Por Cotizar</option>
                          <option value="Presupuesto Enviado">Enviado</option>
                          <option value="Turno Confirmado">Turno</option>
                          <option value="Trabajo Completado">Completado</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>

                        <button
                          onClick={() => handleEditQuote(quote)}
                          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
                        >
                          Editar
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

      {/* 2. INSUMOS & STOCK */}
      {activeTab === 'stock' && <DetailingStockSection businessFilter="detailing" />}

      {/* 3. GASTOS */}
      {activeTab === 'expenses' && <DetailingExpensesSection businessFilter="detailing" />}

      {/* 4. COMISIONES */}
      {activeTab === 'commissions' && <DetailingCommissionsSection businessFilter="detailing" />}

      {/* 5. BALANCE & MÉTRICAS (SOLO ADMIN) */}
      {activeTab === 'dashboard' && isAdmin && <DetailingDashboardSection />}

      {/* MODALES MONTADOS */}
      {isQuoterModalOpen && (
        <DetailingQuoterModal
          isOpen={isQuoterModalOpen}
          onClose={() => setIsQuoterModalOpen(false)}
          quoteToEdit={quoteToEdit}
          onOpenWhatsApp={handleOpenWhatsApp}
        />
      )}

      {isWhatsAppModalOpen && (
        <DetailingWhatsAppModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => setIsWhatsAppModalOpen(false)}
          quote={quoteForWhatsApp}
        />
      )}

      {isTariffModalOpen && (
        <DetailingTariffManagerModal
          isOpen={isTariffModalOpen}
          onClose={() => setIsTariffModalOpen(false)}
        />
      )}

      {isMigrationModalOpen && (
        <DetailingMigrationModal
          isOpen={isMigrationModalOpen}
          onClose={() => setIsMigrationModalOpen(false)}
        />
      )}

    </div>
  );
};
