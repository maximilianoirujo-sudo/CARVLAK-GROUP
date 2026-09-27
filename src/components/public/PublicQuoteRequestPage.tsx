import React, { useState } from 'react';
import {
  Sparkles,
  Car,
  User,
  Phone,
  CheckCircle2,
  Send,
  MessageCircle,
  MapPin,
  Clock,
  ShieldCheck,
  Camera,
  ArrowLeft
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { VehicleCategory } from '../../types';
import { normalizePlate, sanitizePhoneForWhatsApp } from '../../lib/formatters';

interface PublicQuoteRequestPageProps {
  onBackToApp?: () => void;
}

export const PublicQuoteRequestPage: React.FC<PublicQuoteRequestPageProps> = ({
  onBackToApp
}) => {
  const { detailingTariffs, addClient, addVehicle, addDetailingQuote } = useData();

  // Campos de formulario
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>('Mediano');
  const [selectedServices, setSelectedServices] = useState<string[]>(['ceramico', 'interior']);
  const [comments, setComments] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Anti-Spam
  const [honeypot, setHoneypot] = useState(''); // Si tiene texto, es un bot
  const [formStartTime] = useState<number>(Date.now()); // Para detectar envíos automáticos instantáneos
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleService = (id: string) => {
    if (selectedServices.includes(id)) {
      setSelectedServices(selectedServices.filter((s) => s !== id));
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Verificación Anti-Spam (Honeypot)
    if (honeypot.trim().length > 0) {
      console.warn('Bot detected via honeypot');
      setIsSubmitted(true); // Engañar al bot simulando éxito
      return;
    }

    // 2. Verificación Anti-Spam (Tiempo mínimo de llenado > 3.5 segundos)
    const elapsedSeconds = (Date.now() - formStartTime) / 1000;
    if (elapsedSeconds < 3.5) {
      console.warn('Bot detected via submission speed');
      return;
    }

    if (!name.trim() || !phone.trim() || !vehicleBrand.trim() || !vehicleModel.trim()) {
      alert('Por favor completá tu nombre, celular y los datos de tu vehículo.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Registrar o recuperar Cliente
      const clientRes = addClient({
        full_name: name.trim(),
        phone: phone.trim(),
        origin: 'Google Form',
        notes: 'Solicitud enviada desde formulario web público'
      });
      const client = clientRes.client;

      // 2. Registrar Vehículo
      const cleanPlate = vehiclePlate.trim() ? normalizePlate(vehiclePlate.trim()) : `UY-${Math.floor(1000 + Math.random() * 9000)}`;
      const vehicleRes = addVehicle({
        brand: vehicleBrand.trim(),
        model: `${vehicleModel.trim()} ${vehicleYear.trim()}`.trim(),
        plate: cleanPlate,
        category: vehicleCategory,
        ownership: 'client',
        client_id: client.id,
        photos: photoUrl.trim() ? [photoUrl.trim()] : []
      });
      const vehicle = vehicleRes.vehicle;

      // 3. Obtener los servicios seleccionados con precios estimados
      const catKey = vehicleCategory === 'Mediano' ? 'mediano' :
                     vehicleCategory === 'SUV/Rural' ? 'suv' :
                     vehicleCategory === 'Pick-up' ? 'pickup' :
                     vehicleCategory === 'Moto' ? 'moto' : 'chico';

      const serviceItems = selectedServices.map((sid) => {
        const tariff = detailingTariffs.find((t) => t.id === sid);
        return {
          serviceId: sid,
          serviceName: tariff?.shortName || tariff?.name || sid,
          price: tariff ? tariff.prices[catKey] || 0 : 0
        };
      });

      const total = serviceItems.reduce((acc, curr) => acc + curr.price, 0);

      // 4. Crear Cotización "Por Cotizar"
      addDetailingQuote({
        client_id: client.id,
        client_name: client.full_name,
        client_phone: client.phone,
        vehicle_id: vehicle.id,
        vehicle_info: `${vehicle.brand} ${vehicle.model}`,
        vehicle_plate: vehicle.plate,
        vehicle_category: vehicleCategory,
        selected_services: serviceItems,
        subtotal: total,
        discount_type: 'none',
        discount_amount: 0,
        extreme_dirt_surcharge: 0,
        total_amount: total,
        estimated_time: 'A coordinar',
        origin: 'Form Web',
        notes: comments.trim() || undefined,
        status: 'Por Cotizar',
        photos_before: photoUrl.trim() ? [photoUrl.trim()] : []
      });

      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al enviar tu solicitud. Podés escribirnos directamente por WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDirectWhatsApp = () => {
    const text = encodeURIComponent(
      `¡Hola DetailVlak! Acabo de enviar una solicitud de presupuesto para mi ${vehicleBrand} ${vehicleModel}. Mi nombre es ${name}. ¿Pudieron verla?`
    );
    window.open(`https://api.whatsapp.com/send?phone=59899267964&text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F2F2F2] dark:bg-[#000000] text-black dark:text-white flex flex-col justify-between antialiased selection:bg-[#D7141A]/20 selection:text-[#D7141A]">
      
      {/* Barra Superior con Logo Oficial CARVLAK */}
      <header className="border-b border-[#222222] bg-[#000000] sticky top-0 z-40 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo-carvlak-white.png"
              alt="CARVLAK Group"
              className="h-7 w-auto object-contain"
            />
            <div className="border-l border-[#222222] pl-3">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <span>DetailVlak</span>
                <span className="text-[10px] font-title font-bold px-1.5 py-0.5 rounded bg-[#222222] text-[#D9D9D9] border border-[#333333]">
                  Taller
                </span>
              </div>
              <div className="text-[10px] text-[#6B6B6B]">Estética automotriz • Shangrilá</div>
            </div>
          </div>

          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Hub</span>
            </button>
          )}
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 my-4">
        
        {isSubmitted ? (
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-[#121826] to-[#0A0D15] border border-purple-500/30 text-center space-y-6 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-3xl shadow-lg shadow-emerald-500/10">
              ✨
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">¡Solicitud recibida con éxito!</h2>
              <p className="text-xs text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                Muchas gracias <strong className="text-white">{name}</strong>. Evaluaremos el tratamiento ideal para tu <strong className="text-purple-300">{vehicleBrand} {vehicleModel}</strong> y nos contactaremos a la brevedad por WhatsApp con tu presupuesto detallado.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#070A0E] border border-slate-800 text-left space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-slate-300 font-bold">
                <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Av. Giannattasio y, Shangrilá, Canelones</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 font-bold">
                <Clock className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Lunes a Sábados con agenda previa</span>
              </div>
            </div>

            <button
              onClick={handleOpenDirectWhatsApp}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Avisarnos por WhatsApp ahora mismo</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            
            {/* Presentación */}
            <div className="text-center sm:text-left space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Solicitá tu Presupuesto de Detailing
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Completá los datos de tu auto y seleccioná los tratamientos que te interesan. Te enviaremos la cotización exacta sin costo.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Campo Trampa Anti-Spam (Honeypot) - Oculto a humanos */}
              <div className="hidden" aria-hidden="true">
                <input
                  type="text"
                  name="user_website_url_check"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {/* 1. Datos Personales */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#121826] border border-slate-800 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>1. Tus Datos de Contacto</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Tu Nombre y Apellido *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      className="w-full bg-[#070A0E] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">WhatsApp / Celular *</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej: 099 123 456"
                      className="w-full bg-[#070A0E] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 2. Datos del Vehículo */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#121826] border border-slate-800 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5" />
                  <span>2. Tu Vehículo</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Marca *</label>
                    <input
                      type="text"
                      value={vehicleBrand}
                      onChange={(e) => setVehicleBrand(e.target.value)}
                      placeholder="Ej: Volkswagen"
                      className="w-full bg-[#070A0E] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Modelo *</label>
                    <input
                      type="text"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="Ej: Golf GTI"
                      className="w-full bg-[#070A0E] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Año</label>
                    <input
                      type="text"
                      value={vehicleYear}
                      onChange={(e) => setVehicleYear(e.target.value)}
                      placeholder="Ej: 2021"
                      className="w-full bg-[#070A0E] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Tamaño / Categoría Aproximada</label>
                    <select
                      value={vehicleCategory}
                      onChange={(e) => setVehicleCategory(e.target.value as VehicleCategory)}
                      className="w-full bg-[#070A0E] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                    >
                      <option value="Chico">Chico (Hatchback / Celerio, Gol, Onix)</option>
                      <option value="Mediano">Mediano (Sedán / Corolla, Cruze, Vento)</option>
                      <option value="SUV/Rural">SUV / Camioneta (Tracker, Duster, Compass)</option>
                      <option value="Pick-up">Pick-up Grande (Hilux, Ranger, Amarok)</option>
                      <option value="Moto">Moto</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Matrícula (opcional)</label>
                    <input
                      type="text"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      placeholder="Ej: SBX 1234"
                      className="w-full bg-[#070A0E] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Tratamientos de Interés */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#121826] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>3. Tratamientos que te interesan</span>
                  </h3>
                  <span className="text-[10px] text-slate-500">Marcá todos los que apliquen</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {detailingTariffs.map((t) => {
                    const isSelected = selectedServices.includes(t.id);

                    return (
                      <div
                        key={t.id}
                        onClick={() => toggleService(t.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-purple-950/40 border-purple-500 text-white'
                            : 'bg-[#070A0E] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-0.5 w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700 pointer-events-none"
                        />
                        <div>
                          <div className="font-bold text-xs">{t.shortName || t.name}</div>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{t.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Comentarios y Fotos */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#121826] border border-slate-800 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-400">
                  4. Detalles del Estado Actual
                </h3>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    ¿Tiene rayones, manchas difíciles o algo especial a tratar?
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Contanos brevemente qué te gustaría mejorar de la pintura o el interior..."
                    rows={3}
                    className="w-full bg-[#070A0E] border border-slate-700 rounded-xl p-3 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-purple-400" />
                    <span>Enlace a foto del vehículo (Google Drive, Imgur, etc. - opcional)</span>
                  </label>
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#070A0E] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Botón de Envío */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-purple-600/25 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Enviando solicitud...' : 'Solicitar Presupuesto Gratuito'}</span>
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Tus datos son privados y se usan exclusivamente para coordinar tu presupuesto.</span>
              </div>

            </form>
          </div>
        )}

      </main>

      {/* Pie de página */}
      <footer className="border-t border-slate-800/60 bg-[#0B0F19] py-4 px-4 text-center text-xs text-slate-500">
        <div><strong>DetailVlak</strong> • Shangrilá, Canelones • Miembro de <strong>CARVLAK Group</strong></div>
      </footer>

    </div>
  );
};
