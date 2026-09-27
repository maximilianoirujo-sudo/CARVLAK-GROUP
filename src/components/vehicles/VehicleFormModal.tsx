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
      title={vehicleToEdit ? 'Editar ficha vehicular' : 'Registrar nuevo vehículo'}
      subtitle="Ficha única identificada por matrícula uruguaya"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        
        {/* Matrícula */}
        <div>
          <label className="block text-xs font-medium text-[#161616] mb-1">Matrícula (patente) *</label>
          <input
            type="text"
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            placeholder="Ej: SBX 1234"
            required
            className="w-full bg-white border border-[#E5E5E3] rounded-xl p-3 text-base font-black text-[#161616] uppercase tracking-widest font-mono focus:outline-none focus:border-[#D7141A] transition-colors"
          />
          <p className="text-[11px] text-[#6B6B6B] mt-1">Se normaliza automáticamente en mayúsculas.</p>
        </div>

        {/* Marca y Modelo */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#161616] mb-1">Marca *</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Ej: Volkswagen, BMW, Toyota..."
              required
              className="w-full bg-white border border-[#E5E5E3] rounded-xl p-2.5 text-xs text-[#161616] font-medium placeholder-[#9A9A9A] focus:outline-none focus:border-[#D7141A] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#161616] mb-1">Modelo *</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Ej: Golf GTI, Hilux, Serie 3..."
              required
              className="w-full bg-white border border-[#E5E5E3] rounded-xl p-2.5 text-xs text-[#161616] font-medium placeholder-[#9A9A9A] focus:outline-none focus:border-[#D7141A] transition-colors"
            />
          </div>
        </div>

        {/* Año, Color, Kilómetros */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-[#161616] mb-1">Año</label>
            <input
              type="number"
              value={year || ''}
              onChange={(e) => setYear(Number(e.target.value))}
              placeholder="2020"
              min="1980"
              max="2027"
              className="w-full bg-white border border-[#E5E5E3] rounded-xl p-2.5 text-xs text-[#161616] font-medium focus:outline-none focus:border-[#D7141A] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#161616] mb-1">Color</label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Ej: Blanco"
              className="w-full bg-white border border-[#E5E5E3] rounded-xl p-2.5 text-xs text-[#161616] font-medium placeholder-[#9A9A9A] focus:outline-none focus:border-[#D7141A] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#161616] mb-1">Kilómetros</label>
            <input
              type="number"
              value={mileage || ''}
              onChange={(e) => setMileage(Number(e.target.value))}
              placeholder="Ej: 54000"
              className="w-full bg-white border border-[#E5E5E3] rounded-xl p-2.5 text-xs text-[#161616] font-medium focus:outline-none focus:border-[#D7141A] transition-colors"
            />
          </div>
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-xs font-medium text-[#161616] mb-1">Categoría de vehículo *</label>
          <div className="grid grid-cols-5 gap-1.5 text-center">
            {(['Chico', 'Mediano', 'SUV/Rural', 'Pick-up', 'Moto'] as VehicleCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`py-2 px-1 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  category === cat
                    ? 'bg-[#161616] text-white border-[#161616] font-semibold shadow-xs'
                    : 'bg-white border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Titularidad */}
        <div className="pt-2 border-t border-[#E5E5E3] space-y-3">
          <label className="block text-xs font-medium text-[#161616]">Titularidad o dueño</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOwnership('client')}
              className={`py-2 px-3 rounded-xl font-medium text-xs border transition-all cursor-pointer ${
                ownership === 'client'
                  ? 'bg-[#161616] text-white border-[#161616] font-semibold shadow-xs'
                  : 'bg-white border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4]'
              }`}
            >
              Cliente particular
            </button>
            <button
              type="button"
              onClick={() => setOwnership('dealership')}
              className={`py-2 px-3 rounded-xl font-medium text-xs border transition-all cursor-pointer ${
                ownership === 'dealership'
                  ? 'bg-[#161616] text-white border-[#161616] font-semibold shadow-xs'
                  : 'bg-white border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4]'
              }`}
            >
              Propio de automotora
            </button>
          </div>

          {ownership === 'client' && (
            <div>
              <label className="block text-xs font-medium text-[#161616] mb-1">Seleccionar cliente dueño</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-white border border-[#E5E5E3] rounded-xl p-2.5 text-xs text-[#161616] focus:outline-none focus:border-[#D7141A] cursor-pointer"
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
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E5E3]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F5F5F4] text-[#161616] font-medium border border-[#E5E5E3] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#D7141A] hover:bg-[#B80E14] text-white font-semibold shadow-sm transition-colors cursor-pointer"
          >
            {vehicleToEdit ? 'Guardar cambios' : 'Registrar vehículo'}
          </button>
        </div>

      </form>
    </Modal>
  );
};
