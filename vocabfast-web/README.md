# VocabFast – Web-App v6

Stabile statische Web-App für Englisch ↔ Deutsch mit Cloudflare Pages Functions. Kein npm-Build und kein React-Setup nötig: Dateien in GitHub hochladen, Cloudflare Pages verbinden, deployen.

## Was in v6 neu ist

- **Exakt 4.500 Kernwörter liegen direkt im Projekt** (`data/core-vocabulary.js`). Die App lädt dafür keine externe GitHub-Wortliste mehr nach.
- Kernwortschatz kann nach **A1, A2, B1, B2, C1** gefiltert und nach Häufigkeit, A–Z, A1→C1 oder C1→A1 sortiert werden.
- Feste Lernband-Zähler: **A1 650 · A2 850 · B1 1.000 · B2 1.100 · C1 900 = 4.500**.
- **1.086 zusätzliche Themenbegriffe**: Luftfahrt 201, Basketball 154, Reisen 165, Business 173, Restaurant/Essen 124, Alltag/flüssiges Sprechen 148, Gesundheit 121.
- Freie Übersetzung funktioniert **Englisch → Deutsch und Deutsch → Englisch**.
- Die Übersetzung ist **nicht** an die 4.500 Kernwörter oder Themenlisten gebunden. Neue Fachwörter und Phrasen werden an einen Online-Übersetzungsdienst geschickt.
- Einfacherer Grammatikteil mit **Bauplan**, kurzer Erklärung, typischem Fehler und Beispielen.

## Lernlogik

Ein Wort ist **nicht** gemeistert, nur weil es Stufe 1 erreicht hat.

1. **Stufe 3 (rot)**
   - 5× hintereinander richtig → Stufe 2
   - Fehler → bleibt Stufe 3, Serie wieder 0/5
2. **Stufe 2 (gelb)**
   - Deutsch ↔ Englisch werden gemischt
   - 5× hintereinander richtig → Stufe 1
   - 1 Fehler → sofort zurück zu Stufe 3, Serie 0/5
3. **Stufe 1 (grün)**
   - bleibt weiterhin im normalen Trainer
   - Deutsch ↔ Englisch werden gemischt
   - 1 Fehler → sofort zurück zu Stufe 2
   - erst **5× hintereinander richtig in Stufe 1** → Wort wird als **🏆 Gemeistert** gespeichert und aus dem Standard-Trainer entfernt

Gemeisterte Wörter haben einen eigenen Bereich **Erfolge**.

## Freie Übersetzung in beide Richtungen

Unter **Hinzufügen** gibt es drei Modi:

- Automatisch nach dem zuletzt bearbeiteten Feld
- Englisch → Deutsch
- Deutsch → Englisch

Beispiele, die nicht in der App gespeichert sein müssen:

- `hydraulic accumulator` → Deutsch
- `angle of attack` → Deutsch
- `Hydraulikspeicher` → Englisch
- `Strömungsabriss` → Englisch
- firmenspezifische Begriffe oder längere Fachphrasen

Der optionale **Fachgebiet / Lernkontext** (z. B. `Luftfahrt – Flugzeugwartung / Airbus A320`) wird beim DeepL-Weg als Übersetzungskontext mitgesendet.

### Übersetzungsanbieter

Die Cloudflare Function `functions/api/translate.js` versucht:

1. **DeepL API**, wenn `DEEPL_API_KEY` in Cloudflare hinterlegt ist.
2. einen key-losen Online-Fallback für den Prototyp.
3. MyMemory als zweiten Online-Fallback.
4. nur als letzter Notfall existiert eine kleine lokale Basis für einige häufige Wörter.

Für eine spätere produktive Veröffentlichung ist ein offizieller Übersetzungsanbieter mit eigenem API-Key empfehlenswert. API-Keys niemals in GitHub oder `app.js` speichern.

## DeepL in Cloudflare einrichten (optional)

1. DeepL API-Key erstellen.
2. Cloudflare Dashboard → **Workers & Pages** → dein Projekt.
3. **Settings → Variables and Secrets**.
4. Secret anlegen:
   - Name: `DEEPL_API_KEY`
   - Wert: dein API-Key
5. Neu deployen.

Optional kann `DEEPL_API_URL` gesetzt werden. Ohne Variable erkennt die Function API-Free-Keys mit `:fx` und verwendet sonst den normalen API-Endpunkt.

## Cloudflare Pages veröffentlichen

1. **Den Inhalt dieses Ordners** in dein GitHub-Repository hochladen. `index.html` muss direkt im Repository-Root liegen.
2. Cloudflare Pages mit dem Repository verbinden.
3. Framework preset: **None**
4. Build command: **leer**
5. Build output directory: **`.`**
6. Deploy.

Wichtig: Der Ordner **`functions/` muss mit hochgeladen werden**, sonst funktionieren Online-Übersetzung und Online-Beispielsätze nicht.

Bereitgestellte Functions:

- `/api/translate` – beliebige EN↔DE-Übersetzung
- `/api/example` – kurzer englischer Beispielsatz, wenn online verfügbar

Die 4.500 Kernwörter kommen **nicht** aus einer Function, sondern liegen direkt unter `data/`.

## Kernwortschatz und A1–C1

Der Kernwortschatz ist ein **häufigkeitsorientiertes VocabFast-Lernpaket**. Die 4.500 Wörter wurden aus einer lokalen englischen Häufigkeitsbasis zusammengestellt. Die Einteilung A1–C1 dient in dieser Version als Lernorientierung nach Häufigkeitsbändern und ist **keine offizielle Cambridge-/CEFR-Prüfungswortliste**.

Das ist absichtlich transparent gehalten: Für eine spätere kommerzielle Version kann die Wortbasis noch gegen eine lizenzierte/validierte CEFR-Lexikquelle ausgetauscht werden, ohne das Lernsystem zu ändern.

## Themenwortschatz

Die Themenpakete sind umfangreiche, C1-orientierte Sammlungen. Ein Fachgebiet hat in der Realität keine endliche Liste „aller“ Wörter – besonders Luftfahrt oder Business können tausende Spezialbegriffe enthalten. Deshalb sind die Pakete breit aufgebaut und können mit dem freien Übersetzer beliebig um persönliche Fachwörter ergänzt werden.

Aktueller Umfang:

- Luftfahrt: **201**
- Basketball: **154**
- Reisen: **165**
- Business & Büro: **173**
- Restaurant & Essen: **124**
- Alltag & flüssiges Sprechen: **148**
- Gesundheit: **121**
- Gesamt: **1.086 zusätzliche Begriffe**

## PDF

PDFs mit eingebettetem Text können ausgelesen werden. Erkannte englische Wörter lassen sich auswählen und werden beim Hinzufügen frei online übersetzt. PDF.js wird erst beim tatsächlichen PDF-Upload geladen, sodass die PDF-Funktion den App-Start nicht blockiert.

Reine Scan-/Bild-PDFs benötigen OCR; OCR ist noch nicht Bestandteil dieser stabilen Version.

## Aussprache

Englische Wörter und Beispielsätze können über die Browser-Sprachausgabe angehört werden. Mikrofoneingabe ist in unterstützten Browsern möglich; Chrome/Edge eignen sich dafür am besten.

## Datenspeicherung

Eigene Wörter, Lernfortschritt, Erfolge, Übersetzungscache und Fachkontext werden derzeit im `localStorage` des jeweiligen Browsers gespeichert. Dadurch ist die Testversion ohne Login/Backend nutzbar. Ein anderer PC oder Browser hat einen eigenen Datenstand. Unter **Meine Wörter** kann ein JSON-Backup exportiert werden.
