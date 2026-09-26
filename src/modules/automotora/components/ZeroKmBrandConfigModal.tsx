import React, { useState } from 'react';
import {
  X,
  Settings,
  Plus,
  Save,
  Building2,
  CheckCircle2,
  Percent,
  DollarSign,
  Calendar,
  Phone,
  User,
  HelpCircle
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { ZeroKmBrandConfig, ZeroKmProfitScheme } from '../../../types';

interface ZeroKmBrandConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ZeroKmBrandConfigModal: React.FC<ZeroKmBrandConfigModalProps> = ({ isOpen, onClose }) => {
  const { zeroKmBrandConfigs, updateZeroKmBrandConfig, addZeroKmBrandConfig } = useData();

  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(
    zeroKmBrandConfigs.length > 0 ? zeroKmBrandConfigs[0].id : null
  );

  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form state
  const [brand, setBrand] = useState('');
  const [importerName, setImporterName] = useState('');
  const [profitScheme, setProfitScheme] = useState<ZeroKmProfitScheme>('margen');
  const [commissionType, setCommissionType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [commissionValue, setCommissionValue] = useState<number>(4.5);
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(15);
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const currentBrand = zeroKmBrandConfigs.find((b) => b.id === selectedBrandId);

  // Cargar datos al seleccionar marca
  const handleSelectBrand = (brandConfig: ZeroKmBrandConfig) => {
    setIsCreatingNew(false);
    setSelectedBrandId(brandConfig.id);
    setBrand(brandConfig.brand);
    setImporterName(brandConfig.importer_name);
    setProfitScheme(brandConfig.profit_scheme);
    setCommissionType(brandConfig.default_commission_type || 'percentage');
    setCommissionValue(brandConfig.default_commission_value || 4.5);
    setPaymentTermsDays(brandConfig.payment_terms_days);
    setContactPerson(brandConfig.contact_person || '');
    setContactPhone(brandConfig.contact_phone || '');
    setSavedSuccess(false);
  };

  const handleStartCreate = () => {
    setIsCreatingNew(true);
    setSelectedBrandId(null);
    setBrand('');
    setImporterName('');
    setProfitScheme('margen');
    setCommissionType('percentage');
    setCommissionValue(4.5);
    setPaymentTermsDays(15);
    setContactPerson('');
    setContactPhone('');
    setSavedSuccess(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !importerName.trim()) return;

    if (isCreatingNew) {
      const created = addZeroKmBrandConfig({
        brand: brand.trim(),
        importer_name: importerName.trim(),
        profit_scheme: profitScheme,
        default_commission_type: profitScheme === 'comision_aparte' ? commissionType : undefined,
        default_commission_value: profitScheme === 'comision_aparte' ? Number(commissionValue) : undefined,
        payment_terms_days: Number(paymentTermsDays) || 15,
        contact_person: contactPerson.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined
      });
      setIsCreatingNew(false);
      setSelectedBrandId(created.id);
    } else if (selectedBrandId) {
      updateZeroKmBrandConfig(selectedBrandId, {
        brand: brand.trim(),
        importer_name: importerName.trim(),
        profit_scheme: profitScheme,
        default_commission_type: profitScheme === 'comision_aparte' ? commissionType : undefined,
        default_commission_value: profitScheme === 'comision_aparte' ? Number(commissionValue) : undefined,
        payment_terms_days: Number(paymentTermsDays) || 15,
        contact_person: contactPerson.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined
      });
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#12161F] border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#161B26]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Configuración de Marcas e Importadores 0km</h2>
              <p className="text-xs text-slate-400">
                Define para cada marca si tu ganancia es por Margen Directo o Comisión Aparte, plazos y contactos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido en dos columnas */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Columna Izquierda: Lista de Marcas */}
          <div className="md:col-span-4 border-r border-slate-800/80 p-4 overflow-y-auto space-y-2 bg-[#0F131C]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                Marcas ({zeroKmBrandConfigs.length})
              </span>
              <button
                type="button"
                onClick={handleStartCreate}
                className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-bold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {zeroKmBrandConfigs.map((b) => {
                const isSelected = !isCreatingNew && b.id === selectedBrandId;
                return (
                  <button
                    key={b.id}
                    onClick={() => handleSelectBrand(b)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                        : 'bg-slate-900/50 border-slate-800/70 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-xs ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                        {b.brand}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          b.profit_scheme === 'margen'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {b.profit_scheme === 'margen' ? 'Margen' : 'Comisión'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 truncate">
                      {b.importer_name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha: Formulario de Edición / Creación */}
          <div className="md:col-span-8 p-5 overflow-y-auto bg-[#12161F]">
            {(selectedBrandId || isCreatingNew) ? (
              <form onSubmit={handleSave} className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Settings className="w-4 h-4 text-amber-400" />
                    <span>{isCreatingNew ? 'Registrar Nueva Marca 0km' : `Editar Marca: ${brand || currentBrand?.brand}`}</span>
                  </h3>
                  {savedSuccess && (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>¡Guardado exitosamente!</span>
                    </span>
                  )}
                </div>

                {/* Campos Principales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Marca del Vehículo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Chevrolet, Toyota, BYD..."
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Razón Social del Importador *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: General Motors Uruguay, Curcio Capital..."
                      value={importerName}
                      onChange={(e) => setImporterName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* ESQUEMA DE GANANCIA (OPCIÓN A vs OPCIÓN B) */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                      Modelo de Cálculo de Ganancia
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      Aplica por marca
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Opción A */}
                    <div
                      onClick={() => setProfitScheme('margen')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        profitScheme === 'margen'
                          ? 'bg-amber-500/10 border-amber-400 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-white">Opción A: "Margen"</span>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${profitScheme === 'margen' ? 'border-amber-400 bg-amber-400' : 'border-slate-600'}`}>
                            {profitScheme === 'margen' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          El importador te factura un <strong>precio neto</strong> mayorista.
                          Tu ganancia = <span className="text-amber-300">Precio cliente – Costo neto importador</span>.
                        </p>
                      </div>
                      <div className="mt-2 text-[10px] text-slate-400">
                        Pagas al importador el neto. La diferencia queda en caja.
                      </div>
                    </div>

                    {/* Opción B */}
                    <div
                      onClick={() => setProfitScheme('comision_aparte')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        profitScheme === 'comision_aparte'
                          ? 'bg-amber-500/10 border-amber-400 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-white">Opción B: "Comisión Aparte"</span>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${profitScheme === 'comision_aparte' ? 'border-amber-400 bg-amber-400' : 'border-slate-600'}`}>
                            {profitScheme === 'comision_aparte' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Pagas al importador el <strong>precio de lista completo</strong> y él te liquida una comisión (% o USD fijo) por separado.
                        </p>
                      </div>
                      <div className="mt-2 text-[10px] text-slate-400">
                        La comisión va a Cuentas por Cobrar hasta que el importador pague.
                      </div>
                    </div>
                  </div>

                  {/* Parámetros de Comisión si es Opción B */}
                  {profitScheme === 'comision_aparte' && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950/90 border border-emerald-500/30 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Tipo de Comisión Habitual
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setCommissionType('percentage')}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                              commissionType === 'percentage'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-slate-900 text-slate-400 border-slate-700'
                            }`}
                          >
                            % Porcentaje
                          </button>
                          <button
                            type="button"
                            onClick={() => setCommissionType('fixed_amount')}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                              commissionType === 'fixed_amount'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-slate-900 text-slate-400 border-slate-700'
                            }`}
                          >
                            $ Monto Fijo
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Valor sugerido por defecto
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step={commissionType === 'percentage' ? '0.1' : '10'}
                            value={commissionValue}
                            onChange={(e) => setCommissionValue(parseFloat(e.target.value) || 0)}
                            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-400"
                          />
                          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                            {commissionType === 'percentage' ? <Percent className="w-3.5 h-3.5" /> : <DollarSign className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Plazos de Pago y Contacto */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Plazo de Pago (Días) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={paymentTermsDays}
                        onChange={(e) => setPaymentTermsDays(parseInt(e.target.value) || 15)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">Días para calcular vencimiento</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Contacto Comercial
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Nombre de ejecutivo"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Teléfono / WhatsApp
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="+598 99..."
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                {/* Botón Guardar */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isCreatingNew ? 'Guardar Nueva Marca' : 'Actualizar Configuración'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                <Building2 className="w-12 h-12 mb-3 stroke-[1.5] text-slate-600" />
                <p className="text-sm font-bold text-slate-400">Selecciona una marca de la lista o crea una nueva</p>
                <p className="text-xs text-slate-500 mt-1">Configura si se liquida por Margen o por Comisión separada.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
