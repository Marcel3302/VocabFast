# VocabFast – Cloudflare Worker v8

Diese Version ist speziell für Cloudflare Workers Builds eingerichtet.

## Cloudflare-Einstellungen

- Stammverzeichnis: `/vocabfast-web`
- Build-Befehl: leer
- Bereitstellungsbefehl: `npx wrangler deploy`
- Versionsbefehl: `npx wrangler versions upload`
- Produktions-Branch: `main`

## Übersetzung

Die Übersetzung läuft primär direkt über **Cloudflare Workers AI**. Dafür ist im `wrangler.jsonc` bereits das AI-Binding `AI` konfiguriert. Ein separater Übersetzungs-API-Key ist für die normale Nutzung nicht erforderlich.

Optional kann zusätzlich `DEEPL_API_KEY` als Cloudflare Worker Secret gesetzt werden. Dann wird DeepL bevorzugt.

### Test nach dem Deployment

1. `/api/health` öffnen. Erwartet: `"ok": true` und `"aiBinding": true`.
2. `/api/translate?q=aviation&source=EN&target=DE` öffnen.
3. `/api/translate?q=Luftfahrt&source=DE&target=EN` öffnen.

Die 4.500 Lernwörter begrenzen die Übersetzung nicht. Beliebige neue Wörter, Fachbegriffe und kurze Phrasen werden an den Übersetzungsdienst gesendet.
