# VocabFast Language Platform

## Product direction

VocabFast evolves from a vocabulary-focused web application into a complete language-learning platform with a premium, original visual identity. The product combines structured CEFR learning, adaptive repetition, professional specialty language, AI-assisted practice and measurable progress.

The first complete learning direction is **German -> English**. The platform data model is prepared for ten target languages, but languages are released only after their content reaches the required quality level.

## Supported target languages

1. English
2. Spanish
3. French
4. German
5. Italian
6. Portuguese
7. Chinese
8. Japanese
9. Korean
10. Arabic

English is the first production curriculum. The other languages remain feature-flagged until curriculum, audio, grammar and assessment quality are validated.

## Core learning model

The canonical hierarchy is:

`course -> CEFR level -> unit -> lesson -> exercise`

Each lesson can contain multiple exercise types:

- recognition / multiple choice
- translation
- sentence construction
- fill-the-gap
- listening comprehension
- dictation
- speaking / pronunciation
- reading comprehension
- contextual vocabulary
- grammar application
- AI dialogue

Each exercise should carry normalized metadata such as target skill, CEFR level, concept IDs, difficulty, prerequisite concepts and expected answer forms. This allows one learning engine to operate across every language.

## Adaptive learning

The long-term learner model should track mastery at concept level, not only lesson completion. Suggested concept states:

- unseen
- introduced
- learning
- familiar
- strong
- due-for-review
- weak

A scheduler selects the next learning activity using recent mistakes, spaced repetition due dates, current course progression and the learner's daily goal.

## Specialty language

Specialty content is a first-class layer, not an afterthought. Initial tracks:

- Aviation English
- Business
- Medicine
- Technology & IT
- Tourism

Specialty tracks use the same lesson and assessment engine but have their own concept graph, vocabulary, situations and competency tests. Additional professional areas can be added without changing the core application.

## Product tiers

### Free

- structured foundational learning
- vocabulary and grammar practice
- daily learning path
- standard progress tracking
- limited AI usage

### Pro — target price 19.99 EUR / month

- expanded AI coach and conversations
- pronunciation and speaking feedback
- specialty-language tracks
- document/PDF learning
- advanced adaptive practice
- competence tests and certificates
- detailed weakness analysis
- higher/unlimited usage limits where economically sustainable

An annual plan can later offer a lower effective monthly price without weakening the monthly positioning.

## Design principles

The interface may borrow successful interaction principles from leading learning products — short sessions, visible progress, motivation loops and large interactive targets — but must remain visually and textually original.

VocabFast should feel:

- modern rather than childish
- motivating rather than noisy
- professional enough for adult and business users
- usable on mobile first, while excellent on desktop
- accessible by keyboard and assistive technology
- fast on weak connections

## Technical direction

The next-generation client is isolated in `vocabfast-platform/` while the existing production application continues to operate. This prevents a visual rewrite from destabilizing current authentication, billing, moderation or stored learner data.

Initial stack:

- React
- TypeScript
- Vite
- Cloudflare Worker API
- existing Cloudflare/R2 infrastructure where appropriate

Production migration should happen only after the new client has integration tests for authentication, state persistence, billing gates and admin isolation.

## Backend evolution

Existing account/session and billing behavior should be reused or migrated behind versioned endpoints rather than recreated inside the UI. New learning APIs should be versioned, for example:

- `GET /api/v2/catalog`
- `GET /api/v2/learning/next`
- `POST /api/v2/learning/attempt`
- `GET /api/v2/progress`
- `POST /api/v2/speaking/evaluate`
- `POST /api/v2/coach/chat`

The client should never determine subscription or permission state on its own; authoritative access decisions remain server-side.

## Data model direction

Important entities:

- UserProfile
- Subscription
- Course
- Level
- Unit
- Lesson
- Exercise
- Concept
- Attempt
- ConceptMastery
- ReviewSchedule
- DailyGoal
- Streak
- SpecialtyTrack
- Assessment
- Certificate

Course content should be data-driven and versioned so improvements do not invalidate historical progress unexpectedly.

## Quality gates

A language is not marked available merely because generated content exists. Each released course should have:

- curriculum coverage review
- native-quality translations
- deterministic answer validation where possible
- audio quality checks
- grammar review
- duplicate / contradiction detection
- assessment calibration
- accessibility review

AI can accelerate content generation and tutoring but should not be the sole source of truth for permanent curriculum content.

## Rollout

### Milestone 1 — Foundation

- new application shell and design system
- scalable language catalog
- learning-path UI
- responsive mobile/desktop layout
- account/billing integration plan

### Milestone 2 — English learning engine

- normalized lesson schema
- lesson player
- answer evaluation
- persistent attempts/progress
- spaced repetition
- daily goals and streaks

### Milestone 3 — Intelligent practice

- weakness model
- adaptive review queue
- grammar and vocabulary concept mastery
- listening/speaking foundations

### Milestone 4 — Pro

- AI coach
- speaking feedback
- document learning
- specialty tracks
- competence tests/certificates

### Milestone 5 — multilingual expansion

Release additional target languages one at a time after quality validation. Spanish and French are the preferred next candidates before languages that require substantially different writing-system handling.

## Migration rule

`main` remains the production-safe branch. Development of the new platform happens on `vocabfast-language-platform` until the replacement reaches a release candidate. Existing VocabFast features that users rely on must either be preserved or explicitly migrated before production cutover.
