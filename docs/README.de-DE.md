# ReloadedFlux

In anderen Sprachen lesen: [English](../README.md), [Español](README.es-ES.md), [Français](README.fr-FR.md), [简体中文](README.zh-CN.md)

## Überblick

ReloadedFlux ist ein Drittanbieter-Web-Frontend für [Miniflux](https://github.com/miniflux/v2), das ein benutzerfreundlicheres Leseerlebnis bieten soll.

Unterstützte Miniflux-Versionen: 2.1.4 und höher.

Die wichtigsten Merkmale sind:

- Modernes Oberflächendesign
- Responsives Layout mit Unterstützung von Touch-Gesten
- Unterstützung für Darkmode und benutzerdefinierte Designs
- Anpassbare Leseerfahrung:
  - Einstellungen für Schriftfamilie und -größe
  - Anpassung der Artikelbreite
  - Optionen für Titelausrichtung
  - Bildbetrachter mit Zoom und Diashow
  - Fußnoten-Verbesserung
  - Quelltext-Syntax-Hervorhebung
  - Geschätzte Lesezeit
- Verwaltung von Artikeln und Abonnements (_Feeds_):
  - Google-artige Syntax für die Suche
  - Filtern von Artikeln nach Lesestatus, Veröffentlichungsdatum, Titel, Inhalt oder Autor
  - Stapel-Operationen für Abonnements (_Feeds_)
  - Unterstützung für Volltextabruf
  - Artikel nach Hashsumme, Titel oder URL de-duplizieren
  - Artikel beim Scrollen automatisch als gelesen markieren
- Erweiterte Funktionen:
  - Tastenkürzel (anpassbar)
  - Stapelaktualisierung des Hosts von gefilterten Abonnement-URLs (nützlich für den Austausch von RSSHub-Instanzen)
  - Stapelaktualisierung fehlerhafter Abonnements
  - Speichern von Artikeln in Diensten von Drittanbietern
- I18n-Unterstützung (Deutsch / English / Español / Français / 简体中文)
- Andere Funktionen warten darauf, entdeckt zu werden…

## Online-Demo & Screenshots

ReloadedFlux mit unserer [Online-Demo-Instanz](https://reloadedflux.pages.dev) testen.

So sieht ReloadedFlux in verschiedenen Designs aus:

![screenshot](../images/screenshot.png)
![devices](../images/devices.png)

## Schnellstart

1. Sicherstellen, dass eine funktionierende Miniflux-Instanz vorhanden ist
2. Direkt unsere [Online-Demo-Instanz](https://reloadedflux.pages.dev) verwenden oder ReloadedFlux mit einer der folgenden Methoden einrichten
3. Mit Miniflux-Benutzernamen und -Passwort oder mit API-Schlüssel (empfohlen) anmelden

## Installation

### Cloudflare Pages

ReloadedFlux wird mit React erstellt und generiert nach der Erstellung eine Reihe von statischen Webdateien, die direkt auf Cloudflare Pages bereitgestellt werden können.

ReloadedFlux kann auf Cloudflare Pages eingerichtet werden, indem man `Framework preset` als `Create React App` auswählt.

### Vorgenerierte Dateien verwenden

Fertige Dateien können aus dem `build`-Zweig heruntergeladen und bei jedem statischen Hosting-Service eingesetzt werden, der Single-Page-Webanwendungen (SPA: _single-page applications_) unterstützt.

Es sollte sichergestellt werden, dass das URL-Rewriting so konfiguriert ist, dass alle Anfragen auf `index.html` umgeleitet werden.

Wird Nginx verwendet, muss möglicherweise folgende Konfiguration hinzugefügt werden:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Wenn Caddy genutzt wird, muss möglicherweise diese Konfiguration hinzugefügt werden:

```caddyfile
try_files {path} {path}/ /index.html
```

### Vercel

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/Kombatant/ReloadedFlux)

### Docker

[![dockeri.co](https://dockerico.blankenship.io/image/kombatant/reloadedflux)](https://hub.docker.com/r/kombatant/reloadedflux)

```bash
docker run -p 2000:2000 kombatant/reloadedflux
```

Oder mit [Docker Compose](../docker-compose.yml):

```bash
docker-compose up -d
```

<!-- ### Zeabur (Veraltet, nicht empfohlen)

[![Deploy to Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/OKXO3W) -->

## Übersetzungsleitfaden

Um uns bei der Übersetzung von ReloadedFlux in deine Sprache zu helfen, bitte den Ordner `locales` ergänzen und einen Pull-Request senden.

Zusätzlich muss eine README-Datei für die jeweilige Sprache hinzufügt und diese in allen bestehenden README-Dateien referenziert werden.

Es sollten auch Teile des Quellcodes geändert werden, um die i18n-Sprachpakete für `Arco Design` und `Day.js` einzubinden.

Detaillierte Änderungen bitte [PR #145](https://github.com/electh/ReactFlux/pull/145) entnehmen.

### Derzeit mit Übersetzungen Beitragende

| Sprache  | Mitwirkende                                     |
| -------- | ----------------------------------------------- |
| Deutsch  | [DonkeeeyKong](https://github.com/donkeeeykong) |
| Español  | [Victorhck](https://github.com/victorhck)       |
| Français | [MickGe](https://github.com/MickGe)             |
| 简体中文 | [Neko Aria](https://github.com/NekoAria)        |

## Mitwirkende

> Danke an alle Mitwirkenden, die dieses Projekt noch großartiger gemacht haben!

<a href="https://github.com/Kombatant/ReloadedFlux/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Kombatant/ReloadedFlux" alt="An ReloadedFlux Mitwirkende" />
</a>

Erstellt mit [contrib.rocks](https://contrib.rocks).

## Sternverlauf

[![Star History](https://starchart.cc/Kombatant/ReloadedFlux.svg)](https://starchart.cc/Kombatant/ReloadedFlux)
