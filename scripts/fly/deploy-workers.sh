#!/usr/bin/env bash
set -euo pipefail

OUTBOX_APP="m4ktaba-outbox-worker"
STRIPE_APP="m4ktaba-stripe-worker"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing $1. Please install it and re-run." >&2
    exit 1
  fi
}

set_if_defined() {
  local VAR_NAME="$1"
  local APP="$2"
  local VAL
  VAL=$(printenv "$VAR_NAME" || true)
  if [ -n "$VAL" ]; then
    echo "Setting secret $VAR_NAME for $APP"
    fly secrets set "$VAR_NAME=$VAL" -a "$APP"
  else
    echo "Skipping $VAR_NAME for $APP (not set in env)"
  fi
}

require_cmd fly

echo "Ensuring apps exist..."
fly apps show "$OUTBOX_APP" >/dev/null 2>&1 || fly apps create "$OUTBOX_APP"
fly apps show "$STRIPE_APP" >/dev/null 2>&1 || fly apps create "$STRIPE_APP"

echo "Setting secrets from current shell env if present..."
for APP in "$OUTBOX_APP" "$STRIPE_APP"; do
  set_if_defined SANITY_PROJECT_ID "$APP"
  set_if_defined SANITY_DATASET "$APP"
  set_if_defined SANITY_API_VERSION "$APP"
  set_if_defined SANITY_API_TOKEN "$APP"
  set_if_defined STRIPE_SECRET_KEY "$APP"
  set_if_defined STRIPE_WEBHOOK_SECRET "$APP"
done

echo "Deploying outbox worker..."
fly deploy -c fly.outbox.toml

echo "Deploying stripe worker..."
fly deploy -c fly.stripe.toml

echo "Done."


