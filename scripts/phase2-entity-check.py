#!/usr/bin/env python3
"""
Interactive Phase 2 entity check for ha-bambulab printers.

Compares live entities (from HA entity registry and/or REST API) against:
  - Phase 1 PrintDeck slots (read-only map)
  - Expected control entities when mqtt_signature_required is OFF
    (Cloud mode or LAN developer mode)
  - Extra sensors already present under LAN signature mode

Usage:
  # Default: read local HA registry at /mnt/homeassistant
  python3 scripts/phase2-entity-check.py --prefix bambulab_p2s

  # Point at another config dir
  python3 scripts/phase2-entity-check.py --ha-config /config --prefix bambulab_p2s

  # Live REST (optional)
  python3 scripts/phase2-entity-check.py --prefix bambulab_p2s \\
    --ha-url http://ha.stepa.local:8123 --token "$HA_TOKEN"

  # Interactive: after you switch Cloud/dev mode and reload integration,
  # re-run to see newly created button/number/select/fan entities.
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.request
from collections import defaultdict
from pathlib import Path

# Phase 1 PrintDeck map (domain, suffix) — same as src/utils/entity-map.js
PHASE1_SLOTS = {
    "print_status": ("sensor", "print_status"),
    "current_stage": ("sensor", "current_stage"),
    "task_name": ("sensor", "task_name"),
    "progress": ("sensor", "print_progress"),
    "current_layer": ("sensor", "current_layer"),
    "total_layers": ("sensor", "total_layer_count"),
    "remaining_time": ("sensor", "remaining_time"),
    "bed_temp": ("sensor", "bed_temperature"),
    "nozzle_temp": ("sensor", "nozzle_temperature"),
    "bed_target_temp": ("sensor", "bed_target_temperature"),
    "nozzle_target_temp": ("sensor", "nozzle_target_temperature"),
    "speed_profile": ("sensor", "speed_profile"),
    "ams_tray_1": ("sensor", "ams_tray_1"),
    "ams_tray_2": ("sensor", "ams_tray_2"),
    "ams_tray_3": ("sensor", "ams_tray_3"),
    "ams_tray_4": ("sensor", "ams_tray_4"),
    "external_spool": ("sensor", "external_spool_external_spool"),
    "camera": ("camera", "camera"),
    "cover_image": ("image", "cover_image"),
    "chamber_light": ("light", "chamber_light"),
    "online": ("binary_sensor", "online"),
    "print_weight": ("sensor", "print_weight"),
    "print_length": ("sensor", "print_length"),
}

# Typical control entities when signature requirement is OFF (ha-bambulab).
# Suffixes vary slightly by model/version — we match by domain + keyword.
PHASE2_CONTROL_EXPECTATIONS = [
    ("button", "pause", "Pause printing"),
    ("button", "resume", "Resume printing"),
    ("button", "stop", "Stop printing"),
    ("number", "bed", "Writable bed target temperature"),
    ("number", "nozzle", "Writable nozzle target temperature"),
    ("select", "speed", "Writable speed profile"),
    ("fan", "aux", "Aux fan control"),
    ("fan", "chamber", "Chamber fan control"),
    ("fan", "cooling", "Part cooling fan"),
]

# Mode / gate signals useful for deciding Phase 2 readiness
MODE_SIGNALS = [
    "developer_lan_mode",
    "mqtt_connection_mode",
    "mqtt_encryption",
    "hybrid_mqtt_control_blocked",
]


def eid(prefix: str, domain: str, suffix: str) -> str:
    return f"{domain}.{prefix}_{suffix}"


def load_registry(ha_config: Path) -> list[dict]:
    path = ha_config / ".storage" / "core.entity_registry"
    if not path.exists():
        return []
    data = json.loads(path.read_text())
    return data.get("data", {}).get("entities", [])


def load_states_api(ha_url: str, token: str) -> dict[str, dict]:
    req = urllib.request.Request(
        f"{ha_url.rstrip('/')}/api/states",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        states = json.loads(resp.read().decode())
    return {s["entity_id"]: s for s in states}


def filter_prefix(entities: list[dict], prefix: str) -> list[dict]:
    needle = f"_{prefix}_" if not prefix.startswith("_") else prefix
    # entity_id like sensor.bambulab_p2s_print_status
    out = []
    for e in entities:
        eid_ = e.get("entity_id") or ""
        # match domain.prefix_...
        if f".{prefix}_" in eid_ or eid_.endswith(f".{prefix}") or f".{prefix}." in eid_:
            out.append(e)
            continue
        # also prefix as substring after domain
        parts = eid_.split(".", 1)
        if len(parts) == 2 and parts[1].startswith(prefix + "_"):
            out.append(e)
    return out


def classify_control(entity_id: str) -> str | None:
    domain = entity_id.split(".", 1)[0]
    name = entity_id.split(".", 1)[1].lower()
    for d, keyword, _label in PHASE2_CONTROL_EXPECTATIONS:
        if domain == d and keyword in name:
            return f"{d}:{keyword}"
    return None


def main() -> int:
    ap = argparse.ArgumentParser(description="Phase 2 entity check (cloud / LAN dev mode)")
    ap.add_argument("--prefix", default="bambulab_p2s", help="entity prefix (default bambulab_p2s)")
    ap.add_argument("--ha-config", default="/mnt/homeassistant", help="HA config directory")
    ap.add_argument("--ha-url", default="", help="optional HA base URL for live states")
    ap.add_argument("--token", default="", help="long-lived access token for --ha-url")
    ap.add_argument("--json", action="store_true", help="machine-readable JSON output")
    args = ap.parse_args()

    ha_config = Path(args.ha_config)
    prefix = args.prefix.strip()
    entities = filter_prefix(load_registry(ha_config), prefix)
    by_id = {e["entity_id"]: e for e in entities}

    states: dict[str, dict] = {}
    if args.ha_url and args.token:
        try:
            states = load_states_api(args.ha_url, args.token)
        except Exception as exc:
            print(f"WARNING: REST states failed: {exc}", file=sys.stderr)

    # Phase 1 coverage
    phase1 = []
    for slot, (domain, suffix) in PHASE1_SLOTS.items():
        entity_id = eid(prefix, domain, suffix)
        reg = by_id.get(entity_id)
        state = states.get(entity_id)
        present = reg is not None or state is not None
        disabled = bool(reg and reg.get("disabled_by"))
        phase1.append(
            {
                "slot": slot,
                "entity_id": entity_id,
                "present": present,
                "disabled": disabled,
                "state": (state or {}).get("state") if state else None,
            }
        )

    # All live under prefix
    all_ids = sorted(set(by_id) | {k for k in states if f".{prefix}_" in k or k.split(".", 1)[-1].startswith(prefix + "_")})
    if not all_ids:
        all_ids = sorted(by_id.keys())

    by_domain: dict[str, list[str]] = defaultdict(list)
    for entity_id in all_ids:
        by_domain[entity_id.split(".", 1)[0]].append(entity_id)

    # Control domain inventory
    control_domains = ("button", "number", "select", "fan")
    control_present = {d: by_domain.get(d, []) for d in control_domains}

    # Expected Phase 2 controls
    phase2_hits = []
    for domain, keyword, label in PHASE2_CONTROL_EXPECTATIONS:
        matches = [e for e in control_present.get(domain, []) if keyword in e.lower()]
        phase2_hits.append(
            {
                "domain": domain,
                "keyword": keyword,
                "label": label,
                "found": matches,
                "unlocked": bool(matches),
            }
        )

    # Mode signals
    mode = []
    for key in MODE_SIGNALS:
        entity_id = f"binary_sensor.{prefix}_{key}" if not key.startswith("mqtt_connection") else f"sensor.{prefix}_{key}"
        # try both domains for connection mode
        candidates = [
            f"binary_sensor.{prefix}_{key}",
            f"sensor.{prefix}_{key}",
        ]
        found_id = next((c for c in candidates if c in by_id or c in states), None)
        st = states.get(found_id or "", {})
        mode.append(
            {
                "signal": key,
                "entity_id": found_id,
                "present": found_id is not None,
                "state": st.get("state") if st else None,
            }
        )

    # Extra sensors not in Phase 1 map
    phase1_ids = {eid(prefix, d, s) for d, s in PHASE1_SLOTS.values()}
    extras = [i for i in all_ids if i not in phase1_ids]

    report = {
        "prefix": prefix,
        "total_entities": len(all_ids),
        "by_domain": {k: len(v) for k, v in sorted(by_domain.items())},
        "phase1": phase1,
        "phase1_missing": [p for p in phase1 if not p["present"]],
        "phase2_controls": phase2_hits,
        "phase2_unlocked_count": sum(1 for p in phase2_hits if p["unlocked"]),
        "mode_signals": mode,
        "extras": extras,
        "control_entities": control_present,
    }

    if args.json:
        print(json.dumps(report, indent=2))
        return 0

    print(f"=== Phase 2 entity check — prefix={prefix} ===\n")
    print(f"Total entities: {report['total_entities']}")
    print("By domain:", report["by_domain"])
    print()

    print("--- Mode / gate signals ---")
    for m in mode:
        st = m["state"] if m["state"] is not None else ("registry" if m["present"] else "MISSING")
        print(f"  {m['signal']}: {m['entity_id'] or '—'}  [{st}]")
    print()

    print("--- Phase 1 PrintDeck slots ---")
    missing = report["phase1_missing"]
    ok = len(phase1) - len(missing)
    print(f"  present {ok}/{len(phase1)}")
    for p in missing:
        print(f"  MISSING  {p['slot']}: {p['entity_id']}")
    if not missing:
        print("  all Phase 1 slots present in registry")
    print()

    print("--- Phase 2 controls (expect when Cloud / LAN developer mode unlocks) ---")
    unlocked = report["phase2_unlocked_count"]
    print(f"  unlocked {unlocked}/{len(phase2_hits)}")
    for p in phase2_hits:
        mark = "YES" if p["unlocked"] else "no "
        found = ", ".join(p["found"]) if p["found"] else "—"
        print(f"  [{mark}] {p['domain']}.{p['keyword']}*  {p['label']}")
        if p["found"]:
            print(f"         → {found}")
    print()

    if unlocked == 0:
        print(
            "Interpretation: control domains (button/number/select/fan) are still gated.\n"
            "  Likely mqtt_signature_required is still true (LAN without developer mode).\n"
            "  To unlock: enable printer LAN developer mode OR use Cloud connection in ha-bambulab,\n"
            "  then reload the integration and re-run this script."
        )
    else:
        print(
            "Interpretation: some control entities exist. Wire Phase 2 PrintDeck control map\n"
            "  (separate from Phase 1 sensor slots) using the entity IDs listed above."
        )
    print()

    print("--- Extra entities (not in Phase 1 map) — candidates for later UI ---")
    # group extras by domain for readability
    ex_by = defaultdict(list)
    for e in extras:
        ex_by[e.split(".", 1)[0]].append(e)
    for domain in sorted(ex_by):
        print(f"  [{domain}] ({len(ex_by[domain])})")
        for e in sorted(ex_by[domain]):
            print(f"    {e}")

    print()
    print("Re-run after switching mode to see newly created control entities.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
