import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  Car,
  CheckCircle2,
  AlertCircle,
  Database,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { INITIAL_DEALERSHIP_VEHICLES } from '../../../lib/mockData';

interface DealershipMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DealershipMigrationModal: React.FC<DealershipMigrationModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const { dealershipVehicles, importTiendanubeCatalog } = useData();
  const { showToast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ importedCount: number; duplicatesCount: number } | null>(null);

  // Calcular duplicados existentes
  const { newCount, existingCount } = useMemo(() => {
    let existing = 0;
    let newCars = 0;

    INITIAL_DEALERSHIP_VEHICLES.forEach((car) => {
      const alreadyIn = dealershipVehicles.some(
        (v) =>
          (v.plate && car.plate && v.plate.toUpperCase() === car.plate.toUpperCase()) ||
          (v.chassis_vin && car.chassis_vin && v.chassis_vin.toUpperCase() === car.chassis_vin.toUpperCase()) ||
          v.id === car.id
      );
      if (alreadyIn) existing++;
      else newCars++;
    });

    return { newCount: newCars, existingCount: existing };
  }, [dealershipVehicles]);

  const handleImport = () => {
    setIsImporting(true);
    setTimeout(() => {
      const res = importTiendanubeCatalog();
      setResult(res);
      setIsImporting(false);
      showToast(`¡Se importaron ${res.importedCount} vehículos del catálogo oficial!`, 'success');
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-[#0D121C] border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Sincronización de Catálogo Oficial CARVLAK
              </h2>
              <p className="text-[11px] text-slate-400">
                46 vehículos oficiales (39 Usados Seleccionados + 7 Eléctricos 0km) con fotos HD
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Explicación de la fuente de verdad */}
          <div className="p-4 rounded-2xl bg-[#121826] border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider">
              <Database className="w-4 h-4" />
              <span>CARVLAK Group como Única Fuente de Verdad</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              El inventario pasa a estar 100% centralizado en la base de datos de CARVLAK Group, habilitando control de costos, peritaje previo, alistamiento en taller, comisiones de vendedores y sincronización con el catálogo web público.
            </p>
          </div>

          {/* Estadísticas de Importación */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Total en Catálogo</div>
              <div className="text-2xl font-black text-white mt-1">46</div>
              <div className="text-[10px] text-slate-500">39 Usados + 7 Eléctricos 0km</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
              <div className="text-[10px] font-bold text-emerald-400 uppercase">Nuevos a Importar</div>
              <div className="text-2xl font-black text-emerald-300 mt-1">{newCount}</div>
              <div className="text-[10px] text-emerald-400/80">Sin duplicar matrícula/chasis</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Ya Existentes</div>
              <div className="text-2xl font-black text-slate-400 mt-1">{existingCount}</div>
              <div className="text-[10px] text-slate-500">Omitidos automáticamente</div>
            </div>
          </div>

          {/* Resultado si ya se importó */}
          {result && (
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <strong>¡Importación completada!</strong> Se añadieron {result.importedCount} vehículos al catálogo activo y se omitieron {result.duplicatesCount} vehículos existentes.
              </div>
            </div>
          )}

          {/* Vista Previa de Unidades */}
          <div className="space-y-2">
            <div className="text-xs font-black text-white uppercase tracking-wider">
              Vista Previa de Unidades del Catálogo Oficial
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-800 rounded-2xl p-2 bg-slate-900/40">
              {INITIAL_DEALERSHIP_VEHICLES.slice(0, 10).map((car, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 overflow-hidden shrink-0">
                      {car.images && car.images[0] ? (
                        <img src={car.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Car className="w-4 h-4 m-auto text-slate-600" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-white">
                        {car.brand} {car.model} {car.version || ''}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-2">
                        {car.condition === '0km' ? '⚡ 0km' : `Año ${car.year}`}
                      </span>
                    </div>
                  </div>

                  <div className="font-black text-emerald-400">
                    USD {car.sale_price?.toLocaleString()}
                  </div>
                </div>
              ))}
              <div className="text-center text-[10px] text-slate-500 pt-1">
                ...y 36 vehículos adicionales con fotos HD y equipamiento.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            {result ? 'Cerrar' : 'Cancelar'}
          </button>

          <button
            onClick={handleImport}
            disabled={isImporting || newCount === 0}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{isImporting ? 'Importando...' : `Importar ${newCount} Autos a CARVLAK`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
