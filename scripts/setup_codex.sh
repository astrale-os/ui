#!/usr/bin/env bash
set -euo pipefail

for required_command in node npm npx; do
  if ! command -v "$required_command" >/dev/null 2>&1; then
    echo "error: $required_command is required but is not on PATH" >&2
    exit 1
  fi
done

if [[ -n "${CODEX_HOME:-}" ]]; then
  codex_dir="$CODEX_HOME"
elif [[ -d "/opt/codex" ]]; then
  # Codex Cloud sets CODEX_HOME for the agent phase but not during setup.
  codex_dir="/opt/codex"
else
  codex_dir="${HOME}/.codex"
fi

tools_dir="$codex_dir/tools/browser"
official_bun_version="1.4.1"
bun_runtime_dir="$codex_dir/tools/bun-$official_bun_version"
bun_bin="$bun_runtime_dir/node_modules/.bin/bun"
skills_dir="$codex_dir/skills"
tool_bin="$tools_dir/node_modules/.bin"
global_bin_dir="${CODEX_BIN_DIR:-/usr/local/bin}"
minimum_release_age_seconds=604800

mkdir -p "$bun_runtime_dir" "$tools_dir" "$skills_dir"

link_cli() {
  local cli_name="$1"
  local cli_source="$tool_bin/$cli_name"
  local cli_destination="$global_bin_dir/$cli_name"

  if [[ ! -x "$cli_source" ]]; then
    echo "error: expected CLI is missing or not executable: $cli_source" >&2
    exit 1
  fi
  if [[ ! -d "$global_bin_dir" ]]; then
    echo "error: CLI destination directory does not exist: $global_bin_dir" >&2
    exit 1
  fi
  if [[ ! -w "$global_bin_dir" ]]; then
    echo "error: CLI destination directory is not writable: $global_bin_dir" >&2
    echo "Set CODEX_BIN_DIR to a writable directory on PATH." >&2
    exit 1
  fi

  ln -sfn "$cli_source" "$cli_destination"
}

install_codex_skill() {
  local repository="$1"
  local skill_name="$2"
  local npx_source="${HOME}/.agents/skills/$skill_name"
  local codex_destination="$skills_dir/$skill_name"
  local skill_manifest="$codex_destination/SKILL.md"

  npx --yes skills@latest add \
    "$repository" \
    --skill "$skill_name" \
    --agent codex \
    --global \
    --copy \
    --yes

  # `skills --global` stores canonical skills under ~/.agents and does not
  # honor Codex Cloud's later agent-phase CODEX_HOME=/opt/codex.
  if [[ ! -f "$npx_source/SKILL.md" ]]; then
    echo "error: skills@latest did not install $npx_source/SKILL.md" >&2
    exit 1
  fi

  mkdir -p "$codex_destination"
  cp -R "$npx_source/." "$codex_destination/"

  if [[ ! -f "$skill_manifest" ]]; then
    echo "error: synchronized skill manifest is missing: $skill_manifest" >&2
    exit 1
  fi
  if ! grep -Eq "^name:[[:space:]]*$skill_name[[:space:]]*$" "$skill_manifest"; then
    echo "error: $skill_manifest does not declare the expected name: $skill_name" >&2
    exit 1
  fi
}

echo "Installing isolated Bun $official_bun_version..."
npm install \
  --prefix "$bun_runtime_dir" \
  --no-save \
  --no-package-lock \
  "bun@$official_bun_version"

# Some managed npm configurations disable dependency lifecycle scripts. Run
# Bun's official package installer explicitly only when its binary is missing.
if [[ "$($bun_bin --version 2>/dev/null || true)" != "$official_bun_version" ]]; then
  node "$bun_runtime_dir/node_modules/bun/install.js"
fi
if [[ "$($bun_bin --version)" != "$official_bun_version" ]]; then
  echo "error: failed to install Bun $official_bun_version at $bun_bin" >&2
  exit 1
fi

echo "Installing isolated browser tools into $tools_dir..."
"$bun_bin" add \
  --cwd "$tools_dir" \
  --exact \
  --minimum-release-age="$minimum_release_age_seconds" \
  agent-browser@latest \
  chrome-devtools-mcp@latest \
  playwright@latest

link_cli "agent-browser"
link_cli "chrome-devtools"
link_cli "playwright"

echo "Installing the two Codex skills non-interactively from GitHub..."
install_codex_skill "vercel-labs/agent-browser" "agent-browser"
install_codex_skill "ChromeDevTools/chrome-devtools-mcp" "chrome-devtools-cli"

chromium_path="$("$bun_bin" --cwd "$tools_dir" -e 'import { chromium } from "playwright"; console.log(chromium.executablePath())')"
if [[ -x "$chromium_path" ]]; then
  echo "Chromium is already installed: $chromium_path"
else
  echo "Installing Chromium directly through Playwright..."
  playwright install --with-deps chromium
fi

echo "Checking the Codex browser environment..."
test -x "$chromium_path"
agent-browser doctor --offline --quick

echo
echo "Codex browser setup completed:"
echo "  Bun: $($bun_bin --version)"
echo "  agent-browser: $(agent-browser --version)"
echo "  chrome-devtools: $(chrome-devtools --version)"
echo "  Chromium: $chromium_path"
echo "  Tools: $tools_dir"
echo "  Skills: $skills_dir/{agent-browser,chrome-devtools-cli}"
