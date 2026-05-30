# 🔢 Two's Complement Quest

An interactive, gamified web app that teaches **two's complement** — the way computers
represent signed integers — aligned with the **HKDSE ICT** "Data Representation" topic.

Built with **Vue 3 + Vite + TypeScript + Tailwind + Pinia**. Fully static, no backend,
deploys to GitHub Pages.

## Features

- **📖 Learn** — six bite-sized lessons (place values → sign bit → range → negation → addition/overflow) each with a quick quiz. Completing a lesson earns XP.
- **🧪 Bit Lab** — flip bits on a 4- or 8-bit register and watch the signed value, unsigned value, hex, place-value breakdown and ranges update live. Animated "invert + 1" negation.
- **🎮 Challenge** — four timed game modes: **Decode**, **Encode**, **Negate**, **Add & Overflow**. Streak-based combo multiplier and time pressure.
- **🏆 Progress** — XP, levels (Bit Novice → Grandmaster), accuracy, per-mode stats, and unlockable achievements. Persisted in `localStorage`.
- Sound effects (WebAudio, no asset files), confetti, reduced-motion support, keyboard-accessible bit toggles, responsive layout.

## Development

```bash
npm install
npm run dev        # start the dev server
npm run build      # type-check + production build to dist/
npm run preview    # preview the built app
npm test           # run unit tests (Vitest)
```

The two's complement maths lives in `src/lib/twosComplement.ts` and is covered by
unit tests in `src/lib/twosComplement.test.ts`.

## Deploying to GitHub Pages

A workflow at `.github/workflows/deploy.yml` builds and deploys on every push to `main`.

1. Push this repo to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main`. The site publishes at `https://<user>.github.io/<repo>/`.

The workflow sets `VITE_BASE` to `/<repo>/` automatically, so asset paths are correct
regardless of the repository name. For local builds the base defaults to
`/twoscomplement/`; override with `VITE_BASE=/ npm run build` to build for a root domain.

## Project structure

```
src/
  lib/            two's complement maths + challenge question generators (+ tests)
  stores/         Pinia progress store (XP, levels, achievements, persistence)
  data/           lesson content
  components/     BitCell, BitRegister, XpBar, AwardToast
  composables/    useSound, useConfetti
  views/          Home, Learn, Lab, Challenge, Progress
  router/         hash-based routing (Pages-friendly)
```
