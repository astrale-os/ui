#!/usr/bin/env bash
# Read-only readiness check apart from disposable browser sessions; never installs anything.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
agent_load_config
agent_resolve_harnesses
source "$SCRIPT_DIR/lib/repo.sh"
ui_check_repo
cd "$AGENT_REPO_ROOT"

[[ "$#" == 0 ]] || agent_die 'Select verification harnesses with AGENT_HARNESSES=claude,codex'
export npm_config_manage_package_manager_versions=false
[[ "$(node --version)" == "v$(agent_node_version)" ]] || agent_die 'Node does not match .nvmrc'
[[ "$(pnpm --version)" == "$(agent_pnpm_version)" ]] || agent_die 'pnpm does not match packageManager'
node --version
pnpm --version
bun --version
[[ -f node_modules/.modules.yaml ]] || agent_die 'Repository dependencies are missing'
pnpm exec oxlint --version
pnpm exec oxfmt --version
pnpm exec tsc --version
for package in packages/ui registry playground domain; do
  [[ -d "$package/node_modules" ]] || agent_die "Missing UI workspace dependencies: $package"
  pnpm --dir "$package" exec tsc --version
  pnpm --dir "$package" exec vitest --version
done
[[ -f packages/ui/dist/index.js && -f packages/ui/dist/index.d.ts && -f packages/ui/dist/theme.css ]] || agent_die 'UI library build is missing'
pnpm --dir playground exec vite --version
pnpm --dir domain exec bun --version
if [[ "$AGENT_SETUP_BROWSER" == 1 ]]; then
  pnpm --dir playground exec node --input-type=module -e 'import { chromium } from "@playwright/test"; const browser = await chromium.launch({headless:true}); await browser.close()'
fi
if [[ "$AGENT_SETUP_BROWSER" == 1 ]]; then
  playwright --version
  agent-browser --version
  chrome-devtools --version
  agent_select_browser
  agent_check_browser playwright
  agent_check_browser agent-browser
  agent_check_browser chrome-devtools
else
  agent_log 'Browser tools and probes disabled by repository configuration'
fi
for harness in ${AGENT_HARNESSES//,/ }; do
  skill_directory="$(agent_skill_directory "$harness")"
  skills=()
  if [[ "$AGENT_SETUP_BROWSER" == 1 ]]; then skills+=(agent-browser chrome-devtools-cli); fi
  for skill in ${skills[@]+"${skills[@]}"}; do
    node "$SCRIPT_DIR/lib/skill-check.cjs" "$skill_directory/$skill" "$skill" ||
      agent_die "Missing/incomplete $harness skill: $skill"
  done
done
agent_log "Ready: UI runtimes, all workspace dependencies, development tools and enabled skills (harnesses: ${AGENT_HARNESSES:-none})"
