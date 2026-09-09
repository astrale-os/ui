#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

agent_load_config
agent_resolve_harnesses
source "$SCRIPT_DIR/lib/repo.sh"
ui_check_repo
case "${1:-}" in
  --check) exit 0 ;;
  '') ;;
  *) agent_die 'Usage: setup_repo.sh [--check]' ;;
esac
# Request workflow contract tests execute their checked-in jq filters.
if ! command -v jq >/dev/null 2>&1; then agent_system_install jq; fi
agent_ensure_node
agent_ensure_bun
agent_install_repo
# Direct Domain commands select its own pnpm pin; warm that runtime while network is available.
if [[ "$AGENT_SETUP_TOOLS" == check ]]; then
  # Check the existing secondary runtime without pnpm's implicit download.
  expected="$(node -p "require('./domain/package.json').packageManager.split('@')[1].split('+')[0]")"
  actual="$(cd domain && COREPACK_ENABLE_NETWORK=0 npm_config_manage_package_manager_versions=false pnpm --version 2>/dev/null || true)"
  [[ "$actual" == "$expected" ]] || agent_die "Prepare Domain pnpm $expected locally before rerunning setup"
else
  env npm_config_manage_package_manager_versions=true pnpm --dir domain --version
fi
# Consumers resolve the library's published dist exports during typechecks.
pnpm run build
# Project E2E uses its own pinned Playwright, independently of global browser tools.
if [[ "$AGENT_SETUP_BROWSER" == 1 ]]; then
  agent_select_browser
  pnpm --dir playground exec playwright install chromium
fi
agent_persist_environment
agent_log 'UI workspace dependencies and enabled tools are ready'
