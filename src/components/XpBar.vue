<script setup lang="ts">
import { computed } from 'vue'
import { useProgress } from '@/stores/progress'

const progress = useProgress()
const pct = computed(() => Math.round(progress.levelProgress * 100))
</script>

<template>
  <div class="flex items-center gap-3">
    <div
      class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent-violet to-accent-cyan font-mono text-lg font-extrabold text-ink-900"
      :title="`Level ${progress.level}`"
    >
      {{ progress.level }}
    </div>
    <div class="min-w-[8rem]">
      <div class="flex items-baseline justify-between gap-2">
        <span class="text-sm font-semibold text-slate-200">{{ progress.rank }}</span>
        <span class="font-mono text-xs text-slate-400 tabular-nums">{{ progress.xp }} XP</span>
      </div>
      <div class="mt-1 h-2 overflow-hidden rounded-full bg-ink-700">
        <div
          class="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet transition-all duration-500"
          :style="{ width: `${pct}%` }"
        />
      </div>
    </div>
  </div>
</template>
