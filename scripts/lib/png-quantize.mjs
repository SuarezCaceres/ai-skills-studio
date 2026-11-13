/**
 * Reduce un PNG de 8 bits (RGB o RGBA, sin entrelazar) a un PNG de paleta indexada de hasta N colores.
 * Solo usa `node:zlib`: el proyecto no incorpora librerías de imagen. Sirve para que las capturas con
 * muchos degradados quepan en el límite de tamaño sin perder legibilidad.
 */
import { deflateSync, inflateSync } from 'node:zlib';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

/** Decodifica un PNG de 8 bits RGB/RGBA a píxeles RGBA planos. */
export function decodePng(buffer) {
  if (!buffer.subarray(0, 8).equals(SIGNATURE)) throw new Error('No es un PNG.');
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const bitDepth = data[8];
      colorType = data[9];
      const interlace = data[12];
      if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6) || interlace !== 0) {
        throw new Error(`PNG no soportado (profundidad ${bitDepth}, tipo ${colorType}, entrelazado ${interlace}).`);
      }
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    offset += 12 + length;
  }
  const bpp = colorType === 6 ? 4 : 3;
  const stride = width * bpp;
  const raw = inflateSync(Buffer.concat(idat));
  const rgba = new Uint8Array(width * height * 4);
  let prev = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = new Uint8Array(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? line[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let add = 0;
      if (filter === 1) add = a;
      else if (filter === 2) add = b;
      else if (filter === 3) add = (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        add = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      line[x] = (line[x] + add) & 0xff;
    }
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      rgba[o] = line[x * bpp];
      rgba[o + 1] = line[x * bpp + 1];
      rgba[o + 2] = line[x * bpp + 2];
      rgba[o + 3] = bpp === 4 ? line[x * bpp + 3] : 255;
    }
    prev = line;
  }
  return { width, height, rgba };
}

/** Paleta de hasta `maxColors` colores por corte mediano sobre el histograma de colores únicos. */
function buildPalette(rgba, maxColors) {
  const histogram = new Map();
  for (let i = 0; i < rgba.length; i += 4) {
    const key = (rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2];
    histogram.set(key, (histogram.get(key) ?? 0) + 1);
  }
  let boxes = [[...histogram].map(([key, count]) => ({ r: key >> 16, g: (key >> 8) & 255, b: key & 255, count }))];
  const range = (colors, channel) => {
    let min = 255;
    let max = 0;
    for (const c of colors) {
      min = Math.min(min, c[channel]);
      max = Math.max(max, c[channel]);
    }
    return max - min;
  };
  while (boxes.length < maxColors) {
    // Se parte la caja con más rango de color × población.
    let best = -1;
    let bestScore = 0;
    boxes.forEach((colors, index) => {
      if (colors.length < 2) return;
      const population = colors.reduce((sum, c) => sum + c.count, 0);
      const score = Math.max(range(colors, 'r'), range(colors, 'g'), range(colors, 'b')) * Math.sqrt(population);
      if (score > bestScore) {
        bestScore = score;
        best = index;
      }
    });
    if (best < 0) break;
    const colors = boxes[best];
    const channel = ['r', 'g', 'b'].sort((a, b) => range(colors, b) - range(colors, a))[0];
    colors.sort((x, y) => x[channel] - y[channel]);
    const half = colors.reduce((sum, c) => sum + c.count, 0) / 2;
    let acc = 0;
    let cut = 1;
    for (let i = 0; i < colors.length - 1; i++) {
      acc += colors[i].count;
      cut = i + 1;
      if (acc >= half) break;
    }
    boxes.splice(best, 1, colors.slice(0, cut), colors.slice(cut));
  }
  return boxes.map((colors) => {
    const total = colors.reduce((sum, c) => sum + c.count, 0) || 1;
    const avg = (channel) => Math.round(colors.reduce((sum, c) => sum + c[channel] * c.count, 0) / total);
    return [avg('r'), avg('g'), avg('b')];
  });
}

/** Codifica los píxeles como PNG indexado de 8 bits con la paleta indicada. */
function encodeIndexed(width, height, rgba, palette) {
  const cache = new Map();
  const nearest = (r, g, b) => {
    const key = (r << 16) | (g << 8) | b;
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < palette.length; i++) {
      const dr = palette[i][0] - r;
      const dg = palette[i][1] - g;
      const db = palette[i][2] - b;
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
        if (dist === 0) break;
      }
    }
    cache.set(key, best);
    return best;
  };
  const rows = Buffer.alloc((width + 1) * height);
  for (let y = 0; y < height; y++) {
    rows[y * (width + 1)] = 0; // sin filtro: con paleta suele comprimir mejor
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      rows[y * (width + 1) + 1 + x] = nearest(rgba[o], rgba[o + 1], rgba[o + 2]);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 3;
  const plte = Buffer.from(palette.flat());
  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('PLTE', plte),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Devuelve el PNG reducido a paleta. Prueba 256, 192, 128 y 64 colores y se queda con el primero que
 * cabe en `maxBytes`; si ninguno cabe, devuelve el más pequeño.
 */
export function quantizePng(buffer, maxBytes) {
  const { width, height, rgba } = decodePng(buffer);
  let smallest = null;
  for (const colors of [256, 192, 128, 64]) {
    const out = encodeIndexed(width, height, rgba, buildPalette(rgba, colors));
    if (!smallest || out.length < smallest.buffer.length) smallest = { buffer: out, colors };
    if (out.length <= maxBytes) return { buffer: out, colors };
  }
  return smallest;
}
