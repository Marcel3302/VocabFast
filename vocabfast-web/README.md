# VocabFast – Cloudflare Worker v13

VocabFast ist eine Englisch–Deutsch-Lernwebapp für Cloudflare Workers. Diese Version ist auf den aktuellen Aufbau mit GitHub + `npx wrangler deploy` abgestimmt.

## Was in v13 korrigiert wurde

- Gäste sehen **zuerst Anmeldung / Registrierung**. Ohne Konto ist der eigentliche Lernbereich nicht zugänglich.
- Angemeldete Nutzer landen direkt im **Dashboard**.
- **Passwort vergessen** ist eingebaut: Reset-Link per E-Mail, neues Passwort setzen, alte Sessions werden danach beendet.
- **E-Mail-Bestätigung** ist vorbereitet und wird automatisch aktiviert, sobald der Mailversand konfiguriert ist.
- PBKDF2 verwendet Cloudflare-kompatible **100.000 Iterationen**.
- Autoübersetzung hat nur **ein Eingabefeld**. Deutsch oder Englisch wird automatisch erkannt.
- Der Button heißt **Autoübersetzung**.
- Das Cloudflare-M2M-Übersetzungsmodell bekommt jetzt die korrekten Sprachwerte `english` / `german`.
- Für freie Begriffe verwendet VocabFast mehrere Übersetzungswege mit Cloudflare Workers AI.
- Fachkontext kann weiterhin angegeben werden, z. B. `Luftfahrt – Flugzeugwartung / Airbus A320`.
- Die Themenpakete besitzen **fest hinterlegte, themenspezifische deutsche Übersetzungen** und sind nicht mehr von einer allgemeinen Maschinenübersetzung abhängig.
- Luftfahrt-Stichprobe: `approach = Anflug`, `bank angle = Querneigungswinkel`, `altimeter = Höhenmesser`.
- **4.500 Kernwörter sind exakt 4.500 eindeutige Einträge**.
- CEFR-Lernbänder: A1 650, A2 850, B1 1.000, B2 1.100, C1 900.
- **1.086 Themenbegriffe sind jetzt ebenfalls 1.086 eindeutige Einträge** – keine Wiederholung zwischen den Themenpaketen.
- Themenwörter zeigen die deutsche Bedeutung **sofort**, ohne DE-Button.
- Kernwörter zeigen ihre deutsche Bedeutung automatisch; fehlende Bedeutungen der geöffneten Seite werden in kleinen Batches geladen und im Browser-Cache gespeichert.

## Cloudflare-Einstellungen

Der komplette Ordner `vocabfast-web` gehört in dein GitHub-Repository.

Cloudflare:

- **Stammverzeichnis:** `/vocabfast-web`
- **Build-Befehl:** leer
- **Bereitstellungsbefehl:** `npx wrangler deploy`
- **Produktions-Branch:** `main`

Die Datei `wrangler.jsonc` enthält bereits:

- Workers-AI-Binding `AI`
- Static Assets aus `./public`
- Durable Object `USER_STORE` für Konten und Lerndaten
- SQLite-Durable-Object-Migration

## Nach dem Deployment testen

### Worker

`https://DEINE-DOMAIN/api/health`

Erwartet werden u. a.:

```json
{
  "ok": true,
  "service": "vocabfast-worker-v13",
  "aiBinding": true,
  "accountStorage": true,
  "passwordKdfIterations": 100000
}
```

### Autoübersetzung

`https://DEINE-DOMAIN/api/translate?q=brick`

Erwartet: `Ziegelstein`, Quelle `EN`, Ziel `DE`.

`https://DEINE-DOMAIN/api/translate?q=Beton`

Erwartet: `concrete`, Quelle `DE`, Ziel `EN`.

Mit Luftfahrtkontext:

`/api/translate?q=approach&context=Luftfahrt`

Erwartet: `Anflug`.

## Passwort vergessen + E-Mail-Bestätigung aktivieren

Der Code ist fertig eingebaut. Für echte E-Mails benötigt der Worker einen Mailanbieter. v13 verwendet **Resend**.

Lege in Cloudflare unter den Worker-Einstellungen folgende Secrets / Variablen an:

- `RESEND_API_KEY` – als Secret
- `MAIL_FROM` – z. B. `VocabFast <noreply@deine-domain.de>`

Für Produktion muss die Absenderdomain beim Mailanbieter verifiziert sein. API-Schlüssel niemals in GitHub eintragen.

Ohne diese beiden Werte funktionieren Registrierung/Login und Cloud-Speicherung trotzdem; E-Mail-Bestätigung wird dann nicht erzwungen. „Passwort vergessen“ zeigt bewusst an, dass der Mailversand noch eingerichtet werden muss.

## Cloud-Speicherung

Persönliche Daten werden nach Anmeldung serverseitig im Durable Object gespeichert:

- eigene Vokabeln
- Stufe 1 / 2 / 3 und Serien
- gemeisterte Wörter / Erfolge
- Lern- und Fachkontext

Der Browser dient nur noch als lokaler Cache. Nach dem Abmelden werden persönliche lokale Lerndaten entfernt.

## Datenprüfung

Im Projekt liegt eine automatische Prüfung:

```bash
npm run validate
```

Sie prüft:

- exakt 4.500 Kernwörter
- keine Duplikate im Kernwortschatz
- korrekte A1–C1-Anzahlen
- alle 1.086 Themenbegriffe eindeutig
- zu jedem Themenbegriff eine deutsche Übersetzung
- die kritischen Luftfahrtübersetzungen `approach`, `bank angle`, `altimeter`

## Hinweis zu den A1–C1-Stufen

Die A1–C1-Einteilung des Kernwortschatzes ist eine VocabFast-Lerneinteilung nach Häufigkeit/Rang und keine offizielle CEFR-Zertifizierung einzelner Wörter.
