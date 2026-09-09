# UI agent setup

Run from a standalone checkout; Node and pnpm need not be installed beforehand:

```bash
AGENT_HARNESSES=codex bash scripts/setup/agent/setup.sh
AGENT_HARNESSES=codex bash scripts/setup/agent/verify.sh
```

Use `claude` or `codex,claude` for skill destinations. Node comes from `.nvmrc`,
pnpm from the root `package.json#packageManager`. Setup also installs jq when missing for the request workflow contract tests.
Root installation prepares the
library, registry, playground and Domain with the checked-in native build policy.
Setup preloads the Domain's separately pinned pnpm for direct Domain commands.
Setup builds the library because consumers resolve its dist exports. Browser-on
also installs Chromium for the playground's own pinned Playwright, separately
from the global automation tools. No registry refresh, release, deployment,
authentication or development server is started.

Browser tools and their skills are enabled by default: Playwright, agent-browser
and chrome-devtools, with agent-browser and chrome-devtools-cli skills. Set
`AGENT_SETUP_BROWSER=0` explicitly for dependency-only preparation. UI does not
install the published Astrale CLI or its skills; keep `AGENT_SETUP_ASTRALE_CLI=0`.

`setup_repo.sh --check` validates required manifests without installed runtimes
or writes. `verify.sh` never installs: it checks runtimes, dependency tools,
the library build and the playground Chromium launch,
three global browser launches and the two selected harness skills.
Installation uses `STANDALONE=true pnpm install --no-frozen-lockfile --prefer-offline`;
Git branch/HEAD and native-build permissions are preserved, lockfile changes
are reported without committing.

The former root `setup.sh` and browser-only `scripts/setup_codex.sh` are replaced
by this entry point. Local users with pnpm can also use `pnpm setup`.

## Clouds

- Codex: UI repository, cache disabled, Setup only:
  `AGENT_HARNESSES=codex bash scripts/setup/agent/setup.sh`. Maintenance empty.
- Claude: existing Astrale environment, environment Setup empty. The committed
  SessionStart hook initializes and verifies once per physical checkout under a
  lock, then records success and reloads skills. Subsequent hooks load paths via
  `CLAUDE_ENV_FILE`. Local hooks only load an explicitly prepared environment.
- Fresh Linux needs Bash, Git, root or passwordless sudo and APT; Claude needs
  `flock` (util-linux). Allow Node/npm/JSR, GitHub and its release-asset hosts,
  cdn.sheetjs.com (the checked-in xlsx tarball), browser downloads and Ubuntu mirrors.

Probe a new cloud session without rerunning setup, hooks, installs or PATH fixes.
Check delivered command paths, the active skill inventory, then run verify.
Record HEAD and Git status before/after, and test prepared-checkout reuse
separately. Run root lint, typecheck and tests, plus playground unit tests and Domain checks.
  Browser suites use their checked-in playground scripts.

## Shared standard

Eight files are copied unchanged from Config revision
`49291648ffb6fcff3247a73251c40c8d7574ec35`. Repository choices, preparation,
verification, hooks and tests belong here. Change common behavior in Config and
synchronize consumers; startup never downloads shared code. CI checks exact
conformity and runs shared plus repository setup regressions.

```bash
bash /path/to/config/agent-setup/sync.sh --check .
node --test /path/to/config/agent-setup/*.test.cjs scripts/setup/agent/*.test.cjs
```
