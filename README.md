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

A workflow at `.github/workflows/deploy.yml` builds the app and pushes `dist/` to a
`gh-pages` branch on every push to `main`. GitHub Pages serves the site from that branch.

1. Push this repo to GitHub.
2. Push to `main` once so the workflow runs and creates the `gh-pages` branch.
3. In **Settings → Pages**, set **Source** to **Deploy from a branch**, then pick
   **`gh-pages`** / **`/ (root)`**.
4. Under **Custom domain**, enter your domain and save. Point your DNS at GitHub Pages
   (a `CNAME` record to `<user>.github.io`, or `A`/`AAAA` records for an apex domain).

Because the site is served from the domain root, the Vite `base` stays `/` (the default
in `vite.config.ts`) — no `VITE_BASE` override is needed.

> Update the `cname:` value in `.github/workflows/deploy.yml` to your actual domain.
> That keeps the `CNAME` file on the `gh-pages` branch so the custom-domain setting
> survives each deploy. If you ever serve from `https://<user>.github.io/<repo>/`
> instead, remove the `cname:` line and set `VITE_BASE: /<repo>/` on the build step.

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
