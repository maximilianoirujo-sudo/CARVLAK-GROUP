import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Vehicle, VehicleCategory, VehicleOwnership } from '../../types';
import { normalizePlate } from '../../lib/formatters';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleToEdit?: Vehicle | null;
  defaultClientId?: string;
}

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({
  isOpen,
  onClose,
  vehicleToEdit,
  defaultClientId
}) => {
  const { clients, addVehicle, updateVehicle } = useData();
  const { showToast } = useToast();

  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number | undefined>(2020);
  const [color, setColor] = useState('');
  const [mileage, setMileage] = useState<number | undefined>(50000);
  const [category, setCategory] = useState<VehicleCategory>('Mediano');
  const [ownership, setOwnership] = useState<VehicleOwnership>('client');
  const [clientId, setClientId] = useState(defaultClientId || '');

  useEffect(() => {
    if (vehicleToEdit) {
      setPlate(vehicleToEdit.plate);
      setBrand(vehicleToEdit.brand);
      setModel(vehicleToEdit.model);
      setYear(vehicleToEdit.year);
      setColor(vehicleToEdit.color || '');
      setMileage(vehicleToEdit.mileage);
      setCategory(vehicleToEdit.category);
      setOwnership(vehicleToEdit.ownership);
      setClientId(vehicleToEdit.client_id || '');
    } else {
      setPlate('');
      setBrand('');
      setModel('');
      setYear(2020);
      setColor('');
      setMileage(50000);
      setCategory('Mediano');
      setOwnership(defaultClientId ? 'client' : 'client');
      setClientId(defaultClientId || '');
    }
  }, [vehicleToEdit, defaultClientId, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim() || !brand.trim() || !model.trim()) {
      showToast('Matrícula, marca y modelo son obligatorios', 'warning');
      return;
    }

    const normPlate = normalizePlate(plate);

    if (vehicleToEdit) {
      updateVehicle(vehicleToEdit.id, {
        plate: normPlate,
        brand: brand.trim(),
        model: model.trim(),
        year: year ? Number(year) : undefined,
        color: color.trim() || undefined,
        mileage: mileage ? Number(mileage) : 0,
        category,
        ownership,
        client_id: ownership === 'dealership' ? undefined : clientId || undefined
      });
      showToast('Vehículo actualizado correctamente', 'success');
    } else {
      const res = addVehicle({
        plate: normPlate,
        brand: brand.trim(),
        model: model.trim(),
        year: year ? Number(year) : undefined,
        color: color.trim() || undefined,
        mileage: mileage ? Number(mileage) : 0,
        category,
        ownership,
        client_id: ownership === 'dealership' ? undefined : clientId || undefined,
        photos: []
      });

      if (res.error) {
        showToast(res.error, 'error');
        return;
      }
      showToast(`Vehículo ${normPlate} registrado exitosamente`, 'success');
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehicleToEdit ? 'Editar Ficha Vehicular' : 'Registrar Nuevo Vehículo'}
      subtitle="Ficha única identificada por matrícula uruguaya"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        
        {/* Matrícula */}
        <div>
          <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Matrícula (Patente) *</label>
          <input
            type="text"
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            placeholder="Ej: SBX 1234"
            required
            className="w-full bg-black border border-[#2A2A2A] rounded-xl p-3 text-base font-black text-white uppercase tracking-widest font-mono focus:outline-none focus:border-[#D7141A] focus:ring-1 focus:ring-[#D7141A]"
          />
          <p className="text-[10px] text-[#8A8A8A] mt-1">Se normaliza automáticamente en mayúsculas.</p>
        </div>

        {/* Marca y Modelo */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Marca *</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Ej: Volkswagen, BMW, Toyota..."
              required
              className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white font-semibold placeholder-[#8A8A8A] focus:outline-none focus:border-[#D7141A]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Modelo *</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Ej: Golf GTI, Hilux, Serie 3..."
              required
              className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white font-semibold placeholder-[#8A8A8A] focus:outline-none focus:border-[#D7141A]"
            />
          </div>
        </div>

        {/* Año, Color, Kilómetros */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Año</label>
            <input
              type="number"
              value={year || ''}
              onChange={(e) => setYear(Number(e.target.value))}
              placeholder="2020"
              min="1980"
              max="2027"
              className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white font-semibold focus:outline-none focus:border-[#D7141A]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Color</label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Ej: Blanco"
              className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white font-semibold placeholder-[#8A8A8A] focus:outline-none focus:border-[#D7141A]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Kilómetros</label>
            <input
              type="number"
              value={mileage || ''}
              onChange={(e) => setMileage(Number(e.target.value))}
              placeholder="Ej: 54000"
              className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white font-semibold focus:outline-none focus:border-[#D7141A]"
            />
          </div>
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Categoría de Vehículo *</label>
          <div className="grid grid-cols-5 gap-1.5 text-center">
            {(['Chico', 'Mediano', 'SUV/Rural', 'Pick-up', 'Moto'] as VehicleCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  category === cat
                    ? 'bg-[#D7141A] text-white border-[#D7141A]'
                    : 'bg-black border-[#2A2A2A] text-[#8A8A8A] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Titularidad */}
        <div className="pt-2 border-t border-[#2A2A2A] space-y-3">
          <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider">Titularidad / Dueño</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOwnership('client')}
              className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                ownership === 'client'
                  ? 'bg-transparent text-white border-white'
                  : 'bg-black border-[#2A2A2A] text-[#8A8A8A] hover:text-white'
              }`}
            >
              👤 Cliente Particular
            </button>
            <button
              type="button"
              onClick={() => setOwnership('dealership')}
              className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                ownership === 'dealership'
                  ? 'bg-[#D7141A]/15 border-[#D7141A] text-[#D7141A]'
                  : 'bg-black border-[#2A2A2A] text-[#8A8A8A] hover:text-white'
              }`}
            >
              🚗 Propio de la Automotora
            </button>
          </div>

          {ownership === 'client' && (
            <div>
              <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Seleccionar Cliente Dueño</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D7141A] cursor-pointer"
              >
                <option value="">Particular sin registrar</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2A2A2A]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/10 text-white font-semibold border border-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#D7141A] hover:bg-[#B51015] text-white font-bold shadow-sm transition-colors cursor-pointer"
          >
            {vehicleToEdit ? 'Guardar Cambios' : 'Registrar Vehículo'}
          </button>
        </div>

      </form>
    </Modal>
  );
};
