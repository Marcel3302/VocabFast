# VocabFast – GitHub / Cloudflare Worker

Dieser Ordner `vocabfast-web` ist das komplette Projekt.

## Cloudflare Workers Builds

- Build-Befehl: `npm run build`
- Bereitstellungsbefehl: `npx wrangler deploy`
- Versionsbefehl: `npx wrangler versions upload`
- Stammverzeichnis: `vocabfast-web` (ohne führenden `/`)
- Produktions-Branch: `main`

`wrangler.jsonc` veröffentlicht `./dist` als Workers Static Assets.
Compatibility-Date: `2026-09-02`.

## Update

Den bestehenden Ordner `vocabfast-web` im Repository durch den Inhalt dieser Version ersetzen, committen und auf `main` pushen.
