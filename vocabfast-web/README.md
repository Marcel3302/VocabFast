# VocabFast – Cloudflare Worker Ready

Dieser Ordner `vocabfast-web` ist das komplette Cloudflare-Projekt.

## Cloudflare Build-Konfiguration

- Build-Befehl: `npm run build`
- Bereitstellungsbefehl: `npx wrangler deploy`
- Versionsbefehl: `npx wrangler versions upload`
- Stammverzeichnis: `vocabfast-web` (ohne führenden Slash)
- Produktions-Branch: `main`

`wrangler.jsonc` veröffentlicht automatisch `./dist` als statische Website.

## GitHub

Den Ordner `vocabfast-web` direkt im Repository ablegen. Alte Dateien außerhalb dieses Ordners werden ignoriert, wenn Cloudflare als Stammverzeichnis `vocabfast-web` verwendet.
