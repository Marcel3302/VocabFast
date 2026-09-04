# VocabFast Platform

This directory contains the next-generation VocabFast language-learning client. It is intentionally isolated from `vocabfast-web` while the new architecture and learning engine are developed.

## Local development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Current prototype

The first milestone includes:

- responsive premium dashboard shell
- scalable catalog for ten target languages
- German -> English as the first active course
- CEFR learning-path presentation
- daily goals and streak UI
- specialty-language area
- adaptive-coach concept
- VocabFast Pro positioning at 19.99 EUR/month

The current dashboard uses prototype learner data. Authentication, persisted progress and billing must be wired to authoritative server APIs before release.

See `ARCHITECTURE.md` for product and migration rules.
