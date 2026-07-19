<p align="center">
  <img src="https://raw.githubusercontent.com/bbk1ng/printdeck-card/main/assets/printdeck-banner.png" alt="PrintDeck — Bambu Lab printer card for Home Assistant" width="820">
</p>

# PrintDeck

A Home Assistant Lovelace card to monitor **and control** Bambu Lab 3D printers.

> **PrintDeck is a hard fork of [PrintWatch Card](https://github.com/drkpxl/printwatch-card) by Steven Hubert ([@drkpxl](https://github.com/drkpxl)).**
> The original card provided the UI, monitoring features, and overall design — full credit to Steven.
> The fork replaces the hardcoded single-printer entity wiring with config-driven entity resolution,
> adds working print controls, and is actively developed against a Bambu Lab **P2S**.
> Licensed MIT, same as upstream (see [LICENSE](LICENSE)).

> **Migrating from PrintWatch Card (or an older install of this fork)?** The card is now
> `custom:printdeck-card` and the resource file is `printdeck-card.js`. The old
> `custom:printwatch-card` tag still works as a legacy alias for this release, but the resource
> URL must point at the new file — see [Installation](#installation).

## What the fork changes vs upstream

- **Any printer, not one hardcoded P1S** — upstream baked one P1S serial number into every entity id.
  PrintDeck resolves entities from a single `entity_prefix` (e.g. `bambulab_p2s`), with per-entity
  overrides for anything that doesn't match.
- **Print controls that work** — pause/resume/stop, bed & nozzle target temperature (slider dialog),
  print-speed profile — wired to the writable `button.*`/`number.*`/`select.*` entities and
  automatically hidden when your setup doesn't expose them (see [Capabilities](#capabilities)).
- **Reliable dialogs** — replaced Home Assistant's lazy-loaded `ha-dialog`/`ha-textfield`/`mwc-button`
  (which frequently render empty on dashboard views) with the card's own overlay dialogs and native
  inputs.
- **Robustness** — camera feed survives printer power-off and recovers without a page reload,
  missing values render `---` instead of `NaN`, AMS + external-spool state merging fixed.
- **Tests** — upstream shipped none; the fork has a `node --test` suite covering entity resolution,
  control gating, camera helpers, and state merging.

Full details in the [CHANGELOG](CHANGELOG.md).

## Requirements

- Home Assistant with the [ha-bambulab](https://github.com/greghesp/ha-bambulab) integration
- A Bambu Lab printer (see [Printer support](#printer-support))

## Installation

### HACS (custom repository)

1. HACS → three-dot menu → **Custom repositories**
2. Add `https://github.com/bbk1ng/printdeck-card` (type: Dashboard)
3. Install **PrintDeck**; make sure the resource `/hacsfiles/printdeck-card/printdeck-card.js`
   (type: module) is registered
4. Reload / clear browser cache if upgrading

### Manual

Copy `dist/printdeck-card.js` to `config/www/` and add it as a dashboard resource (type: module).

## Configuration

In dashboard edit mode, choose **Add card → PrintDeck**. The visual editor lets you name the
printer, select a detected entity prefix (or enter one such as `bambulab_p2s`), and configure
display and control toggles. Advanced entity overrides remain available in YAML.

> **Behavior change:** Temperature and speed tap-to-set controls are now read-only by default.
> Enable **Allow temperature control** in the visual editor or set
> `allow_temp_control: true` in YAML to restore them.

Minimal config — `entity_prefix` derives every entity id as `{domain}.{prefix}_{suffix}`:

```yaml
type: custom:printdeck-card
printer_name: P2S
entity_prefix: bambulab_p2s
```

Find your prefix in Developer Tools → States (e.g. `sensor.bambulab_p2s_bed_temperature`
→ prefix is `bambulab_p2s`).

Any entity can be overridden individually; explicit keys always win over the prefix:

```yaml
type: custom:printdeck-card
printer_name: P2S
entity_prefix: bambulab_p2s
camera_refresh_rate: 1000                    # ms, default 1000
camera_entity: camera.bambulab_p2s_camera    # example override
```

<details>
<summary>All config keys and their prefix-derived defaults</summary>

| Key | Derived from `entity_prefix` |
|---|---|
| `print_status_entity` | `sensor.{prefix}_print_status` |
| `current_stage_entity` | `sensor.{prefix}_current_stage` |
| `task_name_entity` | `sensor.{prefix}_task_name` |
| `progress_entity` | `sensor.{prefix}_print_progress` |
| `current_layer_entity` | `sensor.{prefix}_current_layer` |
| `total_layers_entity` | `sensor.{prefix}_total_layer_count` |
| `remaining_time_entity` | `sensor.{prefix}_remaining_time` |
| `bed_temp_entity` | `sensor.{prefix}_bed_temperature` |
| `nozzle_temp_entity` | `sensor.{prefix}_nozzle_temperature` |
| `bed_target_temp_entity` | `sensor.{prefix}_bed_target_temperature` |
| `nozzle_target_temp_entity` | `sensor.{prefix}_nozzle_target_temperature` |
| `speed_profile_entity` | `sensor.{prefix}_speed_profile` |
| `ams_slot1_entity` … `ams_slot4_entity` | `sensor.{prefix}_ams_tray_1` … `_4` |
| `ams_slot5_entity` … `ams_slot16_entity` | *(not derived — set explicitly for multi-AMS)* |
| `external_spool_entity` | `sensor.{prefix}_external_spool_external_spool` |
| `camera_entity` | `camera.{prefix}_camera` |
| `cover_image_entity` | `image.{prefix}_cover_image` |
| `pause_button_entity` / `resume_button_entity` / `stop_button_entity` | `button.{prefix}_pause` / `_resume` / `_stop` |
| `chamber_light_entity` | `light.{prefix}_chamber_light` |
| `aux_fan_entity` | `fan.{prefix}_aux_fan` |
| `bed_target_number_entity` | `number.{prefix}_bed_target_temperature` *(writable)* |
| `nozzle_target_number_entity` | `number.{prefix}_nozzle_target_temperature` *(writable)* |
| `speed_select_entity` | `select.{prefix}_printing_speed` *(writable)* |
| `online_entity` | `binary_sensor.{prefix}_online` *(absent → treated as online)* |
| `print_weight_entity` / `print_length_entity` | `sensor.{prefix}_print_weight` / `_print_length` |

</details>

## Capabilities

What you get depends on your **ha-bambulab setup**, not on card flags — the card checks which
entities actually exist in Home Assistant and shows/hides features accordingly.

| Feature | Requirement |
|---|---|
| Progress, layers, temperatures, remaining time, AMS spools, weight/length | ha-bambulab sensors (any mode) |
| Live camera feed | `camera.*` entity exposed by the integration |
| G-code/cover preview | `image.*` cover entity (model/version dependent) |
| Pause / resume / stop | `button.*` entities — **cloud mode, or LAN with Developer Mode** |
| Bed / nozzle target temp (slider dialog) | writable `number.*` entities — same requirement |
| Speed profile (silent/standard/sport/ludicrous) | writable `select.*` entity — same requirement |
| Chamber light / aux fan toggles | `light.*` / `fan.*` entities present |

**LAN mode without Developer Mode:** ha-bambulab cannot create the control entities
(`mqtt_signature_required`), so the card shows monitoring only — controls disappear rather than
render broken. Enable Developer Mode on the printer (or use cloud mode) to get controls.

Translations: English, German. Theming: fully inherited from your HA theme (dark mode included).

## Printer support

The card contains no per-model code — support is a function of how ha-bambulab names your
printer's entities.

| Printer | Status |
|---|---|
| **P2S** | ✅ Tested — developed and verified against a real P2S (entities, controls, LAN/cloud gating) |
| P1S / P1P | ⚠️ Should work via `entity_prefix` (upstream's original target) — unconfirmed since the rework |
| A1 / A1 mini / X1 / X1C | ❓ Untested — expected to work if entity naming matches; overrides available if not |

**Have one of the untested models?** Please try it and
[open an issue](https://github.com/bbk1ng/printdeck-card/issues) saying what worked — a config
snippet and your entity list is enough. Confirmations (and fixes) move a model to ✅.
[CONTRIBUTING](CONTRIBUTING.md) has a step-by-step way to check your printer's entities against
what the card expects.

## Screenshots

Upstream screenshots (P1S era) — UI is largely unchanged:

![Dark mode](assets/dark-mode-min.png)
![Light mode](assets/light-mode-min.png)

## Development

```bash
npm install
npm run build        # dist/printdeck-card.js (version injected from package.json)
npm test             # node --test suite
npm run watch        # unminified rebuild on change; set HA_WWW_DEST to auto-copy into HA
python3 scripts/phase2-entity-check.py --prefix <your_prefix>   # diff live HA entities vs expected
```

## Credits

- **Steven Hubert ([@drkpxl](https://github.com/drkpxl))** — author of the original
  [PrintWatch Card](https://github.com/drkpxl/printwatch-card): the card's design, UI, and all
  pre-fork features. Upstream changelog preserved in [CHANGELOG](CHANGELOG.md).
  If PrintDeck is useful to you, consider
  [buying Steven a coffee](https://www.buymeacoffee.com/drkpxl).
- [Greg Hesp](https://github.com/greghesp) — [ha-bambulab](https://github.com/greghesp/ha-bambulab),
  the integration this card is built on.
- German translations originate upstream (partly AI-generated — corrections welcome).

## License

[MIT](LICENSE) — both the original work and this fork.
