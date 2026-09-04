# VocabFast Language Platform

This directory contains the next-generation VocabFast language-learning client. It is intentionally isolated from `vocabfast-web` while the new platform is developed and tested.

## Quick start

```bash
cd vocabfast-platform
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

Every push to `vocabfast-language-platform` also creates the GitHub Actions artifact **VocabFast_PLATFORM_PREVIEW** with the compiled browser build.

## Current interactive prototype

The current milestone includes:

- React + TypeScript + Vite application shell
- responsive premium VocabFast design system
- onboarding with learner goal and daily target
- German -> English A1 course with **16 interactive lessons / 128 exercises**
- two complete A1 learning units: `Erste Gespräche` and `Im Alltag`
- multiple choice, translation, sentence building, fill-the-gap, listening, dictation and speaking exercises
- browser text-to-speech for English audio
- browser speech recognition for pronunciation/speaking exercises with typed fallback
- concept-level mastery and spaced-review scheduling
- targeted practice modes for speaking, listening/dictation and active sentence production
- persistent local progress, XP, streaks and learner preferences
- vocabulary/mastery dashboard and unit progress
- VocabFast Coach conversation prototype with local fallback and optional authenticated Workers AI endpoint
- specialty-language product area for Aviation English, Business, Medicine, Technology & IT and Tourism
- VocabFast Pro product preview at the planned 19.99 EUR/month price point
- installable PWA foundation and runtime offline cache
- dedicated profile/settings area

## Coach API

The next-generation Worker wrapper `vocabfast-web/src/worker-v12.js` exposes:

`POST /api/platform/coach`

The endpoint requires an authenticated VocabFast user session, limits usage per user/hour and calls the existing Cloudflare Workers AI binding. The standalone platform preview automatically falls back to local scripted scenarios when the API is unavailable.

## Data status

The standalone browser preview stores learning progress and learner preferences locally. Before production migration, authoritative progress will be synchronized to the authenticated VocabFast account on the Worker/R2 backend. The preview deliberately does not overwrite the current production account state.

## Release rule

Do not replace the current production client until account sync, billing migration, privacy/legal review, accessibility review, content QA and regression testing are complete.

See `ARCHITECTURE.md` for the product direction and migration rules.
