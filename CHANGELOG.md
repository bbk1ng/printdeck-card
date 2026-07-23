# Changelog

All notable changes to this project will be documented in this file.

Entries up to and including 1.2.0 are from the original
[PrintWatch Card](https://github.com/drkpxl/printwatch-card) by Steven Hubert
([@drkpxl](https://github.com/drkpxl)). Entries from 1.3.0 onward are the
PrintDeck fork ([bbk1ng/printdeck-card](https://github.com/bbk1ng/printdeck-card)).

## [1.5.1] - 2026-07-23

### Fixed
- Remaining time is normalised from the sensor's own `unit_of_measurement`
  (h/d/s → minutes) and parsed as a float. The P2S integration reports hours,
  so a 3.6 h remainder previously rendered as "3m".

## [1.5.0] - 2026-07-22

### Added
- Lovelace visual editor with per-feature display toggles.
- YAML-only `overrides:` map for entity slots, including nested multi-AMS
  slots 5–16.
- `experimental` config flag to opt into unreleased features.
- Separate dev card tag and `-dev` version badge, so a dev build can coexist
  with the HACS-installed card.
- CI: lint + test + build workflow; built bundle uploaded to release assets.

## [1.4.0] - 2026-07-19 — PrintDeck code rename

The rename announced in 1.3.0 lands in code. New standalone repository:
[bbk1ng/printdeck-card](https://github.com/bbk1ng/printdeck-card).

### Breaking / migration
- Bundle renamed `printwatch-card.js` → **`printdeck-card.js`** — update your dashboard
  resource URL (HACS: `/hacsfiles/printdeck-card/printdeck-card.js`).
- Custom element renamed to **`custom:printdeck-card`**. The old `custom:printwatch-card`
  tag still works as a legacy alias in this release; it will be removed in a future release.

### Changed
- Element class `PrintWatchCard` → `PrintDeckCard`; console banner now `PRINTDECK-CARD`.
- `window.PRINTDECK_VERSION` / `window.PRINTDECK_BUILD_TIME` debug globals
  (legacy `PRINTWATCH_*` names kept for one release).
- Translation key namespace `ui.card.printwatch.*` → `ui.card.printdeck.*` (internal).
- package.json name `printdeck-card`; hacs.json filename `printdeck-card.js`.

## [1.3.0] - 2026-07-19 — PrintDeck fork

First fork release. Renamed the project to **PrintDeck** (custom element and resource
filename remain `printwatch-card` for now — existing configs keep working).

### Added
- **Config-driven entity resolution**: new `entity_prefix` option derives every entity id as
  `{domain}.{prefix}_{suffix}`, replacing config defaults hardcoded to one P1S serial number.
  Explicit `*_entity` keys always override the prefix. Developed and verified against a
  Bambu Lab P2S.
- Writable control entity slots, resolved from the prefix: `bed_target_number_entity`,
  `nozzle_target_number_entity` (`number.*`), `speed_select_entity` (`select.*`).
- New read-only/toggle config slots: `external_spool_entity` (`sensor.*`) and
  `aux_fan_entity` (`fan.*`).
- Temperature dialogs with a range slider synced to the numeric input
  (bed 0–120 °C, nozzle 0–320 °C).
- Speed dialog reads profile options from the live `select` entity's attributes instead of a
  hardcoded list.
- `camera.*` domain support for the live feed (P2S exposes `camera.*`; P1S-era `image.*`
  still works via `cover_image_entity` / explicit override).
- Presence-based control gating: pause/stop/temperature/speed/light/fan UI renders only when
  the corresponding entity exists — LAN mode without Developer Mode (where ha-bambulab
  creates no control entities) now shows a clean monitoring-only card instead of broken buttons.
- Test suite (`npm test`, `node --test`): entity resolution, control gating, camera helpers,
  AMS/state merging, formatters — 35 tests.
- `scripts/phase2-entity-check.py`: diagnostic CLI that diffs a live HA instance's entities
  against what the card expects for a given prefix.
- `CARD_VERSION` console banner and dialog version tag; version injected from `package.json`
  at build time (single source of truth).

### Changed
- All dialogs rebuilt on the card's own overlay implementation with native
  `<input>`/`<select>`/`<button>` elements — replaces HA's lazy-loaded
  `ha-dialog`/`ha-textfield`/`ha-select`/`mwc-button`, which frequently render empty on
  dashboard views.
- AMS + external spool merging rewritten: external spool no longer unconditionally wins,
  `unknown`/`unavailable` slots filtered, only one slot can be active.
- Print weight/length units read from each sensor's `unit_of_measurement` instead of
  hardcoded P1S entity lookups.
- Missing `online_entity` is now treated as online (camera feed no longer killed by an
  unconfigured entity); camera/cover error states auto-clear when a new image arrives.
- Missing numeric values render `---` instead of `NaN`/`undefined`.
- Light/fan buttons are hidden entirely (not just disabled) when unavailable.
- Build: dev watch mode skips minification; optional `HA_WWW_DEST` auto-deploy of the bundle.

### Attribution
- `LISCENSE` renamed to `LICENSE`; copyright credits Steven Hubert (original work) and
  Boris Milinkovic (fork).

## [1.2.0] - 2024-02-2

BREAKING CHANGES - Please update your YAML based on the README

* Added ability to change Bed Temp, Nozzle Temp, and Print Speed
* Fixed some aux fan stuff coming in when it shouldn't have

## [1.1.0] - 2024-02-2

* Added preview G-Code image (Make sure to update to latest HA Bambu Lab plug and enable it in options)
* Reordered some content to better fit the G-Code image
* Rather than hardcoding unit of measure fetch from sensor
* Added weight and length details to card
* Added localization support, used AI to translate to German, but please submit PR to actual human translations.
* AI assisted refactor
* Support for more AMS's up to 16 total colors


## [1.0.10] - 2024-01-30

* Fixed camera aspect ratio, thanks [CasperVerswijvelt](https://github.com/CasperVerswijvelt)
* Adjusted background color of printer status
* Added overflow for long file name
* Ability to remove Aux Fan from YAML to have the icon hide on the card
* If printer is turned off hide the broken image from the card and handle request errors more gracefully. **You will need to add `online_entity: binary_sensor.p1s_online` to your YAML file**
* Adding percent complete


## [1.0.9] - 2024-01-29

* Improved layout of AMS filament
* Highlight filament in use
* Improve status of print labeling

## [1.0.8] - 2024-01-29

* Complete development workflow refactor

## [1.0.7] - 2024-01-29

* Removing all hard coded colors

## [1.0.6] - 2024-01-28

* Removing GCode Preview since it doesn't work in LAN only mode (hopefully we can find a way to get it back)

## [1.0.5] - 2024-01-28

* Fixed list of printer status's to better align with what we expect from Bambu printers
* Fixed light toggle
* Fixed pause/resume/stop

## [1.0.4] - 2024-01-28

* Added external spool support
* Added ability to change name of printer
* Added circled to better highlight light filament
* Hiding printing UI when not printing
* Adding theme support (aka dark mode)


## [1.0.0] - 2024-01-28

### Initial Release

#### Features
- Live camera feed with print status overlay
- Real-time temperature monitoring (bed and nozzle)
- Print progress tracking with layer count
- Estimated completion time calculation
- AMS/Material status visualization
- Chamber light and auxiliary fan controls
- Print control buttons (pause/resume/stop) with confirmation dialogs
- Speed profile monitoring
- Print preview image
- Local API support

#### Technical Features
- Custom card editor for easy configuration
- Automatic camera feed refresh
- Responsive design
- Confirmation dialogs for critical actions
- Real-time updates for all printer stats