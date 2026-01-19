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

if ! command -v netlify >/dev/null 2>&1; then
  echo "netlify CLI not found. Install with: npm i -g netlify-cli" >&2
  exit 1
fi

: ${NETLIFY_SITE_ID:?Please set NETLIFY_SITE_ID env var}

vars=(SMTP_HOST SMTP_PORT SMTP_SECURE SMTP_USER SMTP_PASS EMAIL_FROM EMAIL_TO)

for v in "${vars[@]}"; do
  val="${!v:-}"
  if [ -z "$val" ]; then
    echo "Skipping $v (not set in environment)"
    continue
  fi
  echo "Setting $v on Netlify site $NETLIFY_SITE_ID"
  # Use short flag -s for site id for compatibility with netlify CLI versions
  netlify env:set "$v" "$val" -s "$NETLIFY_SITE_ID"
done

echo "Done. Trigger a deploy in Netlify dashboard or push a commit to deploy." 
