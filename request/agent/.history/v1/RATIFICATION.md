# Ratification status

**Status: implementation-ratified; selected live worker qualification incomplete.**

The narrow V1 boundary—dispatch, observe, read-only reconciliation, cancellation awareness, and
one intended-repository pull-request outcome—is accepted and promoted into `request/agent/.spec`.
GitHub Copilot, Cursor, and GitHub Actions Claude Code adapters pass the same deterministic
restart/admission/proposal/reconciliation contract plus their provider-specific state, failure,
target, idempotency, timeout, and cancellation matrices.

Provider choice and credentials remain trusted composition. Models, sessions, chats, tools, MCP,
environments, raw payloads, merge, release, and publication remain outside the boundary.

## Production-enable gate

Production enablement requires one successful disposable request through the configured
GitHub-Actions/Claude-Code/Foundry route. A second live provider is continuing portability evidence,
not a blocker: three materially different adapters already share one deterministic contract. The
Azure Luna and Claude Opus 5 deployments and Claude Code Foundry transport are live-qualified; the
remaining gate is workflow-to-PR delivery from the default branch.
