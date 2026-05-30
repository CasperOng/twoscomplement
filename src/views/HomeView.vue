<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useProgress } from '@/stores/progress'

const progress = useProgress()

const cards = [
  {
    to: '/learn',
    icon: '📖',
    title: 'Learn',
    desc: 'Six bite-sized lessons from place values to overflow. Earn XP for each one.',
    accent: 'from-accent-violet/20 to-transparent',
  },
  {
    to: '/lab',
    icon: '🧪',
    title: 'Bit Lab',
    desc: 'Flip bits and watch the signed value, place values and negation update live.',
    accent: 'from-accent-cyan/20 to-transparent',
  },
  {
    to: '/challenge',
    icon: '🎮',
    title: 'Challenge',
    desc: 'Beat the clock across decode, encode, negate and overflow game modes.',
    accent: 'from-accent-amber/20 to-transparent',
  },
  {
    to: '/progress',
    icon: '🏆',
    title: 'Progress',
    desc: 'Track XP, levels, accuracy and the achievements you have unlocked.',
    accent: 'from-accent-emerald/20 to-transparent',
  },
]
</script>

<template>
  <div class="space-y-8">
    <!-- Hero -->
    <section class="card relative overflow-hidden px-6 py-10 text-center sm:py-14">
      <div
        class="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-violet/10 via-transparent to-accent-cyan/10"
      />
      <div class="relative">
        <span
          class="chip mx-auto mb-4 w-fit bg-accent-cyan/15 text-accent-cyan ring-1 ring-accent-cyan/30"
        >
          HKDSE ICT · Data Representation
        </span>
        <h1 class="text-3xl font-extrabold tracking-tight text-slate-50 sm:text-5xl">
          Master <span class="text-accent-cyan">Two's Complement</span>
        </h1>
        <p class="mx-auto mt-4 max-w-2xl text-slate-300 sm:text-lg">
          The way computers store negative numbers, turned into a game. Flip bits, decode
          registers, and level up from Bit Novice to Grandmaster.
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <RouterLink to="/learn" class="btn-primary px-6 py-3 text-base">
            📖 Start learning
          </RouterLink>
          <RouterLink to="/lab" class="btn-ghost px-6 py-3 text-base">
            🧪 Open the Bit Lab
          </RouterLink>
        </div>

        <!-- Returning user -->
        <p v-if="progress.xp > 0" class="mt-6 text-sm text-slate-400">
          Welcome back, <span class="font-semibold text-accent-violet">{{ progress.rank }}</span> —
          {{ progress.xp }} XP and counting.
        </p>
      </div>
    </section>

    <!-- Mode cards -->
    <section class="grid gap-4 sm:grid-cols-2">
      <RouterLink
        v-for="c in cards"
        :key="c.to"
        :to="c.to"
        class="card group relative overflow-hidden p-6 transition-transform hover:-translate-y-1"
      >
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-br" :class="c.accent" />
        <div class="relative">
          <span class="text-4xl">{{ c.icon }}</span>
          <h3 class="mt-3 text-xl font-bold text-slate-100">{{ c.title }}</h3>
          <p class="mt-1.5 text-sm text-slate-400">{{ c.desc }}</p>
          <span
            class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-cyan opacity-0 transition-opacity group-hover:opacity-100"
          >
            Go →
          </span>
        </div>
      </RouterLink>
    </section>

    <!-- Quick concept strip -->
    <section class="card p-6">
      <h2 class="text-lg font-bold text-slate-100">The big idea in one line</h2>
      <p class="mt-2 text-slate-300">
        In two's complement, the leftmost bit (the
        <span class="font-semibold text-accent-amber">sign bit</span>) counts as
        <span class="font-mono text-accent-rose">negative</span>. So
        <span class="font-mono text-slate-100">1000</span> isn't 8 — it's
        <span class="font-mono text-accent-rose">−8</span>. Everything else follows from that.
      </p>
    </section>
  </div>
</template>
