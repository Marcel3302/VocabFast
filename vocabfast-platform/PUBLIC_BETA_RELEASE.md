# VocabFast – Public Beta Release

Stand: 14. September 2026

## Ziel dieses Branches

`vocabfast-language-platform` ist für eine **öffentliche kostenlose Beta** vorbereitet. Nutzer können Konten erstellen, vorhandene Lernpfade verwenden und die freigeschalteten Learn-, Speak-, Travel-, Translate-, PDF- und Wortschatzfunktionen testen.

## Für die öffentliche Beta umgesetzt

- Öffentliche Startseite mit klarer Beta-Kommunikation
- Keine öffentliche Stripe-Sandbox/Testkauf-Aufforderung
- Pro wird während der Beta als noch nicht regulär buchbar dargestellt
- Englisch A1–C2 und Kroatisch A1–A2 als strukturierte Lernpfade
- Mehrsprachige Translate-/Voice-/PDF-Unterstützung
- PDF Reader mit Suche, OCR, Übersetzung, Vorlesen, Notizen und Lernkarten
- Persönlicher Wortschatz und Wiederholungslogik
- Travel- und Speak-Handoffs aus Translate
- Konto-Synchronisierung, Passwortänderung und Kontolöschung
- Fehlergrenze und Offline-Hinweis
- PWA-Manifest und Service Worker
- `robots.txt`, `sitemap.xml` und indexierbare Startseite
- Impressum, Datenschutz, Nutzungsbedingungen und Pro/Widerruf
- Explizite Worker-Routen für öffentliche Legal-/SEO-Dateien
- GitHub Actions Build, Release-Audit, Worker-Bundle, Deploy und Live-Smoke-Test

## Bewusst noch NICHT als fertig markieren

### 1. Passwort zurücksetzen per E-Mail
Aktuell existiert kein automatischer Forgot-Password-Mailflow. In der Beta wird auf den Kontakt im Impressum verwiesen. Vor größerer Nutzerzahl sollte ein echter Reset-Token-/E-Mail-Flow gebaut werden.

### 2. VocabFast Pro / echte Zahlungen
Stripe bleibt technisch im Testmodus. Normale Nutzer bekommen keinen Testkauf angeboten. Vor dem Live-Verkauf erforderlich:
- Stripe Live-Produkt und Live-Preis
- Live-Checkout und Kundenportal
- Live-Webhook und Signaturprüfung
- finaler Preis-/Leistungsumfang
- aktualisierte Vertrags- und Widerrufsinformationen
- echter Kauf-, Kündigungs- und Erstattungs-Test

### 3. Rechtliche Endprüfung
Die vorhandenen Seiten beschreiben den aktuellen technischen Beta-Betrieb. Vor einem kommerziellen Start oder größeren öffentlichen Marketing sollte der rechtliche Inhalt fachlich geprüft werden.

### 4. Release-QA auf echten Geräten
Vor größerer Bewerbung testen:
- iPhone Safari / installierte PWA
- Android Chrome / installierte PWA
- Windows Chrome / Edge
- Mikrofonfreigabe und Speech Recognition
- langsame bzw. unterbrochene Verbindung
- große PDFs und Scan-PDFs
- Registrierung, Login, Logout, Passwortänderung, Kontolöschung

## Release-Regel

Ein Commit gilt nur als deploybar, wenn der Workflow `VocabFast platform checks` vollständig grün ist – inklusive Build, Release-Surface-Audit, Worker-Prüfung, Cloudflare-Deploy und Live-Smoke-Test.
