<script setup lang="ts">
import { ref, computed } from 'vue'
import { LESSONS } from '@/data/lessons'
import type { Bit } from '@/lib/twosComplement'
import { parseBits } from '@/lib/twosComplement'
import BitRegister from '@/components/BitRegister.vue'
import { useProgress } from '@/stores/progress'
import { useSound } from '@/composables/useSound'
import { useConfetti } from '@/composables/useConfetti'

const progress = useProgress()
const sound = useSound()
const { burst } = useConfetti()

const activeIndex = ref(0)
const active = computed(() => LESSONS[activeIndex.value])

// Quiz state, reset whenever the lesson changes.
const selected = ref<number | null>(null)
const answered = ref(false)

function selectLesson(i: number) {
  activeIndex.value = i
  selected.value = null
  answered.value = false
  sound.click()
}

function pick(i: number) {
  if (answered.value) return
  selected.value = i
  answered.value = true
  const correct = i === active.value.quiz.answer
  if (correct) {
    sound.correct()
    burst()
    progress.completeLesson(active.value.id)
  } else {
    sound.wrong()
  }
}

const isDone = (id: string) => progress.lessonsDone.includes(id)

function next() {
  if (activeIndex.value < LESSONS.length - 1) selectLesson(activeIndex.value + 1)
}
function prev() {
  if (activeIndex.value > 0) selectLesson(activeIndex.value - 1)
}

// Parse a block's bit string into a Bit[] for the register component.
function bitsOf(s: string): Bit[] {
  return parseBits(s, s.length as 4 | 8) ?? []
}

const noteToneClass: Record<string, string> = {
  tip: 'bg-accent-emerald/10 text-emerald-200 border-accent-emerald/30',
  warn: 'bg-accent-amber/10 text-amber-100 border-accent-amber/30',
  key: 'bg-accent-violet/10 text-violet-100 border-accent-violet/30',
}
const noteIcon: Record<string, string> = { tip: '💡', warn: '⚠️', key: '🔑' }
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-extrabold text-slate-50 sm:text-3xl">📖 Learn</h1>
      <p class="mt-1 text-slate-400">
        Six short lessons. Finish each quiz to mark it complete and earn 40 XP.
      </p>
    </header>

    <!-- Lesson stepper -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="(l, i) in LESSONS"
        :key="l.id"
        class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all"
        :class="
          i === activeIndex
            ? 'bg-accent-violet text-ink-900'
            : 'bg-ink-700 text-slate-300 hover:bg-ink-600'
        "
        @click="selectLesson(i)"
      >
        <span>{{ l.emoji }}</span>
        <span class="hidden sm:inline">{{ l.title }}</span>
        <span class="sm:hidden">{{ i + 1 }}</span>
        <span v-if="isDone(l.id)" class="text-accent-emerald">✓</span>
      </button>
    </div>

    <!-- Lesson body -->
    <article :key="active.id" class="card animate-slide-up p-6 sm:p-8">
      <div class="flex items-center gap-3">
        <span class="text-4xl">{{ active.emoji }}</span>
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-accent-violet">
            Lesson {{ activeIndex + 1 }} of {{ LESSONS.length }}
          </p>
          <h2 class="text-2xl font-bold text-slate-50">{{ active.title }}</h2>
        </div>
      </div>

      <div class="mt-6 space-y-4">
        <template v-for="(block, i) in active.blocks" :key="i">
          <p v-if="block.kind === 'text'" class="leading-relaxed text-slate-300" v-html="block.html" />

          <div
            v-else-if="block.kind === 'note'"
            class="rounded-xl border px-4 py-3 text-sm leading-relaxed"
            :class="noteToneClass[block.tone]"
          >
            <span class="mr-1.5">{{ noteIcon[block.tone] }}</span>
            <span v-html="block.html" />
          </div>

          <div v-else-if="block.kind === 'bits'" class="rounded-xl bg-ink-700/40 p-5">
            <BitRegister :bits="bitsOf(block.bits)" :width="block.width" :interactive="false" />
            <p v-if="block.caption" class="mt-3 text-center text-sm text-slate-400">
              {{ block.caption }}
            </p>
          </div>

          <p
            v-else-if="block.kind === 'formula'"
            class="rounded-xl bg-ink-900/60 px-4 py-3 text-center font-mono text-lg text-accent-cyan"
            v-html="block.html"
          />

          <div
            v-else-if="block.kind === 'example'"
            class="rounded-xl border border-white/10 bg-ink-700/30 p-4"
          >
            <p class="text-xs font-bold uppercase tracking-wider text-slate-400">
              {{ block.title }}
            </p>
            <p class="mt-1.5 font-mono text-slate-200" v-html="block.html" />
          </div>
        </template>
      </div>

      <!-- Quiz -->
      <div class="mt-8 rounded-2xl border border-white/10 bg-ink-900/40 p-5">
        <p class="flex items-center gap-2 font-bold text-slate-100">
          <span>🧠</span> Quick check
        </p>
        <p class="mt-2 text-slate-300">{{ active.quiz.q }}</p>

        <div class="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            v-for="(opt, i) in active.quiz.options"
            :key="i"
            class="rounded-xl border px-4 py-3 text-left font-mono font-semibold transition-all"
            :class="[
              !answered && 'border-white/15 bg-ink-700 hover:border-accent-cyan hover:bg-ink-600',
              answered && i === active.quiz.answer && 'border-accent-emerald bg-accent-emerald/15 text-emerald-200',
              answered && i === selected && i !== active.quiz.answer && 'border-accent-rose bg-accent-rose/15 text-rose-200 animate-shake',
              answered && i !== selected && i !== active.quiz.answer && 'border-white/10 bg-ink-700/40 opacity-50',
            ]"
            :disabled="answered"
            @click="pick(i)"
          >
            {{ opt }}
          </button>
        </div>

        <Transition
          enter-active-class="transition duration-300"
          enter-from-class="opacity-0 -translate-y-1"
        >
          <div
            v-if="answered"
            class="mt-4 rounded-xl px-4 py-3 text-sm"
            :class="
              selected === active.quiz.answer
                ? 'bg-accent-emerald/10 text-emerald-200'
                : 'bg-accent-rose/10 text-rose-200'
            "
          >
            <p class="font-bold">
              {{ selected === active.quiz.answer ? '✅ Correct!' : '❌ Not quite.' }}
            </p>
            <p class="mt-1 text-slate-300">{{ active.quiz.explain }}</p>
          </div>
        </Transition>
      </div>

      <!-- Nav buttons -->
      <div class="mt-6 flex items-center justify-between">
        <button class="btn-ghost" :disabled="activeIndex === 0" @click="prev">← Previous</button>
        <span class="text-sm text-slate-500">
          {{ progress.lessonsDone.length }} / {{ LESSONS.length }} complete
        </span>
        <button
          class="btn-primary"
          :disabled="activeIndex === LESSONS.length - 1"
          @click="next"
        >
          Next →
        </button>
      </div>
    </article>
  </div>
</template>
