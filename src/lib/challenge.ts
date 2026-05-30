/**
 * Question generators for the Challenge game modes.
 *
 * Every generator returns a `Question` with a `check()` that validates a raw
 * user answer (string), so the view stays agnostic about answer formats.
 */

import {
  type Bit,
  type BitWidth,
  toBits,
  bitsToString,
  bitsToSigned,
  signedToBinary,
  negate,
  add,
  maxSigned,
  minSigned,
} from './twosComplement'

export type GameMode = 'decode' | 'encode' | 'negate' | 'add'

export interface ModeMeta {
  id: GameMode
  label: string
  icon: string
  blurb: string
  /** Input style the view should render. */
  input: 'bits' | 'number'
  baseXp: number
}

export const MODES: ModeMeta[] = [
  {
    id: 'decode',
    label: 'Decode',
    icon: '🔍',
    blurb: 'Read a binary pattern as a signed decimal.',
    input: 'number',
    baseXp: 10,
  },
  {
    id: 'encode',
    label: 'Encode',
    icon: '✍️',
    blurb: 'Write a signed decimal as a binary pattern.',
    input: 'bits',
    baseXp: 12,
  },
  {
    id: 'negate',
    label: 'Negate',
    icon: '🔄',
    blurb: 'Apply invert + 1 to flip the sign.',
    input: 'bits',
    baseXp: 14,
  },
  {
    id: 'add',
    label: 'Add & Overflow',
    icon: '➕',
    blurb: 'Add two patterns; flag overflow.',
    input: 'bits',
    baseXp: 16,
  },
]

export const MODE_BY_ID: Record<GameMode, ModeMeta> = Object.fromEntries(
  MODES.map((m) => [m.id, m]),
) as Record<GameMode, ModeMeta>

export interface Question {
  mode: GameMode
  width: BitWidth
  /** The prompt shown to the player. */
  prompt: string
  /** Operand bit arrays to display (1 for decode/encode/negate, 2 for add). */
  operands: Bit[][]
  /** For 'add' mode: does this question involve overflow? */
  overflow?: boolean
  /** Canonical correct answer, for the "reveal" after a wrong attempt. */
  answerLabel: string
  /** Validate a raw answer string. */
  check: (raw: string) => boolean
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Normalise a binary answer: strip spaces, pad to width. Empty -> null. */
function normBits(raw: string, width: BitWidth): string | null {
  const cleaned = raw.replace(/\s+/g, '')
  if (!/^[01]+$/.test(cleaned) || cleaned.length > width) return null
  return cleaned.padStart(width, '0')
}

function genDecode(width: BitWidth): Question {
  const value = randInt(minSigned(width), maxSigned(width))
  const bits = toBits(value, width)
  return {
    mode: 'decode',
    width,
    prompt: `What signed value is ${bitsToString(bits)}?`,
    operands: [bits],
    answerLabel: String(value),
    check: (raw) => {
      const n = parseInt(raw.trim(), 10)
      return !Number.isNaN(n) && n === value
    },
  }
}

function genEncode(width: BitWidth): Question {
  const value = randInt(minSigned(width), maxSigned(width))
  const answer = signedToBinary(value, width)
  return {
    mode: 'encode',
    width,
    prompt: `Write ${value} as a ${width}-bit two's complement pattern.`,
    operands: [toBits(0, width)],
    answerLabel: answer,
    check: (raw) => normBits(raw, width) === answer,
  }
}

function genNegate(width: BitWidth): Question {
  // Avoid the most-negative value so a clean negation exists.
  const value = randInt(minSigned(width) + 1, maxSigned(width))
  const bits = toBits(value, width)
  const answer = bitsToString(negate(bits).result)
  return {
    mode: 'negate',
    width,
    prompt: `Negate ${bitsToString(bits)} (= ${value}). Give the ${width}-bit result.`,
    operands: [bits],
    answerLabel: answer,
    check: (raw) => normBits(raw, width) === answer,
  }
}

function genAdd(width: BitWidth): Question {
  // ~40% of the time, force an overflow case so it's well represented.
  const wantOverflow = Math.random() < 0.4
  let a: number, b: number
  let guard = 0
  do {
    a = randInt(minSigned(width), maxSigned(width))
    b = randInt(minSigned(width), maxSigned(width))
    guard++
  } while (guard < 50 && wantOverflow !== !inRange(a + b, width))

  const ba = toBits(a, width)
  const bb = toBits(b, width)
  const res = add(ba, bb)
  const answer = bitsToString(res.sum)
  return {
    mode: 'add',
    width,
    prompt: `Add these two ${width}-bit numbers. Give the ${width}-bit sum.`,
    operands: [ba, bb],
    overflow: res.overflow,
    answerLabel: `${answer}${res.overflow ? ' (overflow!)' : ''}`,
    check: (raw) => normBits(raw, width) === answer,
  }
}

function inRange(v: number, width: BitWidth): boolean {
  return v >= minSigned(width) && v <= maxSigned(width)
}

export function generate(mode: GameMode, width: BitWidth): Question {
  switch (mode) {
    case 'decode':
      return genDecode(width)
    case 'encode':
      return genEncode(width)
    case 'negate':
      return genNegate(width)
    case 'add':
      return genAdd(width)
  }
}

/** Re-export for views that want to show the signed value of a pattern. */
export { bitsToSigned }
