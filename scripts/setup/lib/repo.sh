#!/usr/bin/env bash
ui_check_repo() {
  agent_check_repo
  local manifest
  for manifest in pnpm-workspace.yaml packages/ui/package.json registry/package.json playground/package.json domain/package.json; do
    [[ -f "$AGENT_REPO_ROOT/$manifest" ]] || agent_die "Incomplete UI checkout: missing $manifest"
  done
  [[ "$AGENT_SETUP_ASTRALE_CLI" == 0 ]] || agent_die 'UI does not install the Astrale CLI; keep AGENT_SETUP_ASTRALE_CLI=0'
}
