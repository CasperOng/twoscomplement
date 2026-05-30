<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import type { Bit, BitWidth } from '@/lib/twosComplement'
import { BIT_WIDTHS, bitsToSigned } from '@/lib/twosComplement'
import {
  MODES,
  MODE_BY_ID,
  generate,
  type GameMode,
  type Question,
} from '@/lib/challenge'
import BitRegister from '@/components/BitRegister.vue'
import { useProgress } from '@/stores/progress'
import { useSound } from '@/composables/useSound'
import { useConfetti } from '@/composables/useConfetti'

const progress = useProgress()
const sound = useSound()
const { burst } = useConfetti()

const ROUND_SECONDS = 60

type Phase = 'menu' | 'playing' | 'over'
const phase = ref<Phase>('menu')

const mode = ref<GameMode>('decode')
const width = ref<BitWidth>(8)

// Live game state
const question = ref<Question | null>(null)
const timeLeft = ref(ROUND_SECONDS)
const score = ref(0)
const streak = ref(0)
const bestStreakThisRound = ref(0)
const roundCorrect = ref(0)
const roundTotal = ref(0)

// Answer inputs
const numberAnswer = ref('')
const bitAnswer = ref<Bit[]>([])

// Feedback
const feedback = ref<'idle' | 'correct' | 'wrong'>('idle')
const lastReveal = ref<string | null>(null)

let timerId: number | undefined

const meta = computed(() => MODE_BY_ID[mode.value])
const isBitsInput = computed(() => meta.value.input === 'bits')

function start(m: GameMode) {
  mode.value = m
  phase.value = 'playing'
  score.value = 0
  streak.value = 0
  bestStreakThisRound.value = 0
  roundCorrect.value = 0
  roundTotal.value = 0
  timeLeft.value = ROUND_SECONDS
  nextQuestion()
  sound.click()

  clearInterval(timerId)
  timerId = window.setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) endRound()
  }, 1000)
}

function nextQuestion() {
  question.value = generate(mode.value, width.value)
  numberAnswer.value = ''
  bitAnswer.value = new Array(width.value).fill(0) as Bit[]
  feedback.value = 'idle'
  lastReveal.value = null
}

function toggleAnswerBit(i: number) {
  const next = [...bitAnswer.value]
  next[i] = (next[i] === 1 ? 0 : 1) as Bit
  bitAnswer.value = next
  sound.flip()
}

const rawAnswer = computed(() =>
  isBitsInput.value ? bitAnswer.value.join('') : numberAnswer.value,
)

function submit() {
  if (!question.value || feedback.value !== 'idle') return
  const ok = question.value.check(rawAnswer.value)
  roundTotal.value++

  if (ok) {
    feedback.value = 'correct'
    streak.value++
    bestStreakThisRound.value = Math.max(bestStreakThisRound.value, streak.value)
    roundCorrect.value++

    // Time bonus: faster answers (more time left) score a bit more.
    const award = progress.recordCorrect({
      mode: mode.value,
      baseXp: meta.value.baseXp,
      streak: streak.value,
    })
    score.value += award.xpGained
    sound.correct()
    burst()
    // Auto-advance after a short beat.
    window.setTimeout(() => {
      if (phase.value === 'playing') nextQuestion()
    }, 700)
  } else {
    feedback.value = 'wrong'
    streak.value = 0
    lastReveal.value = question.value.answerLabel
    progress.recordWrong()
    sound.wrong()
  }
}

function skip() {
  if (!question.value) return
  streak.value = 0
  lastReveal.value = question.value.answerLabel
  feedback.value = 'wrong'
  roundTotal.value++
  sound.click()
}

function endRound() {
  clearInterval(timerId)
  timerId = undefined
  phase.value = 'over'
  sound.levelUp()
}

function backToMenu() {
  clearInterval(timerId)
  phase.value = 'menu'
}

onUnmounted(() => clearInterval(timerId))

const accuracy = computed(() =>
  roundTotal.value === 0 ? 0 : Math.round((roundCorrect.value / roundTotal.value) * 100),
)
const timerPct = computed(() => (timeLeft.value / ROUND_SECONDS) * 100)
const comboMult = computed(() => (1 + Math.min(Math.max(streak.value - 1, 0), 9) * 0.1).toFixed(1))
</script>

<template>
  <div class="space-y-6">
    <!-- ============ MENU ============ -->
    <template v-if="phase === 'menu'">
      <header>
        <h1 class="text-2xl font-extrabold text-slate-50 sm:text-3xl">🎮 Challenge</h1>
        <p class="mt-1 text-slate-400">
          Pick a mode. You have {{ ROUND_SECONDS }} seconds — keep your streak alive for a combo
          multiplier.
        </p>
      </header>

      <!-- Width selector -->
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-slate-400">Difficulty</span>
        <div class="flex rounded-xl bg-ink-700 p-1">
          <button
            v-for="w in BIT_WIDTHS"
            :key="w"
            class="rounded-lg px-4 py-1.5 text-sm font-bold transition-colors"
            :class="width === w ? 'bg-accent-cyan text-ink-900' : 'text-slate-300 hover:text-white'"
            @click="width = w"
          >
            {{ w }}-bit
          </button>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <button
          v-for="m in MODES"
          :key="m.id"
          class="card group p-6 text-left transition-transform hover:-translate-y-1"
          @click="start(m.id)"
        >
          <div class="flex items-center justify-between">
            <span class="text-4xl">{{ m.icon }}</span>
            <span class="chip bg-accent-cyan/15 text-accent-cyan">+{{ m.baseXp }} XP</span>
          </div>
          <h3 class="mt-3 text-xl font-bold text-slate-100">{{ m.label }}</h3>
          <p class="mt-1 text-sm text-slate-400">{{ m.blurb }}</p>
        </button>
      </div>
    </template>

    <!-- ============ PLAYING ============ -->
    <template v-else-if="phase === 'playing' && question">
      <!-- HUD -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <button class="btn-ghost text-sm" @click="backToMenu">← Quit</button>
        <div class="flex items-center gap-4">
          <div class="text-center">
            <p class="font-mono text-2xl font-bold text-accent-cyan tabular-nums">{{ score }}</p>
            <p class="text-[10px] uppercase tracking-wider text-slate-500">XP</p>
          </div>
          <div class="text-center">
            <p
              class="font-mono text-2xl font-bold tabular-nums"
              :class="streak >= 3 ? 'text-accent-amber' : 'text-slate-300'"
            >
              {{ streak }}🔥
            </p>
            <p class="text-[10px] uppercase tracking-wider text-slate-500">
              streak ×{{ comboMult }}
            </p>
          </div>
        </div>
      </div>

      <!-- Timer -->
      <div class="h-2.5 overflow-hidden rounded-full bg-ink-700">
        <div
          class="h-full rounded-full transition-all duration-1000 ease-linear"
          :class="timeLeft <= 10 ? 'bg-accent-rose' : 'bg-accent-emerald'"
          :style="{ width: `${timerPct}%` }"
        />
      </div>

      <!-- Question card -->
      <section class="card p-6 sm:p-8">
        <div class="flex items-center gap-2 text-sm font-semibold text-accent-violet">
          <span>{{ meta.icon }}</span> {{ meta.label }}
          <span class="ml-auto font-mono text-slate-400">{{ timeLeft }}s</span>
        </div>

        <p class="mt-3 text-lg font-semibold text-slate-100">{{ question.prompt }}</p>

        <!-- Operands -->
        <div class="mt-6 space-y-4">
          <div v-for="(op, idx) in question.operands" :key="idx">
            <div v-if="question.mode === 'add' && idx === 1" class="mb-2 text-center text-2xl text-slate-500">
              +
            </div>
            <BitRegister :bits="op" :width="width" :interactive="false" size="md" />
            <p v-if="question.mode === 'add'" class="mt-1 text-center text-xs text-slate-500">
              = {{ bitsToSigned(op) }}
            </p>
          </div>
        </div>

        <!-- Answer input -->
        <div class="mt-8">
          <p class="mb-3 text-sm font-semibold text-slate-400">Your answer</p>

          <!-- Bits input -->
          <div v-if="isBitsInput">
            <BitRegister
              :bits="bitAnswer"
              :width="width"
              :interactive="feedback === 'idle'"
              :show-weights="false"
              size="md"
              @toggle="toggleAnswerBit"
            />
            <p class="mt-2 text-center font-mono text-sm text-slate-400">
              = {{ bitsToSigned(bitAnswer) }}
            </p>
          </div>

          <!-- Number input -->
          <div v-else class="flex justify-center">
            <input
              v-model="numberAnswer"
              type="number"
              inputmode="numeric"
              :disabled="feedback !== 'idle'"
              placeholder="decimal…"
              class="w-40 rounded-xl border-2 border-white/15 bg-ink-700 px-4 py-3 text-center font-mono text-2xl font-bold text-slate-100 focus:border-accent-cyan"
              @keyup.enter="submit"
            />
          </div>
        </div>

        <!-- Feedback -->
        <Transition
          enter-active-class="transition duration-200"
          enter-from-class="opacity-0 scale-95"
        >
          <div
            v-if="feedback !== 'idle'"
            class="mt-5 rounded-xl px-4 py-3 text-center font-semibold"
            :class="
              feedback === 'correct'
                ? 'bg-accent-emerald/15 text-emerald-200'
                : 'bg-accent-rose/15 text-rose-200'
            "
          >
            <template v-if="feedback === 'correct'">✅ Correct! +{{ meta.baseXp }} base XP</template>
            <template v-else>
              ❌ Answer: <span class="font-mono">{{ lastReveal }}</span>
            </template>
          </div>
        </Transition>

        <!-- Controls -->
        <div class="mt-6 flex gap-2">
          <button
            v-if="feedback === 'idle'"
            class="btn-primary flex-1"
            @click="submit"
          >
            Submit
          </button>
          <button v-if="feedback === 'idle'" class="btn-ghost" @click="skip">Skip</button>
          <button
            v-if="feedback === 'wrong'"
            class="btn-primary flex-1"
            @click="nextQuestion"
          >
            Next →
          </button>
        </div>
      </section>
    </template>

    <!-- ============ GAME OVER ============ -->
    <template v-else-if="phase === 'over'">
      <section class="card mx-auto max-w-md p-8 text-center">
        <p class="text-5xl">🏁</p>
        <h2 class="mt-3 text-2xl font-extrabold text-slate-50">Time's up!</h2>
        <p class="mt-1 text-slate-400">{{ MODE_BY_ID[mode].label }} · {{ width }}-bit</p>

        <div class="mt-6 grid grid-cols-3 gap-3">
          <div class="rounded-xl bg-ink-700/60 p-4">
            <p class="font-mono text-2xl font-bold text-accent-cyan">{{ score }}</p>
            <p class="text-[10px] uppercase tracking-wider text-slate-500">XP earned</p>
          </div>
          <div class="rounded-xl bg-ink-700/60 p-4">
            <p class="font-mono text-2xl font-bold text-accent-amber">{{ bestStreakThisRound }}</p>
            <p class="text-[10px] uppercase tracking-wider text-slate-500">best streak</p>
          </div>
          <div class="rounded-xl bg-ink-700/60 p-4">
            <p class="font-mono text-2xl font-bold text-accent-emerald">{{ accuracy }}%</p>
            <p class="text-[10px] uppercase tracking-wider text-slate-500">accuracy</p>
          </div>
        </div>

        <div class="mt-7 flex gap-2">
          <button class="btn-primary flex-1" @click="start(mode)">Play again</button>
          <button class="btn-ghost flex-1" @click="backToMenu">Change mode</button>
        </div>
      </section>
    </template>
  </div>
</template>
