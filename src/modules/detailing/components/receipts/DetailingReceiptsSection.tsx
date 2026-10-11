import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Calendar,
  Download,
  Printer,
  Copy,
  Check,
  MessageCircle,
  Eye,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { useData } from '../../../../context/DataContext';
import { DetailingReceipt } from '../../../../types';
import { formatCurrency, getLocalMonthString } from '../../../../lib/formatters';
import { Button } from '../../../../components/ui/Button';
import { UruguayanPlate } from '../../../../components/ui/UruguayanPlate';
import { DetailingReceiptView } from './DetailingReceiptView';
import { useToast } from '../../../../context/ToastContext';

export const DetailingReceiptsSection: React.FC = () => {
  const { detailingReceipts } = useData();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getLocalMonthString()); // YYYY-MM
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pagado' | 'Saldo pendiente' | 'Anulado'>('all');
  const [selectedReceiptForView, setSelectedReceiptForView] = useState<DetailingReceipt | null>(null);

  // Filtrado de comprobantes
  const filteredReceipts = useMemo(() => {
    return detailingReceipts.filter((r) => {
      const matchMonth = !selectedMonth || r.issue_date.startsWith(selectedMonth);
      const matchStatus = statusFilter === 'all'
        ? true
        : statusFilter === 'Anulado'
        ? r.is_voided
        : !r.is_voided && r.status === statusFilter;

      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term ||
        r.receipt_number.toLowerCase().includes(term) ||
        r.client_name.toLowerCase().includes(term) ||
        (r.vehicle_plate && r.vehicle_plate.toLowerCase().includes(term)) ||
        r.vehicle_info.toLowerCase().includes(term);

      return matchMonth && matchStatus && matchSearch;
    });
  }, [detailingReceipts, selectedMonth, statusFilter, searchTerm]);

  // Exportar a Excel (CSV con UTF-8 BOM para compatibilidad total con Excel en Windows/Mac)
  const handleExportExcel = () => {
    if (filteredReceipts.length === 0) {
      showToast('No hay comprobantes para exportar en este filtro.', 'error');
      return;
    }

    const headers = [
      'Número',
      'Versión',
      'Fecha Emisión',
      'Fecha Servicio',
      'Cliente',
      'Teléfono',
      'Vehículo',
      'Matrícula',
      'Detailer',
      'Subtotal',
      'Descuento',
      'Total',
      'Abonado',
      'Saldo Pendiente',
      'Estado',
      'Enlace Público'
    ];

    const rows = filteredReceipts.map((r) => [
      `"${r.receipt_number}"`,
      r.version,
      `"${r.issue_date}"`,
      `"${r.service_date}"`,
      `"${r.client_name.replace(/"/g, '""')}"`,
      `"${(r.client_phone || '').replace(/"/g, '""')}"`,
      `"${(r.vehicle_info || '').replace(/"/g, '""')}"`,
      `"${r.vehicle_plate || ''}"`,
      `"${(r.detailer_name || '').replace(/"/g, '""')}"`,
      r.subtotal,
      r.discount_amount,
      r.total_amount,
      r.deposit_amount,
      r.balance_pending,
      `"${r.is_voided ? 'Anulado' : r.status}"`,
      `"${window.location.origin}/?comprobante=${r.token}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Comprobantes_DetailVlak_${selectedMonth || 'todos'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Archivo Excel descargado exitosamente.', 'success');
  };

  const handleCopyPublicLink = (token: string) => {
    const url = `${window.location.origin}/?comprobante=${token}`;
    navigator.clipboard.writeText(url);
    showToast('Enlace público copiado al portapapeles', 'success');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      
      {/* Barra de cabecera y exportación */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E5E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h2 className="text-base font-bold font-title text-[#161616] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#D7141A]" />
            <span>Comprobantes de Servicio DetailVlak</span>
          </h2>
          <p className="text-xs text-[#6B6B6B]">
            Historial oficial de comprobantes emitidos, reimpresiones y enlaces públicos para clientes.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={handleExportExcel}
          className="text-xs gap-1.5 self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-[#161616]" />
          <span>Exportar a Excel</span>
        </Button>
      </div>

      {/* Controles de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Buscador */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#9A9A9A] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por número, cliente o matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-white border border-[#E5E5E3] rounded-xl text-xs text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none w-56 sm:w-72"
            />
          </div>

          {/* Selector de Mes */}
          <div className="flex items-center gap-1.5 bg-white border border-[#E5E5E3] rounded-xl px-3 py-1.5 text-xs text-[#161616]">
            <Calendar className="w-3.5 h-3.5 text-[#9A9A9A]" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-[#161616] font-medium focus:outline-none cursor-pointer"
            />
            {selectedMonth && (
              <button
                type="button"
                onClick={() => setSelectedMonth('')}
                className="text-[10px] text-[#6B6B6B] hover:text-[#161616] ml-1"
                title="Ver todos los meses"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro por Estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-white border border-[#E5E5E3] rounded-xl px-3 py-1.5 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="Pagado">Pagados</option>
            <option value="Saldo pendiente">Saldo pendiente</option>
            <option value="Anulado">Anulados</option>
          </select>

        </div>

        <div className="text-xs text-[#6B6B6B]">
          Mostrando <strong>{filteredReceipts.length}</strong> comprobantes
        </div>
      </div>

      {/* Listado de Comprobantes */}
      {filteredReceipts.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-[#E5E5E3] text-center text-[#6B6B6B] space-y-2">
          <FileText className="w-8 h-8 text-[#9A9A9A] mx-auto opacity-40" />
          <p className="text-sm font-medium">No se encontraron comprobantes para el filtro seleccionado.</p>
          <p className="text-xs text-[#9A9A9A]">
            Los comprobantes se emiten automáticamente al completar o entregar un vehículo.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E5E3] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F5F5F4] border-b border-[#E5E5E3] text-[#161616]">
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">Comprobante</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">Fecha</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">Cliente</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">Vehículo</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] text-right">Total</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] text-center">Estado</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E3]">
                {filteredReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F5F5F4]/60 transition-colors">
                    
                    {/* Número */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#D7141A] text-sm">
                          {r.receipt_number}
                        </span>
                        {r.version > 1 && (
                          <span className="text-[10px] bg-[#161616] text-white px-1.5 py-0.2 rounded font-semibold">
                            v{r.version}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#6B6B6B]">Op: {r.detailer_name}</span>
                    </td>

                    {/* Fecha */}
                    <td className="py-3 px-4 whitespace-nowrap text-[#161616]">
                      <div>{r.issue_date}</div>
                      <span className="text-[10px] text-[#6B6B6B]">Serv: {r.service_date}</span>
                    </td>

                    {/* Cliente */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#161616]">{r.client_name}</div>
                      <div className="text-[11px] text-[#6B6B6B] font-mono">{r.client_phone || 'Sin tel'}</div>
                    </td>

                    {/* Vehículo */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#161616]">{r.vehicle_info}</span>
                        {r.vehicle_plate && (
                          <div className="scale-75 origin-left">
                            <UruguayanPlate plate={r.vehicle_plate} />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-[#6B6B6B]">
                        {r.services.length} {r.services.length === 1 ? 'servicio' : 'servicios'}
                      </span>
                    </td>

                    {/* Total y Saldo */}
                    <td className="py-3 px-4 text-right">
                      <div className="font-mono font-bold text-[#161616] text-sm">
                        {formatCurrency(r.total_amount, 'UYU')}
                      </div>
                      {r.balance_pending > 0 && (
                        <div className="text-[10px] font-mono text-[#D7141A] font-semibold">
                          Saldo: {formatCurrency(r.balance_pending, 'UYU')}
                        </div>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        r.is_voided
                          ? 'bg-red-50 text-[#D7141A] border border-red-200'
                          : r.status === 'Pagado'
                          ? 'bg-[#EEF7F2] text-[#1E6B43] border border-[#1E6B43]/20'
                          : 'bg-amber-50 text-amber-800 border border-amber-300'
                      }`}>
                        {r.is_voided ? 'Anulado' : r.status}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptForView(r)}
                          className="p-1.5 rounded-lg bg-white hover:bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3] hover:border-[#D0D0CD] transition-colors cursor-pointer"
                          title="Ver / Imprimir Comprobante"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyPublicLink(r.token)}
                          className="p-1.5 rounded-lg bg-white hover:bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3] hover:border-[#D0D0CD] transition-colors cursor-pointer"
                          title="Copiar Enlace Público"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal con la vista completa oficial del comprobante */}
      {selectedReceiptForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl my-8">
            <DetailingReceiptView
              receipt={selectedReceiptForView}
              onClose={() => setSelectedReceiptForView(null)}
            />
          </div>
        </div>
      )}

    </div>
  );
};
