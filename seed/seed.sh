#!/usr/bin/env bash
# Seed example rows for you (and `seed/seed.sh clean` to remove them). Pass the CLI context:
#   bash seed/seed.sh --server <server> --org <org-id> --pod <pod-id>
#   bash seed/seed.sh clean --server <server> --org <org-id> --pod <pod-id>
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ "${1:-}" = "clean" ]; then shift; exec python3 "$HERE/clean.py" "$@"; fi
exec python3 "$HERE/seed.py" "$@"
