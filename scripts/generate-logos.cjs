const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodeRGBA(width, height, rgba) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const scanlineLen = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineLen);
  for (let y = 0; y < height; y++) {
    rawData[y * scanlineLen] = 0; // Filter None
    rgba.copy(rawData, y * scanlineLen + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(rawData);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  return Buffer.concat([
    header,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

function unfilterPNG(raw, width, height, bpp) {
  const scanlineLen = 1 + width * bpp;
  const out = Buffer.alloc(width * height * bpp);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * scanlineLen];
    const prev = (y - 1) * width * bpp;
    const curr = y * width * bpp;
    for (let i = 0; i < width * bpp; i++) {
      const rawByte = raw[y * scanlineLen + 1 + i];
      const a = (i >= bpp) ? out[curr + i - bpp] : 0;
      const b = (y > 0) ? out[prev + i] : 0;
      const c = (y > 0 && i >= bpp) ? out[prev + i - bpp] : 0;
      let val = 0;
      if (filter === 0) val = rawByte;
      else if (filter === 1) val = (rawByte + a) & 0xff;
      else if (filter === 2) val = (rawByte + b) & 0xff;
      else if (filter === 3) val = (rawByte + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
        val = (rawByte + pr) & 0xff;
      }
      out[curr + i] = val;
    }
  }
  return out;
}

function readPNG(filePath) {
  const buf = fs.readFileSync(filePath);
  let pos = 8, w = 0, h = 0, idats = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') {
      w = buf.readUInt32BE(pos + 8);
      h = buf.readUInt32BE(pos + 12);
    } else if (type === 'IDAT') {
      idats.push(buf.subarray(pos + 8, pos + 8 + len));
    }
    pos += 12 + len;
  }
  const decomp = zlib.inflateSync(Buffer.concat(idats));
  const bpp = buf[25] === 6 ? 4 : 3;
  const pixels = unfilterPNG(decomp, w, h, bpp);
  return { width: w, height: h, pixels, bpp };
}

// Resampling helper (bilinear interpolation)
function resample(srcPixels, srcW, srcH, dstW, dstH) {
  const dst = Buffer.alloc(dstW * dstH * 4);
  const xRatio = (srcW - 1) / (dstW > 1 ? dstW - 1 : 1);
  const yRatio = (srcH - 1) / (dstH > 1 ? dstH - 1 : 1);

  for (let y = 0; y < dstH; y++) {
    const srcY = y * yRatio;
    const yFloor = Math.floor(srcY);
    const yCeil = Math.min(srcH - 1, yFloor + 1);
    const dy = srcY - yFloor;

    for (let x = 0; x < dstW; x++) {
      const srcX = x * xRatio;
      const xFloor = Math.floor(srcX);
      const xCeil = Math.min(srcW - 1, xFloor + 1);
      const dx = srcX - xFloor;

      const idx00 = (yFloor * srcW + xFloor) * 4;
      const idx10 = (yFloor * srcW + xCeil) * 4;
      const idx01 = (yCeil * srcW + xFloor) * 4;
      const idx11 = (yCeil * srcW + xCeil) * 4;

      const dstIdx = (y * dstW + x) * 4;

      for (let c = 0; c < 4; c++) {
        const top = srcPixels[idx00 + c] * (1 - dx) + srcPixels[idx10 + c] * dx;
        const bot = srcPixels[idx01 + c] * (1 - dx) + srcPixels[idx11 + c] * dx;
        dst[dstIdx + c] = Math.round(top * (1 - dy) + bot * dy);
      }
    }
  }
  return dst;
}

const srcFile = 'C:/Users/maxim/.gemini/antigravity/brain/ce2ef36d-3467-4b3a-844a-c65ff104a18b/.user_uploaded/media_1790525620668.png';
const src = readPNG(srcFile);
console.log('Source loaded:', src.width, 'x', src.height);

// 1. CARVLAK LOGO NEGRO
const logoNegroBuf = fs.readFileSync(srcFile);

// 2. CARVLAK LOGO BLANCO
const whitePixels = Buffer.alloc(src.width * src.height * 4);
for (let i = 0; i < src.width * src.height; i++) {
  const alpha = src.pixels[i * 4 + 3];
  whitePixels[i * 4] = 255;
  whitePixels[i * 4 + 1] = 255;
  whitePixels[i * 4 + 2] = 255;
  whitePixels[i * 4 + 3] = alpha;
}
const logoBlancoBuf = encodeRGBA(src.width, src.height, whitePixels);

// 3. CARVLAK ICONO
// Crop the icon part: x from 7 to 181, y from 7 to 114
const iconCropW = 181 - 7 + 1; // 175
const iconCropH = 114 - 7 + 1; // 108
const iconCrop = Buffer.alloc(iconCropW * iconCropH * 4);
for (let y = 0; y < iconCropH; y++) {
  for (let x = 0; x < iconCropW; x++) {
    const srcIdx = ((7 + y) * src.width + (7 + x)) * 4;
    const dstIdx = (y * iconCropW + x) * 4;
    iconCrop[dstIdx] = src.pixels[srcIdx];
    iconCrop[dstIdx + 1] = src.pixels[srcIdx + 1];
    iconCrop[dstIdx + 2] = src.pixels[srcIdx + 2];
    iconCrop[dstIdx + 3] = src.pixels[srcIdx + 3];
  }
}

// Function to generate a square icon with centered mark
function makeSquareIcon(targetSize, paddingRatio = 0.12) {
  const square = Buffer.alloc(targetSize * targetSize * 4, 0); // transparent
  const innerMax = Math.round(targetSize * (1 - 2 * paddingRatio));
  const scale = Math.min(innerMax / iconCropW, innerMax / iconCropH);
  const drawW = Math.round(iconCropW * scale);
  const drawH = Math.round(iconCropH * scale);
  const scaled = resample(iconCrop, iconCropW, iconCropH, drawW, drawH);

  const startX = Math.round((targetSize - drawW) / 2);
  const startY = Math.round((targetSize - drawH) / 2);

  for (let y = 0; y < drawH; y++) {
    for (let x = 0; x < drawW; x++) {
      const srcIdx = (y * drawW + x) * 4;
      const dstIdx = ((startY + y) * targetSize + (startX + x)) * 4;
      square[dstIdx] = scaled[srcIdx];
      square[dstIdx + 1] = scaled[srcIdx + 1];
      square[dstIdx + 2] = scaled[srcIdx + 2];
      square[dstIdx + 3] = scaled[srcIdx + 3];
    }
  }
  return encodeRGBA(targetSize, targetSize, square);
}

// Function to generate maskable icon (with white/light background padding safe area)
function makeMaskableIcon(targetSize) {
  const square = Buffer.alloc(targetSize * targetSize * 4);
  for (let i = 0; i < targetSize * targetSize; i++) {
    square[i * 4] = 255;
    square[i * 4 + 1] = 255;
    square[i * 4 + 2] = 255;
    square[i * 4 + 3] = 255;
  }
  const innerMax = Math.round(targetSize * 0.65); // 65% safe zone for maskable
  const scale = Math.min(innerMax / iconCropW, innerMax / iconCropH);
  const drawW = Math.round(iconCropW * scale);
  const drawH = Math.round(iconCropH * scale);
  const scaled = resample(iconCrop, iconCropW, iconCropH, drawW, drawH);

  const startX = Math.round((targetSize - drawW) / 2);
  const startY = Math.round((targetSize - drawH) / 2);

  for (let y = 0; y < drawH; y++) {
    for (let x = 0; x < drawW; x++) {
      const srcIdx = (y * drawW + x) * 4;
      const dstIdx = ((startY + y) * targetSize + (startX + x)) * 4;
      const a = scaled[srcIdx + 3] / 255;
      square[dstIdx] = Math.round(scaled[srcIdx] * a + 255 * (1 - a));
      square[dstIdx + 1] = Math.round(scaled[srcIdx + 1] * a + 255 * (1 - a));
      square[dstIdx + 2] = Math.round(scaled[srcIdx + 2] * a + 255 * (1 - a));
      square[dstIdx + 3] = 255;
    }
  }
  return encodeRGBA(targetSize, targetSize, square);
}

// Simple ICO generator for 32x32 and 16x16
function makeIco(png32, png16) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(2, 4); // 2 images

  const entry1 = Buffer.alloc(16);
  entry1.writeUInt8(32, 0); // width
  entry1.writeUInt8(32, 1); // height
  entry1.writeUInt8(0, 2);  // color palette
  entry1.writeUInt8(0, 3);  // reserved
  entry1.writeUInt16LE(1, 4); // color planes
  entry1.writeUInt16LE(32, 6); // bpp
  entry1.writeUInt32LE(png32.length, 8); // size
  entry1.writeUInt32LE(6 + 16 * 2, 12); // offset

  const entry2 = Buffer.alloc(16);
  entry2.writeUInt8(16, 0); // width
  entry2.writeUInt8(16, 1); // height
  entry2.writeUInt8(0, 2);  // color palette
  entry2.writeUInt8(0, 3);  // reserved
  entry2.writeUInt16LE(1, 4); // color planes
  entry2.writeUInt16LE(32, 6); // bpp
  entry2.writeUInt32LE(png16.length, 8); // size
  entry2.writeUInt32LE(6 + 16 * 2 + png32.length, 12); // offset

  return Buffer.concat([header, entry1, entry2, png32, png16]);
}

const icon512 = makeSquareIcon(512);
const icon192 = makeSquareIcon(192);
const icon180 = makeSquareIcon(180);
const icon32 = makeSquareIcon(32, 0.05);
const icon16 = makeSquareIcon(16, 0.05);
const iconMaskable = makeMaskableIcon(512);
const ico = makeIco(icon32, icon16);

// Targets:
// 1. carvlak-diseno
const disenoDir = path.resolve(__dirname, '../carvlak-diseno');
fs.writeFileSync(path.join(disenoDir, 'carvlak-logo-negro.png'), logoNegroBuf);
fs.writeFileSync(path.join(disenoDir, 'carvlak-logo-blanco.png'), logoBlancoBuf);
fs.writeFileSync(path.join(disenoDir, 'carvlak-icono.png'), icon512);

// 2. public/
const pubDir = path.resolve(__dirname, '../public');
const iconsDir = path.join(pubDir, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

fs.writeFileSync(path.join(pubDir, 'carvlak-logo-negro.png'), logoNegroBuf);
fs.writeFileSync(path.join(pubDir, 'carvlak-logo-blanco.png'), logoBlancoBuf);
fs.writeFileSync(path.join(pubDir, 'carvlak-icono.png'), icon512);
fs.writeFileSync(path.join(pubDir, 'logo-carvlak-black.png'), logoNegroBuf);
fs.writeFileSync(path.join(pubDir, 'logo-carvlak-white.png'), logoBlancoBuf);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), icon512);
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), icon192);
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512.png'), iconMaskable);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), icon180);
fs.writeFileSync(path.join(pubDir, 'favicon.ico'), ico);

// Also generate SVG wrappers so any existing svg references don't fail
const b64Black = logoNegroBuf.toString('base64');
const svgBlack = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + src.width + ' ' + src.height + '" width="100%" height="100%">\n  <image href="data:image/png;base64,' + b64Black + '" width="' + src.width + '" height="' + src.height + '" />\n</svg>';
fs.writeFileSync(path.join(pubDir, 'logo-carvlak-black.svg'), svgBlack);

const b64White = logoBlancoBuf.toString('base64');
const svgWhite = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + src.width + ' ' + src.height + '" width="100%" height="100%">\n  <image href="data:image/png;base64,' + b64White + '" width="' + src.width + '" height="' + src.height + '" />\n</svg>';
fs.writeFileSync(path.join(pubDir, 'logo-carvlak-white.svg'), svgWhite);

console.log('ALL LOGO AND ICON ASSETS GENERATED SUCCESSFULLY!');
