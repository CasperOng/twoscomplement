/**
 * Pure two's complement arithmetic for fixed-width registers.
 *
 * Everything here is framed the way the HKDSE ICT syllabus presents it:
 *  - a fixed number of bits (we support 4 and 8),
 *  - the most significant bit (MSB) carries a *negative* place value,
 *  - negation = invert all bits, then add 1.
 *
 * Bit arrays are stored MSB-first (index 0 is the sign bit) because that is
 * how they are written on paper and on screen.
 */

export type BitWidth = 4 | 8
export type Bit = 0 | 1

/** All supported register widths, for UI toggles. */
export const BIT_WIDTHS: readonly BitWidth[] = [4, 8] as const

/** Largest unsigned value for a width, e.g. 8 bits -> 255. */
export function maxUnsigned(width: BitWidth): number {
  return 2 ** width - 1
}

/** Most positive signed value, e.g. 8 bits -> 127. */
export function maxSigned(width: BitWidth): number {
  return 2 ** (width - 1) - 1
}

/** Most negative signed value, e.g. 8 bits -> -128. */
export function minSigned(width: BitWidth): number {
  return -(2 ** (width - 1))
}

/** True if `value` fits in the signed range for `width`. */
export function inSignedRange(value: number, width: BitWidth): boolean {
  return value >= minSigned(width) && value <= maxSigned(width)
}

/**
 * Normalise any integer into the bit pattern stored in a `width`-bit register
 * (i.e. modulo 2^width), returned as an MSB-first bit array.
 * Negative numbers are wrapped exactly as two's complement hardware would.
 */
export function toBits(value: number, width: BitWidth): Bit[] {
  const mask = 2 ** width
  // `>>> 0`-style wrap that also works for negatives and stays < 2^width.
  const wrapped = ((Math.trunc(value) % mask) + mask) % mask
  const bits: Bit[] = []
  for (let i = width - 1; i >= 0; i--) {
    bits.push(((wrapped >> i) & 1) as Bit)
  }
  return bits
}

/** Interpret an MSB-first bit array as an unsigned integer. */
export function bitsToUnsigned(bits: Bit[]): number {
  return bits.reduce<number>((acc, bit) => acc * 2 + bit, 0)
}

/**
 * Interpret an MSB-first bit array as a *signed* two's complement integer.
 * The MSB contributes -2^(n-1); every other bit contributes its usual weight.
 */
export function bitsToSigned(bits: Bit[]): number {
  if (bits.length === 0) return 0
  const width = bits.length
  const unsigned = bitsToUnsigned(bits)
  // If the sign bit is set, subtract the full range to get the negative value.
  return bits[0] === 1 ? unsigned - 2 ** width : unsigned
}

/** Place value (weight) of each column, MSB-first. The MSB weight is negative. */
export function placeValues(width: BitWidth): number[] {
  const weights: number[] = []
  for (let i = width - 1; i >= 0; i--) {
    const weight = 2 ** i
    weights.push(i === width - 1 ? -weight : weight)
  }
  return weights
}

/** Bit array -> string like "1011". */
export function bitsToString(bits: Bit[]): string {
  return bits.join('')
}

/**
 * Parse a binary string (any length up to `width`, optional spaces) into a
 * left-zero-padded MSB-first bit array. Returns null if it contains anything
 * other than 0/1 or is too long for the register.
 */
export function parseBits(input: string, width: BitWidth): Bit[] | null {
  const cleaned = input.replace(/\s+/g, '')
  if (cleaned.length === 0 || cleaned.length > width) return null
  if (!/^[01]+$/.test(cleaned)) return null
  const padded = cleaned.padStart(width, '0')
  return padded.split('').map((c) => (c === '1' ? 1 : 0) as Bit)
}

/** Invert every bit (the "one's complement" / NOT step). */
export function invert(bits: Bit[]): Bit[] {
  return bits.map((b) => (b === 1 ? 0 : 1) as Bit)
}

/**
 * Add 1 to an MSB-first bit array with wraparound, returning both the result
 * and each carry. Useful for animating the "+1" step of negation.
 */
export function addOne(bits: Bit[]): { result: Bit[]; carries: Bit[] } {
  const result = [...bits]
  const carries: Bit[] = new Array(bits.length).fill(0)
  let carry: Bit = 1 // we are adding 1
  for (let i = bits.length - 1; i >= 0; i--) {
    const sum = result[i] + carry
    result[i] = (sum & 1) as Bit
    carry = (sum >> 1) as Bit
    carries[i] = carry
  }
  return { result, carries }
}

/**
 * Full two's complement negation: invert all bits, then add 1.
 * Returns the intermediate inverted pattern too, so the UI can show both steps.
 *
 * Note the classic edge case: negating the most negative number
 * (e.g. -128 in 8 bits) overflows back to itself.
 */
export function negate(bits: Bit[]): {
  inverted: Bit[]
  result: Bit[]
  /** True when the value cannot be represented (negating minSigned). */
  overflow: boolean
} {
  const inverted = invert(bits)
  const { result } = addOne(inverted)
  const width = bits.length as BitWidth
  const original = bitsToSigned(bits)
  const overflow = original === minSigned(width)
  return { inverted, result, overflow }
}

export interface AdditionResult {
  /** The width-bit sum (wrapped). */
  sum: Bit[]
  /** Carry out of each column, MSB-first. carries[0] is the carry *out of* the MSB. */
  carries: Bit[]
  /** Carry out of the most significant bit. */
  carryOut: Bit
  /** Carry into the most significant bit. */
  carryIntoMsb: Bit
  /**
   * Signed overflow: the true signed sum doesn't fit in the register.
   * Detected the canonical way — carry into MSB differs from carry out of MSB.
   */
  overflow: boolean
  /** Signed value actually stored (after wrap). */
  signedSum: number
  /** Signed value that *should* have resulted (the true math). */
  trueSigned: number
}

/**
 * Add two same-width bit arrays as two's complement integers, column by column,
 * tracking carries and detecting signed overflow.
 */
export function add(a: Bit[], b: Bit[]): AdditionResult {
  const width = a.length
  if (b.length !== width) {
    throw new Error('add(): operands must have the same width')
  }
  const sum: Bit[] = new Array(width).fill(0)
  const carries: Bit[] = new Array(width).fill(0)
  let carry: Bit = 0
  let carryIntoMsb: Bit = 0
  for (let i = width - 1; i >= 0; i--) {
    if (i === 0) carryIntoMsb = carry
    const total = a[i] + b[i] + carry
    sum[i] = (total & 1) as Bit
    carry = (total >> 1) as Bit
    carries[i] = carry
  }
  const carryOut = carry
  const overflow = carryIntoMsb !== carryOut
  const trueSigned = bitsToSigned(a) + bitsToSigned(b)
  return {
    sum,
    carries,
    carryOut,
    carryIntoMsb,
    overflow,
    signedSum: bitsToSigned(sum),
    trueSigned,
  }
}

/** Convenience: signed decimal -> binary string for the given width. */
export function signedToBinary(value: number, width: BitWidth): string {
  return bitsToString(toBits(value, width))
}

/** Convenience: binary string -> signed decimal for the given width. */
export function binaryToSigned(input: string, width: BitWidth): number | null {
  const bits = parseBits(input, width)
  return bits ? bitsToSigned(bits) : null
}
