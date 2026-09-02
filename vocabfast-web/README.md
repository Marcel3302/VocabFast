# VocabFast – Worker v9

Cloudflare-Worker-Version der VocabFast Web-App.

## Neu in v9

- **Ein einziges Übersetzungsfeld** statt Richtungs-Auswahl.
- Button heißt **Autoübersetzung**.
- VocabFast erkennt per Workers AI selbst, ob die Eingabe Deutsch oder Englisch ist.
- Danach wird automatisch in die jeweils andere Sprache übersetzt.
- Die Übersetzung ist **nicht** auf die 4.500 Kernwörter begrenzt und ist auch für Fachbegriffe gedacht.
- Optionaler Fach-/Lernkontext bleibt erhalten.
- **E-Mail + Passwort Registrierung und Login**.
- Persönliche Wörter, Erfolge und Lernkontext werden nach Login **serverseitig bei Cloudflare** gespeichert.
- Cloud-Sync läuft automatisch nach Änderungen.
- Die 4.500 Kernwörter und Themenpakete bleiben statische Lerninhalte und werden nicht pro Benutzer gespeichert.

## GitHub / Cloudflare Einstellungen

Der komplette Ordner `vocabfast-web` gehört in dein GitHub-Repository.

Cloudflare Build-Einstellungen:

- **Stammverzeichnis:** `/vocabfast-web`
- **Build-Befehl:** leer
- **Bereitstellungsbefehl:** `npx wrangler deploy`
- **Produktions-Branch:** `main`

`wrangler.jsonc` enthält bereits:

- Workers-AI-Binding `AI`
- Static Assets aus `./public`
- Durable-Object-Binding `USER_STORE`
- SQLite-Durable-Object-Migration für die Benutzerkonten

Du musst für den Kontospeicher **keine Datenbank-ID manuell eintragen**.

## Nach dem Deployment testen

### 1. Worker / AI / Kontospeicher

Öffne:

`https://DEINE-DOMAIN/api/health`

Erwartet werden unter anderem:

```json
{
  "ok": true,
  "aiBinding": true,
  "accountStorage": true
}
```

### 2. Automatische Spracherkennung + Übersetzung

Englisch nach Deutsch, ohne Sprachparameter:

`https://DEINE-DOMAIN/api/translate?q=brick`

Die Antwort soll ungefähr so aussehen:

```json
{
  "translation": "Ziegelstein",
  "source": "EN",
  "target": "DE"
}
```

Deutsch nach Englisch:

`https://DEINE-DOMAIN/api/translate?q=Luftfahrt`

Erwartet: `aviation`, Quelle `DE`, Ziel `EN`.

### 3. Konto

In der App links auf **Konto** gehen, registrieren und danach ein Wort hinzufügen. Die App speichert Wörter, Erfolge und Profiländerungen automatisch in den Cloudflare-Kontospeicher.

## Konten – aktueller Stand

v9 unterstützt E-Mail + Passwort. Passwörter werden nicht im Klartext gespeichert, sondern mit PBKDF2 + individuellem Salt abgeleitet. Sitzungen laufen über ein HttpOnly/Secure-Cookie.

Noch **nicht** enthalten:

- Bestätigung der E-Mail-Adresse
- Passwort-vergessen-E-Mail
- Social Login (Google/Apple)

Diese Punkte sollten vor einem öffentlichen kommerziellen Launch ergänzt werden.

## Datenhaltung

Ohne Login läuft VocabFast weiter im Gastmodus und hält Daten als lokalen Zwischenspeicher im Browser. Nach Login ist der Cloud-Speicher die geräteübergreifende Quelle. Beim ersten Login werden vorhandene lokale Vokabeln in ein noch leeres Konto übernommen.

## DeepL

DeepL bleibt optional. Für die Standard-Autoübersetzung wird Workers AI verwendet. Ein `DEEPL_API_KEY` kann später zusätzlich als Secret gesetzt werden.
