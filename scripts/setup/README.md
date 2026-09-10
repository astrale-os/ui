# Prepare UI

The launcher downloads the [Config setup archive](https://github.com/astrale-os/config/tree/main/setup),
pinned by version and SHA-256 in `setup.lock`; `repo.sh` selects the profile.
Setup prepares jq, the four workspace packages, the Domain’s separate pnpm version, the library build and the playground’s pinned Chromium. Browser clients and two browser skills are enabled; Astrale CLI is disabled.
Node and pnpm follow repository declarations. Product scripts own builds and tests.

- Prepare: `bash scripts/setup/setup.sh`.
- Verify without installation/download: `bash scripts/setup/verify.sh`.
- Codex: cache disabled; Setup `AGENT_HARNESSES=codex bash scripts/setup/setup.sh`; Maintenance empty.
- Claude: environment Setup empty; SessionStart prepares when inputs change, otherwise loads paths. Local hooks only restore paths.
- Conductor: `AGENT_SETUP_TOOLS=check bash scripts/setup/setup.sh` requires existing machine tools, then prepares dependencies and artifacts.

Use the umbrella workspace’s root installation when working there. Standalone setup
reports dependency lockfile changes; review them before committing.
CI tests archive installation and reuse; update version and digest together.
Cloud validation must confirm active skills and run product checks without rerunning
setup, sourcing paths or repairing the environment.

Network access requires GitHub release assets, runtime/package registries and any
enabled browser download hosts; see Config for the shared network contract.
Linux preparation may require root or passwordless sudo for system libraries.
