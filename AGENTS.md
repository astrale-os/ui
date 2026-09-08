# Astrale UI

Astrale OS is a graph-based operating system. This autonomous repository is the `ui` submodule of the Astrale workspace and owns `@astrale-os/ui`, its semantic themes, source registry, playground, and UI control-plane Domain.

## Repository boundaries

- Extend existing primitives, patterns, tokens, and registry items before introducing parallel UI abstractions.
- `workspace:*` may reference only packages owned by this repository. Depend on packages owned by another Astrale repository through published versions.
- Use the checked-in package scripts and configuration as the source of truth for tooling and verification.

## Browser verification

- For quick UI smoke checks, load the `agent-browser` skill and use the `agent-browser` CLI.
- For repeatable checks or regression tests, use Playwright through the `webapp-testing` skill.
- For deep browser diagnosis, load the `chrome-devtools-cli` skill and use the Chrome DevTools CLI.
