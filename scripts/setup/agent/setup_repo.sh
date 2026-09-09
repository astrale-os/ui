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
agent_ensure_node
agent_ensure_bun
agent_install_repo
# Direct Domain commands select its own pnpm pin; warm that runtime while network is available.
env npm_config_manage_package_manager_versions=true pnpm --dir domain --version
# Consumers resolve the library's published dist exports during typechecks.
pnpm run build
# Project E2E uses its own pinned Playwright, independently of global browser tools.
if [[ "$AGENT_SETUP_BROWSER" == 1 ]]; then
  agent_select_browser
  pnpm --dir playground exec playwright install chromium
fi
agent_persist_environment
agent_log 'UI workspace dependencies and enabled tools are ready'
