# Phase 3 Spec — draft

Prereq: PR #1 (visual editor) merged.

## 1. AMS additional sensors
Verified on live HA (P2S + AMS 2 Pro, prefix `bambulab_p2s`):
- `sensor.<prefix>_ams_humidity` + `_ams_humidity_index`
- `sensor.<prefix>_ams_temperature`
- `binary_sensor.<prefix>_ams_active`
- drying set: `binary_sensor.<prefix>_ams_drying`,
  `sensor.<prefix>_ams_remaining_drying_time`, `_ams_drying_temperature`,
  `_ams_drying_duration`, `_ams_drying_filament`
- trays 1-4 already mapped
Extend entity-map prefix table with these; render humidity/temp chips in AMS
strip header; drying status line only while `ams_drying` is on.
Older AMS (no drying/temp) -> entities absent, chips hidden (existing
missing-entity handling).

## 2. `overrides:` YAML section (YAML-only, never in editor)
Nested map, cleaner than 30 flat keys:
```yaml
overrides:
  camera_entity: camera.p2s_special
  bed_temp_entity: sensor.external_probe
```
- Same keys as today's flat `*_entity` keys.
- Back-compat: flat keys keep working (HACS users); precedence
  flat key > overrides.<key> > prefix derivation. One-line merge in resolveConfig.

## 3. Editor toggles (visual editor additions)
- `show_camera` (default true) — camera section on/off
- `show_ams` (default true) — AMS strip on/off
- `allow_temp_control` (default **false**) — temps read-only unless enabled;
  safeguard: dialog still confirms. NOTE: behavior change for existing users
  who rely on temp control -> release note + editor toggle makes re-enabling easy.
- `camera_refresh_rate` number input
- `experimental` checkbox
All flow through existing controlFlags/config gating.

## 4. Compact design
Problem: card tall; adding AMS sensors makes it worse.
Direction LOCKED (2026-07-19): hybrid of mockup B + C
(`tasks/phase3-compact-mockups.html`, section D).
`layout: full | compact` (default full, editor dropdown). Compact =
- header row: name + badges, state, `67% · 1h 24m` right-aligned; 3px progress bar under it
- metrics: B-style two-column key/value grid (bed, nozzle, layer, speed,
  AMS humidity, AMS temp; drying rows appear only while drying)
- AMS: C-style filament ribbon — segment width = remaining %, colors from tray
  filament color; per-tray labels row under it
- controls: icon row bottom right
- camera hidden by default in compact (show_camera: true overrides)
Target: ~190px tall.

## Sequencing
1. overrides section (small, unblocks nothing, low risk)
2. editor toggles (small, builds on PR #1)
3. AMS sensors (needs live entity verification)
4. compact layout (biggest, do last, on top of new sensors)

Each step = one orch task, lands on dev card first, HACS release when phase complete.
