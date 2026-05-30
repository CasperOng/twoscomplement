<script setup lang="ts">
import { watch, ref } from 'vue'
import { useProgress } from '@/stores/progress'
import { useConfetti } from '@/composables/useConfetti'
import { useSound } from '@/composables/useSound'

const progress = useProgress()
const { celebrate } = useConfetti()
const sound = useSound()

interface Toast {
  id: number
  icon: string
  title: string
  subtitle: string
  tone: 'level' | 'achievement'
}

const toasts = ref<Toast[]>([])
let seq = 0

function push(t: Omit<Toast, 'id'>) {
  const id = ++seq
  toasts.value.push({ ...t, id })
  setTimeout(() => {
    toasts.value = toasts.value.filter((x) => x.id !== id)
  }, 4200)
}

// React to awards recorded anywhere in the app.
watch(
  () => progress.lastAward,
  (award) => {
    if (!award) return
    if (award.leveledUp) {
      sound.levelUp()
      celebrate()
      push({
        icon: '🆙',
        title: `Level ${award.newLevel}!`,
        subtitle: award.newRank,
        tone: 'level',
      })
    }
    for (const a of award.newAchievements) {
      sound.achievement()
      push({
        icon: a.icon,
        title: 'Achievement unlocked',
        subtitle: a.title,
        tone: 'achievement',
      })
    }
    progress.clearLastAward()
  },
)
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
    <TransitionGroup
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-3 scale-95"
      leave-active-class="transition duration-300 ease-in"
      leave-to-class="opacity-0 -translate-y-3 scale-95"
      move-class="transition duration-300"
    >
      <div
        v-for="t in toasts"
        :key="t.id"
        class="card flex items-center gap-3 px-5 py-3"
        :class="
          t.tone === 'level'
            ? 'border-accent-violet/50 shadow-violet-500/20'
            : 'border-accent-amber/50 shadow-amber-500/20'
        "
      >
        <span class="text-3xl">{{ t.icon }}</span>
        <div>
          <p
            class="text-xs font-bold uppercase tracking-wider"
            :class="t.tone === 'level' ? 'text-accent-violet' : 'text-accent-amber'"
          >
            {{ t.title }}
          </p>
          <p class="font-semibold text-slate-100">{{ t.subtitle }}</p>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>
