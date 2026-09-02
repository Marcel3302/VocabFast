# VocabFast – stabiler MVP

Diese Version ist absichtlich ohne React-, OCR-, PDF- oder sonstige npm-Abhängigkeiten gebaut. Dadurch gibt es keinen Build-Schritt und deutlich weniger Möglichkeiten für eine leere Seite.

## Enthalten
- Dashboard
- Eigene Englisch/Deutsch-Vokabeln
- Automatische Übersetzung über eine Cloudflare Pages Function
- Offline-Fallback für häufige Wörter
- Mikrofon-Eingabe in unterstützten Browsern (vor allem Chrome/Edge)
- Aussprache über Browser Speech Synthesis
- Trainer mit Schreiben- und Denken-Modus
- Stufe 3 (rot) -> nach 5 richtigen in Folge Stufe 2 (gelb) -> nach weiteren 5 Stufe 1 (grün)
- Falsche Antwort setzt nur die aktuelle Serie auf 0
- Wörter pausieren / aktivieren
- Suche, Filter, Sortierung
- JSON-Backup der Wortliste
- Eingebauter Basiswortschatz als stabiler Ersatz für die problematische externe Top-2000-Bibliothek

## Bewusst noch nicht enthalten
- Abo
- Login / Cloud-Sync
- Bild-OCR
- PDF-Import
- vollständige Top-2000-Liste

Diese Funktionen kommen erst nach dem Stabilitätstest der Kern-App.

## Lokal testen
Du kannst `index.html` direkt öffnen. Noch besser ist ein kleiner lokaler Webserver:

```bash
python -m http.server 8000
```

Dann im Browser `http://localhost:8000` öffnen.

Hinweis: `/api/translate` funktioniert lokal nur mit einer Cloudflare-Pages-Dev-Umgebung. Ohne diese API verwendet die App für viele häufige Wörter den eingebauten Übersetzungs-Fallback; manuelle Eingabe funktioniert immer.

## Cloudflare Pages + GitHub
1. Inhalt dieses Ordners in ein GitHub-Repository hochladen.
2. In Cloudflare Pages das Repository verbinden.
3. Framework preset: `None`.
4. Build command: leer lassen.
5. Build output directory: `/` bzw. Root des Repositorys (wenn Cloudflare ein Feld verlangt, `.` verwenden).
6. Deploy starten.

Der Ordner `functions/api/translate.js` wird von Cloudflare Pages als Function unter `/api/translate` bereitgestellt.

## Daten
Alle eigenen Wörter werden aktuell in `localStorage` dieses Browsers gespeichert. Das ist für den Firmen-PC-Test praktisch, bedeutet aber auch: anderer Browser oder anderes Gerät = eigene lokale Daten. Dafür gibt es in „Meine Wörter“ einen Backup-Export.
