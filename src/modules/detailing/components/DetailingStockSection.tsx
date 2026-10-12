import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  Plus,
  Minus,
  Search,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  AlertCircle
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
  const { stockItems, addStockItem, updateStockItem, deleteStockItemPermanent } = useData();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<StockItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<StockItem | null>(null);

  // Formulario de Producto
  const [name, setName] = useState('');
  const [category, setCategory] = useState<StockCategory>('Químicos');
  const [unit, setUnit] = useState<StockItem['unit']>('litros');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(1);
  const [supplier, setSupplier] = useState('');

  const isAdmin = profile?.roles?.includes('admin');

  // Filtrado
  const detailingItems = stockItems.filter(
    (s) => !s.is_archived && (s.business === businessFilter || s.business === 'general')
  );

  const filteredItems = detailingItems.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.supplier || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'all' || s.category === categoryFilter;
    return matchSearch && matchCat;
  });

  // Métricas
  const lowStockItems = detailingItems.filter((s) => s.quantity <= s.min_stock);
  const totalValue = detailingItems.reduce((acc, curr) => acc + curr.quantity * curr.unit_cost, 0);

  const handleOpenAddModal = () => {
    setItemToEdit(null);
    setName('');
    setCategory('Químicos');
    setUnit('litros');
    setQuantity(5);
    setUnitCost(800);
    setMinStock(2);
    setSupplier('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: StockItem) => {
    setItemToEdit(item);
    setName(item.name);
    setCategory(item.category);
    setUnit(item.unit);
    setQuantity(item.quantity);
    setUnitCost(item.unit_cost);
    setMinStock(item.min_stock);
    setSupplier(item.supplier || '');
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Ingresá el nombre del producto', 'error');
      return;
    }

    if (itemToEdit) {
      updateStockItem(itemToEdit.id, {
        name: name.trim(),
        category,
        unit,
        quantity: Number(quantity),
        unit_cost: Number(unitCost),
        min_stock: Number(minStock),
        supplier: supplier.trim() || undefined
      });
      showToast('Producto actualizado correctamente', 'success');
    } else {
      addStockItem({
        name: name.trim(),
        category,
        unit,
        quantity: Number(quantity),
        unit_cost: Number(unitCost),
        min_stock: Number(minStock),
        supplier: supplier.trim() || undefined,
        business: businessFilter,
        is_archived: false
      });
      showToast('Producto agregado al inventario', 'success');
    }
    setIsModalOpen(false);
  };

  // Ajuste rápido de cantidad +/-
  const handleAdjustQuantity = (item: StockItem, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    updateStockItem(item.id, { quantity: newQty });
  };

  // Borrar con confirmación
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    deleteStockItemPermanent(itemToDelete.id);
    showToast(`Producto "${itemToDelete.name}" eliminado del inventario`, 'info');
    setItemToDelete(null);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header con Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-[#E5E5E3] shadow-xs">
          <span className="text-[10px] sm:text-xs text-[#6B6B6B] block">Total Insumos</span>
          <p className="text-xl font-bold font-mono text-[#161616] mt-0.5">
            {detailingItems.length}
          </p>
          <span className="text-[10px] text-[#6B6B6B] block">productos cargados</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-[#E5E5E3] shadow-xs">
          <span className="text-[10px] sm:text-xs text-[#6B6B6B] block">Bajo Stock</span>
          <p className={`text-xl font-bold font-mono mt-0.5 ${lowStockItems.length > 0 ? 'text-[#D7141A]' : 'text-emerald-600'}`}>
            {lowStockItems.length}
          </p>
          <span className="text-[10px] text-[#6B6B6B] block">requieren reposición</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-[#E5E5E3] shadow-xs">
          <span className="text-[10px] sm:text-xs text-[#6B6B6B] block">Valor del Inventario</span>
          <p className="text-xl font-bold font-mono text-[#161616] mt-0.5">
            {formatCurrency(totalValue)}
          </p>
          <span className="text-[10px] text-[#6B6B6B] block">Costo total acumulado</span>
        </div>
      </div>

      {/* 2. Barra de Búsqueda y Botón Agregar */}
      <div className="bg-white p-3 rounded-2xl border border-[#E5E5E3] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#9A9A9A]" />
            <input
              type="text"
              placeholder="Buscar insumo o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl pl-8 pr-3 py-2 text-xs text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-2.5 py-2 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none"
          >
            <option value="all">Todas las categorías</option>
            <option value="Químicos">Químicos</option>
            <option value="Pulido">Pulido</option>
            <option value="Herramientas">Herramientas</option>
            <option value="Microfibras y Pads">Microfibras y Pads</option>
            <option value="Packaging y Entregas">Packaging y Entregas</option>
            <option value="Otros">Otros</option>
          </select>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto bg-[#D7141A] hover:bg-[#b01015]"
        >
          <Plus className="w-4 h-4 mr-1" />
          Agregar producto
        </Button>
      </div>

      {/* 3. Lista Simple de Productos */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E5E3] p-10 text-center space-y-3">
          <Package className="w-8 h-8 text-[#9A9A9A] mx-auto" />
          <p className="text-xs text-[#6B6B6B]">
            {searchTerm || categoryFilter !== 'all'
              ? 'No se encontraron productos con los filtros actuales.'
              : 'El inventario está vacío. Agregá el primer insumo con el botón de arriba.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E5E3] divide-y divide-[#E5E5E3] overflow-hidden shadow-xs">
          {filteredItems.map((item) => {
            const isLow = item.quantity <= item.min_stock;
            return (
              <div
                key={item.id}
                className={`p-3 sm:p-4 flex items-center justify-between gap-3 text-xs transition-colors ${
                  isLow ? 'bg-red-50/30' : 'hover:bg-[#F5F5F4]'
                }`}
              >
                {/* Nombre e info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[#161616] truncate">{item.name}</span>
                    <span className="text-[10px] text-[#6B6B6B] bg-[#F5F5F4] px-2 py-0.5 rounded-full border border-[#E5E5E3]">
                      {item.category}
                    </span>
                    {isLow && (
                      <span className="text-[10px] font-bold text-[#D7141A] bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Bajo stock
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                    Costo unitario: <span className="font-mono font-medium text-[#161616]">{formatCurrency(item.unit_cost)}</span> ·
                    Mínimo: <span className="font-mono">{item.min_stock} {item.unit}</span>
                    {item.supplier && <span> · Prov: {item.supplier}</span>}
                  </p>
                </div>

                {/* Control de Cantidad (+/-) */}
                <div className="flex items-center gap-1.5 shrink-0 bg-[#F5F5F4] p-1 rounded-xl border border-[#E5E5E3]">
                  <button
                    onClick={() => handleAdjustQuantity(item, -1)}
                    className="w-7 h-7 rounded-lg bg-white border border-[#E5E5E3] text-[#161616] hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
                    title="Restar 1"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <div className="px-2 text-center min-w-[50px]">
                    <span className="text-sm font-bold font-mono text-[#161616] block leading-none">
                      {item.quantity}
                    </span>
                    <span className="text-[9px] text-[#6B6B6B] block leading-none mt-0.5">
                      {item.unit}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAdjustQuantity(item, 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-[#E5E5E3] text-[#161616] hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
                    title="Sumar 1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Acciones Editar y Borrar */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-2 rounded-lg text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] transition-colors cursor-pointer"
                    title="Editar producto"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setItemToDelete(item)}
                    className="p-2 rounded-lg text-[#6B6B6B] hover:text-[#D7141A] hover:bg-red-50 transition-colors cursor-pointer"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Agregar / Editar Producto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-[#E5E5E3] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl my-auto">
            <div className="p-4 border-b border-[#E5E5E3] flex items-center justify-between bg-[#F5F5F4]">
              <h3 className="text-sm font-bold text-[#161616] flex items-center gap-2">
                <Package className="w-4 h-4 text-[#D7141A]" />
                {itemToEdit ? 'Editar producto' : 'Agregar producto'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#161616] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-4 space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-[#161616] block mb-1">
                  Nombre del producto / insumo *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Compound de Corte, Cera Líquida..."
                  className="w-full bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-[#161616] block mb-1">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as StockCategory)}
                    className="w-full bg-white border border-[#E5E5E3] rounded-xl px-2 py-2 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none"
                  >
                    <option value="Químicos">Químicos</option>
                    <option value="Pulido">Pulido</option>
                    <option value="Herramientas">Herramientas</option>
                    <option value="Microfibras y Pads">Microfibras y Pads</option>
                    <option value="Packaging y Entregas">Packaging y Entregas</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#161616] block mb-1">
                    Unidad
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as StockItem['unit'])}
                    className="w-full bg-white border border-[#E5E5E3] rounded-xl px-2 py-2 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none"
                  >
                    <option value="litros">Litros</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="unidades">Unidades</option>
                    <option value="gramos">Gramos</option>
                    <option value="packs">Packs</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-[#161616] block mb-1">
                    Cantidad inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-white border border-[#E5E5E3] rounded-xl px-2 py-2 text-xs font-mono text-[#161616] focus:border-[#D7141A] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#161616] block mb-1">
                    Costo unit. ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    className="w-full bg-white border border-[#E5E5E3] rounded-xl px-2 py-2 text-xs font-mono text-[#161616] focus:border-[#D7141A] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#161616] block mb-1">
                    Stock mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="w-full bg-white border border-[#E5E5E3] rounded-xl px-2 py-2 text-xs font-mono text-[#161616] focus:border-[#D7141A] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#161616] block mb-1">
                  Proveedor (opcional)
                </label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Ej: Detailing Pro UY, Importador..."
                  className="w-full bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E5E5E3]">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" type="submit" className="bg-[#D7141A] hover:bg-[#b01015]">
                  {itemToEdit ? 'Guardar cambios' : 'Crear producto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-[#E5E5E3] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-100 text-[#D7141A] flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-[#161616]">¿Eliminar producto?</h4>
              <p className="text-xs text-[#6B6B6B]">
                Se eliminará permanentemente <span className="font-semibold text-[#161616]">"{itemToDelete.name}"</span> del inventario.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setItemToDelete(null)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmDelete} className="bg-[#D7141A] hover:bg-[#b01015]">
                Sí, eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
