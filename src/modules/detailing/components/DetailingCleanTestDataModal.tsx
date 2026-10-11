import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Download,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  FileSpreadsheet,
  FileCode,
  X,
  Lock
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { DetailingCleanSelection } from '../../../types';
import { normalizePlate } from '../../../lib/formatters';
import { Button } from '../../../components/ui/Button';

interface DetailingCleanTestDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DetailingCleanTestDataModal: React.FC<DetailingCleanTestDataModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    detailingQuotes,
    appointments,
    commissions,
    expenses,
    detailingReceipts,
    stockItems,
    clients,
    vehicles,
    dealershipVehicles,
    dealershipInquiries,
    inspections,
    cleanDetailingTestData
  } = useData();

  const { profile } = useAuth();
  const { showToast } = useToast();

  const isAdmin = profile?.roles.includes('admin');

  // Selección de entidades a limpiar
  const [selection, setSelection] = useState<DetailingCleanSelection>({
    quotes: true,
    appointments: true,
    commissions: true,
    payments: true,
    expenses: true,
    stock_movements: true,
    only_detailing_clients_vehicles: false
  });

  // Requisitos de seguridad obligatorios
  const [hasDownloadedBackup, setHasDownloadedBackup] = useState<boolean>(false);
  const [confirmInput, setConfirmInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Conteo de registros que se borrarán
  const detailingAppts = useMemo(() => appointments.filter((a) => a.business === 'detailing'), [appointments]);
  const detailingComms = useMemo(() => commissions.filter((c) => c.business === 'detailing'), [commissions]);
  const detailingExp = useMemo(() => expenses.filter((e) => e.business === 'detailing'), [expenses]);

  // Clientes y vehículos exclusivos de Detailing (Protección estricta: NUNCA los de automotora ni Carbusters)
  const dealershipClientIds = useMemo(() => new Set(dealershipInquiries.map((i) => i.client_id).filter(Boolean)), [dealershipInquiries]);
  const inspectionClientIds = useMemo(() => new Set(inspections.map((i) => i.client_id).filter(Boolean)), [inspections]);
  const detailingOnlyClientsCount = useMemo(() => {
    return clients.filter((c) => !dealershipClientIds.has(c.id) && !inspectionClientIds.has(c.id)).length;
  }, [clients, dealershipClientIds, inspectionClientIds]);

  const dealershipPlates = useMemo(() => new Set(dealershipVehicles.map((v) => normalizePlate(v.plate)).filter(Boolean)), [dealershipVehicles]);
  const inspectionPlates = useMemo(() => new Set(inspections.map((i) => normalizePlate(i.vehicle_plate)).filter(Boolean)), [inspections]);
  const detailingOnlyVehiclesCount = useMemo(() => {
    return vehicles.filter(
      (v) => !dealershipPlates.has(normalizePlate(v.plate)) && !inspectionPlates.has(normalizePlate(v.plate))
    ).length;
  }, [vehicles, dealershipPlates, inspectionPlates]);

  if (!isOpen) return null;

  // 1. Descarga obligatoria de respaldo JSON
  const handleDownloadJsonBackup = () => {
    const backupData = {
      backup_timestamp: new Date().toISOString(),
      user: profile?.full_name,
      detailing_quotes: detailingQuotes,
      detailing_appointments: detailingAppts,
      detailing_commissions: detailingComms,
      detailing_expenses: detailingExp,
      detailing_receipts: detailingReceipts
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Respaldo_DetailVlak_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setHasDownloadedBackup(true);
    showToast('Respaldo de seguridad JSON descargado. Ahora podés descargar el Excel.', 'success');
  };

  // 2. Descarga de respaldo en Excel (CSV con UTF-8 BOM)
  const handleDownloadExcelBackup = () => {
    const headers = ['Tipo Registro', 'ID', 'Referencia / Cliente', 'Vehículo / Detalle', 'Monto / Valor', 'Fecha', 'Estado'];
    const rows: (string | number)[][] = [];

    detailingQuotes.forEach((q) => {
      rows.push(['Cotización / Trabajo', q.id, `"${q.client_name}"`, `"${q.vehicle_info}"`, q.total_amount, q.created_at, q.status]);
    });
    detailingAppts.forEach((a) => {
      rows.push(['Turno Taller', a.id, `"${a.title || 'Turno'}"`, `"${a.stage || ''}"`, a.price_amount, a.start_time, a.status]);
    });
    detailingComms.forEach((c) => {
      rows.push(['Comisión', c.id, `"${c.employee_name}"`, `"${c.client_name}"`, c.commission_amount, c.created_at, c.status]);
    });
    detailingExp.forEach((e) => {
      rows.push(['Gasto', e.id, `"${e.description || e.category}"`, `"${e.supplier || ''}"`, e.amount, e.date, 'Pagado']);
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Respaldo_DetailVlak_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setHasDownloadedBackup(true);
    showToast('Respaldo Excel descargado exitosamente.', 'success');
  };

  // 3. Ejecutar limpieza
  const handleConfirmClean = async () => {
    if (!isAdmin) {
      showToast('Solo los administradores pueden realizar esta acción.', 'error');
      return;
    }
    if (!hasDownloadedBackup) {
      showToast('Debés descargar el respaldo antes de continuar.', 'error');
      return;
    }
    if (confirmInput.trim() !== 'BORRAR') {
      showToast('Debés escribir exactamente "BORRAR" para confirmar.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await cleanDetailingTestData(selection);
      if (res.success) {
        showToast('Datos de prueba de DetailVlak eliminados exitosamente. Registro guardado en auditoría.', 'success');
        onClose();
      } else {
        showToast('Ocurrió un error al limpiar los datos.', 'error');
      }
    } catch (err: any) {
      showToast(`Error: ${err?.message || 'Error desconocido'}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-[#E5E5E3] rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera de Alerta */}
        <div className="p-4 sm:p-5 border-b border-[#E5E5E3] bg-red-50/60 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D7141A] text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#161616] font-title flex items-center gap-2">
                <span>Limpiar datos de prueba de DetailVlak</span>
                <span className="text-[10px] bg-[#D7141A] text-white px-2 py-0.5 rounded font-semibold uppercase">
                  Solo Admin
                </span>
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                Elimina cotizaciones, turnos y gastos cargados durante la puesta a punto.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white hover:bg-gray-100 text-[#6B6B6B] flex items-center justify-center border border-[#E5E5E3] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* PASO 1: Descarga Obligatoria de Respaldo */}
          <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#161616] text-xs flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#161616] text-white inline-flex items-center justify-center text-[11px] font-bold">1</span>
                <span>Paso 1: Descarga obligatoria de respaldo</span>
              </span>
              {hasDownloadedBackup && (
                <span className="text-[11px] text-[#1E6B43] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Respaldo generado
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#6B6B6B]">
              Para evitar cualquier pérdida accidental, es obligatorio descargar una copia completa antes de habilitar el borrado:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadJsonBackup}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white hover:bg-[#F5F5F4] border border-[#E5E5E3] font-semibold text-[#161616] shadow-xs cursor-pointer transition-colors"
              >
                <FileCode className="w-4 h-4 text-[#D7141A]" />
                <span>Descargar Respaldo JSON</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadExcelBackup}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white hover:bg-[#F5F5F4] border border-[#E5E5E3] font-semibold text-[#161616] shadow-xs cursor-pointer transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#1E6B43]" />
                <span>Descargar Respaldo Excel</span>
              </button>
            </div>
          </div>

          {/* PASO 2: Selección de Registros con Conteo */}
          <div className="space-y-3">
            <span className="font-bold text-[#161616] text-xs flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#161616] text-white inline-flex items-center justify-center text-[11px] font-bold">2</span>
              <span>Paso 2: Elegí qué registros de DetailVlak borrar</span>
            </span>

            <div className="space-y-2 border border-[#E5E5E3] rounded-xl p-3 bg-white">
              
              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F5F5F4] cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selection.quotes}
                    onChange={(e) => setSelection({ ...selection, quotes: e.target.checked })}
                    className="w-4 h-4 rounded text-[#D7141A] accent-[#D7141A]"
                  />
                  <div>
                    <span className="font-semibold text-[#161616]">Cotizaciones y trabajos de Detailing</span>
                    <p className="text-[10px] text-[#6B6B6B]">Incluye historial y comprobantes emitidos</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {detailingQuotes.length} registros
                </span>
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F5F5F4] cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selection.appointments}
                    onChange={(e) => setSelection({ ...selection, appointments: e.target.checked })}
                    className="w-4 h-4 rounded text-[#D7141A] accent-[#D7141A]"
                  />
                  <div>
                    <span className="font-semibold text-[#161616]">Turnos en agenda del taller</span>
                    <p className="text-[10px] text-[#6B6B6B]">Libera los horarios y boxes ocupados</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {detailingAppts.length} turnos
                </span>
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F5F5F4] cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selection.commissions}
                    onChange={(e) => setSelection({ ...selection, commissions: e.target.checked })}
                    className="w-4 h-4 rounded text-[#D7141A] accent-[#D7141A]"
                  />
                  <div>
                    <span className="font-semibold text-[#161616]">Comisiones de Detailing</span>
                    <p className="text-[10px] text-[#6B6B6B]">Elimina comisiones pendientes o liquidadas del taller</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {detailingComms.length} registros
                </span>
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F5F5F4] cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selection.expenses}
                    onChange={(e) => setSelection({ ...selection, expenses: e.target.checked })}
                    className="w-4 h-4 rounded text-[#D7141A] accent-[#D7141A]"
                  />
                  <div>
                    <span className="font-semibold text-[#161616]">Gastos de Detailing</span>
                    <p className="text-[10px] text-[#6B6B6B]">Insumos y servicios del taller cargados en pruebas</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {detailingExp.length} gastos
                </span>
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F5F5F4] cursor-pointer border-t border-[#E5E5E3] pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selection.only_detailing_clients_vehicles}
                    onChange={(e) => setSelection({ ...selection, only_detailing_clients_vehicles: e.target.checked })}
                    className="w-4 h-4 rounded text-[#D7141A] accent-[#D7141A]"
                  />
                  <div>
                    <span className="font-semibold text-[#161616]">
                      Clientes y autos exclusivos de Detailing
                    </span>
                    <p className="text-[10px] text-[#1E6B43] font-medium">
                      ✓ Protección total: NUNCA se tocarán clientes ni autos de Automotora o Carbusters.
                    </p>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {detailingOnlyClientsCount} cli / {detailingOnlyVehiclesCount} autos
                </span>
              </label>

            </div>
          </div>

          {/* PASO 3: Confirmación con palabra BORRAR */}
          <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 space-y-2">
            <span className="font-bold text-[#161616] text-xs flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#D7141A] text-white inline-flex items-center justify-center text-[11px] font-bold">3</span>
              <span>Confirmación de seguridad</span>
            </span>
            <p className="text-[11px] text-[#6B6B6B]">
              Para confirmar, escribí la palabra <strong className="text-[#D7141A] font-mono">BORRAR</strong> en mayúsculas:
            </p>
            <input
              type="text"
              placeholder='Escribí "BORRAR"'
              value={confirmInput}
              disabled={!hasDownloadedBackup}
              onChange={(e) => setConfirmInput(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#E5E5E3] rounded-xl text-xs font-mono font-bold tracking-widest text-center uppercase focus:border-[#D7141A] focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

        </div>

        {/* Botones de Pie */}
        <div className="p-4 border-t border-[#E5E5E3] bg-[#F5F5F4] flex items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="primary"
            disabled={!hasDownloadedBackup || confirmInput.trim() !== 'BORRAR' || isProcessing}
            onClick={handleConfirmClean}
            className="gap-1.5 bg-[#D7141A] hover:bg-[#B80E14] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isProcessing ? 'Eliminando...' : 'Eliminar Datos de Prueba'}</span>
          </Button>
        </div>

      </div>
    </div>
  );
};
