# VocabFast Language Platform

This directory contains the next-generation VocabFast language-learning client. It stays isolated from `vocabfast-web` until migration, account sync, content QA and release checks are complete.

## Current playable development scope

- React + TypeScript + Vite application
- German → English as the first active course
- CEFR course hub from **A1 through C1**
- 5 visible CEFR levels and 10 currently playable units
- 48 playable lessons and 384 interactive exercises in the current course spine
- multiple choice, translation, sentence building, fill gaps, listening, dictation and speaking
- browser speech synthesis plus microphone/speech-recognition flow with fallback
- quick placement test with A1–C1 learning recommendation
- concept mastery, due dates and adaptive spaced review
- XP, streaks, learner preferences and local progress
- VocabFast Coach with local scenario fallback and prepared authenticated Workers-AI API in the legacy backend branch
- specialty-language / Pro product area
- installable PWA foundation
- isolated Cloudflare preview Worker configuration

The A1–C1 content is a **playable development course spine**, not yet a claim of a complete CEFR curriculum. Before public release, every level needs significantly more units, broader lexical/grammar coverage, freer production tasks, listening material and didactic/content QA.

## Local development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Local production preview:

```bash
npm run preview
```

Every push to `vocabfast-language-platform` also creates the GitHub Actions artifact **VocabFast_PLATFORM_PREVIEW** with the compiled browser build.

## Cloudflare preview

The repository contains `wrangler.preview.jsonc` for the isolated Worker `vocabfast-language-preview`. It has **no production custom-domain route** and does not use the production R2/Stripe/admin configuration.

Validate it without deploying:

```bash
npm run dry-run:preview
```

Deploy it manually:

```bash
npm run deploy:preview
```

The GitHub workflow can deploy it automatically when `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets are configured. See `CLOUDFLARE_PREVIEW.md`.

## Coach API

The next-generation Worker wrapper `vocabfast-web/src/worker-v12.js` exposes `POST /api/platform/coach`. The endpoint requires an authenticated VocabFast user session, limits usage per user/hour and calls the existing Cloudflare Workers AI binding.

The isolated platform preview intentionally does **not** receive production account bindings. Its Coach therefore falls back to local scripted scenarios until a dedicated authenticated preview backend is intentionally connected.

## Data status

The standalone browser preview stores learning progress and learner preferences locally. Before production migration, authoritative progress will be synchronized to the authenticated VocabFast account on the Worker/R2 backend. The preview deliberately does not overwrite the current production account state.

## Release rule

Do not replace the current production client until account sync, billing migration, privacy/legal review, accessibility review, content QA and regression testing are complete.

See `ARCHITECTURE.md` for the product direction and migration rules.
