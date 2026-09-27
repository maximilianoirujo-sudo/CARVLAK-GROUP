import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  Plus,
  Minus,
  DollarSign,
  Search,
  Filter,
  Layers,
  History,
  CheckCircle2,
  X
} from 'lucide-react';
import { StockItem, StockCategory, Business } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { formatCurrency } from '../../../lib/formatters';
import { Button } from '../../../components/ui/Button';

interface DetailingStockSectionProps {
  businessFilter?: Business;
}

export const DetailingStockSection: React.FC<DetailingStockSectionProps> = ({
  businessFilter = 'detailing'
}) => {
  const { stockItems, addStockItem, updateStockItem, recordStockMovement } = useData();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modales de movimiento
  const [activeItemForMovement, setActiveItemForMovement] = useState<StockItem | null>(null);
  const [movementType, setMovementType] = useState<'Entrada' | 'Salida'>('Entrada');
  const [movementQty, setMovementQty] = useState<number>(1);
  const [movementCost, setMovementCost] = useState<number>(0);
  const [movementNotes, setMovementNotes] = useState('');
  const [createExpenseOnRestock, setCreateExpenseOnRestock] = useState(true);

  // Modal de nuevo producto
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<StockCategory>('Químicos');
  const [newItemUnit, setNewItemUnit] = useState<StockItem['unit']>('litros');
  const [newItemQty, setNewItemQty] = useState<number>(5);
  const [newItemMinStock, setNewItemMinStock] = useState<number>(2);
  const [newItemUnitCost, setNewItemUnitCost] = useState<number>(800);
  const [newItemSupplier, setNewItemSupplier] = useState('');

  // Filtrado
  const filteredItems = stockItems
    .filter((s) => s.business === businessFilter || s.business === 'general')
    .filter((s) => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.supplier || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoryFilter === 'all' || s.category === categoryFilter;
      return matchSearch && matchCat;
    });

  // Métricas de stock
  const lowStockItems = filteredItems.filter((s) => s.quantity <= s.min_stock);
  const totalInventoryValue = filteredItems.reduce((acc, curr) => acc + (curr.quantity * curr.unit_cost), 0);

  const openMovementModal = (item: StockItem, type: 'Entrada' | 'Salida') => {
    setActiveItemForMovement(item);
    setMovementType(type);
    setMovementQty(type === 'Entrada' ? 2 : 1);
    setMovementCost(item.unit_cost || 0);
    setMovementNotes('');
    setCreateExpenseOnRestock(true);
  };

  const handleConfirmMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItemForMovement) return;
    if (movementQty <= 0) {
      showToast('La cantidad debe ser mayor a 0', 'error');
      return;
    }

    recordStockMovement(
      {
        stock_item_id: activeItemForMovement.id,
        type: movementType,
        quantity: Number(movementQty),
        unit_cost: movementType === 'Entrada' ? Number(movementCost) : undefined,
        operator_name: profile?.full_name || 'Operador',
        notes: movementNotes.trim() || undefined
      },
      createExpenseOnRestock
    );

    showToast(
      `${movementType === 'Entrada' ? 'Entrada' : 'Salida'} de ${movementQty} ${activeItemForMovement.unit} registrada`,
      'success'
    );
    setActiveItemForMovement(null);
  };

  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      showToast('Ingresá el nombre del producto', 'error');
      return;
    }

    addStockItem({
      business: businessFilter,
      name: newItemName.trim(),
      category: newItemCategory,
      unit: newItemUnit,
      quantity: Number(newItemQty),
      min_stock: Number(newItemMinStock),
      unit_cost: Number(newItemUnitCost),
      supplier: newItemSupplier.trim() || undefined
    });

    setIsNewItemModalOpen(false);
    setNewItemName('');
    showToast('Producto agregado al inventario', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Banner de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-panel border border-borde">
          <div className="text-[11px] font-bold text-gris-texto">Total Productos</div>
          <div className="text-2xl font-black text-white mt-0.5">{filteredItems.length}</div>
          <p className="text-[10px] text-gris-texto mt-0.5">En taller Shangrilá</p>
        </div>

        <div className={`p-4 rounded-xl border ${
          lowStockItems.length > 0 ? 'bg-panel border-rojo' : 'bg-panel border-borde'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-bold text-gris-texto">
            <span>Stock Bajo / Reponer</span>
            {lowStockItems.length > 0 && <AlertTriangle className="w-4 h-4 text-rojo" />}
          </div>
          <div className={`text-2xl font-black mt-0.5 ${lowStockItems.length > 0 ? 'text-rojo' : 'text-white'}`}>
            {lowStockItems.length}
          </div>
          <p className="text-[10px] text-gris-texto mt-0.5">
            {lowStockItems.length > 0 ? 'Insumos por debajo del mínimo' : 'Stock en niveles óptimos'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-panel border border-borde">
          <div className="text-[11px] font-bold text-gris-texto">Valorización del Inventario</div>
          <div className="text-2xl font-black text-white font-mono mt-0.5">
            {formatCurrency(totalInventoryValue, 'UYU')}
          </div>
          <p className="text-[10px] text-gris-texto mt-0.5">Costo total de reposición</p>
        </div>
      </div>

      {/* Alerta Destacada si hay stock crítico */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-xl bg-panel border border-rojo flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-negro border border-rojo/40 text-rojo flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-rojo uppercase tracking-wide">
                Atención: Insumos críticos en Shangrilá
              </div>
              <div className="text-[11px] text-gris-texto mt-0.5">
                {lowStockItems.map((s) => s.name).join(' • ')}
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCategoryFilter('all')}
          >
            Ver Insumos
          </Button>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gris-texto" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar producto o proveedor..."
              className="w-full bg-negro border border-borde rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gris-texto focus:border-rojo focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-negro border border-borde rounded-xl px-3 py-2 text-xs text-white focus:border-rojo focus:outline-none"
          >
            <option value="all">Todas las categorías</option>
            <option value="Químicos">Químicos</option>
            <option value="Pads">Pads</option>
            <option value="Paños/Microfibras">Paños / Microfibras</option>
            <option value="Selladores">Selladores / Coatings</option>
            <option value="Herramientas">Herramientas</option>
            <option value="Accesorios">Accesorios</option>
            <option value="Otros">Otros</option>
          </select>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsNewItemModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span>+ Nuevo Producto</span>
        </Button>
      </div>

      {/* Lista de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredItems.map((item) => {
          const isCritical = item.quantity <= item.min_stock;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl bg-panel border transition-all flex flex-col justify-between space-y-3 ${
                isCritical ? 'border-rojo shadow-sm' : 'border-borde hover:border-gris-texto/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-negro border border-borde text-gris-texto">
                    {item.category}
                  </span>
                  {isCritical ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rojo/10 text-rojo border border-rojo/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Stock Bajo
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-gris-texto flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                      OK
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-white mt-2 leading-tight">{item.name}</h4>
                {item.supplier && (
                  <p className="text-[11px] text-gris-texto mt-0.5">Prov: {item.supplier}</p>
                )}
              </div>

              {/* Cantidad y costo */}
              <div className="pt-2 border-t border-borde flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-gris-texto uppercase font-bold">Disponible</div>
                  <div className="text-lg font-black text-white">
                    {item.quantity} <span className="text-xs font-normal text-gris-texto">{item.unit}</span>
                  </div>
                  <div className="text-[10px] text-gris-texto">Mínimo: {item.min_stock} {item.unit}</div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-gris-texto uppercase font-bold">Costo Unitario</div>
                  <div className="text-xs font-mono font-bold text-white">
                    {formatCurrency(item.unit_cost, 'UYU')}
                  </div>
                </div>
              </div>

              {/* Botones de acción rápida: Entrada y Salida */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openMovementModal(item, 'Entrada')}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Entrada</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openMovementModal(item, 'Salida')}
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>– Salida</span>
                </Button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal de Movimiento (+ Entrada / - Salida) */}
      {activeItemForMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-panel border border-borde rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-borde flex items-center justify-between bg-negro">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${movementType === 'Entrada' ? 'bg-white' : 'bg-rojo'}`} />
                <h4 className="text-sm font-bold text-white">
                  Registrar {movementType} de Stock
                </h4>
              </div>
              <button
                onClick={() => setActiveItemForMovement(null)}
                className="w-8 h-8 rounded-lg bg-panel hover:bg-negro text-gris-texto hover:text-white flex items-center justify-center border border-borde"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmMovement} className="p-4 sm:p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-negro border border-borde text-gris-texto">
                <div className="font-bold text-white">{activeItemForMovement.name}</div>
                <div className="text-[11px] text-gris-texto mt-0.5">
                  Stock actual: {activeItemForMovement.quantity} {activeItemForMovement.unit}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gris-texto block mb-1">
                  Cantidad ({activeItemForMovement.unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={movementQty}
                  onChange={(e) => setMovementQty(Number(e.target.value))}
                  className="w-full bg-negro border border-borde rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-rojo focus:outline-none"
                  required
                />
              </div>

              {movementType === 'Entrada' && (
                <>
                  <div>
                    <label className="text-[11px] font-semibold text-gris-texto block mb-1">
                      Costo Unitario ($UYU)
                    </label>
                    <input
                      type="number"
                      value={movementCost}
                      onChange={(e) => setMovementCost(Number(e.target.value))}
                      className="w-full bg-negro border border-borde rounded-xl px-3 py-2 text-white font-mono focus:border-rojo focus:outline-none"
                    />
                  </div>

                  <label className="flex items-center gap-2 p-3 rounded-xl bg-negro border border-borde cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createExpenseOnRestock}
                      onChange={(e) => setCreateExpenseOnRestock(e.target.checked)}
                      className="w-4 h-4 rounded text-rojo bg-panel border-borde"
                    />
                    <div className="text-[11px] text-white">
                      <strong>Cargar automáticamente como Gasto</strong> en Detailing (Insumos) por {formatCurrency(movementCost * movementQty, 'UYU')}
                    </div>
                  </label>
                </>
              )}

              <div>
                <label className="text-[11px] font-semibold text-gris-texto block mb-1">
                  Notas / Motivo (opcional)
                </label>
                <input
                  type="text"
                  value={movementNotes}
                  onChange={(e) => setMovementNotes(e.target.value)}
                  placeholder={movementType === 'Entrada' ? 'ej: Compra factura 1284' : 'ej: Utilizado en BMW 320i'}
                  className="w-full bg-negro border border-borde rounded-xl px-3 py-2 text-white placeholder-gris-texto focus:border-rojo focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-borde">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setActiveItemForMovement(null)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                >
                  Confirmar {movementType}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Nuevo Producto */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-panel border border-borde rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-borde flex items-center justify-between bg-negro">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-white" />
                <span>Nuevo Producto de Inventario</span>
              </h4>
              <button
                onClick={() => setIsNewItemModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-panel hover:bg-negro text-gris-texto hover:text-white flex items-center justify-center border border-borde"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewItem} className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-gris-texto block mb-1">Nombre del Insumo / Producto</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="ej: Pasta de Corte Pesado Menzerna 400"
                  className="w-full bg-negro border border-borde rounded-xl px-3 py-2 text-white placeholder-gris-texto focus:border-rojo focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gris-texto block mb-1">Categoría</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as StockCategory)}
                    className="w-full bg-negro border border-borde rounded-xl px-3 py-2 text-white focus:border-rojo focus:outline-none"
                  >
                    <option value="Químicos">Químicos</option>
                    <option value="Pads">Pads</option>
                    <option value="Paños/Microfibras">Paños / Microfibras</option>
                    <option value="Selladores">Selladores</option>
                    <option value="Herramientas">Herramientas</option>
                    <option value="Accesorios">Accesorios</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gris-texto block mb-1">Unidad de Medida</label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value as any)}
                    className="w-full bg-negro border border-borde rounded-xl px-3 py-2 text-white focus:border-rojo focus:outline-none"
                  >
                    <option value="unidades">Unidades</option>
                    <option value="litros">Litros</option>
                    <option value="botellas">Botellas</option>
                    <option value="pack">Pack</option>
                    <option value="gramos">Gramos</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gris-texto block mb-1">Cantidad Inicial</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Number(e.target.value))}
                    className="w-full bg-negro border border-borde rounded-xl px-3 py-2 text-white font-mono focus:border-rojo focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gris-texto block mb-1">Stock Mínimo (Alerta)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newItemMinStock}
                    onChange={(e) => setNewItemMinStock(Number(e.target.value))}
                    className="w-full bg-negro border border-borde rounded-xl px-3 py-2 text-white font-mono focus:border-rojo focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gris-texto block mb-1">Costo Unit. ($UYU)</label>
                  <input
                    type="number"
                    value={newItemUnitCost}
                    onChange={(e) => setNewItemUnitCost(Number(e.target.value))}
                    className="w-full bg-negro border border-borde rounded-xl px-3 py-2 text-white font-mono focus:border-rojo focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gris-texto block mb-1">Proveedor (opcional)</label>
                <input
                  type="text"
                  value={newItemSupplier}
                  onChange={(e) => setNewItemSupplier(e.target.value)}
                  placeholder="ej: Detailing Pro UY, Importador"
                  className="w-full bg-negro border border-borde rounded-xl px-3 py-2 text-white placeholder-gris-texto focus:border-rojo focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-borde">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setIsNewItemModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                >
                  Crear Producto
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
