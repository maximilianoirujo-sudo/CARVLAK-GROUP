import { SocialMediaFormat, SocialMediaTemplateId, LogoPosition } from '../../../types';

export interface RenderCanvasOptions {
  format: SocialMediaFormat;
  templateId: SocialMediaTemplateId;
  imageUrl?: string;
  secondaryImageUrl?: string; // Para antes y después
  headline?: string;
  subtitle?: string;
  price?: string;
  originalPrice?: string;
  specs?: string[]; // Ej: ['Año 2018', '74.000 km', '1.4 TSI', 'Automática']
  stampText?: string;
  coverPlate?: boolean;
  platePosition?: { x: number; y: number; scale?: number };
  imagePan?: { x: number; y: number; zoom: number };
  logoPosition?: LogoPosition;
  instagramHandle?: string;
  locationName?: string;
  badgeTag?: string;
  inspectionHighlights?: string[];
  detailingServices?: string[];
}

const loadedImageCache = new Map<string, HTMLImageElement>();

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (loadedImageCache.has(src)) {
      const cached = loadedImageCache.get(src)!;
      if (cached.complete) {
        resolve(cached);
        return;
      }
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      loadedImageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      // Fallback
      reject(new Error(`Failed to load image at ${src}`));
    };
    img.src = src;
  });
}

// Dibuja un rectángulo redondeado
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Renderiza la plantilla completa en un Canvas 2D
 */
export async function renderSocialCanvas(
  canvas: HTMLCanvasElement,
  options: RenderCanvasOptions
): Promise<void> {
  const {
    format,
    templateId,
    imageUrl,
    secondaryImageUrl,
    headline = '',
    subtitle = '',
    price = '',
    originalPrice = '',
    specs = [],
    stampText = '',
    coverPlate = false,
    platePosition = { x: 540, y: 1100, scale: 1 },
    imagePan = { x: 0, y: 0, zoom: 1 },
    logoPosition = 'top-left',
    instagramHandle = '@car.vlak',
    locationName = 'Shangrilá, Canelones',
    badgeTag = '',
    inspectionHighlights = [],
    detailingServices = []
  } = options;

  // 1. Dimensiones exactas
  const width = 1080;
  const height = format === 'story' ? 1920 : 1350;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 2. Fondo inicial oscuro premium
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, width, height);

  // 3. Renderizar imagen de fondo o split
  if (templateId === 'detailing-antes-despues' && imageUrl && secondaryImageUrl) {
    // Dibujo comparativo 50/50
    try {
      const [imgBefore, imgAfter] = await Promise.all([
        loadImage(imageUrl),
        loadImage(secondaryImageUrl)
      ]);

      const halfHeight = height / 2;

      // Mitad superior: Antes
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, width, halfHeight);
      ctx.clip();
      drawImageCover(ctx, imgBefore, 0, 0, width, halfHeight, imagePan);
      ctx.restore();

      // Mitad inferior: Después
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, halfHeight, width, halfHeight);
      ctx.clip();
      drawImageCover(ctx, imgAfter, 0, halfHeight, width, halfHeight, imagePan);
      ctx.restore();

      // Línea divisoria roja
      ctx.fillStyle = '#D7141A';
      ctx.fillRect(0, halfHeight - 3, width, 6);

      // Pill "ANTES"
      drawPill(ctx, 40, halfHeight - 65, 140, 42, '#000000', '#D7141A', 'ANTES');

      // Pill "DESPUÉS"
      drawPill(ctx, 40, halfHeight + 25, 160, 42, '#D7141A', '#FFFFFF', 'DESPUÉS');
    } catch {
      drawFallbackBackground(ctx, width, height);
    }
  } else if (imageUrl) {
    // Imagen principal estándar con pan & zoom
    try {
      const img = await loadImage(imageUrl);
      drawImageCover(ctx, img, 0, 0, width, height, imagePan);
    } catch {
      drawFallbackBackground(ctx, width, height);
    }
  } else {
    drawFallbackBackground(ctx, width, height);
  }

  // 4. Parche "Tapar Matrícula" si está habilitado
  if (coverPlate) {
    drawPlateCoverBadge(ctx, platePosition.x, platePosition.y, platePosition.scale || 1);
  }

  // 5. Degradado cinematográfico para legibilidad de textos
  drawVignetteGradient(ctx, width, height, format);

  // 6. Header con Logo y Marca
  await drawBrandHeader(ctx, width, height, logoPosition, instagramHandle, locationName);

  // 7. Contenido según la plantilla específica
  renderTemplateContent(ctx, {
    width,
    height,
    format,
    templateId,
    headline,
    subtitle,
    price,
    originalPrice,
    specs,
    stampText,
    badgeTag,
    inspectionHighlights,
    detailingServices
  });

  // 8. Footer unificado con @car.vlak y llamado a la acción
  drawFooterBar(ctx, width, height, instagramHandle, locationName);
}

/**
 * Dibuja una imagen cubriendo el área especificada con Pan y Zoom
 */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  pan = { x: 0, y: 0, zoom: 1 }
) {
  const zoom = Math.max(0.5, Math.min(3, pan.zoom || 1));
  const imgRatio = img.width / img.height;
  const targetRatio = w / h;

  let renderW: number;
  let renderH: number;

  if (imgRatio > targetRatio) {
    renderH = h * zoom;
    renderW = renderH * imgRatio;
  } else {
    renderW = w * zoom;
    renderH = renderW / imgRatio;
  }

  const posX = x + (w - renderW) / 2 + (pan.x || 0);
  const posY = y + (h - renderH) / 2 + (pan.y || 0);

  ctx.drawImage(img, posX, posY, renderW, renderH);
}

/**
 * Fondo estético de respaldo si no hay imagen
 */
function drawFallbackBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#141414');
  grad.addColorStop(0.5, '#0a0a0a');
  grad.addColorStop(1, '#1b1b1b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Trama geométrica sutil
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 1;
  for (let i = 0; i < w; i += 80) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, h);
    ctx.stroke();
  }
}

/**
 * Dibuja un degradado cinematográfico negro en la parte superior e inferior
 */
function drawVignetteGradient(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  format: SocialMediaFormat
) {
  // Degradado superior (para el logo)
  const topGrad = ctx.createLinearGradient(0, 0, 0, format === 'story' ? 450 : 320);
  topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.88)');
  topGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.45)');
  topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, w, format === 'story' ? 450 : 320);

  // Degradado inferior (para textos y precios)
  const botHeight = format === 'story' ? 850 : 620;
  const botGrad = ctx.createLinearGradient(0, h - botHeight, 0, h);
  botGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  botGrad.addColorStop(0.3, 'rgba(0, 0, 0, 0.65)');
  botGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.94)');
  botGrad.addColorStop(1, 'rgba(0, 0, 0, 0.98)');
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, h - botHeight, w, botHeight);
}

/**
 * Dibuja la chapa oficial tapada con estética CARVLAK
 */
function drawPlateCoverBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 1
) {
  const w = 240 * scale;
  const h = 65 * scale;
  const rx = x - w / 2;
  const ry = y - h / 2;

  ctx.save();
  // Sombra exterior
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 12 * scale;
  ctx.shadowOffsetY = 4 * scale;

  // Fondo negro
  roundRect(ctx, rx, ry, w, h, 8 * scale);
  ctx.fillStyle = '#000000';
  ctx.fill();

  // Borde rojo fino CARVLAK
  ctx.strokeStyle = '#D7141A';
  ctx.lineWidth = 2.5 * scale;
  ctx.stroke();
  ctx.restore();

  // Micro logo + texto CARVLAK
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Punto rojo característico
  ctx.fillStyle = '#D7141A';
  ctx.beginPath();
  ctx.arc(rx + 28 * scale, y, 5 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Texto
  ctx.font = `900 ${18 * scale}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.letterSpacing = `${2 * scale}px`;
  ctx.fillText('CARVLAK', x + 5 * scale, y - 2 * scale);

  ctx.font = `600 ${10 * scale}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = '#8A8A8A';
  ctx.letterSpacing = `${1 * scale}px`;
  ctx.fillText('@CAR.VLAK', x + 5 * scale, y + 15 * scale);
  ctx.restore();
}

/**
 * Dibuja el Header con Logo y badge de Instagram
 */
async function drawBrandHeader(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  logoPos: LogoPosition,
  instagramHandle: string,
  locationName: string
) {
  const pad = 60;
  let logoX = pad;
  let logoY = pad;

  if (logoPos === 'top-right') {
    logoX = w - 280 - pad;
  } else if (logoPos === 'top-center') {
    logoX = (w - 280) / 2;
  } else if (logoPos === 'bottom-left') {
    logoY = h - 200;
  } else if (logoPos === 'bottom-right') {
    logoX = w - 280 - pad;
    logoY = h - 200;
  } else if (logoPos === 'bottom-center') {
    logoX = (w - 280) / 2;
    logoY = h - 200;
  }

  // Intentar cargar logo blanco oficial
  let loaded = false;
  try {
    const logoImg = await loadImage('/logo-carvlak-white.png');
    const targetW = 250;
    const aspect = logoImg.width / logoImg.height;
    const targetH = targetW / aspect;
    ctx.drawImage(logoImg, logoX, logoY, targetW, targetH);
    loaded = true;
  } catch {
    // Dibujo tipográfico de alta fidelidad si no se pudo cargar la imagen
  }

  if (!loaded) {
    ctx.save();
    ctx.font = '900 38px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.letterSpacing = '3px';
    ctx.fillText('CARVLAK', logoX, logoY + 36);

    ctx.fillStyle = '#D7141A';
    ctx.fillRect(logoX + 205, logoY + 12, 10, 24);

    ctx.font = '600 13px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#8A8A8A';
    ctx.letterSpacing = '2px';
    ctx.fillText('GROUP • AUTOMOTORA & STUDIO', logoX, logoY + 58);
    ctx.restore();
  }

  // Cápsula superior derecha: @car.vlak
  if (logoPos !== 'top-right') {
    const badgeW = 220;
    const badgeH = 44;
    const badgeX = w - pad - badgeW;
    const badgeY = pad + 10;

    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 22);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fill();
    ctx.strokeStyle = '#2A2A2A';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Icono Instagram simulado / texto
    ctx.save();
    ctx.font = '700 16px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#D7141A';
    ctx.fillText('@', badgeX + 22, badgeY + 28);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 16px system-ui, -apple-system, sans-serif';
    ctx.letterSpacing = '0.5px';
    ctx.fillText(instagramHandle.replace('@', ''), badgeX + 42, badgeY + 28);
    ctx.restore();
  }
}

/**
 * Renderizado de contenidos específicos para cada plantilla
 */
function renderTemplateContent(
  ctx: CanvasRenderingContext2D,
  data: {
    width: number;
    height: number;
    format: SocialMediaFormat;
    templateId: SocialMediaTemplateId;
    headline: string;
    subtitle: string;
    price: string;
    originalPrice: string;
    specs: string[];
    stampText: string;
    badgeTag: string;
    inspectionHighlights: string[];
    detailingServices: string[];
  }
) {
  const {
    width,
    height,
    format,
    templateId,
    headline,
    subtitle,
    price,
    originalPrice,
    specs,
    stampText,
    badgeTag,
    inspectionHighlights,
    detailingServices
  } = data;

  const pad = 60;
  const isStory = format === 'story';

  // 1. SELLOS DE ALTO IMPACTO (VENDIDO, RESERVADO, NUEVO INGRESO, ETC.)
  if (templateId === 'auto-vendido') {
    drawHighImpactStamp(ctx, 540, isStory ? 700 : 480, stampText || 'VENDIDO', '#D7141A', -12);
  } else if (templateId === 'auto-reservado') {
    drawHighImpactStamp(ctx, 540, isStory ? 700 : 480, stampText || 'RESERVADO', '#eab308', -8);
  } else if (templateId === 'auto-descuento') {
    drawHighImpactStamp(ctx, 840, isStory ? 450 : 320, stampText || 'OFERTA', '#D7141A', 14);
  } else if (templateId === 'auto-nuevo-ingreso') {
    drawTagPill(ctx, pad, isStory ? 1220 : 800, stampText || 'NUEVO INGRESO', '#D7141A');
  } else if (templateId === 'auto-electricos-0km') {
    drawTagPill(ctx, pad, isStory ? 1220 : 800, stampText || '100% ELÉCTRICO • 0KM', '#22c55e');
  } else if (templateId === 'auto-entrega') {
    drawHighImpactStamp(ctx, 540, isStory ? 650 : 440, stampText || '¡NUEVO DUEÑO!', '#D7141A', -6);
  } else if (badgeTag) {
    drawTagPill(ctx, pad, isStory ? 1220 : 800, badgeTag, '#D7141A');
  }

  // 2. Posición vertical de textos principales (anclados en la parte inferior)
  const baseY = height - (isStory ? 240 : 180);

  // 3. Render según la categoría o plantilla
  if (templateId === 'auto-descuento') {
    // Bloque de precios con tacha
    let currentY = baseY;

    if (price) {
      currentY -= 70;
      ctx.save();
      // Si hay precio anterior, tacharlo
      if (originalPrice) {
        ctx.font = '700 32px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#8A8A8A';
        const origW = ctx.measureText(originalPrice).width;
        ctx.fillText(originalPrice, pad, currentY);
        // Línea roja sobre el precio anterior
        ctx.strokeStyle = '#D7141A';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pad - 4, currentY - 10);
        ctx.lineTo(pad + origW + 4, currentY - 10);
        ctx.stroke();

        currentY += 55;
      }

      // Precio nuevo gigante
      ctx.font = '900 68px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#D7141A';
      ctx.fillText(price, pad, currentY);
      ctx.restore();
    }

    // Título y specs arriba del precio
    const titleY = currentY - (price ? 120 : 60);
    drawTitleAndSpecs(ctx, pad, titleY, headline, subtitle, specs);

  } else if (templateId === 'agenda-turnos-disponibles') {
    // Plantilla de Turnos Detailing
    const boxY = isStory ? 800 : 540;
    const boxW = width - pad * 2;
    const boxH = isStory ? 750 : 520;

    roundRect(ctx, pad, boxY, boxW, boxH, 24);
    ctx.fillStyle = 'rgba(20, 20, 20, 0.92)';
    ctx.fill();
    ctx.strokeStyle = '#2A2A2A';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Encabezado
    drawTagPill(ctx, pad + 30, boxY + 35, 'AGENDA ABIERTA', '#D7141A');

    ctx.save();
    ctx.font = '900 42px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(headline || 'Turnos Disponibles Esta Semana', pad + 30, boxY + 120);

    ctx.font = '500 22px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#8A8A8A';
    ctx.fillText(subtitle || 'DetailVlak Studio • Cupos limitados', pad + 30, boxY + 160);

    // Lista de servicios disponibles
    const services = detailingServices.length > 0
      ? detailingServices
      : [
          'Tratamiento Cerámico 9H (Protección 3 años)',
          'Corrección de barniz y pulido espejo',
          'Limpieza y descontaminación de tapizados',
          'Lavado de motor detallado y sellado de plásticos'
        ];

    let itemY = boxY + 225;
    services.forEach((s) => {
      // Checkmark rojo
      ctx.fillStyle = '#D7141A';
      ctx.beginPath();
      ctx.arc(pad + 45, itemY - 7, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 24px system-ui, -apple-system, sans-serif';
      ctx.fillText(s, pad + 70, itemY);
      itemY += 55;
    });

    // Llamado a agendar
    ctx.fillStyle = '#D7141A';
    ctx.font = '700 24px system-ui, -apple-system, sans-serif';
    ctx.fillText('📲 Agendá tu lugar por WhatsApp o mensaje directo', pad + 30, itemY + 25);
    ctx.restore();

  } else if (templateId === 'inspeccion-precompra') {
    // Plantilla de Inspección Vehicular Precompra
    const boxY = isStory ? 880 : 580;
    const boxW = width - pad * 2;
    const boxH = isStory ? 680 : 490;

    roundRect(ctx, pad, boxY, boxW, boxH, 24);
    ctx.fillStyle = 'rgba(15, 15, 15, 0.95)';
    ctx.fill();
    ctx.strokeStyle = '#2A2A2A';
    ctx.lineWidth = 2;
    ctx.stroke();

    drawTagPill(ctx, pad + 30, boxY + 35, 'INSPECCIÓN PRECOMPRA APROBADA', '#D7141A');

    ctx.save();
    ctx.font = '900 40px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(headline || 'Peritaje Técnico de 120+ Puntos', pad + 30, boxY + 120);

    ctx.font = '500 22px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#8A8A8A';
    ctx.fillText(subtitle || 'Informe verificado por CARVLAK Inspecciones', pad + 30, boxY + 160);

    const points = inspectionHighlights.length > 0
      ? inspectionHighlights
      : [
          'Diagnóstico computarizado OBD-II sin fallas',
          'Espesor de pintura verificado (sin choques estructurales)',
          'Mecánica, frenos y tren rodante revisados',
          'Documentación e historial sin antecedentes'
        ];

    let pointY = boxY + 220;
    points.forEach((p) => {
      // Badge circular verde de aprobación
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(pad + 45, pointY - 7, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 23px system-ui, -apple-system, sans-serif';
      ctx.fillText(p, pad + 70, pointY);
      pointY += 52;
    });

    ctx.fillStyle = '#8A8A8A';
    ctx.font = '500 18px system-ui, -apple-system, sans-serif';
    ctx.fillText('🛡️ Comprá tu próximo auto usado con total tranquilidad y respaldo.', pad + 30, pointY + 20);
    ctx.restore();

  } else if (templateId === 'auto-ficha-carrusel') {
    // Ficha de carrusel: specs en tarjetas elegantes
    const titleY = isStory ? 1050 : 680;
    drawTitleAndSpecs(ctx, pad, titleY, headline, subtitle, specs);

    if (price) {
      drawPriceTag(ctx, pad, isStory ? 1420 : 960, price);
    }

    // Indicador "Deslizá para más ➡️"
    const swipeY = isStory ? 1560 : 1080;
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 22px system-ui, -apple-system, sans-serif';
    ctx.fillText('Deslizá para ver más fotos ➡️', pad, swipeY);
    ctx.restore();

  } else {
    // Plantillas estándar (auto-vendido, auto-nuevo-ingreso, auto-reservado, promo-detailing, etc.)
    const titleY = baseY - (price ? 110 : 40);
    drawTitleAndSpecs(ctx, pad, titleY, headline, subtitle, specs);

    if (price) {
      drawPriceTag(ctx, pad, baseY, price);
    }
  }
}

/**
 * Dibuja un gran sello inclinado de alto impacto (Vendido, Reservado, Oferta)
 */
function drawHighImpactStamp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  text: string,
  color: string,
  angleDeg: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((angleDeg * Math.PI) / 180);

  ctx.font = '900 66px system-ui, -apple-system, sans-serif';
  const textMetrics = ctx.measureText(text);
  const padX = 40;
  const padY = 20;
  const boxW = textMetrics.width + padX * 2;
  const boxH = 90;

  // Sombra de fondo
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;

  // Marco exterior
  roundRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 16);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.stroke();

  // Texto
  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '4px';
  ctx.fillText(text, 0, 0);

  ctx.restore();
}

/**
 * Dibuja una píldora de tag (ej: "NUEVO INGRESO")
 */
function drawTagPill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  bgColor: string
) {
  ctx.save();
  ctx.font = '900 20px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '1.5px';
  const w = ctx.measureText(text).width + 36;
  const h = 44;

  roundRect(ctx, x, y, w, h, 22);
  ctx.fillStyle = bgColor;
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2);
  ctx.restore();
}

/**
 * Dibuja una píldora estándar
 */
function drawPill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  bg: string,
  color: string,
  text: string
) {
  ctx.save();
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = '800 18px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2);
  ctx.restore();
}

/**
 * Dibuja título de vehículo y chips de especificaciones
 */
function drawTitleAndSpecs(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  title: string,
  subtitle: string,
  specs: string[]
) {
  ctx.save();

  // Título principal (Modelo y Marca)
  ctx.font = '900 52px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.fillText(title || 'Vehículo Seleccionado', x, y);

  // Subtítulo
  if (subtitle) {
    ctx.font = '600 26px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#8A8A8A';
    ctx.fillText(subtitle, x, y + 42);
  }

  // Chips de especificaciones
  if (specs && specs.length > 0) {
    let chipX = x;
    const chipY = y + (subtitle ? 78 : 36);

    ctx.font = '700 18px system-ui, -apple-system, sans-serif';
    specs.forEach((sp) => {
      const chipW = ctx.measureText(sp).width + 28;
      const chipH = 38;

      roundRect(ctx, chipX, chipY, chipW, chipH, 12);
      ctx.fillStyle = 'rgba(20, 20, 20, 0.85)';
      ctx.fill();
      ctx.strokeStyle = '#2A2A2A';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sp, chipX + chipW / 2, chipY + chipH / 2);

      chipX += chipW + 10;
    });
  }

  ctx.restore();
}

/**
 * Dibuja el precio destacado
 */
function drawPriceTag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  price: string
) {
  ctx.save();
  ctx.font = '900 62px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#D7141A';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillText(price, x, y);
  ctx.restore();
}

/**
 * Dibuja la barra inferior de pie con datos de contacto y ubicación
 */
function drawFooterBar(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  instagramHandle: string,
  locationName: string
) {
  const barH = 75;
  const barY = h - barH;

  ctx.save();
  // Fondo de barra inferior
  ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
  ctx.fillRect(0, barY, w, barH);

  // Línea roja superior fina
  ctx.fillStyle = '#D7141A';
  ctx.fillRect(0, barY, w, 2);

  // Textos del footer
  ctx.font = '700 18px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'middle';
  ctx.fillText(`CARVLAK Group  •  ${instagramHandle}`, 60, barY + barH / 2);

  ctx.textAlign = 'right';
  ctx.font = '500 17px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#8A8A8A';
  ctx.fillText(`📍 ${locationName}`, w - 60, barY + barH / 2);

  ctx.restore();
}

/**
 * Exporta el canvas a Blob en formato PNG
 */
export function exportCanvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to convert canvas to blob'));
      }
    }, 'image/png');
  });
}

/**
 * Descarga el blob como archivo local
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Comparte la imagen generada mediante la Web Share API en dispositivos compatibles
 */
export async function shareCanvasImage(
  canvas: HTMLCanvasElement,
  title: string,
  text: string
): Promise<boolean> {
  try {
    const blob = await exportCanvasToBlob(canvas);
    const file = new File([blob], 'carvlak-post.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title,
        text,
        files: [file]
      });
      return true;
    } else if (navigator.share) {
      await navigator.share({
        title,
        text
      });
      return true;
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.error('Error sharing canvas:', err);
    }
  }
  return false;
}
