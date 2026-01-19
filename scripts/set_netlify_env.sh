#!/usr/bin/env bash
# Usage: copy values into environment or export them, then run this script.
# Requires: netlify CLI installed and authenticated (`netlify login` or set NETLIFY_AUTH_TOKEN).
# Example:
#   export NETLIFY_AUTH_TOKEN=your_token
#   export NETLIFY_SITE_ID=your_site_id
#   export SMTP_HOST=mail.yourdomain.com
#   ...
#   ./scripts/set_netlify_env.sh

set -euo pipefail

if [ -z "${NETLIFY_AUTH_TOKEN:-}" ]; then
  echo "NETLIFY_AUTH_TOKEN not set. Export your Netlify personal access token." >&2
  exit 1
fi

: ${NETLIFY_SITE_ID:?Please set NETLIFY_SITE_ID env var}

API_URL="https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/env"

vars=(SMTP_HOST SMTP_PORT SMTP_SECURE SMTP_USER SMTP_PASS EMAIL_FROM EMAIL_TO)

for v in "${vars[@]}"; do
  val="${!v:-}"
  if [ -z "$val" ]; then
    echo "Skipping $v (not set in environment)"
    continue
  fi
  echo "Setting $v on Netlify site $NETLIFY_SITE_ID via API"
  curl -s -X POST "$API_URL" \
    -H "Authorization: Bearer ${NETLIFY_AUTH_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"key\": \"$v\", \"value\": \"$val\"}" >/dev/null || {
      echo "Failed to set $v" >&2
    }
done

echo "Done. Trigger a deploy in Netlify dashboard or push a commit to deploy." 
