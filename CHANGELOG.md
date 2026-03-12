# Changelog

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.6] – 2026-03-13

### Fixed

- **Sprungmarken-Scroll im Backend**: Wenn die vorgeschaute Frontend-URL einen Hash-Anker enthält (z.B. One-Page-Sites wie `https://example.com/#kontakt`), scrollte das REDAXO-Backend automatisch zu einem gleichnamigen Element. Der Hash wird jetzt beim Setzen von `iframe.src` entfernt – der Inhalt des iframes wird davon nicht beeinflusst, da der Browser die Seite ohnehin vollständig lädt.

---

## [1.0.5] – 2026-03-13

### Removed

- **Slice-Scroll** entfernt: Das automatische Scrollen zur bearbeiteten Slice-Position war nicht zuverlässig und wurde vorerst zurückgezogen

### Fixed

- `load_frontend: true` aus `package.yml` entfernt (war nur für Slice-Scroll benötigt)

---

## [1.0.4] – 2026-03-13

### Added

- **Slice-Scroll**: Nach dem Speichern eines Slices scrollt der iframe automatisch zur Position des bearbeiteten Slices
- `SLICE_SHOW`-Extension-Point injiziert unsichtbare Scroll-Anker (`<span id="rex-slice-{id}">`) ins Frontend – nur wenn `?lp_anchors=1` in der iframe-URL steht
- `load_frontend: true` in `package.yml` damit `boot.php` auch im Frontend ausgeführt wird

### Fixed

- `LivePreviewUrlApi`: fehlende `use`-Statements für REDAXO-Klassen im Namespace ergänzt

---

## [1.0.3] – 2026-03-12

### Fixed

- **Float-Modus Darstellung nach Reload**: Flex-Kette auf `.panel-collapse` und `#rex-lp-panel` komplettiert – iframe-Höhe füllt das Panel nun korrekt aus
- **Panel-Header als Drag-Zone**: Im Float-Modus kann der gesamte Panel-Header zum Verschieben genutzt werden (außer Toggle-Switch und Dock-Button)
- **Bootstrap-Collapse blockiert**: Klick auf Header-Link wird im Float-Modus via Capture-Phase abgefangen
- **Expand-Button deaktiviert**: Im Float-Modus ausgegraut und funktionslos

---

## [1.0.2] – 2026-03-12

### Added

- **Draggable Panel**: Panel lässt sich per Drag-Handle (`⤣`-Icon in der Toolbar) aus der Sidebar lösen und frei im Viewport positionieren
- Position und Breite werden in `localStorage` gespeichert und nach Seitenreload automatisch wiederhergestellt
- Platzhalter (gestrichelter Rahmen) markiert die ursprüngliche Stelle in der Sidebar
- **Dock-Button**: X-Button im floating Panel-Heading bringt das Panel zurück in die Sidebar

---

## [1.0.1] – 2026-03-12

### Fixed

- **Toggle ohne Reload**: iframe ist jetzt immer im DOM (via `data-src`). Beim Einschalten wird `src = data-src` direkt per JS gesetzt – kein Seiten-Reload, kein PJAX nötig
- Beim Ausschalten wird `src = about:blank` gesetzt, der iframe lädt damit sofort ab
- Panel-Body wird immer vollständig gerendert (iframe nie aus dem DOM entfernt)

---

## [1.0.0] – 2026-03-12

### Initial Release

#### Features

**Device Simulation**
- Desktop-Vollbild-Modus (pixel-perfect, kein Scaling)
- Desktop-Custom-Modus mit Skalierung (Scale-to-fit) und frei einstellbarer Größe
- Tablet-Simulation (klassisches iPad-Design: breite Bezels, runder Home Button, Kamera-Dot)
- Mobile-Simulation (moderne Smartphone-Darstellung: Dynamic Island Pill, Home Indicator)

**Desktop Presets**
- Volle Breite (Desktop-Fullscreen)
- 5K (5120 × 2880)
- 4K UHD (3840 × 2160)
- Full HD (1920 × 1080)
- QHD (1440 × 900)
- HD (1280 × 800)
- XGA (1024 × 768)
- Tablet (768px)
- Mobile (390px)

**Monitor-Bezel & Stand**
- Desktop-Custom zeigt einen realistischen Monitor-Rahmen (Bezel mit Kamera-Dot)
- Separates Monitor-Stand-Element (`#rex-lp-monitor-stand`), JS-positioniert unterhalb des Frames

**Chalk Labels**
- Breiten- und Höhenanzeige des Viewport als Chalk-Style-Labels
- JS-positioniert via `getBoundingClientRect`, als Stage-Geschwister (nicht innerhalb des Frames)
- Nur sichtbar im Desktop-Custom-Modus bei definierten Dimensionen

**Resize Handles**
- Resize-Handles (E / S / SE) im Desktop-Custom-Modus
- East-Handle erhält Vorrang und behält das Seitenverhältnis bei

**Tablet-Scrolling**
- Stage im Tablet-Modus: `overflow: auto; align-items: flex-start`
- Ermöglicht natürliches vertikales Scrollen langer Seiten

**Rotation**
- Im Modal-Modus (Vollbild): Tablet und Mobile per Toolbar-Button zwischen Hoch- und Querformat wechseln

**Per-User-Toggle**
- Aktivieren/Deaktivieren des Panels per Switch im Panel-Header, Einstellung wird per User gespeichert
- Bei deaktivierter Vorschau: Panel bleibt zugeklappt

**Persistenz**
- Gewähltes Gerät, Preset, Querformat-Status und Custom-Größe werden in `localStorage` gespeichert
- Wird beim erneuten Öffnen des Modals wiederhergestellt

**Backend-Integration**
- Sidebar-Panel im REDAXO-Backend (Extension Point `STRUCTURE_CONTENT_SIDEBAR`)
- Automatische Ermittlung der Frontend-URL inkl. `rex_version` (Live/Work)
- AJAX-API-Endpunkt (`rex-api-call=live_preview_url`) für dynamische URL-Abfragen
- API erfordert Backend-Session (kein öffentlicher Zugriff)

**Internationaliserung**
- Vollständige i18n-Unterstützung: `de_de.lang` und `en_gb.lang`

**Namespace**
- PHP-Klassen unter `FriendsOfREDAXO\LivePreview` organisiert
- API-Klasse per `rex_api_function::register()` explizit registriert

---

*Credits: [Friends Of REDAXO](https://github.com/FriendsOfREDAXO)*
