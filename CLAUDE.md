<!-- orch:begin (managed by `orch init --link`; edits here are overwritten) -->
## orch
This repo uses agent-orch. See `.orch/ORCH.md` for usage; config in `.orch/orch.yml`.
@.orch/ORCH.md
<!-- orch:end -->

# printdeck-card

## What this is
HACS-distributable Home Assistant Lovelace card for Bambu Lab 3D printers. Recently renamed from `printwatch-card` (fork of Steven Hubert's PrintWatch Card) — v1.4.0 released; legacy `printwatch-card` tag/globals still registered for one release for backward compat (see `src/index.js`). HACS submission is on hold until 100+ downloads; release-asset upload is automated via CI.

## Commands
```
npm run build      # rollup -c -> dist/printdeck-card.js (minified, terser)
npm run watch       # rollup -c --watch (unminified, readable dist)
npm run lint         # eslint src/
npm test             # node --test test/
npm run clean        # rimraf dist
```
Build via Rollup + Babel (`.babelrc` targets last-2 evergreen browsers + IE11) — `@rollup/plugin-{node-resolve,commonjs,json,replace,babel,terser}`. `replace` injects `process.env.VERSION`/`BUILD_TIMESTAMP`/`PRINTDECK_TAG` from `package.json` version + build time; terser is skipped when `ROLLUP_WATCH=true` so watch builds stay readable.

## dev-sync.sh
Local-only helper (gitignored) for live-testing against a real HA instance:
```
./dev-sync.sh          # watch + auto-deploy on every src change
./dev-sync.sh build     # one-shot build + deploy
```
Sets `HA_WWW_DEST=/mnt/homeassistant/www/community/printdeck-card` and runs the corresponding npm script. This overwrites the HACS-installed bundle **in place** (single lovelace resource, no separate dev entry) — "HACS -> Redownload" restores the clean release build. `npm run watch:ha` / `deploy:ha` do the equivalent but into a separate dev dir (`www/printdeck-dev`) tagged `printdeck-card-dev`, so a dev build can coexist with the HACS-installed one under a distinct custom-element tag.

## Architecture
```
src/
  index.js              entry: registers custom element (TAG from PRINTDECK_TAG or 'printdeck-card'),
                         plus legacy printwatch-card alias; exports Lit globals
  components/printdeck-card.js   main LitElement card
  templates/             card-template.js + templates/components/
  styles/card-styles.js  card CSS
  constants/             config.js, version.js
  utils/                 entity-map.js (HA entity naming per printer prefix), state-helpers.js,
                          control-helpers.js, formatters.js, camera-helpers.js, localize.js
  translations/          en.json, de.json
```
Output: single-file `dist/printdeck-card.js` (+ sourcemap). `dist/printwatch-card.js.map` is a stale leftover from the pre-rename build.

## HACS gotchas
- `hacs.json`: `name: "PrintDeck"`, `filename: "printdeck-card.js"`, `content_in_root: false` — HACS expects the built file at `dist/printdeck-card.js` matching this filename exactly; renaming the rollup output breaks HACS install/update.
- Card is a single JS resource — no separate manifest/resource registration beyond the Lovelace resource pointing at the built file.
- Submission gated on the repo hitting 100+ downloads (HACS default inclusion criteria); release-asset upload for download counting is CI-automated (see `.github/`).

## tasks/
`tasks/phase3-spec.md` — draft spec for AMS sensor extensions (humidity/temp/drying chips) and a YAML-only `overrides:` config section; not yet implemented. `tasks/phase3-compact-mockups.html` — accompanying visual mockups. Check before starting AMS/overrides work to avoid re-deriving the design.
