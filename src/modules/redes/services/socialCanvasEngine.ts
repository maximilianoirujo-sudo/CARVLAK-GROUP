import { SocialMediaFormat, SocialMediaTemplateId, LogoPosition, FormatLayoutConfig, CanvasTextElement } from '../../../types';

export interface RenderCanvasOptions {
  format: SocialMediaFormat;
  templateId: string;
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
  hashtag?: string;
  badgeTag?: string;
  inspectionHighlights?: string[];
  detailingServices?: string[];
  layoutConfig?: FormatLayoutConfig;
  showSafeZones?: boolean;
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

let fontsLoadedPromise: Promise<void> | null = null;

/**
 * Precarga fuentes oficiales (Archivo Narrow y Barlow Condensed) antes de renderizar el canvas
 */
export async function ensureFontsLoaded(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  if (!fontsLoadedPromise) {
    fontsLoadedPromise = (async () => {
      try {
        await Promise.all([
          document.fonts.load('700 16px "Archivo Narrow"'),
          document.fonts.load('400 16px "Barlow Condensed"'),
          document.fonts.load('600 16px "Barlow Condensed"')
        ]);
      } catch (err) {
        console.warn('Could not preload fonts via document.fonts.load:', err);
      }
    })();
  }
  await fontsLoadedPromise;
}

/**
 * Dibuja un pin de ubicación vectorial nítido en el canvas con el rojo oficial CARVLAK (#D7141A)
 */
export function drawLocationPinIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number = 22,
  color: string = '#D7141A'
) {
  ctx.save();
  ctx.fillStyle = color;
  const r = size * 0.42;
  const headY = cy - size * 0.15;
  const tipY = cy + size * 0.45;

  ctx.beginPath();
  ctx.arc(cx, headY, r, 0.75 * Math.PI, 2.25 * Math.PI, false);
  ctx.lineTo(cx, tipY);
  ctx.closePath();
  ctx.fill();

  // Punto central blanco
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx, headY, r * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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
  // Precargar tipografías y logos oficiales antes de dibujar
  await ensureFontsLoaded();
  try {
    await Promise.all([
      loadImage('/carvlak-logo-blanco.png').catch(() => null),
      loadImage('/carvlak-logo-negro.png').catch(() => null)
    ]);
  } catch {}

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
    locationName = 'Ciudad de la Costa, Canelones',
    hashtag = '',
    badgeTag = '',
    inspectionHighlights = [],
    detailingServices = [],
    layoutConfig
  } = options;

  // 1. Dimensiones exactas
  const width = 1080;
  const height = format === 'story' ? 1920 : 1350;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const bgMode = layoutConfig?.backgroundMode || 'full_photo';
  const bgColor = layoutConfig?.backgroundColor || '#0a0a0a';
  const vignetteOpacity = layoutConfig?.vignetteOpacity !== undefined ? layoutConfig.vignetteOpacity : 0.85;
  const effectiveLogoPosition = layoutConfig?.logoPosition || logoPosition;
  const effectiveLogoVersion = layoutConfig?.logoVersion || 'auto';

  // Determinar si el fondo es claro
  const isLightBg = bgColor.toUpperCase() === '#FFFFFF' || bgColor.toUpperCase() === '#F5F5F4';

  // 2. Renderizar Fondo según el modo seleccionado
  if (bgMode === 'flat_color') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Trama sutil de líneas
    ctx.strokeStyle = isLightBg ? '#E5E5E3' : '#1F1F1F';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 90) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }

    // Tarjeta flotante con la imagen del vehículo
    if (imageUrl) {
      try {
        const img = await loadImage(imageUrl);
        const cardX = 60;
        const cardY = format === 'story' ? 220 : 160;
        const cardW = width - 120;
        const cardH = format === 'story' ? 840 : 600;

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 10;
        roundRect(ctx, cardX, cardY, cardW, cardH, 24);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.restore();

        ctx.save();
        roundRect(ctx, cardX, cardY, cardW, cardH, 24);
        ctx.clip();
        drawImageCover(ctx, img, cardX, cardY, cardW, cardH, imagePan);
        ctx.restore();

        ctx.save();
        roundRect(ctx, cardX, cardY, cardW, cardH, 24);
        ctx.strokeStyle = '#D7141A';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      } catch {
        // Fallback
      }
    }
  } else if (bgMode === 'photo_with_band') {
    ctx.fillStyle = bgColor || '#111111';
    ctx.fillRect(0, 0, width, height);

    const bandH = format === 'story' ? Math.round(height * 0.62) : Math.round(height * 0.58);

    if (imageUrl) {
      try {
        const img = await loadImage(imageUrl);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, width, bandH);
        ctx.clip();
        drawImageCover(ctx, img, 0, 0, width, bandH, imagePan);
        ctx.restore();
      } catch {
        drawFallbackBackground(ctx, width, bandH);
      }
    } else {
      drawFallbackBackground(ctx, width, bandH);
    }

    // Línea divisoria roja deportiva CARVLAK
    ctx.fillStyle = '#D7141A';
    ctx.fillRect(0, bandH - 3, width, 6);
  } else {
    // bgMode === 'full_photo' (predeterminado)
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    if (templateId === 'detailing-antes-despues' && imageUrl && secondaryImageUrl) {
      try {
        const [imgBefore, imgAfter] = await Promise.all([
          loadImage(imageUrl),
          loadImage(secondaryImageUrl)
        ]);

        const halfWidth = width / 2;

        // Foto Antes (Izquierda)
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, halfWidth, height);
        ctx.clip();
        drawImageCover(ctx, imgBefore, 0, 0, halfWidth, height, imagePan);
        ctx.restore();

        // Foto Después (Derecha)
        ctx.save();
        ctx.beginPath();
        ctx.rect(halfWidth, 0, halfWidth, height);
        ctx.clip();
        drawImageCover(ctx, imgAfter, halfWidth, 0, halfWidth, height, imagePan);
        ctx.restore();

        // Línea divisoria central roja deportiva #D7141A
        ctx.fillStyle = '#D7141A';
        ctx.fillRect(halfWidth - 3, 0, 6, height);

        // Píldoras indicadoras "ANTES" y "DESPUÉS"
        const pillY = format === 'story' ? 270 : 150;
        drawPill(ctx, 40, pillY, 140, 42, '#000000', '#D7141A', 'ANTES');
        drawPill(ctx, halfWidth + 40, pillY, 160, 42, '#D7141A', '#FFFFFF', 'DESPUÉS');
      } catch {
        drawFallbackBackground(ctx, width, height);
      }
    } else if (imageUrl) {
      try {
        const img = await loadImage(imageUrl);
        drawImageCover(ctx, img, 0, 0, width, height, imagePan);
      } catch {
        drawFallbackBackground(ctx, width, height);
      }
    } else {
      drawFallbackBackground(ctx, width, height);
    }
  }

  // 4. Parche "Tapar Matrícula" si está habilitado
  if (coverPlate) {
    drawPlateCoverBadge(ctx, platePosition.x, platePosition.y, platePosition.scale || 1);
  }

  // 5. Degradado cinematográfico para legibilidad de textos (en fotos)
  if (bgMode !== 'flat_color') {
    drawVignetteGradient(ctx, width, height, format, vignetteOpacity);
  }

  // 6. Header con Logo y Marca (solo si no está presente como elemento editable en textElements)
  const hasLogoElement = layoutConfig?.textElements?.some((el) => el.id === 'logo');
  if (!hasLogoElement) {
    await drawBrandHeader(ctx, width, height, effectiveLogoPosition, instagramHandle, locationName, isLightBg, effectiveLogoVersion);
  }

  // 7. Contenido según la plantilla específica o elementos individuales configurados
  const hasCustomFooter = layoutConfig?.textElements?.some((el) => (el.id === 'pie_ubicacion' || el.id === 'linea_divisoria') && el.visible);

  if (layoutConfig?.textElements && layoutConfig.textElements.length > 0) {
    layoutConfig.textElements.forEach((el) => {
      drawCanvasTextElement(ctx, el, width, height);
    });
  } else {
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
      detailingServices,
      layoutConfig,
      locationName,
      hashtag: hashtag || (
        templateId === 'detailing-antes-despues' || templateId === 'detailing-promo' || templateId === 'agenda-turnos-disponibles'
          ? '#DetailVlak'
          : '#TuPróximoAuto'
      )
    });
  }

  // 8. Información base de pie (ubicación y hashtag sobre la foto sin franja negra)
  if (!hasCustomFooter) {
    const effectiveHashtag = hashtag || (
      templateId === 'detailing-antes-despues' || templateId === 'detailing-promo' || templateId === 'agenda-turnos-disponibles'
        ? '#DetailVlak'
        : '#TuPróximoAuto'
    );
    drawBaseFooterInfo(ctx, width, height, format, locationName, effectiveHashtag);
  }

  // 9. Guía visual de zonas seguras de Instagram (si está activada)
  if (options.showSafeZones) {
    drawSafeZonesOverlay(ctx, width, height, format);
  }
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
  format: SocialMediaFormat,
  opacity: number = 0.85
) {
  if (opacity <= 0.01) return;
  // Degradado superior (para el logo)
  const topGrad = ctx.createLinearGradient(0, 0, 0, format === 'story' ? 450 : 320);
  topGrad.addColorStop(0, `rgba(0, 0, 0, ${(0.88 * opacity).toFixed(3)})`);
  topGrad.addColorStop(0.6, `rgba(0, 0, 0, ${(0.45 * opacity).toFixed(3)})`);
  topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, w, format === 'story' ? 450 : 320);

  // Degradado inferior (para textos y precios)
  const botHeight = format === 'story' ? 850 : 620;
  const botGrad = ctx.createLinearGradient(0, h - botHeight, 0, h);
  botGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  botGrad.addColorStop(0.3, `rgba(0, 0, 0, ${(0.65 * opacity).toFixed(3)})`);
  botGrad.addColorStop(0.7, `rgba(0, 0, 0, ${(0.94 * opacity).toFixed(3)})`);
  botGrad.addColorStop(1, `rgba(0, 0, 0, ${(0.98 * opacity).toFixed(3)})`);
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

  // Texto: únicamente CARVLAK centrado
  ctx.font = `700 ${19 * scale}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.letterSpacing = `${2.5 * scale}px`;
  ctx.fillText('CARVLAK', x + 5 * scale, y);
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
  locationName: string,
  isLightBackground: boolean = false,
  logoVersion: 'blanco' | 'negro' | 'auto' = 'auto'
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

  // Intentar cargar logo oficial (blanco sobre oscuro/foto, negro sobre claro)
  let loaded = false;
  try {
    let logoSrc = '/carvlak-logo-blanco.png';
    if (logoVersion === 'negro') {
      logoSrc = '/carvlak-logo-negro.png';
    } else if (logoVersion === 'blanco') {
      logoSrc = '/carvlak-logo-blanco.png';
    } else {
      logoSrc = isLightBackground ? '/carvlak-logo-negro.png' : '/carvlak-logo-blanco.png';
    }
    const logoImg = await loadImage(logoSrc);
    const targetW = 280;
    const aspect = logoImg.width / logoImg.height;
    const targetH = targetW / aspect;
    ctx.drawImage(logoImg, logoX, logoY, targetW, targetH);
    loaded = true;
  } catch {
    // Dibujo tipográfico limpio si no se pudo cargar la imagen
  }

  if (!loaded) {
    ctx.save();
    ctx.font = '700 36px "Archivo Narrow", sans-serif';
    ctx.fillStyle = isLightBackground ? '#161616' : '#FFFFFF';
    ctx.letterSpacing = '2px';
    ctx.fillText('CARVLAK', logoX, logoY + 34);

    ctx.font = '500 13px "Barlow Condensed", sans-serif';
    ctx.fillStyle = isLightBackground ? '#6B6B6B' : '#A0A0A0';
    ctx.letterSpacing = '1.5px';
    ctx.fillText('GROUP', logoX + 175, logoY + 34);
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
    templateId: string;
    headline: string;
    subtitle: string;
    price: string;
    originalPrice: string;
    specs: string[];
    stampText: string;
    badgeTag: string;
    inspectionHighlights: string[];
    detailingServices: string[];
    layoutConfig?: FormatLayoutConfig;
    locationName?: string;
    hashtag?: string;
  }
) {
  const {
    format,
    templateId,
    headline,
    subtitle,
    price,
    originalPrice,
    stampText,
    badgeTag,
    layoutConfig
  } = data;

  const pad = 60;
  const isStory = format === 'story';

  // 1. Etiqueta por defecto según plantilla
  const effectiveTag = (badgeTag || (
    templateId === 'auto-vendido' ? 'ENTREGA CONFIRMADA' :
    templateId === 'auto-destacado-semana' ? 'DESTACADO DE LA SEMANA' :
    templateId === 'auto-descuento' ? 'REBAJA DE LA SEMANA' :
    templateId === 'auto-nuevo-ingreso' ? 'RECIÉN LLEGADO' :
    templateId === 'auto-reservado' ? 'SEÑA RECIBIDA' :
    templateId === 'detailing-antes-despues' ? 'DETAILVLAK' :
    templateId === 'auto-entrega' ? 'ENTREGA' :
    templateId === 'detailing-promo' ? 'PROMO EXCLUSIVA' :
    templateId === 'agenda-turnos-disponibles' ? 'AGENDA ABIERTA' :
    templateId === 'inspeccion-precompra' ? 'PERITAJE MECÁNICO' :
    'STOCK CARVLAK'
  )).toUpperCase();

  // 2. Título principal
  const effectiveTitle = (stampText || layoutConfig?.stampText || (
    templateId === 'auto-vendido' ? 'VENDIDO' :
    templateId === 'auto-destacado-semana' ? 'OPORTUNIDAD' :
    templateId === 'auto-descuento' ? 'OPORTUNIDAD' :
    templateId === 'auto-nuevo-ingreso' ? 'NUEVO INGRESO' :
    templateId === 'auto-reservado' ? 'RESERVADO' :
    templateId === 'detailing-antes-despues' ? 'ANTES / DESPUÉS' :
    templateId === 'auto-entrega' ? '¡FELICITACIONES!' :
    templateId === 'detailing-promo' ? 'BENEFICIO' :
    templateId === 'agenda-turnos-disponibles' ? 'TURNOS DISPONIBLES' :
    templateId === 'inspeccion-precompra' ? 'COMPRÁ SEGURO' :
    'OPORTUNIDAD'
  )).toUpperCase();

  // 3. Modelo del auto
  const effectiveModel = (headline || 'VEHÍCULO').toUpperCase();

  // 4. Precios
  const isPriceAllowed = [
    'auto-destacado-semana',
    'auto-descuento',
    'auto-nuevo-ingreso',
    'auto-ficha-carrusel',
    'auto-electricos-0km',
    'auto-catalogo-semana',
    'auto-rango-precio',
    'detailing-promo'
  ].includes(templateId);

  const shouldShowPrice = isPriceAllowed && (layoutConfig?.showPrice !== false) && !!price;
  const isDiscount = templateId === 'auto-descuento' && !!originalPrice;

  // 5. Mensaje por defecto
  const effectiveMessage = subtitle || (
    templateId === 'auto-vendido' ? '¡Gracias por confiar en nosotros! Entregado con garantía total CARVLAK.' :
    templateId === 'auto-destacado-semana' ? 'Escribinos por WhatsApp y coordiná tu visita.' :
    templateId === 'auto-descuento' ? 'Por tiempo limitado en nuestro showroom.' :
    templateId === 'auto-nuevo-ingreso' ? 'Consultá antes de que se vaya.' :
    templateId === 'auto-reservado' ? '¿Buscás algo parecido? Escribinos.' :
    templateId === 'detailing-antes-despues' ? 'Corrección de barniz y sellado cerámico 9H.' :
    templateId === 'auto-entrega' ? '¡Gracias por confiar en CARVLAK! Entregado con garantía total.' :
    'Consultanos por WhatsApp para coordinar tu visita.'
  );

  // Posicionamiento vertical respetando zonas seguras
  const tagY = isStory
    ? (isDiscount ? 1110 : shouldShowPrice ? 1195 : 1260)
    : (isDiscount ? 900 : shouldShowPrice ? 935 : 985);

  const titleY = isStory
    ? (isDiscount ? 1225 : shouldShowPrice ? 1295 : 1360)
    : (isDiscount ? 975 : shouldShowPrice ? 1010 : 1060);

  const barY = isStory
    ? (isDiscount ? 1285 : shouldShowPrice ? 1345 : 1410)
    : (isDiscount ? 1015 : shouldShowPrice ? 1050 : 1100);

  const modelY = isStory
    ? (isDiscount ? 1355 : shouldShowPrice ? 1405 : 1470)
    : (isDiscount ? 1065 : shouldShowPrice ? 1100 : 1150);

  const origPriceY = isStory ? 1425 : 1120;
  const priceY = isStory ? 1485 : 1170;
  const msgY = isStory ? 1555 : 1220;

  // 1. Etiqueta: recuadro rojo #D7141A con texto blanco mayúsculas chico letter-spaced
  ctx.save();
  const tagFontSize = isStory ? 18 : 15;
  ctx.font = `700 ${tagFontSize}px "Archivo Narrow", sans-serif`;
  ctx.letterSpacing = '2px';
  const tagTextMetrics = ctx.measureText(effectiveTag);
  const tagPadX = 18;
  const tagH = isStory ? 38 : 32;
  const tagW = tagTextMetrics.width + tagPadX * 2;

  roundRect(ctx, pad, tagY - tagH / 2, tagW, tagH, 6);
  ctx.fillStyle = '#D7141A';
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(effectiveTag, pad + tagW / 2, tagY + 1);
  ctx.restore();

  // 2. Título principal: muy grande, blanco, Archivo Narrow 700 en mayúsculas
  ctx.save();
  const titleSize = isStory ? 96 : 76;
  ctx.font = `700 ${titleSize}px "Archivo Narrow", sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.letterSpacing = '3px';
  ctx.shadowColor = 'rgba(0,0,0,0.95)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(effectiveTitle, pad, titleY);

  // 3. Barra roja #D7141A debajo del título, corta y gruesa, alineada a la izquierda
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#D7141A';
  const barW = isStory ? 220 : 180;
  const barH = isStory ? 8 : 6;
  ctx.fillRect(pad, barY, barW, barH);
  ctx.restore();

  // 4. Modelo del auto: blanco, grande, en mayúsculas
  ctx.save();
  const modelSize = isStory ? 48 : 38;
  ctx.font = `700 ${modelSize}px "Archivo Narrow", sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.letterSpacing = '1px';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(effectiveModel, pad, modelY);
  ctx.restore();

  // 5. Precio (solo cuando corresponda): blanco grande, formato "USD 16.900"
  if (shouldShowPrice) {
    ctx.save();
    if (isDiscount) {
      const origSize = isStory ? 30 : 24;
      ctx.font = `700 ${origSize}px "Archivo Narrow", sans-serif`;
      ctx.fillStyle = '#8A8A8A';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const origMetrics = ctx.measureText(originalPrice);
      ctx.fillText(originalPrice, pad, origPriceY);

      // Línea roja deportiva sobre precio anterior
      ctx.strokeStyle = '#D7141A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pad - 2, origPriceY);
      ctx.lineTo(pad + origMetrics.width + 4, origPriceY);
      ctx.stroke();
    }

    const priceSize = isStory ? 68 : 54;
    ctx.font = `700 ${priceSize}px "Archivo Narrow", sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(price, pad, priceY);
    ctx.restore();
  }

  // 6. Mensaje: 1 o 2 líneas en Barlow Condensed, blanco con ligera transparencia
  ctx.save();
  const msgSize = isStory ? 26 : 21;
  ctx.font = `500 ${msgSize}px "Barlow Condensed", sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(effectiveMessage, pad, msgY);
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
 * Dibuja la información base de pie:
 * 7. Línea divisoria fina gris de lado a lado
 * 8. Pie: Izquierda ícono de ubicación rojo + "Ciudad de la Costa, Canelones" en blanco;
 *         Derecha hashtag en gris. Sin franja negra ni fondo propio.
 * Respeta la zona segura de Instagram Stories (< 1670px).
 */
function drawBaseFooterInfo(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  format: SocialMediaFormat = 'story',
  locationName: string = 'Ciudad de la Costa, Canelones',
  hashtag: string = '#TuPróximoAuto'
) {
  const pad = 60;
  const isStory = format === 'story';
  const lineY = isStory ? 1605 : 1255;
  const footerY = isStory ? 1640 : 1290;

  ctx.save();
  // 7. Línea divisoria fina gris
  ctx.strokeStyle = '#3A3A3A';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, lineY);
  ctx.lineTo(w - pad, lineY);
  ctx.stroke();

  // 8. Pie
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;

  // Izquierda: pin de ubicación rojo + Ubicación en blanco
  const loc = locationName || 'Ciudad de la Costa, Canelones';
  ctx.font = '600 22px "Barlow Condensed", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  drawLocationPinIcon(ctx, pad + 10, footerY, 22, '#D7141A');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(loc, pad + 28, footerY);

  // Derecha: hashtag en gris
  ctx.textAlign = 'right';
  ctx.font = '600 20px "Barlow Condensed", system-ui, sans-serif';
  ctx.fillStyle = '#8A8A8A';
  ctx.letterSpacing = '0.5px';
  ctx.fillText(hashtag || '#TuPróximoAuto', w - pad, footerY);

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

/**
 * Dibuja un elemento de texto independiente en el canvas con su tipografía, rotación y fondo
 */
export function drawCanvasTextElement(
  ctx: CanvasRenderingContext2D,
  element: CanvasTextElement,
  canvasWidth: number,
  canvasHeight: number
) {
  if (!element.visible || !element.text.trim()) return;

  const fontName = element.fontFamily === 'Barlow Condensed'
    ? '"Barlow Condensed"'
    : element.fontFamily === 'Archivo Narrow'
    ? '"Archivo Narrow"'
    : 'system-ui';
  const weight = (element.fontWeight === 'black' || element.fontWeight === 'bold')
    ? 700
    : element.fontWeight === 'semibold'
    ? 600
    : 400;

  ctx.save();
  ctx.font = `${weight} ${element.fontSize}px ${fontName}, sans-serif`;
  const metrics = ctx.measureText(element.text);
  const textWidth = metrics.width;
  const textHeight = element.fontSize * 1.1;

  const padX = element.bgType === 'box' ? 24 : 0;
  const padY = element.bgType === 'box' ? 12 : 0;
  const boxW = element.id === 'logo' ? (280 * (element.fontSize || 36)) / 36 : textWidth + padX * 2;
  const boxH = element.id === 'logo' ? (80 * (element.fontSize || 36)) / 36 : textHeight + padY * 2;

  // Clamping seguro para que ningún elemento se corte en los bordes
  const safeMarginX = 60;
  const safeMarginY = 70;
  const rad = ((element.rotation || 0) * Math.PI) / 180;
  const halfEffectiveW = (boxW / 2) * Math.abs(Math.cos(rad)) + (boxH / 2) * Math.abs(Math.sin(rad));
  const halfEffectiveH = (boxW / 2) * Math.abs(Math.sin(rad)) + (boxH / 2) * Math.abs(Math.cos(rad));

  let clampedX = element.x;
  let clampedY = element.y;

  if (element.align === 'center') {
    clampedX = Math.max(safeMarginX + halfEffectiveW, Math.min(canvasWidth - safeMarginX - halfEffectiveW, element.x));
  } else if (element.align === 'left') {
    clampedX = Math.max(safeMarginX, Math.min(canvasWidth - safeMarginX - boxW, element.x));
  } else {
    clampedX = Math.max(safeMarginX + boxW, Math.min(canvasWidth - safeMarginX, element.x));
  }
  clampedY = Math.max(safeMarginY + halfEffectiveH, Math.min(canvasHeight - safeMarginY - halfEffectiveH, element.y));

  ctx.translate(clampedX, clampedY);
  if (element.rotation) {
    ctx.rotate(rad);
  }

  // Elemento Logo CARVLAK editable
  if (element.id === 'logo') {
    const isLight = element.color === '#000000' || element.color === '#161616';
    const logoSrc = isLight ? '/carvlak-logo-negro.png' : '/carvlak-logo-blanco.png';
    const img = loadedImageCache.get(logoSrc);
    const scale = (element.fontSize || 36) / 36;
    const targetW = 280 * scale;

    ctx.save();
    if (img && img.complete && img.naturalWidth > 0) {
      const aspect = img.width / img.height;
      const targetH = targetW / aspect;
      let drawX = 0;
      if (element.align === 'center') drawX = -targetW / 2;
      else if (element.align === 'right') drawX = -targetW;
      ctx.drawImage(img, drawX, -targetH / 2, targetW, targetH);
    } else {
      ctx.font = `700 ${element.fontSize || 36}px "Archivo Narrow", sans-serif`;
      ctx.fillStyle = element.color || '#FFFFFF';
      ctx.textAlign = element.align;
      ctx.textBaseline = 'middle';
      ctx.letterSpacing = '2px';
      ctx.fillText('CARVLAK', 0, 0);
    }
    ctx.restore();
    ctx.restore();
    return;
  }

  // Elementos especiales del formato base CARVLAK
  if (element.id === 'barra_roja') {
    const barW = canvasHeight > 1500 ? 220 : 180;
    const barH = canvasHeight > 1500 ? 8 : 6;
    ctx.save();
    ctx.fillStyle = element.color || '#D7141A';
    ctx.fillRect(0, -barH / 2, barW, barH);
    ctx.restore();
    ctx.restore();
    return;
  }

  if (element.id === 'linea_divisoria') {
    ctx.save();
    ctx.strokeStyle = element.color || '#3A3A3A';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(canvasWidth - 120, 0);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
    return;
  }

  if (element.id === 'pie_ubicacion') {
    ctx.save();
    ctx.font = `600 ${element.fontSize}px "Barlow Condensed", sans-serif`;
    drawLocationPinIcon(ctx, 10, 0, element.fontSize * 1.05, '#D7141A');
    ctx.fillStyle = element.color || '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(element.text, 28, 0);
    ctx.restore();
    ctx.restore();
    return;
  }

  if (element.id === 'pie_hashtag') {
    ctx.save();
    ctx.font = `600 ${element.fontSize}px "Barlow Condensed", sans-serif`;
    ctx.fillStyle = element.color || '#8A8A8A';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '0.5px';
    ctx.fillText(element.text, 0, 0);
    ctx.restore();
    ctx.restore();
    return;
  }

  if (element.id === 'etiqueta') {
    const padX = 18;
    const tagH = canvasHeight > 1500 ? 38 : 32;
    const tagW = textWidth + padX * 2;
    ctx.save();
    roundRect(ctx, 0, -tagH / 2, tagW, tagH, 6);
    ctx.fillStyle = element.bgColor || '#D7141A';
    ctx.fill();

    ctx.fillStyle = element.color || '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '2px';
    ctx.fillText(element.text.toUpperCase(), tagW / 2, 1);
    ctx.restore();
    ctx.restore();
    return;
  }

  // Fondo opcional: franja o recuadro
  if (element.bgType === 'banner') {
    ctx.save();
    ctx.fillStyle = element.bgColor;
    ctx.globalAlpha = element.bgOpacity;
    ctx.fillRect(-clampedX, -boxH / 2, canvasWidth, boxH);
    ctx.restore();
  } else if (element.bgType === 'box') {
    ctx.save();
    ctx.fillStyle = element.bgColor;
    ctx.globalAlpha = element.bgOpacity;
    const rectX = element.align === 'center' ? -boxW / 2 : element.align === 'right' ? -boxW : -padX;
    const rectY = -boxH / 2;
    roundRect(ctx, rectX, rectY, boxW, boxH, element.id === 'sello' ? 16 : 10);
    ctx.fill();

    if (element.id === 'sello') {
      ctx.strokeStyle = element.color;
      ctx.lineWidth = 5;
      ctx.stroke();
    } else if (element.id === 'etiqueta_instagram') {
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  // Sombra de texto cuando no tiene fondo
  if (element.bgType === 'none') {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
  }

  // Dibujo del texto
  if (element.id === 'etiqueta_instagram' && element.text.startsWith('@')) {
    const atW = ctx.measureText('@').width;
    const restText = element.text.slice(1);
    const startX = element.align === 'center' ? -textWidth / 2 : element.align === 'right' ? -textWidth : 0;

    ctx.save();
    ctx.fillStyle = '#D7141A';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('@', startX, 0);

    ctx.fillStyle = element.color || '#FFFFFF';
    ctx.fillText(restText, startX + atW + 2, 0);
    ctx.restore();
  } else {
    ctx.fillStyle = element.color;
    ctx.textAlign = element.align;
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = element.id === 'sello' ? '3px' : 'normal';
    ctx.fillText(element.text, 0, 0);
  }

  // Tachado especial si es precio anterior
  if (element.id === 'precio_anterior') {
    ctx.strokeStyle = '#D7141A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const lineX = element.align === 'center' ? -textWidth / 2 : element.align === 'right' ? -textWidth : 0;
    ctx.moveTo(lineX - 4, 0);
    ctx.lineTo(lineX + textWidth + 4, 0);
    ctx.stroke();
  }

  // Subrayado deportivo rojo si es sello VENDIDO horizontal (Variante A Oficial)
  if (element.id === 'sello' && element.text.toUpperCase() === 'VENDIDO' && Math.abs(element.rotation || 0) < 3) {
    const underlineW = Math.max(260, Math.min(360, textWidth * 0.95));
    const underlineH = canvasHeight > 1500 ? 10 : 8;
    const barX = element.align === 'left' ? 0 : element.align === 'center' ? -underlineW / 2 : -underlineW;
    ctx.save();
    ctx.fillStyle = '#D7141A';
    ctx.fillRect(barX, textHeight / 2 + 10, underlineW, underlineH);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Dibuja la guía visual de Zonas Seguras de Instagram (250px UI nativa)
 */
export function drawSafeZonesOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  format: SocialMediaFormat
) {
  ctx.save();
  const topSafe = format === 'story' ? 250 : 100;
  const bottomSafe = format === 'story' ? 250 : 100;

  // Zona superior (Historias: header, perfil, close button)
  ctx.fillStyle = 'rgba(215, 20, 26, 0.14)';
  ctx.fillRect(0, 0, w, topSafe);
  ctx.strokeStyle = '#D7141A';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.moveTo(0, topSafe);
  ctx.lineTo(w, topSafe);
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 22px "Archivo Narrow", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Zona no segura Instagram Stories (250px superior)', w / 2, topSafe - 35);

  // Zona inferior (Historias: respuesta DM, reacciones, compartir)
  const botY = h - bottomSafe;
  ctx.fillStyle = 'rgba(215, 20, 26, 0.14)';
  ctx.fillRect(0, botY, w, bottomSafe);
  ctx.strokeStyle = '#D7141A';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.moveTo(0, botY);
  ctx.lineTo(w, botY);
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 22px "Archivo Narrow", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Zona no segura Instagram Stories (250px inferior)', w / 2, botY + 45);

  ctx.restore();
}

/**
 * Detecta de forma heurística si una foto es un flyer o tiene texto impreso (ej. fichas de catálogo)
 */
export function isLikelyFlyerImage(url: string, _index?: number, _hasMultiplePhotos?: boolean): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (
    lower.includes('flyer') ||
    lower.includes('ficha') ||
    lower.includes('promo') ||
    lower.includes('especificaciones') ||
    lower.includes('banner')
  ) {
    return true;
  }
  return false;
}

/**
 * Genera la lista de elementos de texto independientes con el formato base oficial:
 * 1. Etiqueta (recuadro rojo #D7141A con texto blanco mayúsculas chico letter-spaced)
 * 2. Título principal (muy grande blanco Archivo Narrow 700 mayúsculas)
 * 3. Barra roja deportiva (#D7141A corta y gruesa)
 * 4. Modelo del auto (blanco grande mayúsculas)
 * 5. Precio / Precio anterior (cuando corresponde)
 * 6. Mensaje (Barlow Condensed con ligera transparencia)
 * 7. Línea divisoria fina gris
 * 8. Pie (Izquierda: pin rojo + Ubicación; Derecha: hashtag en gris)
 */
export function getDefaultTextElements(
  templateId: string,
  format: SocialMediaFormat,
  data: {
    carTitle?: string;
    version?: string;
    price?: string;
    originalPrice?: string;
    stampText?: string;
    badgeTag?: string;
    subtitle?: string;
    cta?: string;
    instagramHandle?: string;
    locationName?: string;
    hashtag?: string;
    specs?: { key: string; label: string; text: string }[];
  }
): CanvasTextElement[] {
  const isStory = format === 'story';
  const showPriceDefault = [
    'auto-descuento',
    'auto-destacado-semana',
    'auto-nuevo-ingreso',
    'auto-ficha-carrusel',
    'auto-electricos-0km',
    'auto-catalogo-semana',
    'auto-rango-precio',
    'detailing-promo'
  ].includes(templateId);

  const defaultBadgeMap: Record<string, string> = {
    'auto-vendido': 'ENTREGA CONFIRMADA',
    'auto-destacado-semana': 'DESTACADO DE LA SEMANA',
    'auto-descuento': 'REBAJA DE LA SEMANA',
    'auto-nuevo-ingreso': 'RECIÉN LLEGADO',
    'auto-reservado': 'SEÑA RECIBIDA',
    'detailing-antes-despues': 'DETAILVLAK',
    'auto-entrega': 'ENTREGA',
    'detailing-promo': 'PROMO EXCLUSIVA',
    'agenda-turnos-disponibles': 'AGENDA ABIERTA',
    'inspeccion-precompra': 'PERITAJE MECÁNICO',
    'auto-ficha-carrusel': 'EN STOCK',
    'auto-electricos-0km': '100% ELÉCTRICO',
    'auto-catalogo-semana': 'STOCK DESTACADO',
    'auto-rango-precio': 'ACCESIBLES'
  };

  const defaultStampMap: Record<string, string> = {
    'auto-vendido': 'VENDIDO',
    'auto-destacado-semana': 'OPORTUNIDAD',
    'auto-descuento': 'OPORTUNIDAD',
    'auto-nuevo-ingreso': 'NUEVO INGRESO',
    'auto-reservado': 'RESERVADO',
    'detailing-antes-despues': 'ANTES / DESPUÉS',
    'auto-entrega': '¡FELICITACIONES!',
    'detailing-promo': 'BENEFICIO',
    'agenda-turnos-disponibles': 'TURNOS DISPONIBLES',
    'inspeccion-precompra': 'COMPRÁ SEGURO',
    'auto-ficha-carrusel': 'FICHA TÉCNICA',
    'auto-electricos-0km': 'NUEVO INGRESO',
    'auto-catalogo-semana': 'OPORTUNIDAD',
    'auto-rango-precio': 'OPORTUNIDAD'
  };

  // Cálculo de diferencia real de descuento si hay precio anterior
  let discountDiffMessage = 'Por tiempo limitado en nuestro showroom.';
  if (data.originalPrice && data.price) {
    const numOrig = parseFloat(String(data.originalPrice).replace(/[^0-9.]/g, ''));
    const numSale = parseFloat(String(data.price).replace(/[^0-9.]/g, ''));
    if (numOrig && numSale && numOrig > numSale) {
      const rebaja = Math.round(numOrig - numSale);
      discountDiffMessage = `Ahorrás USD ${rebaja.toLocaleString('es-UY')}. Por tiempo limitado.`;
    }
  }

  const defaultMessageMap: Record<string, string> = {
    'auto-vendido': '¡Gracias por confiar en nosotros! Entregado con garantía total CARVLAK.',
    'auto-destacado-semana': 'Escribinos por WhatsApp y coordiná tu visita.',
    'auto-descuento': discountDiffMessage,
    'auto-nuevo-ingreso': 'Consultá antes de que se vaya.',
    'auto-reservado': '¿Buscás algo parecido? Escribinos.',
    'detailing-antes-despues': 'Corrección de barniz y sellado cerámico 9H.',
    'auto-entrega': '¡Gracias por confiar en CARVLAK! Entregado con garantía total.',
    'detailing-promo': 'Protección profesional en nuestro taller. Cupos limitados.',
    'agenda-turnos-disponibles': 'Cupos disponibles esta semana. Coordiná por WhatsApp.',
    'inspeccion-precompra': 'Escaneo computarizado OBD-II, espesor de pintura y prueba de manejo.',
    'auto-ficha-carrusel': 'Deslizá para conocer el equipamiento completo.',
    'auto-electricos-0km': 'Autonomía, tecnología y el menor costo por kilómetro.',
    'auto-catalogo-semana': 'Selección de vehículos verificados listos para entrega.',
    'auto-rango-precio': 'Excelente relación precio-calidad con financiación.'
  };

  const defaultHashtagMap: Record<string, string> = {
    'detailing-antes-despues': '#DetailVlak',
    'detailing-promo': '#DetailVlak',
    'agenda-turnos-disponibles': '#DetailVlak'
  };

  const isDiscount = templateId === 'auto-descuento' && !!data.originalPrice;

  const tagY = isStory
    ? (isDiscount ? 1110 : showPriceDefault ? 1195 : 1260)
    : (isDiscount ? 900 : showPriceDefault ? 935 : 985);

  const titleY = isStory
    ? (isDiscount ? 1225 : showPriceDefault ? 1295 : 1360)
    : (isDiscount ? 975 : showPriceDefault ? 1010 : 1060);

  const barY = isStory
    ? (isDiscount ? 1285 : showPriceDefault ? 1345 : 1410)
    : (isDiscount ? 1015 : showPriceDefault ? 1050 : 1100);

  const modelY = isStory
    ? (isDiscount ? 1355 : showPriceDefault ? 1405 : 1470)
    : (isDiscount ? 1065 : showPriceDefault ? 1100 : 1150);

  const origPriceY = isStory ? 1425 : 1120;
  const priceY = isStory ? 1485 : 1170;

  const msgY = isStory ? 1555 : 1220;

  const lineY = isStory ? 1605 : 1255;
  const footerY = isStory ? 1640 : 1290;

  const badgeText = data.badgeTag || defaultBadgeMap[templateId] || 'STOCK CARVLAK';
  const stampText = data.stampText || defaultStampMap[templateId] || 'OPORTUNIDAD';
  const messageText = data.subtitle || (templateId === 'auto-descuento' ? discountDiffMessage : defaultMessageMap[templateId]) || '¡Gracias por confiar en nosotros!';
  const hashtagText = data.hashtag || defaultHashtagMap[templateId] || '#TuPróximoAuto';
  const locationText = data.locationName || 'Ciudad de la Costa, Canelones';
  const instagramText = data.instagramHandle || '@car.vlak';

  const elements: CanvasTextElement[] = [
    // 1. Logo oficial (editable en posición, escala y visibilidad)
    {
      id: 'logo',
      label: 'Logo CARVLAK',
      text: 'CARVLAK',
      visible: true,
      color: '#FFFFFF',
      fontSize: 36,
      fontWeight: 'bold',
      fontFamily: 'Archivo Narrow',
      rotation: 0,
      x: 60,
      y: isStory ? 80 : 70,
      align: 'left',
      bgType: 'none',
      bgColor: '#000000',
      bgOpacity: 0
    },
    // 2. Tag de Instagram superior derecho (apagado por defecto)
    {
      id: 'etiqueta_instagram',
      label: 'Instagram (@car.vlak)',
      text: instagramText,
      visible: false,
      color: '#FFFFFF',
      fontSize: isStory ? 20 : 18,
      fontWeight: 'semibold',
      fontFamily: 'Barlow Condensed',
      rotation: 0,
      x: 1080 - 60 - 90,
      y: isStory ? 80 : 70,
      align: 'center',
      bgType: 'box',
      bgColor: '#0a0a0a',
      bgOpacity: 0.75
    },
    // 3. Etiqueta superior
    {
      id: 'etiqueta',
      label: 'Etiqueta superior',
      text: badgeText,
      visible: true,
      color: '#FFFFFF',
      fontSize: isStory ? 18 : 15,
      fontWeight: 'bold',
      fontFamily: 'Archivo Narrow',
      rotation: 0,
      x: 60,
      y: tagY,
      align: 'left',
      bgType: 'box',
      bgColor: '#D7141A',
      bgOpacity: 1
    },
    // 4. Sello / Título principal
    {
      id: 'sello',
      label: 'Título principal',
      text: stampText.toUpperCase(),
      visible: true,
      color: '#FFFFFF',
      fontSize: isStory ? 96 : 76,
      fontWeight: 'black',
      fontFamily: 'Archivo Narrow',
      rotation: 0,
      x: 60,
      y: titleY,
      align: 'left',
      bgType: 'none',
      bgColor: '#000000',
      bgOpacity: 0
    },
    // 5. Barra roja deportiva
    {
      id: 'barra_roja',
      label: 'Barra roja deportiva',
      text: '━',
      visible: true,
      color: '#D7141A',
      fontSize: 16,
      fontWeight: 'bold',
      fontFamily: 'Archivo Narrow',
      rotation: 0,
      x: 60,
      y: barY,
      align: 'left',
      bgType: 'none',
      bgColor: '#D7141A',
      bgOpacity: 1
    },
    // 6. Modelo del vehículo
    {
      id: 'modelo',
      label: 'Modelo del vehículo',
      text: (data.carTitle || 'Vehículo').toUpperCase(),
      visible: true,
      color: '#FFFFFF',
      fontSize: isStory ? 48 : 38,
      fontWeight: 'bold',
      fontFamily: 'Archivo Narrow',
      rotation: 0,
      x: 60,
      y: modelY,
      align: 'left',
      bgType: 'none',
      bgColor: '#000000',
      bgOpacity: 0
    },
    // 7. Versión del vehículo (apagado por defecto)
    {
      id: 'version',
      label: 'Versión del vehículo',
      text: (data.version || '').toUpperCase(),
      visible: false,
      color: 'rgba(255, 255, 255, 0.88)',
      fontSize: isStory ? 28 : 22,
      fontWeight: 'semibold',
      fontFamily: 'Barlow Condensed',
      rotation: 0,
      x: 60,
      y: modelY + (isStory ? 45 : 35),
      align: 'left',
      bgType: 'none',
      bgColor: '#000000',
      bgOpacity: 0
    },
    // 8. Precio anterior tachado
    {
      id: 'precio_anterior',
      label: 'Precio anterior (tachado)',
      text: data.originalPrice || '',
      visible: templateId === 'auto-descuento' && !!data.originalPrice,
      color: '#8A8A8A',
      fontSize: isStory ? 32 : 26,
      fontWeight: 'bold',
      fontFamily: 'Archivo Narrow',
      rotation: 0,
      x: 60,
      y: origPriceY,
      align: 'left',
      bgType: 'none',
      bgColor: '#000000',
      bgOpacity: 0
    },
    // 9. Precio
    {
      id: 'precio',
      label: 'Precio',
      text: data.price || '',
      visible: showPriceDefault,
      color: '#FFFFFF',
      fontSize: isStory ? 68 : 54,
      fontWeight: 'black',
      fontFamily: 'Archivo Narrow',
      rotation: 0,
      x: 60,
      y: priceY,
      align: 'left',
      bgType: 'none',
      bgColor: '#000000',
      bgOpacity: 0
    },
    // 10. Mensaje / Bajada
    {
      id: 'subtitulo',
      label: 'Mensaje',
      text: messageText,
      visible: true,
      color: 'rgba(255, 255, 255, 0.88)',
      fontSize: isStory ? 26 : 21,
      fontWeight: 'semibold',
      fontFamily: 'Barlow Condensed',
      rotation: 0,
      x: 60,
      y: msgY,
      align: 'left',
      bgType: 'none',
      bgColor: '#000000',
      bgOpacity: 0
    },
    // 11. Llamado a la acción (apagado por defecto)
    {
      id: 'cta',
      label: 'Llamado a la acción',
      text: data.cta || 'Consultá por WhatsApp',
      visible: false,
      color: '#FFFFFF',
      fontSize: isStory ? 22 : 18,
      fontWeight: 'bold',
      fontFamily: 'Barlow Condensed',
      rotation: 0,
      x: 60,
      y: msgY + (isStory ? 45 : 35),
      align: 'left',
      bgType: 'box',
      bgColor: '#D7141A',
      bgOpacity: 0.95
    },
    // 12. Línea divisoria
    {
      id: 'linea_divisoria',
      label: 'Línea divisoria',
      text: '─',
      visible: true,
      color: '#3A3A3A',
      fontSize: 14,
      fontWeight: 'normal',
      fontFamily: 'Archivo Narrow',
      rotation: 0,
      x: 60,
      y: lineY,
      align: 'left',
      bgType: 'none',
      bgColor: '#3A3A3A',
      bgOpacity: 1
    },
    // 13. Ubicación (pie)
    {
      id: 'pie_ubicacion',
      label: 'Ubicación (pie)',
      text: locationText,
      visible: true,
      color: '#FFFFFF',
      fontSize: isStory ? 22 : 18,
      fontWeight: 'semibold',
      fontFamily: 'Barlow Condensed',
      rotation: 0,
      x: 60,
      y: footerY,
      align: 'left',
      bgType: 'none',
      bgColor: '#000000',
      bgOpacity: 0
    },
    // 14. Hashtag (pie)
    {
      id: 'pie_hashtag',
      label: 'Hashtag (pie)',
      text: hashtagText,
      visible: true,
      color: '#8A8A8A',
      fontSize: isStory ? 20 : 16,
      fontWeight: 'semibold',
      fontFamily: 'Barlow Condensed',
      rotation: 0,
      x: 1080 - 60,
      y: footerY,
      align: 'right',
      bgType: 'none',
      bgColor: '#000000',
      bgOpacity: 0
    },
    // 15. Pie de marca (apagado por defecto)
    {
      id: 'pie_marca',
      label: 'Pie de marca',
      text: 'CARVLAK Group • @car.vlak',
      visible: false,
      color: '#8A8A8A',
      fontSize: isStory ? 18 : 15,
      fontWeight: 'semibold',
      fontFamily: 'Barlow Condensed',
      rotation: 0,
      x: 540,
      y: isStory ? 1870 : 1315,
      align: 'center',
      bgType: 'none',
      bgColor: '#000000',
      bgOpacity: 0
    },
    // Ficha técnica adicional (oculta por defecto)
    {
      id: 'specs_km',
      label: 'Kilometraje',
      text: data.specs?.find((s) => s.key === 'mileage')?.text || '0 km',
      visible: false,
      isSpec: true,
      specKey: 'mileage',
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: 'bold',
      fontFamily: 'Archivo Narrow',
      rotation: 0,
      x: 60,
      y: isStory ? 1795 : 1255,
      align: 'left',
      bgType: 'box',
      bgColor: '#141414',
      bgOpacity: 0.85
    },
    {
      id: 'specs_combustible',
      label: 'Combustible',
      text: data.specs?.find((s) => s.key === 'fuel')?.text || 'Nafta',
      visible: false,
      isSpec: true,
      specKey: 'fuel',
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: 'bold',
      fontFamily: 'Archivo Narrow',
      rotation: 0,
      x: 200,
      y: isStory ? 1795 : 1255,
      align: 'left',
      bgType: 'box',
      bgColor: '#141414',
      bgOpacity: 0.85
    },
    {
      id: 'specs_transmision',
      label: 'Transmisión',
      text: data.specs?.find((s) => s.key === 'transmission')?.text || 'Manual',
      visible: false,
      isSpec: true,
      specKey: 'transmission',
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: 'bold',
      fontFamily: 'Archivo Narrow',
      rotation: 0,
      x: 340,
      y: isStory ? 1795 : 1255,
      align: 'left',
      bgType: 'box',
      bgColor: '#141414',
      bgOpacity: 0.85
    },
    {
      id: 'specs_anio',
      label: 'Año',
      text: data.specs?.find((s) => s.key === 'year')?.text || '',
      visible: false,
      isSpec: true,
      specKey: 'year',
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: 'bold',
      fontFamily: 'Archivo Narrow',
      rotation: 0,
      x: 480,
      y: isStory ? 1795 : 1255,
      align: 'left',
      bgType: 'box',
      bgColor: '#141414',
      bgOpacity: 0.85
    }
  ];

  return elements;
}
