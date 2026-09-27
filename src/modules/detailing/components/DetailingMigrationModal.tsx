import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileSpreadsheet,
  ArrowRight,
  Database,
  Sparkles
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/ui/Button';

interface DetailingMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DetailingMigrationModal: React.FC<DetailingMigrationModalProps> = ({
  isOpen,
  onClose
}) => {
  const { importDetailVlakData } = useData();
  const { showToast } = useToast();

  const [rawJson, setRawJson] = useState('');
  const [migrationResult, setMigrationResult] = useState<{
    importedClientsCount: number;
    importedVehiclesCount: number;
    importedQuotesCount: number;
    importedStockCount: number;
    importedExpensesCount: number;
    duplicatesDetected: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleRunMigration = () => {
    if (!rawJson.trim()) {
      showToast('Pegá el JSON exportado de DetailVlak o hacé clic en Cargar Respaldo', 'error');
      return;
    }

    try {
      const parsed = JSON.parse(rawJson);
      const res = importDetailVlakData(parsed);
      setMigrationResult(res);
      showToast('¡Importación completada con éxito!', 'success');
    } catch (err: any) {
      showToast('Error al parsear el formato JSON: revisá que sea válido', 'error');
    }
  };

  // Carga de ejemplo de respaldo real extraído de DetailVlak
  const handleLoadSampleBackup = () => {
    const sampleData = {
      leads: [
        {
          id: 'lead-101',
          name: 'Federico Balbi',
          phone: '099 888 777',
          vehicle: 'Chevrolet Tracker Premier',
          category: 'suv',
          quotedServices: ['pulido', 'ceramico'],
          quotedTotal: 20700,
          status: 'COMPLETADO',
          source: 'Instagram',
          timestamp: '2026-09-15T14:30:00Z',
          notes: 'Cliente muy detallista. Muy conforme con el sellado cerámico.'
        },
        {
          id: 'lead-102',
          name: 'Carolina Méndez',
          phone: '098 333 222',
          vehicle: 'Audi A3 Sportback',
          category: 'chico',
          quotedServices: ['interior', 'lavado_exterior'],
          quotedTotal: 5300,
          status: 'TURNO',
          source: 'WhatsApp',
          timestamp: '2026-09-24T10:00:00Z',
          notes: 'Turno reservado para desmanchado de asientos delanteros.'
        },
        {
          id: 'lead-103',
          name: 'Nicolás Varela', // Ya existe en mockData -> detector de duplicados
          phone: '098 765 432',
          vehicle: 'BMW 320i M-Sport',
          plate: 'SBX 1234',
          category: 'mediano',
          quotedServices: ['ceramico'],
          quotedTotal: 9800,
          status: 'COTIZADO',
          source: 'Presencial',
          timestamp: '2026-09-23T11:00:00Z',
          notes: 'Interesado en protección de llantas.'
        }
      ],
      stock: [
        {
          name: 'Cera Carnauba Líquida Collins',
          category: 'Selladores',
          unit: 'botellas',
          quantity: 3,
          minStock: 1,
          unitCost: 1450,
          supplier: 'Detailing Pro UY'
        },
        {
          name: 'Desengrasante Motor Heavy Duty',
          category: 'Químicos',
          unit: 'litros',
          quantity: 6,
          minStock: 2,
          unitCost: 520,
          supplier: 'Detailing Pro UY'
        }
      ],
      expenses: [
        {
          date: '2026-09-18',
          amount: 2900,
          category: 'Insumos',
          paymentMethod: 'Transferencia',
          description: 'Compra de 2 aplicadores y cera rápida'
        }
      ]
    };

    setRawJson(JSON.stringify(sampleData, null, 2));
    showToast('Datos de respaldo cargados en el visor', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-panel border border-borde rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-borde flex items-center justify-between bg-negro">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-panel border border-borde text-white flex items-center justify-center">
              <UploadCloud className="w-5 h-5 text-rojo" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Migración desde DetailVlak
              </h3>
              <p className="text-xs text-gris-texto">
                Importá clientes, cotizaciones, stock y gastos sin duplicar datos existentes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-panel hover:bg-negro text-gris-texto hover:text-white flex items-center justify-center transition-colors border border-borde"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* Guía Paso a Paso */}
          <div className="p-4 rounded-xl bg-negro border border-borde space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
              <HelpCircle className="w-4 h-4 text-white" />
              <span>Cómo exportar tus datos desde DetailVlak (https://detailvlak.vercel.app):</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-gris-texto text-[11px] leading-relaxed">
              <li>Tu app actual **DetailVlak sigue 100% operativa** y no sufrirá ningún cambio.</li>
              <li>Entrá a tu planilla de Google Sheets vinculada a DetailVlak (pestañas `Tasaciones`, `Stock`, `Gastos`).</li>
              <li>Podés copiar los datos en formato JSON o hacer clic en **"Cargar Respaldo Preconfigurado"** para realizar una prueba inmediata.</li>
              <li>El importador detectará automáticamente si un cliente o vehículo ya existe por su teléfono o matrícula para evitar duplicados.</li>
            </ol>
          </div>

          {/* Área de texto JSON */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gris-texto">
                Datos de Importación (JSON)
              </label>
              <button
                type="button"
                onClick={handleLoadSampleBackup}
                className="text-[11px] font-bold text-rojo hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cargar Respaldo Preconfigurado</span>
              </button>
            </div>

            <textarea
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              placeholder='{"leads": [...], "stock": [...], "expenses": [...]}'
              rows={8}
              className="w-full bg-negro border border-borde rounded-xl p-3 text-xs text-white font-mono focus:border-rojo focus:outline-none"
            />
          </div>

          {/* Resultado de la migración */}
          {migrationResult && (
            <div className="p-4 rounded-xl bg-panel border border-borde space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Resultados de la Importación:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-gris-texto">
                <div>Clientes nuevos: <strong className="text-white">{migrationResult.importedClientsCount}</strong></div>
                <div>Vehículos vinculados: <strong className="text-white">{migrationResult.importedVehiclesCount}</strong></div>
                <div>Cotizaciones cargadas: <strong className="text-white">{migrationResult.importedQuotesCount}</strong></div>
                <div>Insumos de stock: <strong className="text-white">{migrationResult.importedStockCount}</strong></div>
                <div>Gastos registrados: <strong className="text-white">{migrationResult.importedExpensesCount}</strong></div>
                <div>Duplicados detectados: <strong className="text-white">{migrationResult.duplicatesDetected}</strong></div>
              </div>
            </div>
          )}

        </div>

        {/* Barra de Acciones */}
        <div className="p-4 sm:p-5 border-t border-borde bg-negro flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Cerrar
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleRunMigration}
          >
            <Database className="w-4 h-4" />
            <span>Ejecutar Importación</span>
          </Button>
        </div>

      </div>
    </div>
  );
};
