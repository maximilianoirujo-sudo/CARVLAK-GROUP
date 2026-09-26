import React, { useState, useEffect } from 'react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import {
  VehicleInspection,
  InspectionType,
  VehicleCategory,
  InspectionStatus
} from '../../../types';
import { INITIAL_PROFILES } from '../../../lib/mockData';
import { X, Search, Plus, MapPin, DollarSign, Calendar, User, Car, ShieldCheck } from 'lucide-react';

interface InspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspectionToEdit?: VehicleInspection | null;
}

export const InspectionModal: React.FC<InspectionModalProps> = ({
  isOpen,
  onClose,
  inspectionToEdit
}) => {
  const {
    clients,
    vehicles,
    inspectionTariffs,
    addInspection,
    updateInspection,
    addClient,
    addVehicle
  } = useData();
  const { profile } = useAuth();

  const [type, setType] = useState<InspectionType>('precompra');
  const [status, setStatus] = useState<InspectionStatus>('Solicitada');
  
  // Cliente / Comprador
  const [clientId, setClientId] = useState<string>('');
  const [buyerName, setBuyerName] = useState<string>('');
  const [buyerPhone, setBuyerPhone] = useState<string>('');
  const [isNewClient, setIsNewClient] = useState<boolean>(false);

  // Vendedor
  const [sellerName, setSellerName] = useState<string>('');
  const [sellerPhone, setSellerPhone] = useState<string>('');

  // Vehículo
  const [vehicleId, setVehicleId] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState<string>('');
  const [vehicleInfo, setVehicleInfo] = useState<string>('');
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>('Mediano');
  const [isNewVehicle, setIsNewVehicle] = useState<boolean>(false);

  // Inspector & Agenda
  const [assignedTo, setAssignedTo] = useState<string>('user-diego');
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );

  // Ubicación & Traslado
  const [isHomeVisit, setIsHomeVisit] = useState<boolean>(false);
  const [homeAddress, setHomeAddress] = useState<string>('');

  // Precios
  const [priceAmount, setPriceAmount] = useState<number>(3800);
  const [surcharge, setSurcharge] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(3800);

  // Notas
  const [notes, setNotes] = useState<string>('');

  // Cargar si es edición
  useEffect(() => {
    if (inspectionToEdit) {
      setType(inspectionToEdit.type);
      setStatus(inspectionToEdit.status);
      setClientId(inspectionToEdit.client_id || '');
      setBuyerName(inspectionToEdit.buyer_name || '');
      setBuyerPhone(inspectionToEdit.buyer_phone || '');
      setSellerName(inspectionToEdit.seller_name || '');
      setSellerPhone(inspectionToEdit.seller_phone || '');
      setVehicleId(inspectionToEdit.vehicle_id || '');
      setVehiclePlate(inspectionToEdit.vehicle_plate || '');
      setVehicleInfo(inspectionToEdit.vehicle_info || '');
      setVehicleCategory(inspectionToEdit.vehicle_category || 'Mediano');
      setAssignedTo(inspectionToEdit.assigned_to || 'user-diego');
      setScheduledDate(
        inspectionToEdit.scheduled_at
          ? new Date(inspectionToEdit.scheduled_at).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16)
      );
      setIsHomeVisit(inspectionToEdit.is_home_visit);
      setHomeAddress(inspectionToEdit.home_address || '');
      setPriceAmount(inspectionToEdit.price_amount);
      setSurcharge(inspectionToEdit.home_visit_surcharge);
      setTotalPrice(inspectionToEdit.total_price);
      setNotes(inspectionToEdit.inspector_conclusion || '');
    } else {
      // Default para nueva
      setType('precompra');
      setStatus('Solicitada');
      setClientId('');
      setBuyerName('');
      setBuyerPhone('');
      setSellerName('');
      setSellerPhone('');
      setVehicleId('');
      setVehiclePlate('');
      setVehicleInfo('');
      setVehicleCategory('Mediano');
      setAssignedTo('user-diego');
      setIsHomeVisit(false);
      setHomeAddress('');
      setNotes('');
    }
  }, [inspectionToEdit, isOpen]);

  // Recalcular precios según categoría, tipo y traslado
  useEffect(() => {
    if (type === 'interna') {
      const base = inspectionTariffs.internalCost || 1500;
      setPriceAmount(base);
      setSurcharge(0);
      setTotalPrice(base);
    } else {
      const base = inspectionTariffs.prices[vehicleCategory] || 3800;
      const sur = isHomeVisit ? inspectionTariffs.homeVisitSurcharge || 1200 : 0;
      setPriceAmount(base);
      setSurcharge(sur);
      setTotalPrice(base + sur);
    }
  }, [type, vehicleCategory, isHomeVisit, inspectionTariffs]);

  // Manejo de selección de Cliente existente
  const handleSelectClient = (cId: string) => {
    setClientId(cId);
    const c = clients.find((item) => item.id === cId);
    if (c) {
      setBuyerName(c.full_name);
      setBuyerPhone(c.phone);
    }
  };

  // Manejo de selección de Vehículo existente
  const handleSelectVehicle = (vId: string) => {
    setVehicleId(vId);
    const v = vehicles.find((item) => item.id === vId);
    if (v) {
      setVehiclePlate(v.plate);
      setVehicleInfo(`${v.brand} ${v.model} (${v.year || ''})`);
      setVehicleCategory(v.category);
      if (v.client_id && !clientId) {
        handleSelectClient(v.client_id);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalClientId = clientId;
    let finalVehicleId = vehicleId;

    // Crear cliente al vuelo si es nuevo
    if (isNewClient && buyerName) {
      const newC = addClient({
        full_name: buyerName,
        phone: buyerPhone,
        origin: 'Presencial',
        notes: type === 'precompra' ? 'Comprador Precompra' : 'Inspección'
      });
      finalClientId = newC.client.id;
    }

    // Crear vehículo al vuelo si es nuevo
    if (isNewVehicle && vehiclePlate) {
      const parts = vehicleInfo.split(' ');
      const brand = parts[0] || 'Vehículo';
      const model = parts.slice(1).join(' ') || 'Inspección';
      const newV = addVehicle({
        plate: vehiclePlate,
        brand,
        model,
        year: new Date().getFullYear(),
        category: vehicleCategory,
        ownership: 'client',
        photos: [],
        client_id: finalClientId || undefined
      });
      finalVehicleId = newV.vehicle.id;
    }

    if (inspectionToEdit) {
      updateInspection(inspectionToEdit.id, {
        type,
        status,
        client_id: finalClientId || undefined,
        buyer_name: buyerName,
        buyer_phone: buyerPhone,
        seller_name: sellerName,
        seller_phone: sellerPhone,
        vehicle_id: finalVehicleId || undefined,
        vehicle_plate: vehiclePlate,
        vehicle_info: vehicleInfo,
        vehicle_category: vehicleCategory,
        assigned_to: assignedTo,
        scheduled_at: new Date(scheduledDate).toISOString(),
        is_home_visit: isHomeVisit,
        home_address: homeAddress,
        price_amount: priceAmount,
        home_visit_surcharge: surcharge,
        total_price: totalPrice,
        inspector_conclusion: notes
      });
    } else {
      addInspection({
        type,
        status,
        client_id: finalClientId || undefined,
        buyer_name: buyerName || (type === 'interna' ? 'Automotora CARVLAK' : ''),
        buyer_phone: buyerPhone,
        seller_name: sellerName,
        seller_phone: sellerPhone,
        vehicle_id: finalVehicleId || undefined,
        vehicle_plate: vehiclePlate || 'S/D',
        vehicle_info: vehicleInfo || 'Vehículo sin especificar',
        vehicle_category: vehicleCategory,
        assigned_to: assignedTo,
        scheduled_at: new Date(scheduledDate).toISOString(),
        is_home_visit: isHomeVisit,
        home_address: homeAddress,
        price_amount: priceAmount,
        price_currency: 'UYU',
        home_visit_surcharge: surcharge,
        total_price: totalPrice,
        obd_codes: [],
        score: 100,
        traffic_light: 'Recomendable',
        inspector_conclusion: notes,
        estimated_repair_cost: 0
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-[#0F141F] border border-slate-700 shadow-2xl p-5 sm:p-6 space-y-5 my-8">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">
              🔍
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                Fase 3 • Peritaje Vehicular
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {inspectionToEdit ? 'Editar Inspección' : 'Nueva Inspección'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. TIPO DE INSPECCIÓN & ESTADO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tipo de Inspección</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('precompra')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                    type === 'precompra'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Precompra (Cliente)
                </button>
                <button
                  type="button"
                  onClick={() => setType('interna')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                    type === 'interna'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300 ring-2 ring-blue-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Interna Automotora
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Estado Inicial</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InspectionStatus)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-emerald-500 outline-none"
              >
                <option value="Solicitada">Solicitada (A coordinar)</option>
                <option value="Agendada">Agendada (Crea turno en Agenda)</option>
                <option value="En curso">En curso (En revisión)</option>
                <option value="Completada">Completada (Finalizada)</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          {/* 2. CLIENTE / COMPRADOR & VENDEDOR */}
          <div className="p-4 rounded-2xl bg-[#090D14] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <User className="w-4 h-4 text-emerald-400" />
                <span>
                  {type === 'precompra' ? 'Comprador / Solicitante' : 'Entidad Solicitante'}
                </span>
              </div>
              {type === 'precompra' && (
                <button
                  type="button"
                  onClick={() => setIsNewClient(!isNewClient)}
                  className="text-[11px] text-emerald-400 hover:underline font-bold"
                >
                  {isNewClient ? 'Seleccionar existente' : '+ Crear nuevo'}
                </button>
              )}
            </div>

            {type === 'precompra' ? (
              !isNewClient ? (
                <select
                  value={clientId}
                  onChange={(e) => handleSelectClient(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500 outline-none"
                >
                  <option value="">-- Seleccionar cliente existente --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.phone})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nombre completo del comprador"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500 outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Celular / WhatsApp (099...)"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500 outline-none"
                  />
                </div>
              )
            ) : (
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                <strong>Automotora CARVLAK</strong> • Evaluación para stock o toma en permuta (Jonathan Kaitazoff / Patio).
              </div>
            )}

            {/* Datos del vendedor (opcional) */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Vendedor del auto / Titular actual (Opcional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nombre del vendedor"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500 outline-none"
                />
                <input
                  type="tel"
                  placeholder="Teléfono del vendedor"
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. VEHÍCULO */}
          <div className="p-4 rounded-2xl bg-[#090D14] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Car className="w-4 h-4 text-emerald-400" />
                <span>Vehículo a Inspeccionar</span>
              </div>
              <button
                type="button"
                onClick={() => setIsNewVehicle(!isNewVehicle)}
                className="text-[11px] text-emerald-400 hover:underline font-bold"
              >
                {isNewVehicle ? 'Seleccionar de flota' : '+ Cargar manual'}
              </button>
            </div>

            {!isNewVehicle ? (
              <select
                value={vehicleId}
                onChange={(e) => handleSelectVehicle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500 outline-none"
              >
                <option value="">-- Seleccionar vehículo registrado --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate} - {v.brand} {v.model} ({v.year || ''}) [{v.category}]
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Matrícula (ej: SBX 1234)"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-emerald-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Marca y Modelo (ej: BMW 320i 2021)"
                  value={vehicleInfo}
                  onChange={(e) => setVehicleInfo(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500 outline-none"
                />
              </div>
            )}

            {/* Categoría para tarifario */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-semibold text-slate-400">
                Categoría (Define tarifa precompra)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {(['Chico', 'Mediano', 'SUV/Rural', 'Pick-up', 'Moto'] as VehicleCategory[]).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setVehicleCategory(cat)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                        vehicleCategory === cat
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* 4. INSPECTOR, FECHA & TRASLADO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Inspector Asignado</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-emerald-500 outline-none"
              >
                {INITIAL_PROFILES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.roles.join(', ')}) - Comis. {p.commissions?.inspeccion || 0}%
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Fecha y Hora</label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* TRASLADO A DOMICILIO */}
          <div className="p-3.5 rounded-2xl bg-[#090D14] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Inspección a Domicilio</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHomeVisit}
                  onChange={(e) => setIsHomeVisit(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {isHomeVisit && (
              <div className="space-y-2 pt-2 animate-fade-in">
                <input
                  type="text"
                  placeholder="Dirección del domicilio / taller donde está el vehículo"
                  value={homeAddress}
                  onChange={(e) => setHomeAddress(e.target.value)}
                  required={isHomeVisit}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500 outline-none"
                />
                <p className="text-[11px] text-amber-300">
                  Recargo por traslado configurado: +$U {inspectionTariffs.homeVisitSurcharge.toLocaleString('es-UY')}
                </p>
              </div>
            )}
          </div>

          {/* 5. RESUMEN DE COBRO */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                {type === 'precompra' ? 'Total a Cobrar al Cliente' : 'Costo Interno Registrado'}
              </span>
              <p className="text-xs text-slate-300">
                {type === 'precompra'
                  ? `Tarifa ${vehicleCategory} ($U ${priceAmount.toLocaleString('es-UY')}) ${
                      isHomeVisit ? `+ Traslado ($U ${surcharge.toLocaleString('es-UY')})` : ''
                    }`
                  : 'Tarifa fija interna de peritaje CARVLAK'}
              </p>
            </div>
            <div className="text-right font-mono">
              <span className="text-2xl font-black text-emerald-400">
                $U {totalPrice.toLocaleString('es-UY')}
              </span>
            </div>
          </div>

          {/* 6. BOTONES DE ACCIÓN */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-500 text-xs font-black text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
            >
              {inspectionToEdit ? 'Guardar Cambios' : 'Crear Inspección'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
