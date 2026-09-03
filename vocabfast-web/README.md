# VocabFast

Cloudflare/GitHub-Projekt für Englisch-, Fachsprachen-, Grammatik- und PDF-Lernen.

## Cloudflare Workers Builds

- Build-Befehl: `npm run build`
- Bereitstellungsbefehl: `npx wrangler deploy`
- Stammverzeichnis: `vocabfast-web`
- Produktions-Branch: `main`

Die App nutzt statische Assets plus einen Worker unter `/api/*`. Konten, Lernstand und PDF-Daten werden über die R2-Bindung `PDFS` gespeichert.

## Aktuelle UX

- Startseite: **Meine Wörter**
- Fortschritt: grobe CEFR-Schätzung A1–C2 (Orientierung, kein offizieller Einstufungstest)
- Konto-Backend: robustere Login-/Registrierungsfehler mit R2-Speicher
