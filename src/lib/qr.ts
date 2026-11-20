/**
 * Minimal QR code encoder (byte mode, error correction level M, versions 1–10, up to 213 bytes).
 * Enough for profile and race URLs, with no extra dependency. Follows ISO/IEC 18004.
 */

// Level M block structure per version: [ecCodewordsPerBlock, [blockCount, dataCodewords], ...groups]
const BLOCKS_M: Record<number, [number, [number, number][]]> = {
  1: [10, [[1, 16]]],
  2: [16, [[1, 28]]],
  3: [26, [[1, 44]]],
  4: [18, [[2, 32]]],
  5: [24, [[2, 43]]],
  6: [16, [[4, 27]]],
  7: [18, [[4, 31]]],
  8: [22, [[2, 38], [2, 39]]],
  9: [22, [[3, 36], [2, 37]]],
  10: [26, [[4, 43], [1, 44]]],
};

const ALIGNMENT: Record<number, number[]> = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
  7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
};

const dataCapacity = (version: number) => BLOCKS_M[version][1].reduce((sum, [count, size]) => sum + count * size, 0);

// ---- Reed–Solomon over GF(256), polynomial 0x11D ------------------------------------------------
const gfMul = (x: number, y: number) => {
  let z = 0;
  for (let i = 7; i >= 0; i -= 1) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
};

const rsDivisor = (degree: number) => {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < degree; j += 1) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = gfMul(root, 0x02);
  }
  return result;
};

const rsRemainder = (data: number[], divisor: number[]) => {
  const result = new Array<number>(divisor.length).fill(0);
  for (const byte of data) {
    const factor = byte ^ (result.shift() as number);
    result.push(0);
    divisor.forEach((coef, i) => { result[i] ^= gfMul(coef, factor); });
  }
  return result;
};

// ---- encoding -----------------------------------------------------------------------------------
const encodeData = (bytes: Uint8Array, version: number) => {
  const bits: number[] = [];
  const push = (value: number, length: number) => { for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1); };
  push(0b0100, 4); // byte mode
  push(bytes.length, version < 10 ? 8 : 16);
  bytes.forEach((b) => push(b, 8));
  const capacityBits = dataCapacity(version) * 8;
  push(0, Math.min(4, capacityBits - bits.length)); // terminator
  while (bits.length % 8) bits.push(0);
  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) codewords.push(bits.slice(i, i + 8).reduce((acc, bit) => (acc << 1) | bit, 0));
  for (let pad = 0xec; codewords.length < dataCapacity(version); pad ^= 0xec ^ 0x11) codewords.push(pad);
  return codewords;
};

const addErrorCorrection = (data: number[], version: number) => {
  const [ecLength, groups] = BLOCKS_M[version];
  const divisor = rsDivisor(ecLength);
  const blocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;
  for (const [count, size] of groups) {
    for (let i = 0; i < count; i += 1) {
      const block = data.slice(offset, offset + size);
      offset += size;
      blocks.push(block);
      ecBlocks.push(rsRemainder(block, divisor));
    }
  }
  const result: number[] = [];
  const longest = Math.max(...blocks.map((b) => b.length));
  for (let i = 0; i < longest; i += 1) blocks.forEach((b) => { if (i < b.length) result.push(b[i]); });
  for (let i = 0; i < ecLength; i += 1) ecBlocks.forEach((b) => result.push(b[i]));
  return result;
};

// ---- matrix -------------------------------------------------------------------------------------
type Grid = boolean[][];

const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

const buildMatrix = (codewords: number[], version: number, mask: number) => {
  const size = version * 4 + 17;
  const modules: Grid = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const reserved: Grid = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const set = (x: number, y: number, dark: boolean) => { modules[y][x] = dark; reserved[y][x] = true; };

  // Timing patterns
  for (let i = 0; i < size; i += 1) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  // Finder patterns with separators
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        set(x, y, dist !== 2 && dist !== 4);
      }
    }
  }
  // Alignment patterns
  const positions = ALIGNMENT[version];
  const last = positions.length - 1;
  positions.forEach((ax, i) => positions.forEach((ay, j) => {
    if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
    for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }));

  // Format information (level M = 0b00) and the dark module
  const formatData = (0b00 << 3) | mask;
  let rem = formatData;
  for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const format = ((formatData << 10) | rem) ^ 0x5412;
  const bit = (value: number, i: number) => ((value >>> i) & 1) !== 0;
  for (let i = 0; i <= 5; i += 1) set(8, i, bit(format, i));
  set(8, 7, bit(format, 6));
  set(8, 8, bit(format, 7));
  set(7, 8, bit(format, 8));
  for (let i = 9; i < 15; i += 1) set(14 - i, 8, bit(format, i));
  for (let i = 0; i < 8; i += 1) set(size - 1 - i, 8, bit(format, i));
  for (let i = 8; i < 15; i += 1) set(8, size - 15 + i, bit(format, i));
  set(8, size - 8, true);

  // Version information (v7+)
  if (version >= 7) {
    let vr = version;
    for (let i = 0; i < 12; i += 1) vr = (vr << 1) ^ ((vr >>> 11) * 0x1f25);
    const info = (version << 12) | vr;
    for (let i = 0; i < 18; i += 1) {
      const a = size - 11 + (i % 3), b = Math.floor(i / 3);
      set(a, b, bit(info, i));
      set(b, a, bit(info, i));
    }
  }

  // Data, in the zigzag order, then the mask over non-function modules
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert += 1) {
      for (let j = 0; j < 2; j += 1) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (reserved[y][x]) continue;
        const dark = i < codewords.length * 8 ? ((codewords[i >>> 3] >>> (7 - (i & 7))) & 1) === 1 : false;
        i += 1;
        modules[y][x] = dark !== MASKS[mask](x, y);
      }
    }
  }
  return modules;
};

/** Standard mask penalty (lower is easier to scan). */
const penalty = (m: Grid) => {
  const size = m.length;
  let score = 0;
  const lines: boolean[][] = [...m, ...m[0].map((_, x) => m.map((row) => row[x]))];
  for (const line of lines) {
    let run = 1;
    for (let i = 1; i <= size; i += 1) {
      if (i < size && line[i] === line[i - 1]) run += 1;
      else { if (run >= 5) score += 3 + (run - 5); run = 1; }
    }
    const text = line.map((d) => (d ? "1" : "0")).join("");
    for (const pattern of ["10111010000", "00001011101"]) {
      for (let at = text.indexOf(pattern); at !== -1; at = text.indexOf(pattern, at + 1)) score += 40;
    }
  }
  for (let y = 0; y < size - 1; y += 1) {
    for (let x = 0; x < size - 1; x += 1) {
      const c = m[y][x];
      if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) score += 3;
    }
  }
  const dark = m.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
  score += Math.floor(Math.abs((dark * 100) / (size * size) - 50) / 5) * 10;
  return score;
};

/** QR matrix for `text` (true = dark). Throws if the text is longer than 213 bytes. */
export const qrMatrix = (text: string): Grid => {
  const bytes = new TextEncoder().encode(text);
  const version = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].find((v) => 4 + (v < 10 ? 8 : 16) + bytes.length * 8 <= dataCapacity(v) * 8);
  if (!version) throw new Error("Text is too long for this QR encoder.");
  const codewords = addErrorCorrection(encodeData(bytes, version), version);
  let best: Grid | null = null;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask += 1) {
    const candidate = buildMatrix(codewords, version, mask);
    const score = penalty(candidate);
    if (score < bestScore) { best = candidate; bestScore = score; }
  }
  return best!;
};

/** Crisp SVG with a 4-module quiet zone. */
export const qrSvg = (text: string, { dark = "#1c1917", light = "#ffffff", scale = 10 } = {}) => {
  const m = qrMatrix(text);
  const quiet = 4;
  const size = m.length + quiet * 2;
  let path = "";
  m.forEach((row, y) => row.forEach((on, x) => { if (on) path += `M${x + quiet},${y + quiet}h1v1h-1z`; }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size * scale}" height="${size * scale}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="${light}"/><path d="${path}" fill="${dark}"/></svg>`;
};
