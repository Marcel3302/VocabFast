# VocabFast – Cloudflare / GitHub

Dieser Ordner `vocabfast-web` ist das komplette Projekt.

## Cloudflare Workers Builds

- Build-Befehl: `npm run build`
- Bereitstellungsbefehl: `npx wrangler deploy`
- Versionsbefehl: `npx wrangler versions upload`
- Stammverzeichnis: `vocabfast-web` (ohne führenden `/`)
- Produktions-Branch: `main`

`npm run build` erzeugt einen vollständig frischen `dist/`-Ordner mit genau vier öffentlichen Dateien. Es werden bewusst **keine** `_redirects`- oder `_headers`-Dateien erzeugt, da Routing bereits über `wrangler.jsonc` (`not_found_handling: single-page-application`) erfolgt.
