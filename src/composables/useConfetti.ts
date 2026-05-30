import confetti from 'canvas-confetti'

/** Celebration bursts used on correct answers, level-ups and achievements. */
export function useConfetti() {
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  function burst() {
    if (prefersReduced) return
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#22d3ee', '#a78bfa', '#fbbf24', '#34d399'],
      disableForReducedMotion: true,
    })
  }

  function celebrate() {
    if (prefersReduced) return
    const end = Date.now() + 900
    const colors = ['#22d3ee', '#a78bfa', '#fbbf24', '#34d399', '#fb7185']
    ;(function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors })
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors })
      if (Date.now() < end) requestAnimationFrame(frame)
    })()
  }

  return { burst, celebrate }
}
