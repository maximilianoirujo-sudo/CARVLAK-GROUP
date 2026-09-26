import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Calendar,
  CreditCard,
  Tag,
  Trash2,
  Filter,
  FileText,
  X,
  PieChart
} from 'lucide-react';
import { Expense, ExpenseCategory, PaymentMethod, Business } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { formatCurrency } from '../../../lib/formatters';

interface DetailingExpensesSectionProps {
  businessFilter?: Business;
}

export const DetailingExpensesSection: React.FC<DetailingExpensesSectionProps> = ({
  businessFilter = 'detailing'
}) => {
  const { expenses, addExpense, deleteExpense } = useData();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Formulario nuevo gasto
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<ExpenseCategory>('Insumos');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transferencia');
  const [description, setDescription] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Gastos filtrados
  const businessExpenses = useMemo(() => {
    return expenses.filter((e) => e.business === businessFilter || e.business === 'general');
  }, [expenses, businessFilter]);

  const filteredExpenses = useMemo(() => {
    return businessExpenses.filter((e) => {
      const matchMonth = e.date.startsWith(selectedMonth);
      const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
      return matchMonth && matchCat;
    });
  }, [businessExpenses, selectedMonth, categoryFilter]);

  // Total del mes seleccionado
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredExpenses]);

  // Desglose por categoría
  const breakdownByCategory = useMemo(() => {
    const acc: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
    });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      showToast('El monto debe ser mayor a 0', 'error');
      return;
    }
    if (!description.trim()) {
      showToast('Ingresá una descripción del gasto', 'error');
      return;
    }

    addExpense({
      business: businessFilter,
      date,
      amount: Number(amount),
      currency: 'UYU',
      category,
      payment_method: paymentMethod,
      description: description.trim(),
      invoice_number: invoiceNumber.trim() || undefined
    });

    setIsModalOpen(false);
    setAmount(0);
    setDescription('');
    setInvoiceNumber('');
    showToast('Gasto operativo registrado', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Resumen Superior */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#121826] border border-slate-800">
          <div className="text-[11px] font-bold text-slate-400">Total Gastos ({selectedMonth})</div>
          <div className="text-2xl font-black text-rose-400 font-mono mt-0.5">
            {formatCurrency(totalAmount, 'UYU')}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {filteredExpenses.length} comprobantes cargados
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#121826] border border-slate-800 sm:col-span-2">
          <div className="text-[11px] font-bold text-slate-400 mb-2">Desglose por Categoría</div>
          {breakdownByCategory.length === 0 ? (
            <p className="text-xs text-slate-500">Sin gastos para el mes seleccionado</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {breakdownByCategory.map(([cat, total]) => (
                <div key={cat} className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center gap-1.5">
                  <span className="text-slate-300 font-medium">{cat}:</span>
                  <span className="font-bold text-rose-400 font-mono">{formatCurrency(total, 'UYU')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Controles de Filtro y Botón Nuevo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#121826] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#121826] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">Todas las categorías</option>
            <option value="Insumos">Insumos</option>
            <option value="Alquiler/Servicios">Alquiler / Servicios</option>
            <option value="Herramientas/Maquinaria">Herramientas / Maquinaria</option>
            <option value="Marketing/Publicidad">Marketing / Publicidad</option>
            <option value="Sueldos/Adelantos">Sueldos / Adelantos</option>
            <option value="Varios">Varios</option>
          </select>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Cargar Gasto</span>
        </button>
      </div>

      {/* Lista de Gastos */}
      {filteredExpenses.length === 0 ? (
        <div className="p-8 rounded-3xl bg-[#121826] border border-slate-800 text-center text-slate-400">
          <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30 text-purple-400" />
          <p className="text-sm font-bold text-slate-300">No hay gastos registrados en este período</p>
          <p className="text-xs text-slate-500 mt-1">Podés cargar uno nuevo con el botón superior.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredExpenses.map((exp) => (
            <div
              key={exp.id}
              className="p-3.5 rounded-2xl bg-[#121826] border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs truncate">{exp.description}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold shrink-0">
                      {exp.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span>{exp.date}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-slate-500" />
                      {exp.payment_method}
                    </span>
                    {exp.invoice_number && (
                      <>
                        <span>•</span>
                        <span>Fac: {exp.invoice_number}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-sm font-black font-mono text-rose-400">
                    -{formatCurrency(exp.amount, 'UYU')}
                  </span>
                </div>
                {profile?.roles.includes('admin') && (
                  <button
                    onClick={() => {
                      if (confirm('¿Eliminar este registro de gasto?')) {
                        deleteExpense(exp.id);
                        showToast('Gasto eliminado', 'info');
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Carga Rápida de Gasto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0E131F] border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#121826]">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-purple-400" />
                <span>Cargar Gasto Operativo (Detailing)</span>
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Monto en $UYU</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-[10px] text-slate-500 font-bold">$U</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full bg-[#121826] border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white font-mono text-sm font-bold"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Fecha</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#121826] border border-slate-700 rounded-xl px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Descripción</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ej: Compra de microfibras, Reparación de hidrolavadora..."
                  className="w-full bg-[#121826] border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-[#121826] border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                  >
                    <option value="Insumos">Insumos</option>
                    <option value="Alquiler/Servicios">Alquiler / Servicios</option>
                    <option value="Herramientas/Maquinaria">Herramientas / Maquinaria</option>
                    <option value="Marketing/Publicidad">Marketing / Publicidad</option>
                    <option value="Sueldos/Adelantos">Sueldos / Adelantos</option>
                    <option value="Varios">Varios</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Medio de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-[#121826] border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Transferencia">Transferencia bancaria</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta de crédito / débito</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Nº Comprobante / Factura (opcional)</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="ej: A-00492"
                  className="w-full bg-[#121826] border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg"
                >
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
