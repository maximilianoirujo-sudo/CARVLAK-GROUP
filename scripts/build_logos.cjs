const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c;
}
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const toCrc = Buffer.alloc(4 + len);
  toCrc.write(type, 0, 4, 'ascii');
  data.copy(toCrc, 4);
  buf.writeUInt32BE(crc32(toCrc), 8 + len);
  return buf;
}
function encodeRGBA(width, height, rgbaBuffer) {
  const scanlineLen = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineLen);
  for (let y = 0; y < height; y++) {
    rawData[y * scanlineLen] = 0;
    rgbaBuffer.copy(rawData, y * scanlineLen + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(rawData);
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  return Buffer.concat([header, makeChunk('IHDR', ihdr), makeChunk('IDAT', compressed), makeChunk('IEND', Buffer.alloc(0))]);
}

function unfilterPNG(raw, width, height, bpp) {
  const scanlineLen = 1 + width * bpp;
  const out = Buffer.alloc(width * height * bpp);
  function paeth(a, b, c) {
    const p = a + b - c;
    const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
  }
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
      else if (filter === 4) val = (rawByte + paeth(a, b, c)) & 0xff;
      out[curr + i] = val;
    }
  }
  return out;
}

// 1. Read source logo
const srcBuf = fs.readFileSync('C:/Users/maxim/.gemini/antigravity/brain/ce2ef36d-3467-4b3a-844a-c65ff104a18b/img_image.png');
let pos = 8, idatChunks = [], srcW = 0, srcH = 0;
while (pos < srcBuf.length) {
  const len = srcBuf.readUInt32BE(pos);
  const type = srcBuf.toString('ascii', pos + 4, pos + 8);
  if (type === 'IHDR') {
    srcW = srcBuf.readUInt32BE(pos + 8);
    srcH = srcBuf.readUInt32BE(pos + 12);
  } else if (type === 'IDAT') idatChunks.push(srcBuf.subarray(pos + 8, pos + 8 + len));
  pos += 12 + len;
}
const raw = zlib.inflateSync(Buffer.concat(idatChunks));
const rgb = unfilterPNG(raw, srcW, srcH, 3);

// Find exact bounding box of the entire logo
let minX = srcW, maxX = 0, minY = srcH, maxY = 0;
for (let y = 0; y < srcH; y++) {
  for (let x = 0; x < srcW; x++) {
    const idx = (y * srcW + x) * 3;
    const lum = 0.299 * rgb[idx] + 0.587 * rgb[idx+1] + 0.114 * rgb[idx+2];
    if (lum < 235) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
console.log('Full Logo bounds:', { minX, maxX, minY, maxY });

// Crop width & height
const cropW = maxX - minX + 1;
const cropH = maxY - minY + 1;

// Upscale 4x with bicubic/smooth interpolation for high-DPI
const scale = 4;
const upW = cropW * scale;
const upH = cropH * scale;

// Create white-on-transparent (for black headers) and black-on-transparent (for light backgrounds/PDF)
const whiteBuf = Buffer.alloc(upW * upH * 4);
const blackBuf = Buffer.alloc(upW * upH * 4);

function getLum(px, py) {
  const clx = Math.max(0, Math.min(srcW - 1, px));
  const cly = Math.max(0, Math.min(srcH - 1, py));
  const idx = (cly * srcW + clx) * 3;
  return (0.299 * rgb[idx] + 0.587 * rgb[idx+1] + 0.114 * rgb[idx+2]) / 255;
}

for (let y = 0; y < upH; y++) {
  const srcY = minY + y / scale;
  const y0 = Math.floor(srcY);
  const y1 = Math.min(maxY, y0 + 1);
  const dy = srcY - y0;

  for (let x = 0; x < upW; x++) {
    const srcX = minX + x / scale;
    const x0 = Math.floor(srcX);
    const x1 = Math.min(maxX, x0 + 1);
    const dx = srcX - x0;

    const l00 = getLum(x0, y0), l10 = getLum(x1, y0);
    const l01 = getLum(x0, y1), l11 = getLum(x1, y1);
    const lum = (1 - dx) * ((1 - dy) * l00 + dy * l01) + dx * ((1 - dy) * l10 + dy * l11);

    // Alpha is opacity of the dark parts: 1 when lum is 0, 0 when lum is 1
    let alpha = 0;
    if (lum < 0.94) {
      alpha = Math.min(255, Math.max(0, Math.round((0.94 - lum) / 0.94 * 255)));
    }

    const outIdx = (y * upW + x) * 4;

    // White version
    whiteBuf[outIdx] = 255;
    whiteBuf[outIdx + 1] = 255;
    whiteBuf[outIdx + 2] = 255;
    whiteBuf[outIdx + 3] = alpha;

    // Black version
    blackBuf[outIdx] = 0;
    blackBuf[outIdx + 1] = 0;
    blackBuf[outIdx + 2] = 0;
    blackBuf[outIdx + 3] = alpha;
  }
}

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

fs.writeFileSync(path.join(publicDir, 'logo-carvlak-white.png'), encodeRGBA(upW, upH, whiteBuf));
fs.writeFileSync(path.join(publicDir, 'logo-carvlak-black.png'), encodeRGBA(upW, upH, blackBuf));
console.log(`Generated logo-carvlak-white.png and logo-carvlak-black.png (${upW}x${upH})`);

// SVGs
const b64White = fs.readFileSync(path.join(publicDir, 'logo-carvlak-white.png')).toString('base64');
const svgWhite = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${upW} ${upH}" width="100%" height="100%">\n  <image href="data:image/png;base64,${b64White}" width="${upW}" height="${upH}" />\n</svg>`;
fs.writeFileSync(path.join(publicDir, 'logo-carvlak-white.svg'), svgWhite);

const b64Black = fs.readFileSync(path.join(publicDir, 'logo-carvlak-black.png')).toString('base64');
const svgBlack = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${upW} ${upH}" width="100%" height="100%">\n  <image href="data:image/png;base64,${b64Black}" width="${upW}" height="${upH}" />\n</svg>`;
fs.writeFileSync(path.join(publicDir, 'logo-carvlak-black.svg'), svgBlack);

// Now generate the Symbol icon (The 'C' with the car silhouette) for Favicon and PWA!
// The 'C' letter starts at minX (around 12) to roughly minX + 38
// Let's determine column where C ends before A
// Looking at the ASCII, C ends around x = 36
const symbolMinX = minX;
const symbolMaxX = 34; // exact bounds of 'C' with the car!
const symbolMinY = minY;
const symbolMaxY = maxY;
const symW = symbolMaxX - symbolMinX + 1;
const symH = symbolMaxY - symbolMinY + 1;

console.log('Symbol bounds:', { symbolMinX, symbolMaxX, symbolMinY, symbolMaxY, symW, symH });

// Generate a square app icon with dark background #000000 and the symbol in crisp white
function generateAppIcon(size) {
  const iconBuf = Buffer.alloc(size * size * 4);
  // Fill with black #000000
  for (let i = 0; i < size * size; i++) {
    iconBuf[i * 4] = 0;
    iconBuf[i * 4 + 1] = 0;
    iconBuf[i * 4 + 2] = 0;
    iconBuf[i * 4 + 3] = 255;
  }

  // Target size of the symbol inside the icon (e.g. 70% of size)
  const targetW = Math.round(size * 0.72);
  const targetH = Math.round(targetW * (symH / symW));
  const offsetX = Math.round((size - targetW) / 2);
  const offsetY = Math.round((size - targetH) / 2);

  for (let y = 0; y < targetH; y++) {
    const srcY = symbolMinY + y * (symH / targetH);
    const y0 = Math.floor(srcY);
    const y1 = Math.min(symbolMaxY, y0 + 1);
    const dy = srcY - y0;

    for (let x = 0; x < targetW; x++) {
      const srcX = symbolMinX + x * (symW / targetW);
      const x0 = Math.floor(srcX);
      const x1 = Math.min(symbolMaxX, x0 + 1);
      const dx = srcX - x0;

      const l00 = getLum(x0, y0), l10 = getLum(x1, y0);
      const l01 = getLum(x0, y1), l11 = getLum(x1, y1);
      const lum = (1 - dx) * ((1 - dy) * l00 + dy * l01) + dx * ((1 - dy) * l10 + dy * l11);

      let alpha = 0;
      if (lum < 0.94) {
        alpha = Math.min(255, Math.max(0, Math.round((0.94 - lum) / 0.94 * 255)));
      }

      const destX = offsetX + x;
      const destY = offsetY + y;
      if (destX >= 0 && destX < size && destY >= 0 && destY < size) {
        const outIdx = (destY * size + destX) * 4;
        // White symbol on black
        iconBuf[outIdx] = Math.round(255 * (alpha / 255));
        iconBuf[outIdx + 1] = Math.round(255 * (alpha / 255));
        iconBuf[outIdx + 2] = Math.round(255 * (alpha / 255));
        iconBuf[outIdx + 3] = 255;
      }
    }
  }

  return encodeRGBA(size, size, iconBuf);
}

const iconsDir = path.join(publicDir, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), generateAppIcon(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), generateAppIcon(512));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), generateAppIcon(180));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generateAppIcon(64));
console.log('Generated App Icons: 192, 512, apple-touch-icon, favicon.ico!');
