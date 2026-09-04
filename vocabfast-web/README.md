# VocabFast

GitHub-/Cloudflare-Workers-Projekt für VocabFast.

## Produktion

- **Domain:** `https://vocabfast.net`
- **Admin:** `https://vocabfast.net/admin`
- **Stammverzeichnis:** `vocabfast-web`
- **Build-Befehl:** `npm run build`
- **Bereitstellungsbefehl:** `npx wrangler deploy`
- **Produktions-Branch:** `main`

VocabFast nutzt **R2 (`PDFS`)** für Konten, Lernstände, Sessions und PDFs sowie **Workers AI (`AI`)** für Fachwort- und Grammatikgenerierung. D1 ist in dieser Version nicht erforderlich.

## Zugriff

Die normale Anwendung ist nur nach erfolgreicher Nutzeranmeldung verwendbar. Nicht angemeldete Besucher sehen ausschließlich Anmeldung/Registrierung. Der Admin-Zugang ist vollständig von der normalen Anwendung getrennt und befindet sich unter `/admin`.

Der Admin-Benutzername ist `admin`. Das Passwort wird **nicht im öffentlichen GitHub-Code gespeichert**. In Cloudflare für den Worker `vocabfast` ein Secret `ADMIN_PASSWORD` mit einem starken Passwort hinterlegen.

## Stripe / VocabFast Elite

VocabFast Elite ist als monatliches Abonnement mit 7,99 € eingerichtet. Der Worker verwendet die Produktionsdomain als `APP_ORIGIN`. Das Stripe-Kundenportal ist als Fallback für „Abo verwalten / kündigen“ hinterlegt. Live-Secrets wie `STRIPE_SECRET_KEY_LIVE` und `STRIPE_WEBHOOK_SECRET_LIVE` gehören ausschließlich in Cloudflare-Secrets und niemals ins Repository.

## Rechtliches vor öffentlichem kommerziellem Start

Die Seiten `impressum.html`, `datenschutz.html`, `nutzungsbedingungen.html` und `widerruf.html` sowie ein globaler Rechts-Footer werden beim Build ausgeliefert. Die öffentlichen Anbieterangaben werden zentral in `legal-config.js` gepflegt.

Vor einem kommerziellen Livegang müssen dort mindestens bestätigt und eingetragen sein:

- öffentlicher Anbieter-/Unternehmername
- ladungsfähige Geschäftsanschrift
- öffentliche Kontakt-E-Mail
- gegebenenfalls Rechtsform, Firmenbuch, UID, WKO-/Gewerbe- und Behördenangaben
- steuerlicher Hinweis zum Endpreis, falls erforderlich

Die Vorlagen sind eine technische Grundlage und ersetzen keine individuelle Rechts- oder Steuerberatung. Insbesondere grenzüberschreitender B2C-Vertrieb und die ab Oktober 2026 in Österreich geltende Online-Rücktrittsfunktion sollten vor dem entsprechenden Vertrieb abschließend geprüft werden.

## Lernen und Tests

- **Meine Wörter** ist die Startseite nach Anmeldung
- allgemeiner Wortschatz A1–C2 plus Fachgebiete wie Luftfahrt
- Lernstufen 3 = neu, 2 = lernen, 1 = sicher
- Vokabeltraining über den ausgewählten Wortbestand
- Grammatik A1–C2 mit Erklärungen
- pro Grammatikthema: 10 Übungsfragen und separater 20-Fragen-Kapiteltest
- eigener Reiter TEST mit 50-Fragen-Kompetenztests
- VocabFast-Urkunden sind Lernnachweise und keine staatlich/institutionell akkreditierten Sprachzertifikate
- Rangsystem Bronze III bis Grandmaster
- CEFR-orientierte Lernstandsschätzung
- geräteübergreifende Kontosynchronisierung
- PDF-Bibliothek in R2
- eigene Themen mit Workers-AI-Fachwortgenerierung

## Selbsttest

```bash
npm install --no-audit --no-fund
npm run selftest
npx wrangler deploy --dry-run
```

Der Release-Selftest prüft unter anderem Build-Dateien, Worker-Konfiguration, Zugriffssperre, Stripe-Integration, Rechtsseiten und dass ausgemusterte Admin-Runtimes nicht mehr in den Produktionsbuild injiziert werden.
