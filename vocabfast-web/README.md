# VocabFast – Cloudflare One-Folder Version

Dieser Ordner ist ein vollständiges eigenständiges Webprojekt.

## Wichtig für das vorhandene GitHub-Repository

Wenn der Ordner `vocabfast-web` im Repository liegt, stelle Cloudflare Pages **einmalig** so ein:

- Root directory: `vocabfast-web`
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`

Danach wird ausschließlich dieser Ordner als Website gebaut. Alte Dateien außerhalb des Ordners beeinflussen die Website nicht mehr.

## Künftige Updates

Für spätere Updates einfach den Inhalt dieses Ordners durch die neue VocabFast-Version ersetzen bzw. committen. Cloudflare deployt nach jedem Push automatisch neu.

## Lokal testen

```bash
npm run check
npm run build
```

Die fertige statische Website liegt danach in `dist/`.
