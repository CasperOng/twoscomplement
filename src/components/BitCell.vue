<script setup lang="ts">
import { computed } from 'vue'
import type { Bit } from '@/lib/twosComplement'

const props = withDefaults(
  defineProps<{
    bit: Bit
    /** Place value shown under the bit (e.g. -128, 64...). Optional. */
    weight?: number
    /** Is this the sign bit (MSB)? Styled in amber. */
    isSign?: boolean
    /** Clickable? */
    interactive?: boolean
    /** Highlight (e.g. during step animations). */
    highlight?: boolean
    /** Visual size. */
    size?: 'sm' | 'md' | 'lg'
    index?: number
  }>(),
  { interactive: true, isSign: false, highlight: false, size: 'md' },
)

const emit = defineEmits<{ toggle: [index: number] }>()

const sizeClasses = computed(
  () =>
    ({
      sm: 'h-9 w-9 text-base rounded-lg',
      md: 'h-12 w-12 text-xl rounded-xl sm:h-14 sm:w-14 sm:text-2xl',
      lg: 'h-16 w-16 text-3xl rounded-2xl',
    })[props.size],
)

const stateClasses = computed(() => {
  if (props.bit === 1) {
    return props.isSign
      ? 'bg-accent-amber text-ink-900 shadow-glow-amber border-accent-amber'
      : 'bg-accent-cyan text-ink-900 shadow-glow border-accent-cyan'
  }
  return 'bg-ink-700 text-slate-400 border-white/10 hover:border-white/25'
})

function onClick() {
  if (props.interactive && props.index !== undefined) emit('toggle', props.index)
}
</script>

<template>
  <div class="flex flex-col items-center gap-1.5">
    <button
      type="button"
      :disabled="!interactive"
      :aria-pressed="bit === 1"
      :aria-label="`Bit ${index ?? ''}${isSign ? ' (sign bit)' : ''}, currently ${bit}`"
      class="grid place-items-center border-2 font-mono font-bold transition-all duration-150 select-none"
      :class="[
        sizeClasses,
        stateClasses,
        interactive ? 'cursor-pointer active:scale-90' : 'cursor-default',
        highlight ? 'ring-4 ring-accent-violet/70 animate-pop' : '',
      ]"
      @click="onClick"
    >
      {{ bit }}
    </button>
    <span
      v-if="weight !== undefined"
      class="font-mono text-[10px] sm:text-xs tabular-nums"
      :class="weight < 0 ? 'text-accent-rose font-bold' : 'text-slate-500'"
    >
      {{ weight }}
    </span>
  </div>
</template>
