#!/usr/bin/env python3
"""Remove what seed/seed.py made and put the profile back as it was.

    python3 seed/clean.py --server <server> --org <org-id> --pod <pod-id>
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, ".seeded.json")
ARGS = sys.argv[1:]
if not os.path.exists(STATE):
    sys.exit("Nothing to clean.")
s = json.load(open(STATE))
for table, ids in s["made"].items():
    for i in ids:
        if i:
            subprocess.run(["lemma", *ARGS, "records", "delete", table, i, "--yes"], capture_output=True)
subprocess.run(["lemma", *ARGS, "records", "update", "profile", s["profile_id"], "--data", json.dumps(s["backup"])], check=True, capture_output=True)
for sid in s.get("paused_clocks", []):
    subprocess.run(["lemma", *ARGS, "schedules", "update", sid, "--data", json.dumps({"is_active": True})], capture_output=True)
os.remove(STATE)
print("cleaned:", {k: len(v) for k, v in s["made"].items()}, "| your clock is back on" if s.get("paused_clocks") else "")
