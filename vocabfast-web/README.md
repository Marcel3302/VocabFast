# VocabFast – Web-App v5

Stabile statische Web-App für Englisch ↔ Deutsch mit Cloudflare Pages Functions. Kein npm-Build und kein React-Setup nötig.

## Enthalten

- Eigene Vokabeln, lokal im Browser gespeichert
- Trainer wahlweise **Alle / nur Stufe 3 / nur Stufe 2 / nur Stufe 1**
- Lernlogik:
  - Stufe 3: 5× richtig in Folge → Stufe 2
  - Stufe 2: 5× richtig → Stufe 1; 1 Fehler → Stufe 3
  - Stufe 1: 1 Fehler → Stufe 2; 5× richtig → dauerhaft als **Erfolg / gemeistert** gespeichert
- Ab Stufe 2 zufällig **Deutsch → Englisch** oder **Englisch → Deutsch**
- Kurzer englischer Beispielsatz nach der Lösung
- Englische Aussprache über Browser Speech Synthesis
- Mikrofon-Eingabe in unterstützten Browsern (besonders Chrome/Edge)
- Exakt **4.500 Kernwörter** als frequenzbasierte Basis bis C1
- Zusätzliche Themenpakete, getrennt von den 4.500 Kernwörtern
- Themen u. a. Reisen, Luftfahrt, Basketball, Business, Essen, Technologie, Smalltalk, Gesundheit
- PDF-Import für PDFs mit echtem Text; Wörter aus dem PDF auswählen und übernehmen
- Basic-Grammar-Kapitel mit deutschen Erklärungen und englischen Beispielen
- Eigene Bibliothek mit Suche, Stufenfiltern, Pausieren und Backup-Export
- Separater Bereich für dauerhaft gemeisterte Wörter

## Freie Übersetzung – auch für Fachwörter

Der Übersetzer ist **nicht** auf die 4.500 Kernwörter oder die Themenlisten begrenzt.

Beim Hinzufügen kannst du beliebige englische Wörter oder Phrasen eingeben, z. B.:

- `angle of attack`
- `hydraulic accumulator`
- `thrust reverser`
- `pick and roll coverage`
- einen firmenspezifischen oder technischen Fachbegriff

Zusätzlich gibt es ein Feld **Fachgebiet / Lernkontext**, z. B.:

`Luftfahrt – Flugzeugwartung / Airbus A320`

Dieser Kontext wird bei der Übersetzung mitgesendet und auch beim PDF-Import verwendet.

### Übersetzungsanbieter

1. **DeepL (empfohlen, optional):** Wenn ein DeepL API-Key in Cloudflare hinterlegt ist, wird DeepL zuerst verwendet. Der Fachkontext wird dabei direkt als Übersetzungskontext mitgesendet.
2. **Online-Fallback ohne API-Key:** Wenn kein DeepL-Key hinterlegt ist, nutzt die Function MyMemory für freie EN↔DE-Übersetzungen.
3. **Lokaler Fallback:** Nur wenn die Online-Übersetzung ausfällt, können wenige bereits bekannte Wörter lokal übersetzt werden. Die lokale Liste begrenzt die Übersetzungsfunktion nicht mehr.

## DeepL in Cloudflare einrichten

Die App funktioniert auch ohne DeepL-Key. Für Fachbegriffe und kontextabhängige Übersetzungen ist DeepL empfehlenswert.

1. DeepL API-Zugang erstellen und API-Key kopieren.
2. Cloudflare Dashboard öffnen.
3. **Workers & Pages → dein Pages-Projekt → Settings → Variables and Secrets**.
4. Neues **Secret** anlegen:
   - Name: `DEEPL_API_KEY`
   - Wert: dein DeepL API-Key
5. Neu deployen.

Optional kannst du zusätzlich `DEEPL_API_URL` setzen, wenn du einen bestimmten DeepL-Endpunkt verwenden möchtest. Ohne diese Variable erkennt die Function API-Free-Keys mit `:fx` automatisch und verwendet ansonsten den normalen DeepL-Endpunkt.

**Wichtig:** API-Keys niemals in `app.js`, GitHub oder andere öffentliche Dateien schreiben. `.env*` und `.dev.vars*` sind in `.gitignore` enthalten.

## Cloudflare Pages veröffentlichen

1. Inhalt dieses Ordners in dein GitHub-Repository hochladen.
2. In Cloudflare Pages dein GitHub-Repository verbinden.
3. Framework preset: **None**
4. Build command: **leer lassen**
5. Build output directory: **`.`** bzw. Repository-Root
6. Deploy starten.

Die Dateien unter `functions/api/` werden automatisch als Cloudflare Pages Functions bereitgestellt:

- `/api/translate` – freie Übersetzung
- `/api/core-words` – exakt 4.500 Kernwörter
- `/api/example` – Beispielsatz, wenn online verfügbar

## PDF-Hinweis

Aktuell werden PDFs mit eingebettetem Text direkt gelesen. Bei reinen Scan-/Bild-PDFs ist zusätzlich OCR erforderlich; diese OCR-Erweiterung ist noch nicht Bestandteil dieser stabilen Version. PDF.js wird erst beim Auswählen eines PDFs geladen, damit ein PDF-Problem niemals den Start der App blockieren kann.

## Daten und Firmen-PC

Eigene Wörter, Lernfortschritt, Erfolge, Übersetzungscache und dein Fachkontext werden derzeit in `localStorage` des jeweiligen Browsers gespeichert. Das ist für den Test am Firmen-PC einfach und datensparsam, bedeutet aber: Ein anderer Browser oder PC hat zunächst einen eigenen Datenstand. Unter **Meine Wörter** kannst du ein JSON-Backup exportieren.
