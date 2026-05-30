import { defineStore } from 'pinia'

const STORAGE_KEY = 'tcq-progress-v1'

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  /** Predicate over the live store deciding whether it is earned. */
  test: (s: ProgressState) => boolean
}

export interface ProgressState {
  xp: number
  /** Total questions answered correctly, ever. */
  correct: number
  /** Total questions answered (correct + wrong). */
  answered: number
  /** Best combo streak ever reached. */
  bestStreak: number
  /** Per-mode correct counts, e.g. { decode: 12, negate: 4 }. */
  modeCorrect: Record<string, number>
  /** Lesson ids the user has completed. */
  lessonsDone: string[]
  /** Earned achievement ids. */
  unlocked: string[]
  /** Whether sound effects are enabled. */
  soundOn: boolean
}

/** XP needed to *reach* a given level. Level 1 = 0 XP. Quadratic-ish curve. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.round(50 * (level - 1) * level) // L2=100, L3=300, L4=600, ...
}

/** Derive level (1-based) from total XP. */
export function levelFromXp(xp: number): number {
  let level = 1
  while (xpForLevel(level + 1) <= xp) level++
  return level
}

export const RANKS: Record<number, string> = {
  1: 'Bit Novice',
  2: 'Nibble Apprentice',
  3: 'Byte Cadet',
  4: 'Sign-Bit Scout',
  5: 'Carry Captain',
  6: 'Overflow Ranger',
  7: 'Complement Knight',
  8: 'Register Master',
  9: 'Binary Sage',
  10: 'Two’s Complement Grandmaster',
}

export function rankFor(level: number): string {
  const capped = Math.min(level, 10)
  return RANKS[capped] ?? RANKS[10]
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-blood',
    title: 'First Steps',
    description: 'Answer your first question correctly.',
    icon: '🎯',
    test: (s) => s.correct >= 1,
  },
  {
    id: 'streak-5',
    title: 'On a Roll',
    description: 'Reach a 5-answer streak.',
    icon: '🔥',
    test: (s) => s.bestStreak >= 5,
  },
  {
    id: 'streak-10',
    title: 'Unstoppable',
    description: 'Reach a 10-answer streak.',
    icon: '⚡',
    test: (s) => s.bestStreak >= 10,
  },
  {
    id: 'half-century',
    title: 'Half Century',
    description: 'Answer 50 questions correctly.',
    icon: '🏏',
    test: (s) => s.correct >= 50,
  },
  {
    id: 'scholar',
    title: 'Scholar',
    description: 'Complete every lesson.',
    icon: '📚',
    test: (s) => s.lessonsDone.length >= TOTAL_LESSONS,
  },
  {
    id: 'negator',
    title: 'The Negator',
    description: 'Get 10 negation questions right.',
    icon: '➖',
    test: (s) => (s.modeCorrect['negate'] ?? 0) >= 10,
  },
  {
    id: 'overflow-master',
    title: 'Overflow Master',
    description: 'Get 10 addition/overflow questions right.',
    icon: '💥',
    test: (s) => (s.modeCorrect['add'] ?? 0) >= 10,
  },
  {
    id: 'level-5',
    title: 'Carry Captain',
    description: 'Reach level 5.',
    icon: '🎖️',
    test: (s) => levelFromXp(s.xp) >= 5,
  },
  {
    id: 'level-10',
    title: 'Grandmaster',
    description: 'Reach the maximum rank.',
    icon: '👑',
    test: (s) => levelFromXp(s.xp) >= 10,
  },
]

/** Kept in sync with the lessons module; declared here to avoid a cycle. */
export const TOTAL_LESSONS = 6

function defaultState(): ProgressState {
  return {
    xp: 0,
    correct: 0,
    answered: 0,
    bestStreak: 0,
    modeCorrect: {},
    lessonsDone: [],
    unlocked: [],
    soundOn: true,
  }
}

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as Partial<ProgressState>
    // Merge so newly-added fields get sensible defaults on upgrade.
    return { ...defaultState(), ...parsed, modeCorrect: { ...parsed.modeCorrect } }
  } catch {
    return defaultState()
  }
}

export const useProgress = defineStore('progress', {
  state: (): ProgressState & { lastAward: AwardSummary | null } => ({
    ...load(),
    // Transient: details of the most recent award, for UI toasts. Not persisted.
    lastAward: null,
  }),

  getters: {
    level: (s) => levelFromXp(s.xp),
    rank(): string {
      return rankFor(this.level)
    },
    xpIntoLevel(): number {
      return this.xp - xpForLevel(this.level)
    },
    xpForNextLevel(): number {
      return xpForLevel(this.level + 1) - xpForLevel(this.level)
    },
    levelProgress(): number {
      const span = this.xpForNextLevel
      return span === 0 ? 1 : Math.min(1, this.xpIntoLevel / span)
    },
    accuracy: (s) => (s.answered === 0 ? 0 : Math.round((s.correct / s.answered) * 100)),
    achievementsView(): Array<Achievement & { earned: boolean }> {
      return ACHIEVEMENTS.map((a) => ({ ...a, earned: this.unlocked.includes(a.id) }))
    },
  },

  actions: {
    persist() {
      const { lastAward, ...persisted } = this.$state
      void lastAward
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
      } catch {
        /* storage may be unavailable (private mode); ignore */
      }
    },

    /** Record a correct answer and return the XP/level/achievement deltas. */
    recordCorrect(opts: { mode: string; baseXp: number; streak: number }): AwardSummary {
      const prevLevel = this.level
      this.correct++
      this.answered++
      this.modeCorrect[opts.mode] = (this.modeCorrect[opts.mode] ?? 0) + 1
      this.bestStreak = Math.max(this.bestStreak, opts.streak)

      // Combo multiplier: every answer in a streak is worth a little more.
      const multiplier = 1 + Math.min(opts.streak - 1, 9) * 0.1 // caps at x2.0
      const gained = Math.round(opts.baseXp * multiplier)
      this.xp += gained

      const leveledUp = this.level > prevLevel
      const newAchievements = this.checkAchievements()

      const award: AwardSummary = {
        xpGained: gained,
        multiplier,
        leveledUp,
        newLevel: this.level,
        newRank: this.rank,
        newAchievements,
      }
      this.lastAward = award
      this.persist()
      return award
    },

    recordWrong() {
      this.answered++
      this.persist()
    },

    completeLesson(id: string) {
      if (!this.lessonsDone.includes(id)) {
        this.lessonsDone.push(id)
        this.xp += 40 // lesson completion bonus
        this.checkAchievements()
        this.persist()
      }
    },

    /** Unlock any newly-satisfied achievements; return the freshly-earned ones. */
    checkAchievements(): Achievement[] {
      const fresh: Achievement[] = []
      for (const a of ACHIEVEMENTS) {
        if (!this.unlocked.includes(a.id) && a.test(this.$state)) {
          this.unlocked.push(a.id)
          fresh.push(a)
        }
      }
      return fresh
    },

    toggleSound() {
      this.soundOn = !this.soundOn
      this.persist()
    },

    clearLastAward() {
      this.lastAward = null
    },

    resetAll() {
      const sound = this.soundOn
      this.$patch({ ...defaultState(), soundOn: sound, lastAward: null })
      this.persist()
    },
  },
})

export interface AwardSummary {
  xpGained: number
  multiplier: number
  leveledUp: boolean
  newLevel: number
  newRank: string
  newAchievements: Achievement[]
}
