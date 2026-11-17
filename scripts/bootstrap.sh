#!/usr/bin/env bash
# Install X Teammate into an existing pod, or finish an install the import button started.
#   bash scripts/bootstrap.sh --server <server> --org <org-id> --pod <pod-id> [--import]
# --import  imports the whole bundle first (tables, functions, agent, workflow, schedule).
# Then it publishes the skills to /skills, builds the app and deploys it. Safe to re-run.
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
CTX=() ; IMPORT=0 ; SERVER="" ; ORG="" ; POD=""
while [ $# -gt 0 ]; do
  case "$1" in
    --server) SERVER="$2"; CTX+=(--server "$2"); shift 2 ;;
    --org) ORG="$2"; CTX+=(--org "$2"); shift 2 ;;
    --pod) POD="$2"; CTX+=(--pod "$2"); shift 2 ;;
    --import) IMPORT=1; shift ;;
    *) echo "unknown option $1"; exit 1 ;;
  esac
done
[ -z "$POD" ] && { echo "pass --pod <pod-id> (and --server/--org if you use more than one)"; exit 1; }
L=(lemma "${CTX[@]}")
if [ "$IMPORT" = 1 ]; then
  for layer in tables functions agents workflows schedules; do
    "${L[@]}" pods import "$HERE/$layer"
  done
fi
SERVER="$SERVER" ORG="$ORG" POD="$POD" "$HERE/scripts/publish-skills.sh"
cd "$HERE/apps/x-teammate/source"
if [ ! -f .env.local ]; then
  API="$("${L[@]}" config show 2>/dev/null | awk '/base url/ {print $3}')"
  API="${API:-https://api.lemma.work}"
  HOST="${API#https://api.}"
  printf 'VITE_LEMMA_API_URL="%s"\nVITE_LEMMA_AUTH_URL="https://%s/auth"\nVITE_LEMMA_POD_ID="%s"\nVITE_LEMMA_APP_BASE_PATH="/"\n' "$API" "$HOST" "$POD" > .env.local
fi
npm ci --no-audit --no-fund
npm run build
"${L[@]}" apps deploy x-teammate . --create --yes
"${L[@]}" pods doctor || true
echo "Done. Open the x-teammate app; each person onboards and gets their own clock."
