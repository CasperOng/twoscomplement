import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

// Hash history keeps deep links working on GitHub Pages without any
// server-side rewrite config (no 404 on refresh of /challenge etc.).
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'Home' },
  },
  {
    path: '/learn',
    name: 'learn',
    component: () => import('@/views/LearnView.vue'),
    meta: { title: 'Learn' },
  },
  {
    path: '/lab',
    name: 'lab',
    component: () => import('@/views/LabView.vue'),
    meta: { title: 'Bit Lab' },
  },
  {
    path: '/challenge',
    name: 'challenge',
    component: () => import('@/views/ChallengeView.vue'),
    meta: { title: 'Challenge' },
  },
  {
    path: '/progress',
    name: 'progress',
    component: () => import('@/views/ProgressView.vue'),
    meta: { title: 'Progress' },
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  const title = (to.meta.title as string | undefined) ?? ''
  document.title = title ? `${title} · Two's Complement Quest` : "Two's Complement Quest"
})

export default router
