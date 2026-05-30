<script setup lang="ts">
import { ref } from 'vue'
import { useProgress, xpForLevel } from '@/stores/progress'
import { MODES } from '@/lib/challenge'
import { LESSONS } from '@/data/lessons'

const progress = useProgress()
const confirmReset = ref(false)

const stats = () => [
  { label: 'Level', value: progress.level, icon: '⭐' },
  { label: 'Total XP', value: progress.xp, icon: '✨' },
  { label: 'Correct', value: progress.correct, icon: '✅' },
  { label: 'Accuracy', value: `${progress.accuracy}%`, icon: '🎯' },
  { label: 'Best streak', value: progress.bestStreak, icon: '🔥' },
  {
    label: 'Lessons',
    value: `${progress.lessonsDone.length}/${LESSONS.length}`,
    icon: '📖',
  },
]

function doReset() {
  progress.resetAll()
  confirmReset.value = false
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-50 sm:text-3xl">🏆 Progress</h1>
        <p class="mt-1 text-slate-400">
          You are <span class="font-semibold text-accent-violet">{{ progress.rank }}</span> —
          {{ progress.xpForNextLevel - progress.xpIntoLevel }} XP to level
          {{ progress.level + 1 }}.
        </p>
      </div>
      <button class="btn-ghost text-sm" @click="confirmReset = true">Reset progress</button>
    </header>

    <!-- Level progress bar -->
    <section class="card p-6">
      <div class="flex items-center justify-between text-sm">
        <span class="font-bold text-slate-200">Level {{ progress.level }}</span>
        <span class="text-slate-400">Level {{ progress.level + 1 }}</span>
      </div>
      <div class="mt-2 h-3 overflow-hidden rounded-full bg-ink-700">
        <div
          class="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet transition-all duration-500"
          :style="{ width: `${progress.levelProgress * 100}%` }"
        />
      </div>
      <p class="mt-2 text-center font-mono text-xs text-slate-500">
        {{ progress.xpIntoLevel }} / {{ progress.xpForNextLevel }} XP this level
        (next at {{ xpForLevel(progress.level + 1) }} total)
      </p>
    </section>

    <!-- Stat grid -->
    <section class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <div v-for="s in stats()" :key="s.label" class="card p-4 text-center">
        <p class="text-2xl">{{ s.icon }}</p>
        <p class="mt-1 font-mono text-xl font-bold text-slate-100 tabular-nums">{{ s.value }}</p>
        <p class="text-[11px] uppercase tracking-wider text-slate-500">{{ s.label }}</p>
      </div>
    </section>

    <!-- Per-mode breakdown -->
    <section class="card p-6">
      <h2 class="text-lg font-bold text-slate-100">Correct by mode</h2>
      <div class="mt-4 space-y-3">
        <div v-for="m in MODES" :key="m.id" class="flex items-center gap-3">
          <span class="w-8 text-center text-xl">{{ m.icon }}</span>
          <span class="w-32 text-sm font-semibold text-slate-300">{{ m.label }}</span>
          <div class="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-700">
            <div
              class="h-full rounded-full bg-accent-cyan transition-all"
              :style="{
                width: `${Math.min(100, ((progress.modeCorrect[m.id] ?? 0) / 20) * 100)}%`,
              }"
            />
          </div>
          <span class="w-10 text-right font-mono text-sm text-slate-400 tabular-nums">
            {{ progress.modeCorrect[m.id] ?? 0 }}
          </span>
        </div>
      </div>
    </section>

    <!-- Achievements -->
    <section class="card p-6">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-slate-100">Achievements</h2>
        <span class="text-sm text-slate-400">
          {{ progress.unlocked.length }} / {{ progress.achievementsView.length }}
        </span>
      </div>
      <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="a in progress.achievementsView"
          :key="a.id"
          class="flex items-center gap-3 rounded-xl border p-4 transition-all"
          :class="
            a.earned
              ? 'border-accent-amber/40 bg-accent-amber/10'
              : 'border-white/10 bg-ink-700/40 opacity-60'
          "
        >
          <span class="text-3xl" :class="!a.earned && 'grayscale'">{{ a.icon }}</span>
          <div>
            <p class="font-bold text-slate-100">{{ a.title }}</p>
            <p class="text-xs text-slate-400">{{ a.description }}</p>
          </div>
          <span v-if="a.earned" class="ml-auto text-accent-amber">✓</span>
          <span v-else class="ml-auto text-slate-600">🔒</span>
        </div>
      </div>
    </section>

    <!-- Reset confirm modal -->
    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-150"
      leave-to-class="opacity-0"
    >
      <div
        v-if="confirmReset"
        class="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
        @click.self="confirmReset = false"
      >
        <div class="card max-w-sm p-6 text-center">
          <p class="text-4xl">🗑️</p>
          <h3 class="mt-3 text-xl font-bold text-slate-100">Reset all progress?</h3>
          <p class="mt-1 text-sm text-slate-400">
            This clears your XP, level, streaks and achievements. It can't be undone.
          </p>
          <div class="mt-6 flex gap-2">
            <button class="btn-ghost flex-1" @click="confirmReset = false">Cancel</button>
            <button
              class="btn flex-1 bg-accent-rose text-ink-900 hover:bg-rose-400"
              @click="doReset"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
