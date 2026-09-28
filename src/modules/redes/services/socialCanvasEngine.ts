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

        const halfHeight = height / 2;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, width, halfHeight);
        ctx.clip();
        drawImageCover(ctx, imgBefore, 0, 0, width, halfHeight, imagePan);
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, halfHeight, width, halfHeight);
        ctx.clip();
        drawImageCover(ctx, imgAfter, 0, halfHeight, width, halfHeight, imagePan);
        ctx.restore();

        ctx.fillStyle = '#D7141A';
        ctx.fillRect(0, halfHeight - 3, width, 6);

        drawPill(ctx, 40, halfHeight - 65, 140, 42, '#000000', '#D7141A', 'ANTES');
        drawPill(ctx, 40, halfHeight + 25, 160, 42, '#D7141A', '#FFFFFF', 'DESPUÉS');
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

  // 6. Header con Logo y Marca
  await drawBrandHeader(ctx, width, height, effectiveLogoPosition, instagramHandle, locationName, isLightBg, effectiveLogoVersion);

  // 7. Contenido según la plantilla específica o elementos individuales configurados
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
      layoutConfig
    });
  }

  // 8. Footer unificado con @car.vlak y llamado a la acción
  drawFooterBar(ctx, width, height, instagramHandle, locationName, layoutConfig?.ctaText, layoutConfig?.phoneText);

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

  // Cápsula superior derecha: @car.vlak (legible en celular, 24px)
  if (logoPos !== 'top-right') {
    const badgeW = 250;
    const badgeH = 56;
    const badgeX = w - pad - badgeW;
    const badgeY = pad + 4;

    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 28);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fill();
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Icono Instagram simulado / texto
    ctx.save();
    ctx.font = '700 24px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#D7141A';
    ctx.fillText('@', badgeX + 22, badgeY + 36);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 24px system-ui, -apple-system, sans-serif';
    ctx.letterSpacing = '0.5px';
    ctx.fillText(instagramHandle.replace('@', ''), badgeX + 48, badgeY + 36);
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
    detailingServices,
    layoutConfig
  } = data;

  const pad = 60;
  const isStory = format === 'story';

  // Configuración de estilo extraída de layoutConfig
  const showStamp = layoutConfig?.showStamp !== undefined ? layoutConfig.showStamp : true;
  const customStampText = layoutConfig?.stampText || stampText;
  const customStampColor = layoutConfig?.stampColor;
  const customStampRotation = layoutConfig?.stampRotation;
  const fontFamily = layoutConfig?.fontFamily || 'Archivo Narrow';
  const fontScale = layoutConfig?.fontScale || 'normal';
  const showPrice = layoutConfig?.showPrice !== undefined ? layoutConfig.showPrice : true;
  const showOriginalPrice = layoutConfig?.showOriginalPrice !== undefined ? layoutConfig.showOriginalPrice : true;
  const priceColor = layoutConfig?.priceColor || '#D7141A';

  // 1. SELLOS DE ALTO IMPACTO (VENDIDO, RESERVADO, NUEVO INGRESO, ETC.)
  if (showStamp) {
    if (layoutConfig?.stampText) {
      drawHighImpactStamp(
        ctx,
        540,
        isStory ? 700 : 480,
        layoutConfig.stampText,
        customStampColor || '#D7141A',
        customStampRotation ?? -12,
        fontFamily,
        width,
        height
      );
    } else if (templateId === 'auto-vendido') {
      drawHighImpactStamp(
        ctx,
        540,
        isStory ? 700 : 480,
        customStampText || 'VENDIDO',
        customStampColor || '#D7141A',
        customStampRotation ?? -12,
        fontFamily,
        width,
        height
      );
    } else if (templateId === 'auto-reservado') {
      drawHighImpactStamp(
        ctx,
        540,
        isStory ? 700 : 480,
        customStampText || 'RESERVADO',
        customStampColor || '#eab308',
        customStampRotation ?? -8,
        fontFamily,
        width,
        height
      );
    } else if (templateId === 'auto-descuento') {
      drawHighImpactStamp(
        ctx,
        840,
        isStory ? 450 : 320,
        customStampText || 'OPORTUNIDAD',
        customStampColor || '#D7141A',
        customStampRotation ?? 14,
        fontFamily,
        width,
        height
      );
    } else if (templateId === 'auto-nuevo-ingreso') {
      drawTagPill(ctx, pad, isStory ? 1220 : 800, customStampText || 'NUEVO INGRESO', customStampColor || '#D7141A', fontFamily);
    } else if (templateId === 'auto-electricos-0km') {
      drawTagPill(ctx, pad, isStory ? 1220 : 800, customStampText || '100% ELÉCTRICO • 0KM', customStampColor || '#22c55e', fontFamily);
    } else if (templateId === 'auto-entrega') {
      drawHighImpactStamp(
        ctx,
        540,
        isStory ? 650 : 440,
        customStampText || '¡NUEVO DUEÑO!',
        customStampColor || '#D7141A',
        customStampRotation ?? -6,
        fontFamily,
        width,
        height
      );
    } else if (badgeTag) {
      drawTagPill(ctx, pad, isStory ? 1220 : 800, badgeTag, '#D7141A', fontFamily);
    }
  }

  // 2. Posición vertical de textos principales (anclados en la parte inferior)
  const baseY = height - (isStory ? 240 : 180);

  // 3. Render según la categoría o plantilla
  if (templateId === 'auto-descuento') {
    // Bloque de precios con tacha
    let currentY = baseY;

    if (price && showPrice) {
      currentY -= 70;
      ctx.save();
      // Si hay precio anterior, tacharlo
      if (originalPrice && showOriginalPrice) {
        const fontName = fontFamily === 'Barlow Condensed' ? '"Barlow Condensed"' : fontFamily === 'Archivo Narrow' ? '"Archivo Narrow"' : 'system-ui';
        ctx.font = `700 32px ${fontName}, sans-serif`;
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

      // Precio nuevo destacado
      const fontName = fontFamily === 'Barlow Condensed' ? '"Barlow Condensed"' : fontFamily === 'Archivo Narrow' ? '"Archivo Narrow"' : 'system-ui';
      ctx.font = `900 68px ${fontName}, sans-serif`;
      ctx.fillStyle = priceColor;
      ctx.fillText(price, pad, currentY);
      ctx.restore();
    }

    // Título y specs arriba del precio
    const titleY = currentY - (price && showPrice ? 120 : 60);
    drawTitleAndSpecs(ctx, pad, titleY, headline, subtitle, specs, fontFamily, fontScale);

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
    drawTagPill(ctx, pad + 30, boxY + 35, 'AGENDA ABIERTA', '#D7141A', fontFamily);

    ctx.save();
    const fontName = fontFamily === 'Barlow Condensed' ? '"Barlow Condensed"' : fontFamily === 'Archivo Narrow' ? '"Archivo Narrow"' : 'system-ui';
    ctx.font = `900 42px ${fontName}, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(headline || 'Turnos Disponibles Esta Semana', pad + 30, boxY + 120);

    ctx.font = `500 22px ${fontName}, sans-serif`;
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
      ctx.font = `600 24px ${fontName}, sans-serif`;
      ctx.fillText(s, pad + 70, itemY);
      itemY += 55;
    });

    // Llamado a agendar
    ctx.fillStyle = '#D7141A';
    ctx.font = `700 24px ${fontName}, sans-serif`;
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

    drawTagPill(ctx, pad + 30, boxY + 35, 'INSPECCIÓN PRECOMPRA APROBADA', '#D7141A', fontFamily);

    ctx.save();
    const fontName = fontFamily === 'Barlow Condensed' ? '"Barlow Condensed"' : fontFamily === 'Archivo Narrow' ? '"Archivo Narrow"' : 'system-ui';
    ctx.font = `900 40px ${fontName}, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(headline || 'Peritaje Técnico de 120+ Puntos', pad + 30, boxY + 120);

    ctx.font = `500 22px ${fontName}, sans-serif`;
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
      ctx.font = `600 23px ${fontName}, sans-serif`;
      ctx.fillText(p, pad + 70, pointY);
      pointY += 52;
    });

    ctx.fillStyle = '#8A8A8A';
    ctx.font = `500 18px ${fontName}, sans-serif`;
    ctx.fillText('🛡️ Comprá tu próximo auto usado con total tranquilidad y respaldo.', pad + 30, pointY + 20);
    ctx.restore();

  } else if (templateId === 'auto-ficha-carrusel') {
    // Ficha de carrusel: specs en tarjetas elegantes
    const titleY = isStory ? 1050 : 680;
    drawTitleAndSpecs(ctx, pad, titleY, headline, subtitle, specs, fontFamily, fontScale);

    if (price && showPrice) {
      drawPriceTag(ctx, pad, isStory ? 1420 : 960, price, priceColor, fontFamily);
    }

    // Indicador "Deslizá para más ➡️"
    const swipeY = isStory ? 1560 : 1080;
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    const fontName = fontFamily === 'Barlow Condensed' ? '"Barlow Condensed"' : fontFamily === 'Archivo Narrow' ? '"Archivo Narrow"' : 'system-ui';
    ctx.font = `700 22px ${fontName}, sans-serif`;
    ctx.fillText('Deslizá para ver más fotos ➡️', pad, swipeY);
    ctx.restore();

  } else {
    // Plantillas estándar (auto-vendido, auto-nuevo-ingreso, auto-reservado, promo-detailing, etc.)
    const titleY = baseY - (price && showPrice ? 110 : 40);
    drawTitleAndSpecs(ctx, pad, titleY, headline, subtitle, specs, fontFamily, fontScale);

    if (price && showPrice) {
      drawPriceTag(ctx, pad, baseY, price, priceColor, fontFamily);
    }
  }
}

/**
 * Dibuja un gran sello inclinado de alto impacto (Vendido, Reservado, Oferta) con auto-ajuste de márgenes seguros
 */
function drawHighImpactStamp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  text: string,
  color: string,
  angleDeg: number,
  fontFamily: string = 'Archivo Narrow',
  canvasWidth: number = 1080,
  canvasHeight: number = 1920
) {
  const fontName = fontFamily === 'Barlow Condensed' ? '"Barlow Condensed"' : fontFamily === 'Archivo Narrow' ? '"Archivo Narrow"' : 'system-ui';
  ctx.save();
  ctx.font = `900 66px ${fontName}, sans-serif`;
  const textMetrics = ctx.measureText(text);
  const padX = 40;
  const padY = 20;
  const boxW = textMetrics.width + padX * 2;
  const boxH = 90;

  // Cálculo de dimensiones efectivas rotadas para evitar desbordes fuera del canvas
  const rad = (Math.abs(angleDeg) * Math.PI) / 180;
  const halfEffectiveW = (boxW / 2) * Math.cos(rad) + (boxH / 2) * Math.sin(rad);
  const halfEffectiveH = (boxW / 2) * Math.sin(rad) + (boxH / 2) * Math.cos(rad);

  const safeMarginX = 60;
  const safeMarginY = 70;
  const clampedX = Math.max(safeMarginX + halfEffectiveW, Math.min(canvasWidth - safeMarginX - halfEffectiveW, cx));
  const clampedY = Math.max(safeMarginY + halfEffectiveH, Math.min(canvasHeight - safeMarginY - halfEffectiveH, cy));

  ctx.translate(clampedX, clampedY);
  ctx.rotate((angleDeg * Math.PI) / 180);

  // Sombra de fondo
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;

  // Marco exterior
  roundRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 16);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
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
  bgColor: string,
  fontFamily: string = 'Archivo Narrow'
) {
  ctx.save();
  const fontName = fontFamily === 'Barlow Condensed' ? '"Barlow Condensed"' : fontFamily === 'Archivo Narrow' ? '"Archivo Narrow"' : 'system-ui';
  ctx.font = `900 20px ${fontName}, sans-serif`;
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
  specs: string[],
  fontFamily: string = 'Archivo Narrow',
  fontScale: 'normal' | 'large' | 'xlarge' = 'normal'
) {
  ctx.save();

  const fontName = fontFamily === 'Barlow Condensed' ? '"Barlow Condensed"' : fontFamily === 'Archivo Narrow' ? '"Archivo Narrow"' : 'system-ui';
  const titleSize = fontScale === 'xlarge' ? 62 : fontScale === 'large' ? 56 : 52;
  const subSize = fontScale === 'xlarge' ? 30 : fontScale === 'large' ? 28 : 26;
  const chipSize = fontScale === 'xlarge' ? 20 : fontScale === 'large' ? 19 : 18;

  // Título principal (Modelo y Marca)
  ctx.font = `900 ${titleSize}px ${fontName}, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.fillText(title || 'Vehículo Seleccionado', x, y);

  // Subtítulo
  if (subtitle) {
    ctx.font = `600 ${subSize}px ${fontName}, sans-serif`;
    ctx.fillStyle = '#8A8A8A';
    ctx.fillText(subtitle, x, y + Math.round(titleSize * 0.8));
  }

  // Chips de especificaciones
  if (specs && specs.length > 0) {
    let chipX = x;
    const chipY = y + (subtitle ? Math.round(titleSize * 0.8) + 36 : 36);

    ctx.font = `700 ${chipSize}px ${fontName}, sans-serif`;
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
  price: string,
  color: string = '#D7141A',
  fontFamily: string = 'Archivo Narrow'
) {
  ctx.save();
  const fontName = fontFamily === 'Barlow Condensed' ? '"Barlow Condensed"' : fontFamily === 'Archivo Narrow' ? '"Archivo Narrow"' : 'system-ui';
  ctx.font = `900 64px ${fontName}, sans-serif`;
  ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillText(price, x, y);
  ctx.restore();
}

/**
 * Dibuja la barra inferior de pie con datos de contacto y ubicación (legible en celular, 26px)
 */
function drawFooterBar(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  instagramHandle: string,
  locationName: string,
  ctaText?: string,
  phoneText?: string
) {
  const barH = 85;
  const barY = h - barH;

  ctx.save();
  // Fondo de barra inferior
  ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
  ctx.fillRect(0, barY, w, barH);

  // Línea roja superior distintiva CARVLAK
  ctx.fillStyle = '#D7141A';
  ctx.fillRect(0, barY, w, 3);

  // Textos del footer con alto contraste y tamaño mínimo legible en celular
  ctx.font = '700 26px "Archivo Narrow", system-ui, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'middle';
  const leftText = ctaText ? `${ctaText}  •  ${instagramHandle}` : `CARVLAK Group  •  ${instagramHandle}`;
  ctx.fillText(leftText, 60, barY + barH / 2);

  ctx.textAlign = 'right';
  ctx.font = '600 24px "Barlow Condensed", system-ui, sans-serif';
  ctx.fillStyle = '#D1D5DB';
  const rightText = phoneText ? `📞 ${phoneText}  •  📍 ${locationName}` : `📍 ${locationName}`;
  ctx.fillText(rightText, w - 60, barY + barH / 2);

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
  const weight = element.fontWeight === 'black'
    ? 900
    : element.fontWeight === 'bold'
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
  const boxW = textWidth + padX * 2;
  const boxH = textHeight + padY * 2;

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
  ctx.fillStyle = element.color;
  ctx.textAlign = element.align;
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = element.id === 'sello' ? '3px' : 'normal';
  ctx.fillText(element.text, 0, 0);

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
  ctx.fillText('⚠️ Zona no segura Instagram Stories (250px superior)', w / 2, topSafe - 35);

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
  ctx.fillText('⚠️ Zona no segura Instagram Stories (250px inferior)', w / 2, botY + 45);

  ctx.restore();
}

/**
 * Detecta de forma heurística si una foto es un flyer o tiene texto impreso (ej. fichas de Tiendanube)
 */
export function isLikelyFlyerImage(url: string, index?: number, hasMultiplePhotos?: boolean): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (
    lower.includes('flyer') ||
    lower.includes('freedom') ||
    lower.includes('ficha') ||
    lower.includes('promo') ||
    lower.includes('especificaciones') ||
    lower.includes('banner')
  ) {
    return true;
  }
  if (index === 0 && hasMultiplePhotos && (lower.includes('mitiendanube') || lower.includes('tiendanube'))) {
    return true;
  }
  return false;
}

/**
 * Genera la lista de elementos de texto independientes con los criterios oficiales:
 * - SOLO el modelo visible por defecto
 * - Subtítulo y especificaciones ocultos por defecto (activables vía switch)
 * - Precio visible sólo en plantillas de venta / oferta
 */
export function getDefaultTextElements(
  templateId: string,
  format: SocialMediaFormat,
  data: {
    carTitle?: string;
    price?: string;
    originalPrice?: string;
    stampText?: string;
    subtitle?: string;
    specs?: { key: string; label: string; text: string }[];
  }
): CanvasTextElement[] {
  const isStory = format === 'story';
  const showPriceDefault = [
    'auto-descuento',
    'auto-nuevo-ingreso',
    'auto-ficha-carrusel',
    'auto-electricos-0km',
    'auto-rango-precio',
    'detailing-promo'
  ].includes(templateId);

  const defaultStampMap: Record<string, string> = {
    'auto-vendido': 'VENDIDO',
    'auto-reservado': 'RESERVADO',
    'auto-descuento': 'OPORTUNIDAD',
    'auto-nuevo-ingreso': 'NUEVO INGRESO',
    'auto-electricos-0km': '100% ELÉCTRICO',
    'auto-entrega': '¡NUEVO DUEÑO!',
    'auto-ficha-carrusel': 'EN STOCK',
    'detailing-antes-despues': 'TRANSFORMACIÓN',
    'detailing-promo': 'PROMO EXCLUSIVA',
    'agenda-turnos-disponibles': 'AGENDA ABIERTA',
    'inspeccion-precompra': 'COMPRÁ SEGURO'
  };

  const stampColor = templateId === 'auto-reservado'
    ? '#EAB308'
    : templateId === 'auto-electricos-0km'
    ? '#22C55E'
    : '#D7141A';

  const stampRotation = templateId === 'auto-descuento' ? 14 : templateId === 'auto-reservado' ? -8 : -12;
  const stampX = templateId === 'auto-descuento' ? 760 : 540;
  const stampY = isStory ? (templateId === 'auto-descuento' ? 450 : 700) : (templateId === 'auto-descuento' ? 320 : 480);

  const elements: CanvasTextElement[] = [
    {
      id: 'sello',
      label: 'Texto del sello',
      text: data.stampText || defaultStampMap[templateId] || 'DESTACADO',
      visible: true,
      color: stampColor,
      fontSize: isStory ? 64 : 52,
      fontWeight: 'bold',
      fontFamily: 'Archivo Narrow',
      rotation: stampRotation,
      x: stampX,
      y: stampY,
      align: 'center',
      bgType: 'box',
      bgColor: '#000000',
      bgOpacity: 0.88
    },
    {
      id: 'modelo',
      label: 'Modelo del vehículo',
      text: data.carTitle || 'Vehículo Seleccionado',
      visible: true, // Único elemento visible por defecto
      color: '#FFFFFF',
      fontSize: isStory ? 52 : 44,
      fontWeight: 'bold',
      fontFamily: 'Archivo Narrow',
      rotation: 0,
      x: 60,
      y: isStory ? 1600 : 1080,
      align: 'left',
      bgType: 'none',
      bgColor: '#000000',
      bgOpacity: 0.5
    },
    {
      id: 'subtitulo',
      label: 'Subtítulo / Versión / Año',
      text: data.subtitle || '',
      visible: false, // Oculto por defecto
      color: '#8A8A8A',
      fontSize: isStory ? 26 : 22,
      fontWeight: 'semibold',
      fontFamily: 'Archivo Narrow',
      rotation: 0,
      x: 60,
      y: isStory ? 1655 : 1130,
      align: 'left',
      bgType: 'none',
      bgColor: '#000000',
      bgOpacity: 0.5
    },
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
      y: isStory ? 1690 : 1160,
      align: 'left',
      bgType: 'none',
      bgColor: '#000000',
      bgOpacity: 0.5
    },
    {
      id: 'precio',
      label: 'Precio visible',
      text: data.price || '',
      visible: showPriceDefault,
      color: '#D7141A',
      fontSize: isStory ? 64 : 52,
      fontWeight: 'black',
      fontFamily: 'Archivo Narrow',
      rotation: 0,
      x: 60,
      y: isStory ? 1750 : 1220,
      align: 'left',
      bgType: 'none',
      bgColor: '#000000',
      bgOpacity: 0.5
    },
    // Fichas técnicas ocultas por defecto (activables en el panel)
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
    },
    {
      id: 'cta',
      label: 'Llamado a la acción (CTA)',
      text: '📲 Consultá por WhatsApp',
      visible: false,
      color: '#FFFFFF',
      fontSize: 22,
      fontWeight: 'bold',
      fontFamily: 'Archivo Narrow',
      rotation: 0,
      x: 540,
      y: isStory ? 1835 : 1285,
      align: 'center',
      bgType: 'box',
      bgColor: '#D7141A',
      bgOpacity: 0.95
    }
  ];

  return elements;
}
