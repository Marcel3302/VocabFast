# VocabFast

Komplettes GitHub-/Cloudflare-Workers-Projekt für VocabFast.

## Cloudflare Build-Einstellungen

- **Stammverzeichnis:** `vocabfast-web`
- **Build-Befehl:** `npm run build`
- **Bereitstellungsbefehl:** `npx wrangler deploy`
- **Produktions-Branch:** `main`

`wrangler.jsonc` enthält alles Weitere. Beim ersten Deployment stellt Wrangler die benötigten Cloudflare-Ressourcen automatisch bereit:

- **D1 (`DB`)** für Benutzerkonto, Lernstand, XP, Achievements und Einstellungen
- **R2 (`PDFS`)** für die PDF-Bibliothek

Die Datenbanktabellen werden beim ersten API-Aufruf automatisch angelegt. Es ist keine `_redirects`- oder `_headers`-Datei erforderlich.

## Funktionen dieser Version

- Name nur noch **VocabFast** (kein „MAX“)
- Themenbaum startet eingeklappt und ist übersichtlicher
- „Alles markieren“ wird auf allen Mehrfachauswahlen zu „Alles abwählen“, sobald alles markiert ist
- Sortierung nach Lernpriorität, CEFR-Level oder Alphabet gilt global für Wortlisten
- Eigener Vokabel-Übungsbereich mit 10-Fragen-Runden und XP
- Grammatik A1–C2 mit ausführlichen Erklärungen und automatisch 10 Übungen
- Rangsystem: Bronze III bis Grandmaster
- Achievements und Lernstatistiken
- E-Mail-/Passwort-Konto mit geräteübergreifender Cloud-Synchronisierung
- Serverseitige PDF-Bibliothek über Cloudflare R2
- Löschen einzelner, markierter oder aller Wörter/PDFs
- Konto vollständig löschen
- Einmaliger Import der Daten aus der früheren browserlokalen VocabFast-Version
- 6.655 Vokabeleinträge, darunter 962 C2-Einträge

## Lokal prüfen

```bash
npm run selftest
```

Für einen lokalen Worker-Preview:

```bash
npm install
npm run preview
```
