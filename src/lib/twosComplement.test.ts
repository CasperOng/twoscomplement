import { describe, it, expect } from 'vitest'
import {
  type Bit,
  maxUnsigned,
  maxSigned,
  minSigned,
  inSignedRange,
  toBits,
  bitsToUnsigned,
  bitsToSigned,
  placeValues,
  parseBits,
  invert,
  addOne,
  negate,
  add,
  signedToBinary,
  binaryToSigned,
} from './twosComplement'

describe('ranges', () => {
  it('computes unsigned/signed bounds for 4 bits', () => {
    expect(maxUnsigned(4)).toBe(15)
    expect(maxSigned(4)).toBe(7)
    expect(minSigned(4)).toBe(-8)
  })
  it('computes unsigned/signed bounds for 8 bits', () => {
    expect(maxUnsigned(8)).toBe(255)
    expect(maxSigned(8)).toBe(127)
    expect(minSigned(8)).toBe(-128)
  })
  it('checks signed range membership', () => {
    expect(inSignedRange(127, 8)).toBe(true)
    expect(inSignedRange(-128, 8)).toBe(true)
    expect(inSignedRange(128, 8)).toBe(false)
    expect(inSignedRange(-129, 8)).toBe(false)
  })
})

describe('toBits', () => {
  it('encodes small positives', () => {
    expect(toBits(5, 4)).toEqual([0, 1, 0, 1])
    expect(toBits(5, 8)).toEqual([0, 0, 0, 0, 0, 1, 0, 1])
  })
  it('encodes negatives via wraparound', () => {
    expect(toBits(-1, 4)).toEqual([1, 1, 1, 1])
    expect(toBits(-8, 4)).toEqual([1, 0, 0, 0])
    expect(toBits(-128, 8)).toEqual([1, 0, 0, 0, 0, 0, 0, 0])
    expect(toBits(-1, 8)).toEqual([1, 1, 1, 1, 1, 1, 1, 1])
  })
  it('wraps out-of-range values modulo 2^width', () => {
    expect(toBits(16, 4)).toEqual([0, 0, 0, 0])
    expect(toBits(17, 4)).toEqual([0, 0, 0, 1])
  })
})

describe('interpretation', () => {
  it('reads unsigned values', () => {
    expect(bitsToUnsigned([1, 0, 1, 1])).toBe(11)
    expect(bitsToUnsigned([1, 1, 1, 1, 1, 1, 1, 1])).toBe(255)
  })
  it('reads signed values with negative MSB weight', () => {
    expect(bitsToSigned([0, 1, 1, 1])).toBe(7)
    expect(bitsToSigned([1, 0, 0, 0])).toBe(-8)
    expect(bitsToSigned([1, 1, 1, 1])).toBe(-1)
    expect(bitsToSigned([1, 0, 0, 0, 0, 0, 0, 0])).toBe(-128)
    expect(bitsToSigned([1, 1, 1, 1, 1, 1, 1, 1])).toBe(-1)
  })
})

describe('placeValues', () => {
  it('makes the MSB weight negative', () => {
    expect(placeValues(4)).toEqual([-8, 4, 2, 1])
    expect(placeValues(8)).toEqual([-128, 64, 32, 16, 8, 4, 2, 1])
  })
})

describe('parseBits', () => {
  it('left-pads short valid input', () => {
    expect(parseBits('11', 4)).toEqual([0, 0, 1, 1])
    expect(parseBits('1010', 8)).toEqual([0, 0, 0, 0, 1, 0, 1, 0])
  })
  it('ignores spaces', () => {
    expect(parseBits('1010 1010', 8)).toEqual([1, 0, 1, 0, 1, 0, 1, 0])
  })
  it('rejects invalid or oversized input', () => {
    expect(parseBits('', 4)).toBeNull()
    expect(parseBits('012', 4)).toBeNull()
    expect(parseBits('11111', 4)).toBeNull()
    expect(parseBits('xyz', 8)).toBeNull()
  })
})

describe('invert + addOne', () => {
  it('inverts bits', () => {
    expect(invert([1, 0, 1, 0])).toEqual([0, 1, 0, 1])
  })
  it('adds one with carry propagation', () => {
    expect(addOne([0, 0, 0, 0]).result).toEqual([0, 0, 0, 1])
    expect(addOne([0, 1, 1, 1]).result).toEqual([1, 0, 0, 0])
    // wraps around at the top
    expect(addOne([1, 1, 1, 1]).result).toEqual([0, 0, 0, 0])
  })
})

describe('negate (invert + 1)', () => {
  const cases: Array<[number, number, 4 | 8]> = [
    [5, -5, 4],
    [-5, 5, 4],
    [1, -1, 4],
    [7, -7, 4],
    [42, -42, 8],
    [-42, 42, 8],
    [0, 0, 4],
  ]
  it.each(cases)('negates %i -> %i (%i-bit)', (input, expected, width) => {
    const bits = toBits(input, width)
    const { result } = negate(bits)
    expect(bitsToSigned(result)).toBe(expected)
  })

  it('flags overflow when negating the most negative number', () => {
    const bits = toBits(-8, 4)
    const res = negate(bits)
    expect(res.overflow).toBe(true)
    // -(-8) wraps back to -8 in 4 bits
    expect(bitsToSigned(res.result)).toBe(-8)
  })

  it('does not flag overflow for representable negations', () => {
    expect(negate(toBits(7, 4)).overflow).toBe(false)
  })
})

describe('add', () => {
  it('adds two positives', () => {
    const r = add(toBits(3, 4), toBits(2, 4))
    expect(bitsToSigned(r.sum)).toBe(5)
    expect(r.overflow).toBe(false)
  })
  it('adds positive and negative', () => {
    const r = add(toBits(5, 4), toBits(-3, 4))
    expect(bitsToSigned(r.sum)).toBe(2)
    expect(r.overflow).toBe(false)
  })
  it('detects positive overflow (carry in != carry out)', () => {
    // 7 + 1 = 8, out of 4-bit signed range -> overflow, wraps to -8
    const r = add(toBits(7, 4), toBits(1, 4))
    expect(r.overflow).toBe(true)
    expect(bitsToSigned(r.sum)).toBe(-8)
    expect(r.trueSigned).toBe(8)
  })
  it('detects negative overflow', () => {
    // -8 + -1 = -9, out of range -> overflow, wraps to 7
    const r = add(toBits(-8, 4), toBits(-1, 4))
    expect(r.overflow).toBe(true)
    expect(bitsToSigned(r.sum)).toBe(7)
    expect(r.trueSigned).toBe(-9)
  })
  it('carry out without overflow is fine', () => {
    // -1 + 1 = 0 produces a carry out but no signed overflow
    const r = add(toBits(-1, 4), toBits(1, 4))
    expect(r.carryOut).toBe(1)
    expect(r.overflow).toBe(false)
    expect(bitsToSigned(r.sum)).toBe(0)
  })
  it('throws on mismatched widths', () => {
    expect(() => add(toBits(1, 4), toBits(1, 8) as Bit[])).toThrow()
  })
})

describe('string convenience helpers', () => {
  it('round-trips signed <-> binary', () => {
    expect(signedToBinary(-1, 8)).toBe('11111111')
    expect(signedToBinary(-5, 4)).toBe('1011')
    expect(binaryToSigned('1011', 4)).toBe(-5)
    expect(binaryToSigned('11111111', 8)).toBe(-1)
    expect(binaryToSigned('not binary', 8)).toBeNull()
  })
})
