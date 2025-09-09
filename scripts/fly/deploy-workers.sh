#!/usr/bin/env bash
set -euo pipefail

OUTBOX_APP="${OUTBOX_APP:-m4ktaba-outbox-worker}"
STRIPE_APP="${STRIPE_APP:-m4ktaba-stripe-worker}"
# Optionally set FLY_ORG to your org slug; default to "personal"
FLY_ORG="${FLY_ORG:-personal}"

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

ensure_app() {
  local VAR_NAME="$1"
  local BASE_NAME="$2"
  local APP_VAL
  # Use existing value or base
  APP_VAL=$(eval echo "\${$VAR_NAME}")
  if [ -z "$APP_VAL" ]; then
    APP_VAL="$BASE_NAME"
  fi
  if ! fly apps show "$APP_VAL" >/dev/null 2>&1; then
    echo "Creating app $APP_VAL in org $FLY_ORG..."
    if ! fly apps create "$APP_VAL" --org "$FLY_ORG" >/dev/null 2>&1; then
      local CANDIDATE="${BASE_NAME}-$(date +%s)"
      echo "Name in use; creating $CANDIDATE instead..."
      fly apps create "$CANDIDATE" --org "$FLY_ORG"
      APP_VAL="$CANDIDATE"
    fi
  fi
  eval "$VAR_NAME=$APP_VAL"
  export "$VAR_NAME"
}

echo "Ensuring apps exist (org: $FLY_ORG)..."
ensure_app OUTBOX_APP "m4ktaba-outbox-worker"
ensure_app STRIPE_APP "m4ktaba-stripe-worker"

echo "Setting secrets from current shell env if present..."
for APP in "$OUTBOX_APP" "$STRIPE_APP"; do
  set_if_defined SANITY_PROJECT_ID "$APP"
  set_if_defined SANITY_DATASET "$APP"
  set_if_defined SANITY_API_VERSION "$APP"
  set_if_defined SANITY_API_TOKEN "$APP"
  set_if_defined STRIPE_SECRET_KEY "$APP"
  set_if_defined STRIPE_WEBHOOK_SECRET "$APP"
done

echo "Deploying outbox worker to $OUTBOX_APP..."
fly deploy -c fly.outbox.toml -a "$OUTBOX_APP"

echo "Deploying stripe worker to $STRIPE_APP..."
fly deploy -c fly.stripe.toml -a "$STRIPE_APP"

echo "Done."


