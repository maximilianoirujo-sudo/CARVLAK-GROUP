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
import { Button } from '../ui/Button';

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
    <div className="min-h-screen bg-[#F5F5F4] text-[#161616] flex flex-col justify-between antialiased selection:bg-[#D7141A]/20 selection:text-[#D7141A]">
      
      {/* Barra Superior con Logo Oficial CARVLAK */}
      <header className="border-b border-[#E5E5E3] bg-white sticky top-0 z-40 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/carvlak-logo-negro.png"
              alt="CARVLAK"
              className="h-7 w-auto object-contain"
            />
            <div className="border-l border-[#E5E5E3] pl-3">
              <div className="text-xs font-semibold text-[#161616] flex items-center gap-1.5">
                <span>DetailVlak</span>
                <span className="text-[10px] font-title font-bold px-1.5 py-0.5 rounded bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]">
                  Taller
                </span>
              </div>
              <div className="text-[10px] text-[#6B6B6B]">Estética automotriz • Shangrilá</div>
            </div>
          </div>

          {onBackToApp && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onBackToApp}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al hub</span>
            </Button>
          )}
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 my-4">
        
        {isSubmitted ? (
          <div className="p-8 sm:p-10 rounded-2xl bg-white border border-[#E5E5E3] text-center space-y-6 shadow-sm animate-fade-in">
            <div className="w-16 h-16 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] text-[#D7141A] flex items-center justify-center mx-auto text-3xl shadow-sm">
              ✨
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#161616]">¡Solicitud recibida con éxito!</h2>
              <p className="text-xs text-[#6B6B6B] max-w-md mx-auto mt-2 leading-relaxed">
                Muchas gracias <strong className="text-[#161616]">{name}</strong>. Evaluaremos el tratamiento ideal para tu <strong className="text-[#161616]">{vehicleBrand} {vehicleModel}</strong> y nos contactaremos a la brevedad por WhatsApp con tu presupuesto detallado.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] text-left space-y-2 text-xs text-[#6B6B6B]">
              <div className="flex items-center gap-2 text-[#161616] font-bold">
                <MapPin className="w-4 h-4 text-[#D7141A] shrink-0" />
                <span>Av. Giannattasio y, Shangrilá, Canelones</span>
              </div>
              <div className="flex items-center gap-2 text-[#161616] font-bold">
                <Clock className="w-4 h-4 text-[#D7141A] shrink-0" />
                <span>Lunes a sábados con agenda previa</span>
              </div>
            </div>

            <Button
              variant="whatsapp"
              className="w-full py-3.5 text-sm"
              onClick={handleOpenDirectWhatsApp}
            >
              <MessageCircle className="w-5 h-5" />
              <span>Avisarnos por WhatsApp ahora mismo</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            
            {/* Presentación */}
            <div className="text-center sm:text-left space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-[#161616] tracking-tight">
                Solicitá tu presupuesto de detailing
              </h1>
              <p className="text-xs text-[#6B6B6B] leading-relaxed">
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
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-3 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#161616] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#D7141A]" />
                  <span>1. Tus datos de contacto</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#6B6B6B] block mb-1">Tu nombre y apellido *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2.5 text-xs text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#6B6B6B] block mb-1">WhatsApp / Celular *</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej: 099 123 456"
                      className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2.5 text-xs text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none focus:bg-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 2. Datos del Vehículo */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-3 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#161616] flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-[#D7141A]" />
                  <span>2. Tu vehículo</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#6B6B6B] block mb-1">Marca *</label>
                    <input
                      type="text"
                      value={vehicleBrand}
                      onChange={(e) => setVehicleBrand(e.target.value)}
                      placeholder="Ej: Volkswagen"
                      className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#6B6B6B] block mb-1">Modelo *</label>
                    <input
                      type="text"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="Ej: Golf GTI"
                      className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#6B6B6B] block mb-1">Año</label>
                    <input
                      type="text"
                      value={vehicleYear}
                      onChange={(e) => setVehicleYear(e.target.value)}
                      placeholder="Ej: 2021"
                      className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-[#6B6B6B] block mb-1">Tamaño / Categoría aproximada</label>
                    <select
                      value={vehicleCategory}
                      onChange={(e) => setVehicleCategory(e.target.value as VehicleCategory)}
                      className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] font-bold focus:border-[#D7141A] focus:outline-none"
                    >
                      <option value="Chico">Chico (Hatchback / Celerio, Gol, Onix)</option>
                      <option value="Mediano">Mediano (Sedán / Corolla, Cruze, Vento)</option>
                      <option value="SUV/Rural">SUV / Camioneta (Tracker, Duster, Compass)</option>
                      <option value="Pick-up">Pick-up Grande (Hilux, Ranger, Amarok)</option>
                      <option value="Moto">Moto</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#6B6B6B] block mb-1">Matrícula (opcional)</label>
                    <input
                      type="text"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      placeholder="Ej: SBX 1234"
                      className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] font-mono uppercase placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Tratamientos de Interés */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#161616] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#D7141A]" />
                    <span>3. Tratamientos que te interesan</span>
                  </h3>
                  <span className="text-[10px] text-[#6B6B6B]">Marcá todos los que apliquen</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {detailingTariffs.map((t) => {
                    const isSelected = selectedServices.includes(t.id);

                    return (
                      <div
                        key={t.id}
                        onClick={() => toggleService(t.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-[#EEF7F2] border-[#22C55E]/40 text-[#161616]'
                            : 'bg-[#F5F5F4] border-[#E5E5E3] text-[#6B6B6B] hover:border-[#D0D0CD]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-0.5 w-4 h-4 rounded text-[#D7141A] accent-[#D7141A] pointer-events-none"
                        />
                        <div>
                          <div className="font-bold text-xs text-[#161616]">{t.shortName || t.name}</div>
                          <p className="text-[10px] text-[#6B6B6B] line-clamp-1">{t.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Comentarios y Fotos */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-3 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#161616]">
                  4. Detalles del estado actual
                </h3>

                <div>
                  <label className="text-[11px] font-semibold text-[#6B6B6B] block mb-1">
                    ¿Tiene rayones, manchas difíciles o algo especial a tratar?
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Contanos brevemente qué te gustaría mejorar de la pintura o el interior..."
                    rows={3}
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-3 text-xs text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#6B6B6B] block mb-1 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#161616]" />
                    <span>Enlace a foto del vehículo (Google Drive, Imgur, etc. - opcional)</span>
                  </label>
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* Botón de Envío */}
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 text-sm"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Enviando solicitud...' : 'Solicitar presupuesto gratuito'}</span>
              </Button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-[#6B6B6B]">
                <ShieldCheck className="w-4 h-4 text-[#161616]" />
                <span>Tus datos son privados y se usan exclusivamente para coordinar tu presupuesto.</span>
              </div>

            </form>
          </div>
        )}

      </main>

      {/* Pie de página */}
      <footer className="border-t border-[#E5E5E3] bg-white py-4 px-4 text-center text-xs text-[#6B6B6B]">
        <div><strong>DetailVlak</strong> • Shangrilá, Canelones • Miembro de <strong>CARVLAK Group</strong></div>
      </footer>
    </div>
  );
};
