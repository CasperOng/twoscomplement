<script setup lang="ts">
import { computed } from 'vue'
import type { Bit, BitWidth } from '@/lib/twosComplement'
import { placeValues } from '@/lib/twosComplement'
import BitCell from './BitCell.vue'

const props = withDefaults(
  defineProps<{
    bits: Bit[]
    width: BitWidth
    showWeights?: boolean
    interactive?: boolean
    size?: 'sm' | 'md' | 'lg'
    /** Indices to highlight (for step animations). */
    highlight?: number[]
  }>(),
  { showWeights: true, interactive: true, size: 'md', highlight: () => [] },
)

const emit = defineEmits<{ toggle: [index: number] }>()

const weights = computed(() => placeValues(props.width))
</script>

<template>
  <div class="flex flex-wrap items-start justify-center gap-1.5 sm:gap-2">
    <BitCell
      v-for="(bit, i) in bits"
      :key="i"
      :bit="bit"
      :index="i"
      :weight="showWeights ? weights[i] : undefined"
      :is-sign="i === 0"
      :interactive="interactive"
      :highlight="highlight.includes(i)"
      :size="size"
      @toggle="emit('toggle', $event)"
    />
  </div>
</template>
