# VocabFast – Cloudflare Worker Version v7

Diese Version ist speziell für einen Cloudflare **Worker** mit GitHub-Builds vorbereitet.

## GitHub-Struktur

Der Ordner `vocabfast-web` soll im Repository liegen:

```text
VocabFast/
└── vocabfast-web/
    ├── package.json
    ├── wrangler.jsonc
    ├── src/
    │   └── index.js
    └── public/
        ├── index.html
        ├── app.js
        ├── styles.css
        └── data/
            ├── core-vocabulary.js
            └── theme-packs.js
```

## Cloudflare-Einstellungen

Passend zu deinem aktuellen Cloudflare-Screenshot:

- **Stammverzeichnis:** `/vocabfast-web`
- **Build-Befehl:** keiner / leer
- **Bereitstellungsbefehl:** `npx wrangler deploy`
- **Produktions-Branch:** `main`

`wrangler.jsonc` sorgt dafür, dass Cloudflare die Dateien aus `public/` als Website ausliefert und `/api/*` zuerst durch den Worker schickt.

## Übersetzer testen

Nach dem Deployment im Browser öffnen:

```text
https://DEINE-DOMAIN/api/health
```

Erwartet:

```json
{"ok":true,"service":"vocabfast-worker","translation":true,"deepLConfigured":false}
```

Dann z. B.:

```text
https://DEINE-DOMAIN/api/translate?q=hello&source=EN&target=DE
```

und:

```text
https://DEINE-DOMAIN/api/translate?q=Hydraulikspeicher&source=DE&target=EN
```

Die Übersetzung ist nicht an die 4.500 Lernwörter gebunden.

## Optional: DeepL für zuverlässige Fachübersetzungen

Für bessere und zuverlässigere Fachübersetzungen kannst du in Cloudflare ein Secret namens `DEEPL_API_KEY` hinterlegen. Den Schlüssel niemals in GitHub speichern.

Ohne DeepL versucht der Worker öffentliche Online-Fallbacks. Diese können Rate-Limits oder zeitweise Ausfälle haben.

## Wichtig beim Aktualisieren des GitHub-Repositories

Am saubersten ist, den bisherigen Ordner `vocabfast-web` durch den Ordner aus dieser ZIP zu ersetzen. Alte Dateien wie frühere `vite.config.ts`, `tsconfig.json` oder Pages-`functions/` werden von dieser Worker-Version nicht benötigt.
