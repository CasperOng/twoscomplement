<script setup lang="ts">
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { computed } from 'vue'
import { useProgress } from '@/stores/progress'
import XpBar from '@/components/XpBar.vue'
import AwardToast from '@/components/AwardToast.vue'

const progress = useProgress()
const route = useRoute()

const links = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/learn', label: 'Learn', icon: '📖' },
  { to: '/lab', label: 'Bit Lab', icon: '🧪' },
  { to: '/challenge', label: 'Challenge', icon: '🎮' },
  { to: '/progress', label: 'Progress', icon: '🏆' },
]

const activePath = computed(() => route.path)
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AwardToast />

    <!-- Top bar -->
    <header class="sticky top-0 z-40 border-b border-white/10 bg-ink-900/80 backdrop-blur-lg">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <RouterLink to="/" class="flex items-center gap-2.5">
          <span class="text-2xl">🔢</span>
          <div class="leading-tight">
            <p class="font-extrabold tracking-tight text-slate-100">Two's Complement</p>
            <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-cyan">
              Quest · HKDSE ICT
            </p>
          </div>
        </RouterLink>

        <!-- Desktop nav -->
        <nav class="hidden flex-1 justify-center lg:flex">
          <div class="flex gap-1">
            <RouterLink
              v-for="link in links"
              :key="link.to"
              :to="link.to"
              class="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all"
              :class="
                activePath === link.to
                  ? 'bg-accent-cyan text-ink-900'
                  : 'text-slate-300 hover:bg-white/10'
              "
            >
              <span>{{ link.icon }}</span>
              {{ link.label }}
            </RouterLink>
          </div>
        </nav>

        <div class="hidden sm:block">
          <XpBar />
        </div>

        <button
          class="btn-ghost px-3 py-2 text-lg"
          :title="progress.soundOn ? 'Sound on' : 'Sound off'"
          :aria-label="progress.soundOn ? 'Mute sound' : 'Unmute sound'"
          @click="progress.toggleSound()"
        >
          {{ progress.soundOn ? '🔊' : '🔇' }}
        </button>
      </div>

      <!-- Mobile XP bar -->
      <div class="border-t border-white/5 px-4 py-2 sm:hidden">
        <XpBar />
      </div>
    </header>

    <!-- Main content -->
    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 lg:pb-10">
      <RouterView v-slot="{ Component }">
        <Transition
          mode="out-in"
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-2"
          leave-active-class="transition duration-150 ease-in"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <!-- Bottom nav (mobile + tablet) -->
    <nav
      class="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink-900/90 backdrop-blur-lg lg:hidden"
    >
      <div class="mx-auto flex max-w-6xl justify-around px-2 py-1.5">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-semibold transition-colors"
          :class="
            activePath === link.to ? 'text-accent-cyan' : 'text-slate-400 hover:text-slate-200'
          "
        >
          <span class="text-lg">{{ link.icon }}</span>
          {{ link.label }}
        </RouterLink>
      </div>
    </nav>
  </div>
</template>
