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
import { Button } from '../../components/ui/Button';

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
      <div className="p-5 sm:p-6 rounded-xl bg-panel border border-borde shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-title font-bold uppercase tracking-wider text-gris-texto">
                DetailVlak Shangrilá
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-negro text-gris-texto border border-borde">
                Taller activo
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-title font-bold text-white mt-1">
              Estética automotriz y presupuestos
            </h1>
            <p className="text-xs text-gris-texto mt-1 max-w-2xl leading-relaxed">
              Presupuestos paramétricos por porte de auto, WhatsApp directo (+598), stock de insumos, gastos operativos y comisiones.
            </p>
          </div>

          {/* Botones de acción de cabecera */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenPublicForm && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onOpenPublicForm}
                title="Abrir formulario web público"
              >
                <Globe className="w-3.5 h-3.5 text-white" />
                <span>Formulario web</span>
              </Button>
            )}

            {isAdmin && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsTariffModalOpen(true)}
              >
                <Settings className="w-3.5 h-3.5 text-white" />
                <span>Tarifario</span>
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsMigrationModalOpen(true)}
              title="Importar datos"
            >
              <UploadCloud className="w-3.5 h-3.5 text-white" />
              <span>Migrar datos</span>
            </Button>

            {/* UNICO BOTÓN PRINCIPAL EN ROJO #D7141A */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setQuoteToEdit(null);
                setIsQuoterModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              <span>+ Cotizar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Navegación por Pestañas del Módulo */}
      <div className="border-b border-borde flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('quotes')}
          className={`pb-3 pt-2 px-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] border-b-2 ${
            activeTab === 'quotes'
              ? 'text-white border-rojo'
              : 'text-gris-texto hover:text-white border-transparent'
          }`}
        >
          <Droplets className="w-4 h-4" />
          <span>Cotizaciones y trabajos</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-negro text-gris-texto font-bold border border-borde">
            {detailingQuotes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 pt-2 px-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] border-b-2 ${
            activeTab === 'stock'
              ? 'text-white border-rojo'
              : 'text-gris-texto hover:text-white border-transparent'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Insumos y stock</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 pt-2 px-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] border-b-2 ${
            activeTab === 'expenses'
              ? 'text-white border-rojo'
              : 'text-gris-texto hover:text-white border-transparent'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Gastos operativos</span>
        </button>

        <button
          onClick={() => setActiveTab('commissions')}
          className={`pb-3 pt-2 px-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] border-b-2 ${
            activeTab === 'commissions'
              ? 'text-white border-rojo'
              : 'text-gris-texto hover:text-white border-transparent'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Comisiones</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-3 pt-2 px-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap min-h-[40px] border-b-2 ${
              activeTab === 'dashboard'
                ? 'text-white border-rojo'
                : 'text-gris-texto hover:text-white border-transparent'
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
              { id: 'all', label: 'Todas', count: detailingQuotes.length },
              { id: 'Por Cotizar', label: 'Por Cotizar', count: countsByStatus['Por Cotizar'] },
              { id: 'Presupuesto Enviado', label: 'Enviados', count: countsByStatus['Presupuesto Enviado'] },
              { id: 'Turno Confirmado', label: 'En Turno', count: countsByStatus['Turno Confirmado'] },
              { id: 'Trabajo Completado', label: 'Completados', count: countsByStatus['Trabajo Completado'] }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  statusFilter === f.id
                    ? 'bg-panel border-rojo'
                    : 'bg-panel border-borde hover:border-gris-texto/40'
                }`}
              >
                <div className="text-[10px] text-gris-texto font-bold uppercase">{f.label}</div>
                <div className="text-xl font-black mt-0.5 text-white">{f.count}</div>
              </button>
            ))}
          </div>

          {/* Barra de Búsqueda */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gris-texto" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, teléfono, auto o matrícula..."
              className="w-full bg-negro border border-borde rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gris-texto focus:border-rojo focus:outline-none"
            />
          </div>

          {/* Tarjetas de Cotizaciones */}
          {filteredQuotes.length === 0 ? (
            <div className="p-8 rounded-xl bg-panel border border-borde text-center text-gris-texto">
              <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-30 text-white" />
              <p className="text-sm font-bold text-white">No hay cotizaciones con este filtro</p>
              <p className="text-xs text-gris-texto mt-1">Podés crear una nueva con el botón superior.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredQuotes.map((quote) => {
                const statusColor =
                  quote.status === 'Trabajo Completado' ? 'bg-white/10 text-white border-white/20' :
                  quote.status === 'Turno Confirmado' ? 'bg-rojo/15 text-white border-rojo/40' :
                  quote.status === 'Presupuesto Enviado' ? 'bg-negro text-white border-borde' :
                  quote.status === 'Cancelado' ? 'bg-panel text-gris-texto border-borde line-through' :
                  'bg-rojo text-white border-rojo';

                return (
                  <div
                    key={quote.id}
                    className="p-4 rounded-xl bg-panel border border-borde hover:border-rojo/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      {/* Cabecera Tarjeta: Estado y Origen */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                          {quote.status}
                        </span>

                        <span className="text-[10px] font-bold text-gris-texto bg-negro px-2 py-0.5 rounded border border-borde">
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
                            <span className="font-mono text-white bg-negro px-2 py-0.5 rounded text-[11px] font-bold border border-borde">
                              {normalizePlate(quote.vehicle_plate)}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-gris-texto mt-1 flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-white shrink-0" />
                          <span className="truncate text-white">{quote.vehicle_info}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-negro text-gris-texto font-bold border border-borde shrink-0">
                            {quote.vehicle_category}
                          </span>
                        </div>

                        <div className="text-[11px] text-gris-texto mt-1 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gris-texto" />
                          <span>{quote.client_phone}</span>
                        </div>
                      </div>

                      {/* Lista de Servicios */}
                      <div className="mt-3 pt-2.5 border-t border-borde space-y-1">
                        <div className="text-[10px] text-gris-texto uppercase font-bold">Servicios ({quote.selected_services.length}):</div>
                        <div className="text-xs text-white font-medium line-clamp-2">
                          {quote.selected_services.map((s) => s.serviceName).join(' + ')}
                        </div>
                      </div>

                      {/* Monto y Tiempo */}
                      <div className="mt-3 pt-2 border-t border-borde flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-gris-texto uppercase font-bold">Total Final</div>
                          <div className="text-base font-black font-mono text-white">
                            {formatCurrency(quote.total_amount, 'UYU')}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-gris-texto uppercase font-bold">Tiempo</div>
                          <div className="text-xs font-semibold text-gris-texto">
                            {quote.estimated_time || 'A coordinar'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Acciones Rápidas de la Tarjeta */}
                    <div className="pt-2 border-t border-borde flex items-center justify-between gap-2">
                      <Button
                        variant="whatsapp"
                        size="sm"
                        onClick={() => handleOpenWhatsApp(quote)}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </Button>

                      <div className="flex items-center gap-1.5">
                        <select
                          value={quote.status}
                          onChange={(e) => updateDetailingQuoteStatus(quote.id, e.target.value as DetailingQuoteStatus)}
                          className="bg-negro border border-borde rounded-lg px-2 py-1 text-[11px] text-white font-bold focus:border-rojo focus:outline-none"
                        >
                          <option value="Por Cotizar">Por Cotizar</option>
                          <option value="Presupuesto Enviado">Enviado</option>
                          <option value="Turno Confirmado">Turno</option>
                          <option value="Trabajo Completado">Completado</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditQuote(quote)}
                        >
                          Editar
                        </Button>
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
