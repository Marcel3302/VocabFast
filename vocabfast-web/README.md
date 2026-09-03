# VocabFast MAX

Statische Vokabel-, PDF- und Grammatik-Lernapp für GitHub Pages oder Cloudflare Pages.

## Funktionen
- Mehr als 6.000 integrierte Vokabeleinträge von A1 bis C2/Native, inklusive tiefer Luftfahrt-/Hubschrauber-Fachthemen.
- Komplette Themen oder Unterthemen mit einem Klick zur Lernliste hinzufügen.
- Eigene Themen erstellen und automatisch mit passenden vorhandenen Wörtern füllen.
- Lernliste: Mehrfachauswahl, markierte Wörter löschen, alles löschen, CSV-Export.
- PDF-Bibliothek: PDFs werden per IndexedDB lokal im Browser gespeichert; einzelne, markierte oder alle PDFs können gelöscht werden.
- PDF-Wortanalyse: Beim Markieren eines Wortes bleibt die Scrollposition erhalten.
- Grammatiktrainer A1–C2.
- Konto-/Datenbereich zum Löschen aller lokal gespeicherten Daten.

## GitHub Pages
1. Den Inhalt dieses Ordners in ein Repository hochladen.
2. Settings → Pages → Deploy from a branch.
3. Branch `main`, Ordner `/ (root)`.

## Cloudflare Pages
- Framework preset: **None**
- Build command: **leer lassen**
- Build output directory: **/** (Repository-Root)
- `index.html` liegt direkt im Root.

Die App benötigt keinen Server und keinen Build-Schritt. Für die PDF-Textauswertung wird PDF.js im Browser von jsDelivr geladen. Hochgeladene PDFs und Lernfortschritt verbleiben lokal im jeweiligen Browser/Profil und werden nicht auf GitHub gespeichert.

## Hinweis zur Kontofunktion
Diese statische Version besitzt kein serverseitiges Benutzerkonto. „Konto löschen“ löscht daher vollständig die lokalen App-Daten dieses Browsers (localStorage + IndexedDB). Für serverseitige Accounts wäre ein Auth-/Backend-Dienst nötig.
