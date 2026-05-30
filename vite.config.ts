import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// For GitHub Pages project sites the app is served from
// https://<user>.github.io/<repo>/ , so assets must be referenced
// relative to that sub-path. Override with VITE_BASE in CI if the
// repo name differs.
const base = process.env.VITE_BASE ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
