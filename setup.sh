#!/usr/bin/env bash
# Bootstrap this repository only when it is cloned or opened on its own.
# In the Astrale umbrella workspace, run ../scripts/setup.sh from the workspace
# root instead; it owns the integrated install (including Domains and GUI).
# STANDALONE deliberately bypasses child-repository direct-install guards and
# is harmless in repositories that do not define one.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

export STANDALONE=true
readonly PACKAGE_MANAGER="$(node -p "require('./package.json').packageManager")"

if command -v corepack >/dev/null 2>&1; then
  exec corepack "$PACKAGE_MANAGER" install --frozen-lockfile
elif command -v pnpm >/dev/null 2>&1; then
  readonly EXPECTED_VERSION="${PACKAGE_MANAGER#pnpm@}"
  readonly ACTUAL_VERSION="$(pnpm --version)"
  if [[ "$ACTUAL_VERSION" != "$EXPECTED_VERSION" ]]; then
    echo "setup: $PACKAGE_MANAGER is required (found pnpm@$ACTUAL_VERSION)" >&2
    exit 1
  fi
  exec pnpm install --frozen-lockfile
elif command -v npm >/dev/null 2>&1; then
  exec npm exec --yes --package="$PACKAGE_MANAGER" -- pnpm install --frozen-lockfile
else
  echo "setup: Corepack, pnpm, or npm is required" >&2
  exit 1
fi
