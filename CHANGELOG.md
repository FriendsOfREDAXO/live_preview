# Changelog

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] – 2025

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
- Querformat-Rotation für Mobile und Tablet per Toolbar-Button

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
