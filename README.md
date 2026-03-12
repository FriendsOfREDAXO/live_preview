# Live Preview for REDAXO

![REDAXO Live Preview](https://raw.githubusercontent.com/FriendsOfREDAXO/live_preview/assets/preview.png)

Live Preview ermöglicht eine direkte Vorschau von Frontend-Seiten im REDAXO-Backend – ohne Tab-Wechsel, ohne Browser-Reload-Raten, ohne Ablenkung vom Redaktionsalltag.

---

## Features

### Geräte-Simulation
- **Desktop-Vollbild** – Seite nimmt die gesamte Vorschaufläche ein, 1:1-Darstellung
- **Desktop mit Rahmen** – realistischer Monitor-Bezel inkl. Monitor-Ständer, skaliert automatisch passend auf die verfügbare Fläche
- **Tablet** – klassisches iPad-Design: breite Bezels, runder Home Button, Kamera-Dot
- **Mobile** – modernes Smartphone-Design: Dynamic Island Pill, Home Indicator

### Desktop Presets
Schnellauswahl gängiger Viewport-Breiten per Dropdown:

| Preset      | Auflösung      |
|-------------|----------------|
| Volle Breite | (Fullscreen)  |
| 5K          | 5120 × 2880    |
| 4K UHD      | 3840 × 2160    |
| Full HD     | 1920 × 1080    |
| QHD         | 1440 × 900     |
| HD          | 1280 × 800     |
| XGA         | 1024 × 768     |
| Tablet      | 768px          |
| Mobile      | 390px          |

### Resize-Handles
- Viewport im Desktop-Modus per Drag-and-drop frei in der Breite, Höhe oder diagonal anpassen
- Seitenverhältnis bleibt beim horizontalen Ziehen automatisch erhalten

### Viewport-Anzeige
- Chalk-Style-Labels zeigen die aktuellen Pixel-Dimensionen des Viewports direkt an der Vorschau an

### Querformat-Rotation
- Tablet und Mobile per Toolbar-Button in Querformat drehen und zurück

### Persistenz
- Gewähltes Gerät, Preset, Rotationsstatus und individuelle Größe werden im Browser-LocalStorage gespeichert und beim nächsten Öffnen wiederhergestellt

### Version-Awareness
- Die Vorschau erkennt automatisch, ob ein Artikel im Live- oder Work-Modus (structure/version-Plugin) betrachtet wird, und zeigt die jeweils korrekte Frontend-Version

### Backend-Integration
- Vorschau-Panel erscheint direkt in der REDAXO-Struktur als aufklappbare Sidebar-Sektion (Extension Point `STRUCTURE_CONTENT_SIDEBAR`) – kein separater Aufruf nötig
- AJAX-API-Endpunkt liefert stets die aktuelle Frontend-URL inkl. korrekter `rex_version`
- Zugriff nur für authentifizierte Backend-User

### Mehrsprachigkeit
- Vollständig übersetzt: Deutsch (`de_de`) und Englisch (`en_gb`)

---

## Warum Live Preview?

**Weniger Tab-Chaos** – kein ständiges Hin- und Herwechseln zwischen Backend-Tab und Frontend-Tab. Die Vorschau lebt direkt neben dem Inhalt.

**Schnelleres Feedback** – Tippfehler, Layout-Brüche oder responsive Probleme fallen sofort auf, ohne den Redaktionsfluss zu unterbrechen.

**Bessere UX für Redakteur:innen** – wer weiß, was eine Änderung unmittelbar bewirkt, arbeitet sicherer und braucht weniger Korrekturrunden.

**Gerätecheck ohne Stress** – Desktop, Tablet und Mobile auf Knopfdruck, ohne externe Tools oder Browsererweiterungen.

**Versionskontrolle im Blick** – Live- und Arbeitsfassung werden korrekt unterschieden; die Vorschau zeigt immer das, was der Redakteur gerade bearbeitet.

---

## Voraussetzungen

- REDAXO ≥ 5.17
- PHP ≥ 8.1

---

## Installation

Über den REDAXO-Installer oder manuell in `redaxo/src/addons/live_preview` entpacken und im Backend installieren/aktivieren.

---

## Author

**Friends Of REDAXO**

* https://www.redaxo.org
* https://github.com/FriendsOfREDAXO

---

## Credits

**Project Lead**

[Thomas Skerbis](https://github.com/skerbis)

**Thanks to:**

Inspiration & Support: [Daniel Springer](https://github.com/danspringer)
