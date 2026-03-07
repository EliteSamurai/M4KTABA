#!/usr/bin/env sh
# Use when Sanity dev times out (e.g. project on iCloud Desktop).
# TMPDIR=/tmp avoids timeouts on temp writes.
# If .sanity was previously a symlink to /tmp, remove it so the runtime stays in-project (required for module resolution).
set -e
if [ -L .sanity ]; then
  rm -f .sanity
fi
export TMPDIR=/tmp
exec sanity dev "$@"
