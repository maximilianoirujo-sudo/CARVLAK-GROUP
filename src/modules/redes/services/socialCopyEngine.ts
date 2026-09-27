import { DealershipVehicle, DetailingQuote, VehicleInspection, SocialMediaTemplateId, SocialMediaConfig } from '../../../types';
import { formatCurrency } from '../../../lib/formatters';

interface GenerateCopyParams {
  templateId: SocialMediaTemplateId;
  car?: DealershipVehicle | null;
  quote?: DetailingQuote | null;
  inspection?: VehicleInspection | null;
  customHeadline?: string;
  customSubtitle?: string;
  customPrice?: string;
  config: SocialMediaConfig;
}

export function generateSocialCopy(params: GenerateCopyParams): string {
  const {
    templateId,
    car,
    quote,
    inspection,
    customHeadline,
    customSubtitle,
    customPrice,
    config
  } = params;

  const phone = config.whatsapp_number || '099 123 456';
  const handle = config.instagram_handle || '@car.vlak';
  const location = config.location_name || 'Shangrilá, Ciudad de la Costa';

  const ctaCar = `📲 Escribinos por WhatsApp al ${phone} o dejanos tu consulta por mensaje directo para coordinar visita o prueba de manejo.\n📍 ${location} | CARVLAK Automotores\n🔗 Enlace directo en bio: ${handle}`;
  const ctaDetailing = `📲 Agendá tu turno por WhatsApp al ${phone} o escribinos por MD.\n✨ Tu auto en las mejores manos con productos de primer nivel.\n📍 ${location} | DetailVlak Studio`;
  const ctaInspeccion = `📲 ¿Vas a comprar un auto usado? No te arriesgues. Agendá tu peritaje al ${phone} o link en bio.\n🛡️ Comprá con total tranquilidad y respaldo técnico profesional.\n📍 Cobertura en Montevideo, Canelones y Maldonado`;

  // 1. PLANTILLAS AUTOMOTORA
  if (car) {
    const title = `${car.brand} ${car.model} ${car.version || ''}`.trim();
    const yearStr = car.year ? `Año ${car.year}` : '';
    const kmStr = car.mileage ? `${car.mileage.toLocaleString('es-UY')} km` : (car.condition === '0km' ? '0 km (Nuevo a estrenar)' : '');
    const priceStr = customPrice || (car.sale_price ? formatCurrency(car.sale_price, car.sale_currency || 'USD') : 'Consultar precio');
    const motorStr = car.engine ? `Motor: ${car.engine}` : '';
    const transStr = car.transmission ? `Transmisión: ${car.transmission}` : '';
    const fuelStr = car.fuel ? `Combustible: ${car.fuel}` : '';

    const specs = [yearStr, kmStr, motorStr, transStr, fuelStr].filter(Boolean).join(' • ');

    switch (templateId) {
      case 'auto-vendido':
        return `🎉 ¡OTRA UNIDAD ENTREGADA CON ÉXITO! 🔑\n\n` +
          `Felicitaciones a su nuevo dueño por este impecable ${title} (${car.year}).\n` +
          `¡Gracias por confiar en CARVLAK Automotores para dar el salto a tu nuevo vehículo!\n\n` +
          `¿Buscás un auto similar o querés renovar el tuyo? Tomamos tu usado y financiamos a tu medida.\n\n` +
          `${ctaCar}\n\n` +
          `#Carvlak #AutoVendido #AutosUy #AutomotoraUruguay #VentaDeAutos #Uruguay #Montevideo #Canelones`;

      case 'auto-descuento':
        return `🔥 ¡OPORTUNIDAD ÚNICA CON PRECIO REBAJADO! 🔥\n\n` +
          `${customHeadline || `¡Precio Especial en ${title}!`}\n` +
          `${specs}\n\n` +
          `💰 PRECIO PROMOCIONAL: ${priceStr}\n` +
          `Aceptamos permutas como parte de pago y financiación bancaria hasta en 60 cuotas.\n\n` +
          `Unidad revisada mecánicamente y lista para transferir de inmediato.\n\n` +
          `${ctaCar}\n\n` +
          `#Oportunidad #AutoRebajado #DescuentoAutos #Carvlak #AutosUy #VentaDeAutos #Uruguay`;

      case 'auto-nuevo-ingreso':
        return `🚨 ¡NUEVO INGRESO AL SALÓN! 🚗✨\n\n` +
          `${title} ${specs ? `\n📋 ${specs}` : ''}\n\n` +
          `💎 Estado inmaculado, documentación al día y service recién realizado.\n` +
          `💵 Precio: ${priceStr}\n\n` +
          `Vení a conocerlo y probalo sin compromiso en nuestro showroom.\n\n` +
          `${ctaCar}\n\n` +
          `#NuevoIngreso #Carvlak #AutosUy #AutosSeleccionados #VehiculosUruguay #Seminuevos`;

      case 'auto-reservado':
        return `🔒 ¡UNIDAD RESERVADA! ⏳\n\n` +
          `Este ${title} (${car.year}) ya tiene dueño esperando la entrega.\n\n` +
          `Si buscabas este modelo exacto o similar, contactanos: te conseguimos la unidad que soñás con nuestra garantía de peritaje.\n\n` +
          `${ctaCar}\n\n` +
          `#Reservado #Carvlak #AutosUruguay #AutosUy #Automotores`;

      case 'auto-ficha-carrusel':
        return `📸 FICHA TÉCNICA DETALLADA • Deslizá para ver cada detalle ➡️\n\n` +
          `🚗 ${title}\n` +
          `📅 ${yearStr}\n` +
          `🛣️ ${kmStr}\n` +
          `⚙️ ${transStr || 'Caja Manual / Automática'}\n` +
          `⛽ ${fuelStr || 'Nafta'}\n` +
          `💰 ${priceStr}\n\n` +
          `Equipamiento destacado:\n` +
          (car.features && car.features.length > 0
            ? car.features.slice(0, 4).map((f) => `✔️ ${f}`).join('\n') + '\n\n'
            : `✔️ Aire acondicionado / Climatizador\n✔️ Pantalla multimedia & Bluetooth\n✔️ Control de estabilidad y airbags\n✔️ Llantas de aleación\n\n`) +
          `${ctaCar}\n\n` +
          `#Carvlak #FichaTecnica #AutosEnVenta #AutosUy #Automotora #Uruguay`;

      case 'auto-catalogo-semana':
        return `⭐ DESTACADOS DE LA SEMANA EN CARVLAK AUTOMOTORES ⭐\n\n` +
          `Unidades seleccionadas, inspeccionadas en más de 120 puntos y listas para salir rodando.\n\n` +
          `Destacado: ${title} (${car.year}) - ${priceStr}\n\n` +
          `Contamos con financiación particular y bancaria, recibimos tu permuta y realizamos gestión notarial completa.\n\n` +
          `${ctaCar}\n\n` +
          `#CatalogoSemanal #Carvlak #AutosUy #FinanciacionAutos #Permutas #Uruguay`;

      case 'auto-rango-precio':
        return `🎯 ¿BUSCÁS UN AUTO POR MENOS DE ${priceStr}? 🚘\n\n` +
          `Tenemos las mejores opciones en este rango de presupuesto garantizadas por CARVLAK:\n` +
          `👉 ${title} (${car.year}) - ${kmStr}\n\n` +
          `Te asesoramos para que elijas la opción más confiable y económica de mantener.\n\n` +
          `${ctaCar}\n\n` +
          `#AutosAccesibles #Presupuesto #Carvlak #AutosUy #PrimerAuto #Uruguay`;

      case 'auto-electricos-0km':
        return `⚡ MOVILIDAD ELÉCTRICA & CERO KILÓMETRO EN CARVLAK 🌿🔌\n\n` +
          `${title} 0km\n` +
          `🔋 Autonomía: ${car.autonomy_km ? `${car.autonomy_km} km por carga` : 'Máxima eficiencia urbana'}\n` +
          `⚡ Cero emisiones, mínimo costo por kilómetro y exoneración impositiva.\n` +
          `💰 Precio: ${priceStr}\n\n` +
          `Da el salto al futuro hoy mismo con garantía oficial.\n\n` +
          `${ctaCar}\n\n` +
          `#AutosElectricos #MovilidadSostenible #Carvlak #ElectricosUy #0km #Uruguay`;

      case 'auto-entrega':
        return `🔑 ¡FELICITACIONES POR LA ENTREGA! 🥳🎉\n\n` +
          `Un momento inolvidable: nueva llave, nuevos caminos por recorrer.\n` +
          `Le deseamos los mejores kilómetros con este magnífico ${title}.\n\n` +
          `¡Gracias por ser parte de la familia CARVLAK Group!\n\n` +
          `${ctaCar}\n\n` +
          `#EntregaDeAuto #ClienteFeliz #Carvlak #FamiliaCarvlak #AutosUy #Uruguay`;

      default:
        break;
    }
  }

  // 2. PLANTILLAS DETAILING
  if (quote || templateId === 'detailing-antes-despues' || templateId === 'detailing-promo' || templateId === 'agenda-turnos-disponibles') {
    const serviceNames = quote?.selected_services?.map((s) => s.serviceName).join(', ') || 'Tratamiento Cerámico & Pulido Espejo';
    const vehName = quote?.vehicle_info || 'Vehículo de Alta Gama';

    switch (templateId) {
      case 'detailing-antes-despues':
        return `✨ TRANSFORMACIÓN TOTAL • ANTES & DESPUÉS ✨\n\n` +
          `El resultado de un trabajo minucioso de corrección de barniz y protección en este ${vehName}.\n\n` +
          `🔧 Tratamiento aplicado:\n` +
          `• Descontaminado férrico profundo\n` +
          `• Corrección de micro-rayas (swirls) al 95%\n` +
          `• Sellado cerámico de alta dureza y repelencia extrema al agua\n\n` +
          `Devolvele a tu auto el brillo y la protección que se merece.\n\n` +
          `${ctaDetailing}\n\n` +
          `#DetailingUy #AntesYDespues #DetailVlak #CarCare #EsteticaAutomotriz #SelladoCeramico #Uruguay`;

      case 'detailing-promo':
        return `💥 BENEFICIO ESPECIAL DETAILING • CUPOS LIMITADOS 💥\n\n` +
          `${customHeadline || '20% OFF en Sellado Cerámico y Limpieza Integral'}\n\n` +
          `Protegé tu pintura contra rayos UV, savia de árboles y agentes químicos con brillo hidrorepelente por hasta 3 años.\n\n` +
          `Valores preferenciales para clientes agendados esta semana.\n\n` +
          `${ctaDetailing}\n\n` +
          `#PromoDetailing #DetailVlak #EsteticaVehicular #CarDetail #Uruguay #Canelones #Montevideo`;

      case 'agenda-turnos-disponibles':
        return `📅 AGENDA ABIERTA • ÚLTIMOS TURNOS DE LA SEMANA 🗓️\n\n` +
          `Disponibilidad para:\n` +
          `✔️ Tratamientos cerámicos y acrílicos\n` +
          `✔️ Limpieza y nutrición de tapizados (cuero y tela)\n` +
          `✔️ Lavado de motor al detalle con vapor y dressing\n` +
          `✔️ Pulido de ópticas con polímero líquido\n\n` +
          `Reservá tu lugar antes de que se completen los cupos.\n\n` +
          `${ctaDetailing}\n\n` +
          `#TurnosDisponibles #AgendaDetailing #DetailVlak #CuidadoAutomotor #Carvlak`;

      default:
        break;
    }
  }

  // 3. PLANTILLA INSPECCIÓN
  if (templateId === 'inspeccion-precompra' || inspection) {
    const vehTitle = inspection ? (inspection.vehicle_info || inspection.vehicle_plate || 'Vehículo Inspeccionado') : 'Vehículo Usado';
    return `🛡️ PERITAJE PRECOMPRA • LA DECISIÓN INTELIGENTE 🔍🚗\n\n` +
      `¿Vas a invertir en un ${vehTitle}? No compres a ciegas.\n\n` +
      `En CARVLAK Inspecciones revisamos más de 120 puntos críticos in-situ:\n` +
      `🔎 Escaneo computarizado OBD-II (fallas ocultas y kilometraje real)\n` +
      `🔎 Medición de espesor de pintura electromagnética (choques anteriores y masilla)\n` +
      `🔎 Fugas de fluidos, tren delantero, suspensión, frenos y chasis estructural\n` +
      `🔎 Revisión de historial y antecedentes ante organismos oficiales\n\n` +
      `Te entregamos un informe técnico detallado con fotos y dictamen profesional para que compres seguro o negocies el mejor precio.\n\n` +
      `${ctaInspeccion}\n\n` +
      `#InspeccionPrecompra #PeritajeAutomotor #AutosSegurosUy #Carvlak #RevisionVehicular #Uruguay`;
  }

  // Fallback genérico
  return `🚗 CARVLAK Group • Excelencia en Automotores, Detailing e Inspección Vehicular.\n\n` +
    `📍 ${location}\n` +
    `📲 WhatsApp: ${phone}\n` +
    `🌐 Instagram: ${handle}\n\n` +
    `#Carvlak #CarvlakGroup #AutosUy #Uruguay`;
}
