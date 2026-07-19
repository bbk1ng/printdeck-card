# Contributing to PrintDeck

PrintDeck is a fork of [PrintWatch Card](https://github.com/drkpxl/printwatch-card) by
Steven Hubert. Contributions here target the fork
([bbk1ng/printwatch-card](https://github.com/bbk1ng/printwatch-card)); general UI/feature ideas
may also be worth offering upstream.

## Development setup

```sh
git clone https://github.com/bbk1ng/printwatch-card.git
cd printwatch-card
npm install
npm run watch     # unminified rebuild on change; set HA_WWW_DEST=/path/to/ha/config/www to auto-copy
npm test          # node --test suite — must pass before a PR
```

Code style: Prettier + ESLint are dev dependencies (`npm run lint`), but no shared config files
are committed yet — match the style of surrounding code. Keep PRs focused on a single change.

## Confirming your printer model 🖨️

The card is developed and tested against a **P2S**. Other models (P1S/P1P, A1, X1 series) should
work via `entity_prefix`, but nobody has confirmed them since the entity rework — **reports are
the most valuable contribution right now**, even a simple "works on my A1".

How the card resolves entities: one static suffix table
(`src/utils/entity-map.js`, `ENTITY_SLOTS`) maps each config key to
`{domain}.{entity_prefix}_{suffix}`. There is no per-model code. If your printer's ha-bambulab
entities follow that naming, a two-line config works; if not, explicit `*_entity` overrides fill
the gaps.

To check your printer:

1. Dump what the card expects vs what your HA actually has:
   ```sh
   python3 scripts/phase2-entity-check.py --prefix <your_prefix> \
       --ha-url http://homeassistant.local:8123 --token <long-lived-token>
   ```
   (or run it on the HA host with `--ha-config /config`).
2. Everything matches → your model works out of the box. Open an issue titled
   "Confirmed: <model>" with your config snippet — the README support table gets updated.
3. Mismatches → note which suffixes/domains differ, work around them with explicit
   `*_entity` keys, and open an issue with the script output. That data is exactly what's
   needed to support the model properly.

Making a divergent model first-class in code (rather than per-user overrides) means:

- a per-model entry or override table in `src/utils/entity-map.js`,
- a matching fixture in `test/entity-map.test.js` (mirror the existing `bambulab_p2s` block),
- keeping `PHASE1_SLOTS` in `scripts/phase2-entity-check.py` in sync (manual — there is no
  shared source of truth between the JS and Python tables yet).

Known per-model quirks to watch for:

- Live camera domain differs (P1S-era: `image.*`; P2S: `camera.*`) — handled by separate
  config slots, not auto-detection.
- Temp dialog ranges are hardcoded (bed 0–120 °C, nozzle 0–320 °C in
  `src/templates/components/temperature-display.js`).
- Speed profile fallback list is hardcoded; models exposing different profiles must
  self-describe them via the `select` entity's `options` attribute.
- Only AMS slots 1–4 are prefix-derived; slots 5–16 need explicit config keys.

## Reporting bugs 🐛

1. Check existing issues first.
2. Include: printer model, ha-bambulab version, connection mode (cloud / LAN / LAN+Developer
   Mode), steps to reproduce, expected vs actual, browser console output if the card misrenders.

## Localization 🌍

Translations live in `src/translations/` (currently `en`, `de`). Improvements and new languages
welcome — some German strings are AI-generated and need human review.

## Pull requests

1. Fork, branch, make the change.
2. `npm test` must pass; add/extend tests for behavior changes.
3. Update README/CHANGELOG when user-facing behavior changes.
