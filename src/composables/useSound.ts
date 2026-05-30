import { useProgress } from '@/stores/progress'

/**
 * Tiny WebAudio sound effects — no asset files, generated on the fly.
 * Respects the user's sound toggle in the progress store.
 */

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  return ctx
}

function tone(freq: number, durationMs: number, type: OscillatorType = 'sine', gain = 0.06) {
  const ac = getCtx()
  if (!ac) return
  // Resume if the browser suspended it before a user gesture.
  if (ac.state === 'suspended') void ac.resume()
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.value = gain
  osc.connect(g)
  g.connect(ac.destination)
  const now = ac.currentTime
  // Quick attack + exponential release so it doesn't click.
  g.gain.setValueAtTime(gain, now)
  g.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000)
  osc.start(now)
  osc.stop(now + durationMs / 1000)
}

export function useSound() {
  const progress = useProgress()

  function play(fn: () => void) {
    if (progress.soundOn) fn()
  }

  return {
    click: () => play(() => tone(420, 40, 'triangle', 0.04)),
    flip: () => play(() => tone(660, 50, 'square', 0.03)),
    correct: () =>
      play(() => {
        tone(660, 90, 'sine', 0.06)
        setTimeout(() => tone(880, 130, 'sine', 0.06), 90)
      }),
    wrong: () => play(() => tone(160, 220, 'sawtooth', 0.05)),
    levelUp: () =>
      play(() => {
        ;[523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 140, 'triangle', 0.06), i * 110))
      }),
    achievement: () =>
      play(() => {
        ;[784, 988, 1319].forEach((f, i) => setTimeout(() => tone(f, 160, 'sine', 0.06), i * 130))
      }),
  }
}
