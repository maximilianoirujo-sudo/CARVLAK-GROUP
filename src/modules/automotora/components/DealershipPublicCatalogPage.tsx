import React, { useState, useMemo } from 'react';
import {
  Car,
  Search,
  Filter,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  X,
  CreditCard,
  Sparkles,
  ArrowLeft,
  Star,
  CheckCircle2
} from 'lucide-react';
import { DealershipVehicle } from '../../../types';
import { useData } from '../../../context/DataContext';

interface DealershipPublicCatalogPageProps {
  onBackToApp?: () => void;
}

export const DealershipPublicCatalogPage: React.FC<DealershipPublicCatalogPageProps> = ({
  onBackToApp
}) => {
  const { dealershipVehicles } = useData();

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBodyType, setSelectedBodyType] = useState<string>('todos');
  const [selectedTransmission, setSelectedTransmission] = useState<string>('todos');
  const [maxPrice, setMaxPrice] = useState<number>(50000);

  // Modal de Detalle de Auto Público
  const [selectedCar, setSelectedCar] = useState<DealershipVehicle | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);

  // Solo autos PUBLICADOS (seguridad estricta: nunca expone costos ni datos internos)
  const publishedVehicles = useMemo(() => {
    return dealershipVehicles.filter((v) => v.status === 'publicado' && !v.is_archived);
  }, [dealershipVehicles]);

  const filteredVehicles = useMemo(() => {
    return publishedVehicles.filter((car) => {
      const matchSearch =
        car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (car.version && car.version.toLowerCase().includes(searchTerm.toLowerCase())) ||
        car.year.toString().includes(searchTerm);

      const matchBody =
        selectedBodyType === 'todos' ? true : car.body_type?.toLowerCase() === selectedBodyType.toLowerCase();

      const matchTransmission =
        selectedTransmission === 'todos'
          ? true
          : car.transmission?.toLowerCase() === selectedTransmission.toLowerCase();

      const matchPrice = car.sale_price <= maxPrice;

      return matchSearch && matchBody && matchTransmission && matchPrice;
    });
  }, [publishedVehicles, searchTerm, selectedBodyType, selectedTransmission, maxPrice]);

  // Abrir WhatsApp con consulta específica
  const handleWhatsAppInquiry = (car: DealershipVehicle) => {
    const phone = '59899267964';
    const text = encodeURIComponent(
      `¡Hola CARVLAK! 👋 Me interesa consultar por el vehículo que vi en su catálogo web:\n\n` +
      `🚗 *${car.brand} ${car.model} ${car.version || ''} (${car.year})*\n` +
      `💰 Precio: USD ${car.sale_price.toLocaleString()}\n` +
      `⏱️ Kilometraje: ${car.mileage.toLocaleString()} km\n\n` +
      `¿Sigue disponible? Me gustaría recibir más fotos y coordinar una visita.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col">
      {/* Barra Superior / Header del Catálogo */}
      <header className="sticky top-0 z-40 bg-[#0B0E14]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                title="Volver al Hub de Gestión"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-3">
              <img
                src="/logo-carvlak-white.png"
                alt="CARVLAK Automotores"
                className="h-7 sm:h-8 w-auto object-contain"
              />
              <div className="hidden sm:block border-l border-[#222222] pl-3">
                <span className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Automotores</span>
                  <span className="text-[10px] font-title font-bold px-1.5 py-0.2 rounded bg-[#222222] text-[#D9D9D9] border border-[#333333]">
                    Catálogo
                  </span>
                </span>
                <p className="text-[10px] text-[#6B6B6B] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#D7141A]" />
                  <span>Shangrilá, Canelones • Uruguay</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://wa.me/59899267964?text=Hola%20CARVLAK%20Automotora,%20quiero%20hacer%20una%20consulta"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-md bg-[#D7141A] hover:bg-[#B50F14] text-white font-title font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors min-h-[42px] shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp directo</span>
              <span className="sm:hidden">WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative px-4 py-8 sm:py-10 bg-[#000000] border-b border-[#222222]">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#111111] border border-[#222222] text-[#D9D9D9] text-xs font-title font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#D7141A]" />
            <span>Vehículos seleccionados &amp; garantizados</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-title font-bold text-white tracking-tight">
            Encontrá tu próximo auto en CARVLAK
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Unidades inspeccionadas técnicamente, alistamiento profesional en DetailVlak, títulos garantizados y financiación bancaria en hasta 60 cuotas.
          </p>

          {/* Buscador Rápido */}
          <div className="pt-4 max-w-xl mx-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscá por marca o modelo (ej: Golf, Onix, Hilux, Tracker)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filtros de Navegación */}
      <div className="max-w-7xl w-full mx-auto px-4 py-4 space-y-3">
        {/* Tipos de Carrocería */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'todos', label: 'Todos los vehículos' },
            { id: 'Hatchback', label: 'Hatchback' },
            { id: 'Sedán', label: 'Sedán' },
            { id: 'SUV', label: 'SUV / Rural' },
            { id: 'Pick-up', label: 'Pick-up' },
            { id: 'Coupé', label: 'Coupé' }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedBodyType(type.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedBodyType === type.id
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Barra Secundaria de Filtros */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          <div className="text-slate-400">
            Mostrando <strong className="text-white">{filteredVehicles.length}</strong> autos disponibles
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Transmisión:</span>
              <select
                value={selectedTransmission}
                onChange={(e) => setSelectedTransmission(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="todos">Todas</option>
                <option value="Manual">Manual</option>
                <option value="Automática">Automática</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Hasta USD:</span>
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value={50000}>Cualquier precio</option>
                <option value={10000}>Hasta USD 10.000</option>
                <option value={15000}>Hasta USD 15.000</option>
                <option value={20000}>Hasta USD 20.000</option>
                <option value={30000}>Hasta USD 30.000</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Autos Disponibles */}
      <main className="max-w-7xl w-full mx-auto px-4 py-4 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVehicles.map((car) => {
            const cover = car.cover_image || (car.images && car.images[0]) || '';

            return (
              <div
                key={car.id}
                className="group rounded-3xl bg-[#0F1420] border border-slate-800/80 hover:border-amber-500/40 transition-all flex flex-col overflow-hidden shadow-xl"
              >
                {/* Imagen Principal */}
                <div
                  onClick={() => {
                    setSelectedCar(car);
                    setActivePhotoIdx(0);
                  }}
                  className="relative h-48 bg-slate-900 overflow-hidden cursor-pointer"
                >
                  {cover ? (
                    <img
                      src={cover}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                      <Car className="w-12 h-12" />
                    </div>
                  )}

                  {/* Badge Destacado */}
                  {car.is_featured && (
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase flex items-center gap-1 shadow-md">
                      <Star className="w-3 h-3 fill-slate-950" />
                      <span>Destacado</span>
                    </div>
                  )}

                  {/* Año y Km */}
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-white text-xs font-bold">
                      {car.year}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-slate-300 text-xs font-medium">
                      {car.mileage.toLocaleString()} km
                    </span>
                  </div>
                </div>

                {/* Contenido Card */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div
                      onClick={() => {
                        setSelectedCar(car);
                        setActivePhotoIdx(0);
                      }}
                      className="cursor-pointer"
                    >
                      <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors">
                        {car.brand} {car.model} {car.version || ''}
                      </h3>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>{car.transmission}</span>
                        <span>•</span>
                        <span>{car.fuel}</span>
                        <span>•</span>
                        <span>{car.color_exterior || 'Color original'}</span>
                      </div>
                    </div>

                    {/* Precio y Financiación */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Precio Contado
                        </div>
                        <div className="text-xl font-black text-emerald-400">
                          USD {car.sale_price.toLocaleString()}
                        </div>
                      </div>

                      {car.financing_available && car.monthly_installment_estimate_usd ? (
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-cyan-400 uppercase">
                            Financiación
                          </div>
                          <div className="text-xs font-bold text-slate-300">
                            Desde USD {car.monthly_installment_estimate_usd}/mes
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => {
                        setSelectedCar(car);
                        setActivePhotoIdx(0);
                      }}
                      className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-800 text-center transition-colors"
                    >
                      Ver Ficha
                    </button>

                    <button
                      onClick={() => handleWhatsAppInquiry(car)}
                      className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Consultar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredVehicles.length === 0 && (
          <div className="p-16 text-center rounded-3xl bg-[#0F1420] border border-slate-800 space-y-3">
            <Car className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-black text-white">No encontramos vehículos con esos filtros</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Probá restableciendo los filtros o escribinos por WhatsApp para solicitar que busquemos la unidad que necesitás.
            </p>
          </div>
        )}
      </main>

      {/* Modal Detalle Público del Auto */}
      {selectedCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-[#0D121C] border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div>
                <h2 className="text-lg font-black text-white">
                  {selectedCar.brand} {selectedCar.model} {selectedCar.version || ''} ({selectedCar.year})
                </h2>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>{selectedCar.mileage.toLocaleString()} km</span>
                  <span>•</span>
                  <span>{selectedCar.transmission}</span>
                  <span>•</span>
                  <span>{selectedCar.fuel}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCar(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido Modal */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Galería de Fotos */}
              {selectedCar.images && selectedCar.images.length > 0 && (
                <div className="space-y-2">
                  <div className="relative rounded-3xl overflow-hidden bg-slate-900 aspect-video border border-slate-800">
                    <img
                      src={selectedCar.images[activePhotoIdx] || selectedCar.cover_image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {selectedCar.images.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {selectedCar.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActivePhotoIdx(idx)}
                          className={`w-16 h-12 rounded-xl overflow-hidden shrink-0 border transition-all ${
                            activePhotoIdx === idx
                              ? 'border-amber-400 ring-2 ring-amber-400/40'
                              : 'border-slate-800 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Precio & Garantías */}
              <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Precio Contado Efectivo
                  </div>
                  <div className="text-2xl font-black text-emerald-400">
                    USD {selectedCar.sale_price.toLocaleString()}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Títulos en Regla</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Alistado DetailVlak</span>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              {selectedCar.catalog_description && (
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Descripción del Vehículo
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-2xl border border-slate-800/60">
                    {selectedCar.catalog_description}
                  </p>
                </div>
              )}

              {/* Ficha Técnica Rápida */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  Especificaciones Técnicas
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Año</div>
                    <div className="font-bold text-white mt-0.5">{selectedCar.year}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Kilómetros</div>
                    <div className="font-bold text-white mt-0.5">
                      {selectedCar.mileage.toLocaleString()} km
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Transmisión</div>
                    <div className="font-bold text-white mt-0.5">{selectedCar.transmission}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Combustible</div>
                    <div className="font-bold text-white mt-0.5">{selectedCar.fuel}</div>
                  </div>
                </div>
              </div>

              {/* Equipamiento */}
              {selectedCar.features && selectedCar.features.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Equipamiento Incluido
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCar.features.map((feat, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300"
                      >
                        ✓ {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedCar(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cerrar
              </button>

              <button
                onClick={() => handleWhatsAppInquiry(selectedCar)}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Consultar por WhatsApp (+598 99 267 964)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Público */}
      <footer className="mt-auto border-t border-slate-800 bg-[#0B0E14] px-4 py-6 text-center text-xs text-slate-500 space-y-1">
        <p className="font-bold text-slate-400">CARVLAK Group • Automotora &amp; Centro Automotriz</p>
        <p>Shangrilá, Canelones • WhatsApp: 099 267 964 • Abierto de Lunes a Sábados</p>
      </footer>
    </div>
  );
};
