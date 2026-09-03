# VocabFast

GitHub-/Cloudflare-Workers-Projekt für VocabFast.

## Cloudflare Build-Einstellungen

- **Stammverzeichnis:** `vocabfast-web`
- **Build-Befehl:** `npm run build`
- **Bereitstellungsbefehl:** `npx wrangler deploy`
- **Produktions-Branch:** `main`

VocabFast nutzt **R2 (`PDFS`)** für Konten, Lernstände, Sessions und PDFs sowie **Workers AI (`AI`)** für Fachwort- und Grammatikgenerierung. D1 ist in dieser Version nicht erforderlich.

## Admin einmalig einrichten

Der Admin-Benutzername ist `admin`. Das Passwort wird **nicht im öffentlichen GitHub-Code gespeichert**.

In Cloudflare für den Worker `vocabfast` ein Secret mit dem Namen `ADMIN_PASSWORD` anlegen und dort ein starkes Passwort hinterlegen. Danach kann der getrennte Admin-Login im Bereich **Konto** verwendet werden.

Der Admin kann:

- Benutzerkonten suchen und öffnen
- Name und E-Mail korrigieren
- Konten sperren/entsperren
- alle aktiven Sitzungen abmelden
- ein temporäres Passwort setzen; der Nutzer muss danach ein neues eigenes Passwort vergeben
- Lernstände/Statistiken im erweiterten Editor korrigieren
- Free/Pro manuell freischalten oder wieder entziehen
- optional ein Pro-Ablaufdatum setzen
- Konten endgültig löschen

Nutzerpasswörter können nicht im Klartext angezeigt werden.

## Lernen und Tests

- **Meine Wörter** ist die Startseite
- allgemeiner Wortschatz A1–C2 plus Fachgebiete wie Luftfahrt
- Lernstufen 3 = neu, 2 = lernen, 1 = sicher
- Vokabeltraining über den gesamten ausgewählten Wortbestand; richtig → nach 0,5 s automatisch weiter, falsch → manuell weiter
- Grammatik A1–C2 mit Erklärungen
- pro Grammatikthema: **10 Übungsfragen** und separater **20-Fragen-Kapiteltest**
- Kapiteltest speichert Prozent/Farbe: grün 90–100 %, gelb 80–89 %, rot 0–79 %
- eigener Reiter **TEST**
- Grammatik-Kompetenztest mit 50 Fragen und auswählbaren Grammatikbereichen
- Wortschatz-Kompetenztest mit 50 Fragen für allgemeines Englisch A1–C2 oder Zusatzkompetenzen/Fachgebiete
- bei **mehr als 90 %** kann eine gestaltete VocabFast-Kompetenzurkunde als PDF erzeugt werden
- die Urkunde listet nur die tatsächlich geprüften Bereiche auf
- VocabFast-Urkunden sind Lernnachweise und keine staatlich/institutionell akkreditierten Sprachzertifikate

## Weitere Funktionen

- Rangsystem Bronze III bis Grandmaster
- Achievements und CEFR-orientierte Lernstandsschätzung
- geräteübergreifende Kontosynchronisierung
- PDF-Bibliothek in R2
- eigene Themen mit Workers-AI-Fachwortgenerierung
- 6.655 Vokabeleinträge, darunter 962 C2-Einträge

## Selbsttest

```bash
npm install
npm run selftest
npx wrangler deploy --dry-run
```
