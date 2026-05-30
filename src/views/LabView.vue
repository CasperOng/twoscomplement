<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Bit, BitWidth } from '@/lib/twosComplement'
import {
  BIT_WIDTHS,
  toBits,
  bitsToUnsigned,
  bitsToSigned,
  placeValues,
  maxSigned,
  minSigned,
  maxUnsigned,
  invert,
  addOne,
  negate,
} from '@/lib/twosComplement'
import BitRegister from '@/components/BitRegister.vue'
import { useSound } from '@/composables/useSound'

const sound = useSound()

const width = ref<BitWidth>(8)
const bits = ref<Bit[]>(toBits(0, 8))

// Keep the register sized to the chosen width, preserving the low bits.
watch(width, (w) => {
  const value = bitsToUnsigned(bits.value)
  bits.value = toBits(value, w)
})

const signed = computed(() => bitsToSigned(bits.value))
const unsigned = computed(() => bitsToUnsigned(bits.value))
const weights = computed(() => placeValues(width.value))

function toggle(i: number) {
  const next = [...bits.value]
  next[i] = (next[i] === 1 ? 0 : 1) as Bit
  bits.value = next
  sound.flip()
}

function setValue(v: number) {
  bits.value = toBits(v, width.value)
  sound.click()
}

function randomize() {
  bits.value = bits.value.map(() => (Math.random() < 0.5 ? 0 : 1) as Bit)
  sound.flip()
}

function clearAll() {
  setValue(0)
}

// The signed value broken into per-bit contributions for the breakdown panel.
const contributions = computed(() =>
  bits.value
    .map((bit, i) => ({ bit, weight: weights.value[i], value: bit * weights.value[i] }))
    .filter((c) => c.bit === 1),
)

/* ---- Negation animator ---- */
const negating = ref(false)
const negStep = ref<0 | 1 | 2>(0) // 0 idle, 1 inverted, 2 +1 done
const highlight = ref<number[]>([])

async function animateNegate() {
  if (negating.value) return
  negating.value = true
  const start = [...bits.value]

  // Step 1: invert
  negStep.value = 1
  highlight.value = start.map((_, i) => i)
  bits.value = invert(start)
  sound.flip()
  await wait(650)
  highlight.value = []
  await wait(150)

  // Step 2: +1
  negStep.value = 2
  const { result } = addOne(bits.value)
  bits.value = result
  sound.correct()
  await wait(550)

  negStep.value = 0
  negating.value = false
}

const negationOverflow = computed(() => negate(bits.value).overflow)

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

const presets = computed(() => {
  const w = width.value
  return [
    { label: '0', value: 0 },
    { label: 'max +', value: maxSigned(w) },
    { label: 'min −', value: minSigned(w) },
    { label: '−1', value: -1 },
  ]
})
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-50 sm:text-3xl">🧪 Bit Lab</h1>
        <p class="mt-1 text-slate-400">
          Click any bit to flip it. Watch the value, place values and negation update live.
        </p>
      </div>

      <!-- Width toggle -->
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-slate-400">Width</span>
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
    </header>

    <!-- Register -->
    <section class="card p-6 sm:p-8">
      <div class="overflow-x-auto pb-2">
        <BitRegister
          :bits="bits"
          :width="width"
          :highlight="highlight"
          size="lg"
          @toggle="toggle"
        />
      </div>

      <!-- Live readout -->
      <div class="mt-8 grid gap-4 sm:grid-cols-3">
        <div class="rounded-xl bg-ink-700/60 p-4 text-center">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Signed (two's complement)
          </p>
          <p class="mt-1 font-mono text-3xl font-bold text-accent-cyan tabular-nums">
            {{ signed }}
          </p>
        </div>
        <div class="rounded-xl bg-ink-700/60 p-4 text-center">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Unsigned</p>
          <p class="mt-1 font-mono text-3xl font-bold text-slate-200 tabular-nums">
            {{ unsigned }}
          </p>
        </div>
        <div class="rounded-xl bg-ink-700/60 p-4 text-center">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Hex</p>
          <p class="mt-1 font-mono text-3xl font-bold text-slate-200 tabular-nums">
            0x{{ unsigned.toString(16).toUpperCase().padStart(width / 4, '0') }}
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-6 flex flex-wrap gap-2">
        <button class="btn-violet" :disabled="negating" @click="animateNegate">
          ± Negate (invert + 1)
        </button>
        <button class="btn-ghost" @click="randomize">🎲 Randomize</button>
        <button class="btn-ghost" @click="clearAll">Clear</button>
        <div class="mx-1 w-px self-stretch bg-white/10" />
        <button
          v-for="p in presets"
          :key="p.label"
          class="btn-ghost text-sm"
          @click="setValue(p.value)"
        >
          {{ p.label }}
        </button>
      </div>

      <!-- Negation step hint -->
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-200"
        leave-to-class="opacity-0"
      >
        <p
          v-if="negStep > 0"
          class="mt-4 rounded-lg bg-accent-violet/10 px-4 py-2 text-sm font-semibold text-accent-violet"
        >
          <template v-if="negStep === 1">Step 1 — invert every bit (NOT)…</template>
          <template v-else>Step 2 — add 1. Done!</template>
        </p>
      </Transition>
    </section>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Place-value breakdown -->
      <section class="card p-6">
        <h2 class="text-lg font-bold text-slate-100">How the value is built</h2>
        <p class="mt-1 text-sm text-slate-400">
          Only the bits set to 1 contribute. The sign-bit column is
          <span class="font-semibold text-accent-rose">negative</span>.
        </p>

        <div class="mt-4 space-y-1.5 font-mono text-sm">
          <template v-if="contributions.length">
            <div
              v-for="(c, idx) in contributions"
              :key="idx"
              class="flex items-center justify-between rounded-lg bg-ink-700/50 px-3 py-1.5"
            >
              <span class="text-slate-400">bit = 1, weight</span>
              <span
                class="font-bold tabular-nums"
                :class="c.value < 0 ? 'text-accent-rose' : 'text-accent-cyan'"
              >
                {{ c.value > 0 ? '+' : '' }}{{ c.value }}
              </span>
            </div>
          </template>
          <p v-else class="rounded-lg bg-ink-700/50 px-3 py-1.5 text-slate-500">
            All bits are 0 → value is 0.
          </p>
          <div
            class="mt-2 flex items-center justify-between border-t border-white/10 px-3 pt-3 text-base"
          >
            <span class="font-semibold text-slate-300">Total</span>
            <span class="font-bold text-accent-cyan tabular-nums">{{ signed }}</span>
          </div>
        </div>
      </section>

      <!-- Facts panel -->
      <section class="card p-6">
        <h2 class="text-lg font-bold text-slate-100">{{ width }}-bit facts</h2>
        <dl class="mt-4 space-y-2.5 text-sm">
          <div class="flex justify-between">
            <dt class="text-slate-400">Signed range</dt>
            <dd class="font-mono text-slate-200 tabular-nums">
              {{ minSigned(width) }} … {{ maxSigned(width) }}
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-400">Unsigned range</dt>
            <dd class="font-mono text-slate-200 tabular-nums">0 … {{ maxUnsigned(width) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-400">Sign bit weight</dt>
            <dd class="font-mono text-accent-rose tabular-nums">{{ weights[0] }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-400">Distinct values</dt>
            <dd class="font-mono text-slate-200 tabular-nums">2^{{ width }} = {{ 2 ** width }}</dd>
          </div>
        </dl>

        <div
          v-if="negationOverflow"
          class="mt-4 rounded-lg bg-accent-rose/10 px-4 py-3 text-sm text-accent-rose"
        >
          ⚠️ This is the most negative value. Negating it overflows — it can't be represented in
          {{ width }} bits, so −({{ signed }}) wraps back to {{ signed }}.
        </div>
      </section>
    </div>
  </div>
</template>
