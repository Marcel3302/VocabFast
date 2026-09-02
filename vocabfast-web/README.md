# VocabFast Web MVP

Ein moderner Englisch/Deutsch-Vokabeltrainer als React-Web-App, optimiert für Desktop und Smartphone.

## Enthalten

- Eigene Vokabeln manuell hinzufügen
- Automatische Englisch→Deutsch-Übersetzung über eine Cloudflare Pages Function
- Mikrofon-Eingabe über die Browser Speech Recognition API
- Bild-OCR mit Tesseract.js
- PDF-Textextraktion; bei Scan-Seiten OCR-Fallback
- Lernsystem: Stufe 3 (rot) → nach 5 richtigen in Folge Stufe 2 (gelb) → nach weiteren 5 Stufe 1 (grün)
- Wörter deaktivieren/reaktivieren
- Suche, Filter und Sortierung
- Top-2000-Englischwortliste über `popular-english-words`; Übersetzungen werden bei Bedarf geladen
- Aussprache über Browser Speech Synthesis
- JSON-Backup der lokalen Vokabeln
- Responsive UI für Firmen-PC und Handy
- Pro/Abo-Oberfläche als Platzhalter; echte Zahlung ist im MVP bewusst noch nicht aktiviert

## Datenhaltung

Der MVP speichert Vokabeln und Fortschritt in `localStorage`. Dadurch ist keine Anmeldung nötig und du kannst die App sofort testen. Die Daten sind aber an den jeweiligen Browser gebunden.

Für eine spätere Produktivversion sollte ein Backend für Login, Synchronisierung und Abo-Status ergänzt werden.

## Lokal starten

```bash
npm install
npm run dev
```

Hinweis: Die Cloudflare Function unter `/api/translate` läuft bei reinem `vite`-Dev-Server nicht automatisch. Für den vollständigen lokalen Test inklusive Übersetzung kannst du die App bauen und mit Wrangler als Pages-Projekt starten:

```bash
npm run build
npx wrangler pages dev dist
```

## GitHub + Cloudflare Pages veröffentlichen

1. Neues GitHub-Repository anlegen.
2. Diesen Projektordner in das Repository pushen.
3. In Cloudflare: **Workers & Pages → Create application → Pages → Import an existing Git repository**.
4. Repository auswählen.
5. Build command: `npm run build`
6. Build output directory: `dist`
7. Deploy starten.

Der Ordner `/functions` liegt absichtlich im Projekt-Root. Cloudflare Pages erkennt daraus die serverseitige Route `/api/translate`.

## Übersetzungsdienst

Die Demo-Function verwendet MyMemory als externen Übersetzungsdienst. Das eignet sich zum Testen, hat aber Limits und sollte vor einer kommerziellen Veröffentlichung durch einen vertraglich passenden Übersetzungsanbieter ersetzt werden.

## Browser-Hinweise

- Mikrofon/Spracherkennung funktioniert am zuverlässigsten in aktuellen Chromium-Browsern wie Chrome oder Edge.
- OCR kann bei großen Bildern oder gescannten PDFs einige Sekunden dauern und läuft clientseitig im Browser.
- Firmenrichtlinien können Mikrofon, Datei-Uploads oder externe API-Zugriffe blockieren.

## Nächste sinnvolle Ausbaustufe

- Benutzerkonten und Cloud-Sync (z. B. Supabase oder Cloudflare D1)
- Stripe-Abo für Web sowie Store-Abos für iOS/Android
- echtes Spaced-Repetition-Timing zusätzlich zum 3-Stufen-Modell
- Import-/Export als CSV
- Beispielsätze, Wortarten und mehrere Übersetzungsvarianten
- Admin-Analytics und Fehlertracking
