#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <APPS_SCRIPT_WEBHOOK_URL>"
  echo "Example: $0 https://script.google.com/macros/s/ABC123/exec"
  exit 1
fi

URL="$1"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.test.generated"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

echo "Updating local env file..."
if grep -q '^APPS_SCRIPT_WEBHOOK_URL=' "$ENV_FILE"; then
  sed -i '' "s|^APPS_SCRIPT_WEBHOOK_URL=.*$|APPS_SCRIPT_WEBHOOK_URL=$URL|" "$ENV_FILE"
else
  echo "APPS_SCRIPT_WEBHOOK_URL=$URL" >> "$ENV_FILE"
fi

echo "Syncing Vercel production env..."
cd "$ROOT_DIR"
npx vercel env rm APPS_SCRIPT_WEBHOOK_URL production --yes >/dev/null 2>&1 || true
printf '%s' "$URL" | npx vercel env add APPS_SCRIPT_WEBHOOK_URL production >/dev/null

echo "Redeploying production..."
npx vercel --prod --yes >/dev/null

echo "Done. APPS_SCRIPT_WEBHOOK_URL is now active in production."
