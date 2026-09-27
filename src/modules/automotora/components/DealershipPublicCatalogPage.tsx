import React, { useState, useMemo } from 'react';
import {
  Car,
  Search,
  MessageCircle,
  MapPin,
  ShieldCheck,
  X,
  ArrowLeft,
  Star,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { DealershipVehicle } from '../../../types';
import { useData } from '../../../context/DataContext';
import { Button } from '../../../components/ui/Button';

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
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      {/* Barra Superior / Header del Catálogo */}
      <header className="sticky top-0 z-40 bg-panel/95 backdrop-blur-xl border-b border-borde px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="p-2 rounded-lg bg-negro border border-borde text-gris-texto hover:text-white transition-colors"
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
              <div className="hidden sm:block border-l border-borde pl-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Automotores</span>
                  <span className="text-[10px] font-title font-bold px-1.5 py-0.2 rounded bg-negro text-gris-texto border border-borde">
                    Catálogo
                  </span>
                </span>
                <p className="text-[10px] text-gris-texto flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rojo" />
                  <span>Shangrilá, Canelones • Uruguay</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="whatsapp"
              onClick={() => window.open('https://wa.me/59899267964?text=Hola%20CARVLAK%20Automotora,%20quiero%20hacer%20una%20consulta', '_blank')}
            >
              <MessageCircle className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">WhatsApp directo</span>
              <span className="sm:hidden">WhatsApp</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative px-4 py-8 sm:py-10 bg-black border-b border-borde">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-panel border border-borde text-gris-texto text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-rojo" />
            <span>Vehículos seleccionados &amp; garantizados</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-title font-bold text-white tracking-tight">
            Encontrá tu próximo auto en CARVLAK
          </h2>

          <p className="text-xs sm:text-sm text-gris-texto max-w-xl mx-auto leading-relaxed">
            Unidades inspeccionadas técnicamente, alistamiento profesional en DetailVlak, títulos garantizados y financiación bancaria en hasta 60 cuotas.
          </p>

          {/* Buscador Rápido */}
          <div className="pt-4 max-w-xl mx-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-gris-texto absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscá por marca o modelo (ej: Golf, Onix, Hilux, Tracker)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-panel border border-borde rounded-xl text-xs sm:text-sm text-white placeholder-gris-texto focus:outline-none focus:border-rojo shadow-xl"
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                selectedBodyType === type.id
                  ? 'bg-white text-black'
                  : 'bg-panel border border-borde text-gris-texto hover:text-white'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Barra Secundaria de Filtros */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          <div className="text-gris-texto">
            Mostrando <strong className="text-white">{filteredVehicles.length}</strong> autos disponibles
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-gris-texto text-[11px]">Transmisión:</span>
              <select
                value={selectedTransmission}
                onChange={(e) => setSelectedTransmission(e.target.value)}
                className="bg-panel border border-borde rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-rojo"
              >
                <option value="todos">Todas</option>
                <option value="Manual">Manual</option>
                <option value="Automática">Automática</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-gris-texto text-[11px]">Hasta USD:</span>
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="bg-panel border border-borde rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-rojo"
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
                className="group rounded-xl bg-panel border border-borde hover:border-white/40 transition-all flex flex-col overflow-hidden shadow-xl"
              >
                {/* Imagen Principal */}
                <div
                  onClick={() => {
                    setSelectedCar(car);
                    setActivePhotoIdx(0);
                  }}
                  className="relative h-48 bg-negro overflow-hidden cursor-pointer"
                >
                  {cover ? (
                    <img
                      src={cover}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gris-texto gap-2">
                      <Car className="w-12 h-12" />
                    </div>
                  )}

                  {/* Badge Destacado */}
                  {car.is_featured && (
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded bg-white text-black font-bold text-[10px] uppercase flex items-center gap-1 shadow-md">
                      <Star className="w-3 h-3 fill-black" />
                      <span>Destacado</span>
                    </div>
                  )}

                  {/* Año y Km */}
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-negro/90 backdrop-blur-md text-white text-xs font-bold border border-borde">
                      {car.year}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-negro/90 backdrop-blur-md text-gris-texto text-xs font-medium border border-borde">
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
                      <h3 className="text-base font-bold text-white group-hover:text-rojo transition-colors">
                        {car.brand} {car.model} {car.version || ''}
                      </h3>
                      <div className="text-xs text-gris-texto mt-1 flex items-center gap-2">
                        <span>{car.transmission}</span>
                        <span>•</span>
                        <span>{car.fuel}</span>
                        <span>•</span>
                        <span>{car.color_exterior || 'Color original'}</span>
                      </div>
                    </div>

                    {/* Precio y Financiación */}
                    <div className="mt-4 pt-3 border-t border-borde flex items-baseline justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-gris-texto uppercase tracking-wider">
                          Precio Contado
                        </div>
                        <div className="text-xl font-bold font-mono text-white">
                          USD {car.sale_price.toLocaleString()}
                        </div>
                      </div>

                      {car.financing_available && car.monthly_installment_estimate_usd ? (
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-gris-texto uppercase">
                            Financiación
                          </div>
                          <div className="text-xs font-bold text-white">
                            Desde USD {car.monthly_installment_estimate_usd}/mes
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedCar(car);
                        setActivePhotoIdx(0);
                      }}
                    >
                      Ver Ficha
                    </Button>

                    <Button
                      variant="whatsapp"
                      size="sm"
                      onClick={() => handleWhatsAppInquiry(car)}
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-white" />
                      <span>Consultar</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredVehicles.length === 0 && (
          <div className="p-16 text-center rounded-xl bg-panel border border-borde space-y-3">
            <Car className="w-12 h-12 text-gris-texto mx-auto" />
            <h3 className="text-base font-bold text-white">No encontramos vehículos con esos filtros</h3>
            <p className="text-xs text-gris-texto max-w-sm mx-auto">
              Probá restableciendo los filtros o escribinos por WhatsApp para solicitar que busquemos la unidad que necesitás.
            </p>
          </div>
        )}
      </main>

      {/* Modal Detalle Público del Auto */}
      {selectedCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-panel border border-borde rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-borde flex items-center justify-between bg-negro">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {selectedCar.brand} {selectedCar.model} {selectedCar.version || ''} ({selectedCar.year})
                </h2>
                <div className="text-xs text-gris-texto flex items-center gap-2 mt-0.5">
                  <span>{selectedCar.mileage.toLocaleString()} km</span>
                  <span>•</span>
                  <span>{selectedCar.transmission}</span>
                  <span>•</span>
                  <span>{selectedCar.fuel}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCar(null)}
                className="p-2 rounded-lg text-gris-texto hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido Modal */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Galería de Fotos */}
              {selectedCar.images && selectedCar.images.length > 0 && (
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden bg-negro aspect-video border border-borde">
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
                          className={`w-16 h-12 rounded-lg overflow-hidden shrink-0 border transition-all ${
                            activePhotoIdx === idx
                              ? 'border-white ring-2 ring-white/40'
                              : 'border-borde opacity-60 hover:opacity-100'
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
              <div className="p-4 rounded-xl bg-negro border border-borde flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold text-gris-texto uppercase tracking-wider">
                    Precio Contado Efectivo
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">
                    USD {selectedCar.sale_price.toLocaleString()}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-panel border border-borde text-white text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-rojo" />
                    <span>Títulos en Regla</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-panel border border-borde text-white text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-rojo" />
                    <span>Alistado DetailVlak</span>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              {selectedCar.catalog_description && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Descripción del Vehículo
                  </h4>
                  <p className="text-xs text-gris-texto leading-relaxed bg-negro p-3 rounded-xl border border-borde">
                    {selectedCar.catalog_description}
                  </p>
                </div>
              )}

              {/* Ficha Técnica Rápida */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Especificaciones Técnicas
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-negro border border-borde">
                    <div className="text-[10px] text-gris-texto uppercase">Año</div>
                    <div className="font-bold text-white mt-0.5">{selectedCar.year}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-negro border border-borde">
                    <div className="text-[10px] text-gris-texto uppercase">Kilómetros</div>
                    <div className="font-bold text-white mt-0.5">
                      {selectedCar.mileage.toLocaleString()} km
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-negro border border-borde">
                    <div className="text-[10px] text-gris-texto uppercase">Transmisión</div>
                    <div className="font-bold text-white mt-0.5">{selectedCar.transmission}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-negro border border-borde">
                    <div className="text-[10px] text-gris-texto uppercase">Combustible</div>
                    <div className="font-bold text-white mt-0.5">{selectedCar.fuel}</div>
                  </div>
                </div>
              </div>

              {/* Equipamiento */}
              {selectedCar.features && selectedCar.features.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Equipamiento Incluido
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCar.features.map((feat, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-negro border border-borde text-xs text-gris-texto"
                      >
                        ✓ {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-borde bg-negro flex items-center justify-between gap-3">
              <Button
                variant="secondary"
                onClick={() => setSelectedCar(null)}
              >
                Cerrar
              </Button>

              <Button
                variant="whatsapp"
                onClick={() => handleWhatsAppInquiry(selectedCar)}
              >
                <MessageCircle className="w-4 h-4 text-white" />
                <span>Consultar por WhatsApp (+598 99 267 964)</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Público */}
      <footer className="mt-auto border-t border-borde bg-panel px-4 py-6 text-center text-xs text-gris-texto space-y-1">
        <p className="font-bold text-white">CARVLAK Group • Automotora &amp; Centro Automotriz</p>
        <p>Shangrilá, Canelones • WhatsApp: 099 267 964 • Abierto de Lunes a Sábados</p>
      </footer>
    </div>
  );
};
