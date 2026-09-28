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
import { Button } from '../../../components/ui/Button';

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

  // Escuchar tecla Escape para cerrar
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-xl bg-white border border-[#E5E5E3] shadow-2xl p-5 sm:p-6 space-y-5 my-8">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] text-[#D7141A] flex items-center justify-center text-xl">
              🔍
            </div>
            <div>
              <span className="text-[10px] font-title font-bold uppercase tracking-wider text-[#6B6B6B]">
                Fase 3 • Peritaje vehicular
              </span>
              <h2 className="text-lg sm:text-xl font-title font-bold text-[#161616]">
                {inspectionToEdit ? 'Editar inspección' : 'Nueva inspección'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. TIPO DE INSPECCIÓN & ESTADO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6B6B6B]">Tipo de inspección</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('precompra')}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-all text-center ${
                    type === 'precompra'
                      ? 'bg-[#161616] text-white border-[#161616]'
                      : 'bg-[#F5F5F4] border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616]'
                  }`}
                >
                  Precompra (Cliente)
                </button>
                <button
                  type="button"
                  onClick={() => setType('interna')}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-all text-center ${
                    type === 'interna'
                      ? 'bg-[#161616] text-white border-[#161616]'
                      : 'bg-[#F5F5F4] border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616]'
                  }`}
                >
                  Interna automotora
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6B6B6B]">Estado inicial</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InspectionStatus)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616] text-xs font-semibold focus:bg-white focus:border-[#161616] outline-none"
              >
                <option value="Solicitada">Solicitada (A coordinar)</option>
                <option value="Agendada">Agendada (Crea turno en agenda)</option>
                <option value="En curso">En curso (En revisión)</option>
                <option value="Completada">Completada (Finalizada)</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          {/* 2. CLIENTE / COMPRADOR & VENDEDOR */}
          <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#161616]">
                <User className="w-4 h-4 text-[#6B6B6B]" />
                <span>
                  {type === 'precompra' ? 'Comprador / Solicitante' : 'Entidad solicitante'}
                </span>
              </div>
              {type === 'precompra' && (
                <button
                  type="button"
                  onClick={() => setIsNewClient(!isNewClient)}
                  className="text-[11px] text-[#161616] hover:underline font-bold"
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
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E5E3] text-[#161616] text-xs focus:border-[#161616] outline-none"
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
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E5E3] text-[#161616] placeholder-[#9A9A9A] text-xs focus:border-[#161616] outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Celular / WhatsApp (099...)"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E5E3] text-[#161616] placeholder-[#9A9A9A] text-xs focus:border-[#161616] outline-none"
                  />
                </div>
              )
            ) : (
              <div className="p-2.5 rounded-lg bg-white border border-[#E5E5E3] text-xs text-[#6B6B6B]">
                <strong className="text-[#161616]">Automotora CARVLAK</strong> • Evaluación para stock o toma en permuta (Jonathan Kaitazoff / Patio).
              </div>
            )}

            {/* Datos del vendedor (opcional) */}
            <div className="pt-2 border-t border-[#E5E5E3]">
              <label className="text-[11px] font-semibold text-[#6B6B6B] block mb-1.5">
                Vendedor del auto / Titular actual (Opcional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nombre del vendedor"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E5E3] text-[#161616] placeholder-[#9A9A9A] text-xs focus:border-[#161616] outline-none"
                />
                <input
                  type="tel"
                  placeholder="Teléfono del vendedor"
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E5E3] text-[#161616] placeholder-[#9A9A9A] text-xs focus:border-[#161616] outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. VEHÍCULO */}
          <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#161616]">
                <Car className="w-4 h-4 text-[#6B6B6B]" />
                <span>Vehículo a inspeccionar</span>
              </div>
              <button
                type="button"
                onClick={() => setIsNewVehicle(!isNewVehicle)}
                className="text-[11px] text-[#161616] hover:underline font-bold"
              >
                {isNewVehicle ? 'Seleccionar de flota' : '+ Cargar manual'}
              </button>
            </div>

            {!isNewVehicle ? (
              <select
                value={vehicleId}
                onChange={(e) => handleSelectVehicle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E5E3] text-[#161616] text-xs focus:border-[#161616] outline-none"
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
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E5E3] text-[#161616] placeholder-[#9A9A9A] font-mono text-xs focus:border-[#161616] outline-none"
                />
                <input
                  type="text"
                  placeholder="Marca y Modelo (ej: BMW 320i 2021)"
                  value={vehicleInfo}
                  onChange={(e) => setVehicleInfo(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E5E3] text-[#161616] placeholder-[#9A9A9A] text-xs focus:border-[#161616] outline-none"
                />
              </div>
            )}

            {/* Categoría para tarifario */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-semibold text-[#6B6B6B]">
                Categoría (Define tarifa precompra)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {(['Chico', 'Mediano', 'SUV/Rural', 'Pick-up', 'Moto'] as VehicleCategory[]).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setVehicleCategory(cat)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                        vehicleCategory === cat
                          ? 'bg-[#161616] text-white border-[#161616]'
                          : 'bg-white border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616]'
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
              <label className="text-xs font-semibold text-[#6B6B6B]">Inspector asignado</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616] text-xs font-semibold focus:bg-white focus:border-[#161616] outline-none"
              >
                {INITIAL_PROFILES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.roles.join(', ')}) - Comis. {p.commissions?.inspeccion || 0}%
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#6B6B6B]">Fecha y hora</label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616] text-xs focus:bg-white focus:border-[#161616] outline-none"
              />
            </div>
          </div>

          {/* TRASLADO A DOMICILIO */}
          <div className="p-3.5 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#6B6B6B]" />
                <span className="text-xs font-bold text-[#161616]">Inspección a domicilio</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHomeVisit}
                  onChange={(e) => setIsHomeVisit(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-white border border-[#E5E5E3] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#6B6B6B] peer-checked:after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D7141A]"></div>
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
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E5E3] text-[#161616] placeholder-[#9A9A9A] text-xs focus:border-[#161616] outline-none"
                />
                <p className="text-[11px] text-[#6B6B6B]">
                  Recargo por traslado: +$U {inspectionTariffs.homeVisitSurcharge.toLocaleString('es-UY')}
                </p>
              </div>
            )}
          </div>

          {/* 5. RESUMEN DE COBRO */}
          <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-title font-bold text-[#6B6B6B] uppercase tracking-wider">
                {type === 'precompra' ? 'Total a cobrar al cliente' : 'Costo interno registrado'}
              </span>
              <p className="text-xs text-[#6B6B6B]">
                {type === 'precompra'
                  ? `Tarifa ${vehicleCategory} ($U ${priceAmount.toLocaleString('es-UY')}) ${
                      isHomeVisit ? `+ Traslado ($U ${surcharge.toLocaleString('es-UY')})` : ''
                    }`
                  : 'Tarifa fija interna de peritaje CARVLAK'}
              </p>
            </div>
            <div className="text-right font-mono">
              <span className="text-2xl font-title font-bold text-[#161616]">
                $U {totalPrice.toLocaleString('es-UY')}
              </span>
            </div>
          </div>

          {/* 6. BOTONES DE ACCIÓN */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              {inspectionToEdit ? 'Guardar cambios' : 'Crear inspección'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
