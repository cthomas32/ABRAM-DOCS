/**
 * Minimal QR code encoder.
 *
 * The share sheet needs a scannable code for the hub URL and nothing
 * else, so rather than pull in a library this encodes byte mode at error
 * correction level M for versions 1 to 10 (up to 213 characters), which
 * comfortably covers any page address.
 *
 * Returns a square boolean matrix; the caller draws it however it likes.
 */

type Bits = number[];

/* ------------------------------------------------------------------ */
/*  Galois field arithmetic (GF(256), primitive polynomial 0x11D)      */
/* ------------------------------------------------------------------ */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

/** Generator polynomial for `degree` error correction codewords. */
function rsGenerator(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], 1);
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: number[], ecCount: number): number[] {
  const generator = rsGenerator(ecCount);
  const remainder = new Array<number>(ecCount).fill(0);

  for (const byte of data) {
    const factor = byte ^ remainder[0];
    remainder.shift();
    remainder.push(0);
    for (let i = 0; i < ecCount; i++) {
      remainder[i] ^= gfMul(generator[i + 1], factor);
    }
  }
  return remainder;
}

/* ------------------------------------------------------------------ */
/*  Version tables (error correction level M only)                     */
/* ------------------------------------------------------------------ */

interface VersionSpec {
  /** Error correction codewords per block. */
  ec: number;
  /** [blockCount, dataCodewordsPerBlock] groups. */
  groups: [number, number][];
}

const VERSIONS: Record<number, VersionSpec> = {
  1: { ec: 10, groups: [[1, 16]] },
  2: { ec: 16, groups: [[1, 28]] },
  3: { ec: 26, groups: [[1, 44]] },
  4: { ec: 18, groups: [[2, 32]] },
  5: { ec: 24, groups: [[2, 43]] },
  6: { ec: 16, groups: [[4, 27]] },
  7: { ec: 18, groups: [[4, 31]] },
  8: {
    ec: 22,
    groups: [
      [2, 38],
      [2, 39],
    ],
  },
  9: {
    ec: 22,
    groups: [
      [3, 36],
      [2, 37],
    ],
  },
  10: {
    ec: 26,
    groups: [
      [4, 43],
      [1, 44],
    ],
  },
};

const ALIGNMENT_CENTERS: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
};

function dataCodewords(version: number): number {
  return VERSIONS[version].groups.reduce((sum, [count, size]) => sum + count * size, 0);
}

/* ------------------------------------------------------------------ */
/*  Bit stream                                                         */
/* ------------------------------------------------------------------ */

function pushBits(bits: Bits, value: number, length: number) {
  for (let i = length - 1; i >= 0; i--) bits.push((value >> i) & 1);
}

function encodeData(bytes: number[], version: number): number[] {
  const capacity = dataCodewords(version) * 8;
  const countLength = version < 10 ? 8 : 16;
  const bits: Bits = [];

  pushBits(bits, 0b0100, 4); // byte mode
  pushBits(bits, bytes.length, countLength);
  for (const byte of bytes) pushBits(bits, byte, 8);

  // Terminator, then pad to a whole codeword, then alternating pad bytes.
  for (let i = 0; i < 4 && bits.length < capacity; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let value = 0;
    for (let j = 0; j < 8; j++) value = (value << 1) | bits[i + j];
    codewords.push(value);
  }

  const padBytes = [0xec, 0x11];
  let padIndex = 0;
  while (codewords.length < capacity / 8) {
    codewords.push(padBytes[padIndex++ % 2]);
  }
  return codewords;
}

/** Interleave data and error correction blocks into the final stream. */
function buildCodewords(bytes: number[], version: number): number[] {
  const spec = VERSIONS[version];
  const source = encodeData(bytes, version);

  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;

  for (const [count, size] of spec.groups) {
    for (let i = 0; i < count; i++) {
      const block = source.slice(offset, offset + size);
      offset += size;
      dataBlocks.push(block);
      ecBlocks.push(rsEncode(block, spec.ec));
    }
  }

  const result: number[] = [];
  const maxData = Math.max(...dataBlocks.map((block) => block.length));
  for (let i = 0; i < maxData; i++) {
    for (const block of dataBlocks) if (i < block.length) result.push(block[i]);
  }
  for (let i = 0; i < spec.ec; i++) {
    for (const block of ecBlocks) result.push(block[i]);
  }
  return result;
}

/* ------------------------------------------------------------------ */
/*  Matrix construction                                                */
/* ------------------------------------------------------------------ */

type Cell = 0 | 1 | null;

function placeFinder(matrix: Cell[][], reserved: boolean[][], row: number, col: number) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const y = row + r;
      const x = col + c;
      if (y < 0 || y >= matrix.length || x < 0 || x >= matrix.length) continue;
      const inRing = r >= 0 && r <= 6 && c >= 0 && c <= 6;
      const isDark =
        inRing &&
        ((r === 0 || r === 6 || c === 0 || c === 6) ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4));
      matrix[y][x] = isDark ? 1 : 0;
      reserved[y][x] = true;
    }
  }
}

function bchFormat(value: number, generator: number, bitLength: number): number {
  let result = value << bitLength;
  const generatorBits = 32 - Math.clz32(generator);
  while (32 - Math.clz32(result) >= generatorBits) {
    result ^= generator << (32 - Math.clz32(result) - generatorBits);
  }
  return result;
}

function formatBits(mask: number): number {
  // Level M is 0b00; BCH(15,5) with generator 0x537, masked with 0x5412.
  const data = (0b00 << 3) | mask;
  return ((data << 10) | bchFormat(data, 0x537, 10)) ^ 0x5412;
}

function versionBits(version: number): number {
  return (version << 12) | bchFormat(version, 0x1f25, 12);
}

function maskAt(mask: number, row: number, col: number): boolean {
  switch (mask) {
    case 0:
      return (row + col) % 2 === 0;
    case 1:
      return row % 2 === 0;
    case 2:
      return col % 3 === 0;
    case 3:
      return (row + col) % 3 === 0;
    case 4:
      return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
    case 5:
      return ((row * col) % 2) + ((row * col) % 3) === 0;
    case 6:
      return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
    default:
      return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
  }
}

/** Standard penalty score, used to pick the least noisy mask. */
function penalty(matrix: Cell[][]): number {
  const size = matrix.length;
  let score = 0;

  const runScore = (run: number) => (run >= 5 ? run - 2 : 0);

  for (let i = 0; i < size; i++) {
    let rowRun = 1;
    let colRun = 1;
    for (let j = 1; j < size; j++) {
      rowRun = matrix[i][j] === matrix[i][j - 1] ? rowRun + 1 : (score += runScore(rowRun), 1);
      colRun = matrix[j][i] === matrix[j - 1][i] ? colRun + 1 : (score += runScore(colRun), 1);
    }
    score += runScore(rowRun) + runScore(colRun);
  }

  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = matrix[r][c];
      if (v === matrix[r][c + 1] && v === matrix[r + 1][c] && v === matrix[r + 1][c + 1]) {
        score += 3;
      }
    }
  }

  const pattern = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const reversed = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  const matches = (cells: Cell[]) =>
    cells.every((cell, i) => cell === pattern[i]) || cells.every((cell, i) => cell === reversed[i]);

  for (let i = 0; i < size; i++) {
    for (let j = 0; j <= size - 11; j++) {
      if (matches(matrix[i].slice(j, j + 11))) score += 40;
      const column: Cell[] = [];
      for (let k = 0; k < 11; k++) column.push(matrix[j + k][i]);
      if (matches(column)) score += 40;
    }
  }

  let dark = 0;
  for (const row of matrix) for (const cell of row) if (cell === 1) dark++;
  const ratio = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(ratio - 50) / 5) * 10;

  return score;
}

/**
 * Encodes `text` and returns the finished module matrix.
 * Throws when the content exceeds version 10 at level M.
 */
export function encodeQR(text: string): boolean[][] {
  const bytes = Array.from(new TextEncoder().encode(text));

  let version = 0;
  for (let candidate = 1; candidate <= 10; candidate++) {
    const headerBits = 4 + (candidate < 10 ? 8 : 16);
    if (headerBits + bytes.length * 8 <= dataCodewords(candidate) * 8) {
      version = candidate;
      break;
    }
  }
  if (!version) throw new Error("QR content too long");

  const size = version * 4 + 17;
  const matrix: Cell[][] = Array.from({ length: size }, () => new Array<Cell>(size).fill(null));
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    new Array<boolean>(size).fill(false),
  );

  placeFinder(matrix, reserved, 0, 0);
  placeFinder(matrix, reserved, 0, size - 7);
  placeFinder(matrix, reserved, size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    const value: Cell = i % 2 === 0 ? 1 : 0;
    matrix[6][i] = value;
    matrix[i][6] = value;
    reserved[6][i] = true;
    reserved[i][6] = true;
  }

  // Alignment patterns, skipping the three finder corners
  const centers = ALIGNMENT_CENTERS[version];
  for (const row of centers) {
    for (const col of centers) {
      const nearFinder =
        (row <= 8 && col <= 8) || (row <= 8 && col >= size - 9) || (row >= size - 9 && col <= 8);
      if (nearFinder) continue;
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          matrix[row + r][col + c] = Math.max(Math.abs(r), Math.abs(c)) !== 1 ? 1 : 0;
          reserved[row + r][col + c] = true;
        }
      }
    }
  }

  // Dark module and reserved format areas
  matrix[size - 8][8] = 1;
  reserved[size - 8][8] = true;
  for (let i = 0; i < 9; i++) {
    if (!reserved[8][i]) reserved[8][i] = true;
    if (!reserved[i][8]) reserved[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }

  // Version information blocks (version 7 and above)
  if (version >= 7) {
    const bits = versionBits(version);
    for (let i = 0; i < 18; i++) {
      const bit: Cell = ((bits >> i) & 1) as Cell;
      const row = Math.floor(i / 3);
      const col = i % 3;
      matrix[row][size - 11 + col] = bit;
      reserved[row][size - 11 + col] = true;
      matrix[size - 11 + col][row] = bit;
      reserved[size - 11 + col][row] = true;
    }
  }

  // Data placement, two columns at a time from the bottom right
  const codewords = buildCodewords(bytes, version);
  let bitIndex = 0;
  const nextBit = (): Cell => {
    const byte = codewords[bitIndex >> 3];
    if (byte === undefined) return 0;
    const bit = (byte >> (7 - (bitIndex & 7))) & 1;
    bitIndex++;
    return bit as Cell;
  };

  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // the timing column is never a data column
    for (let step = 0; step < size; step++) {
      const row = upward ? size - 1 - step : step;
      for (let offset = 0; offset < 2; offset++) {
        const c = col - offset;
        if (reserved[row][c]) continue;
        matrix[row][c] = nextBit();
      }
    }
    upward = !upward;
  }

  // Pick the mask with the lowest penalty
  let best: Cell[][] = matrix;
  let bestScore = Infinity;

  for (let mask = 0; mask < 8; mask++) {
    const candidate = matrix.map((row) => [...row]);
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (reserved[r][c]) continue;
        if (maskAt(mask, r, c)) candidate[r][c] = (candidate[r][c] === 1 ? 0 : 1) as Cell;
      }
    }
    applyFormat(candidate, mask, size);
    const score = penalty(candidate);
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best.map((row) => row.map((cell) => cell === 1));
}

function applyFormat(matrix: Cell[][], mask: number, size: number) {
  const bits = formatBits(mask);
  for (let i = 0; i < 15; i++) {
    // The format word is written most significant bit first, so position
    // i along each copy carries bit 14 - i.
    const bit: Cell = ((bits >> (14 - i)) & 1) as Cell;

    // Copy around the top-left finder
    if (i < 6) matrix[8][i] = bit;
    else if (i === 6) matrix[8][7] = bit;
    else if (i === 7) matrix[8][8] = bit;
    else if (i === 8) matrix[7][8] = bit;
    else matrix[14 - i][8] = bit;

    // Duplicate copy: bits 0-6 climb the bottom-left column, bits 7-14
    // run along row 8 to the right, with the dark module in between.
    if (i < 7) matrix[size - 1 - i][8] = bit;
    else matrix[8][size - 15 + i] = bit;
  }
  matrix[size - 8][8] = 1;
}

/** Convenience wrapper: an SVG path string for every dark module. */
export function qrPath(matrix: boolean[][]): string {
  const parts: string[] = [];
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix.length; c++) {
      if (matrix[r][c]) parts.push(`M${c} ${r}h1v1h-1z`);
    }
  }
  return parts.join("");
}
