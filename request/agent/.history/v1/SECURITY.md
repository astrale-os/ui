# Candidate security model

## Trust boundaries

The request, linked pages, repository content, dependency metadata, provider output, branch, and PR
are untrusted inputs. The trusted dispatcher validates admission and compiles a bounded objective;
the managed agent may propose code but cannot accept, merge, publish, release, or provision access.

## Credentials

- Provider credentials exist only in trusted adapter construction and secret storage.
- A provider API key is never placed in `ManagedAgentJob`, an issue, a comment, a branch, or a log.
  The selected Claude Code process necessarily authenticates inference with the Foundry key, but
  receives no shell tool or GitHub publishing token; the key exists only in the proposal job.
- The provider receives no npm publishing token, release credential, deployment secret, Astrale
  kernel authority, preview-administration credential, or unrelated repository access.
- Repository publication uses a fresh job and checkout. Only a bounded inert patch crosses from the
  proposal into credential-free qualification and then publication. Candidate code never executes
  in the publisher, the worker's default `GITHUB_TOKEN` is read-only, and checkout never persists it
  in git config.
- If a future integration needs Astrale authority, it receives a per-run, short-lived,
  least-authority credential—not a long-lived bootstrap or provider-account secret.

The GitHub and provider identities must not be able to merge a PR or bypass required checks.

The selected worker locks the exact Claude Code CLI package, disables Bash, does not load repository
customizations, and permits only read/edit/write/search tools. Candidate checks run in a fresh
credential-free job; commit, push, and PR creation are fixed steps in another fresh job that never
executes candidate-controlled package code or git hooks.

## Prompt and source safety

Web pages, registry metadata, README files, code comments, and issue attachments are research data,
not privileged instructions. The objective states allowed actions and source/license constraints.
The agent may inspect public sources and edit its assigned branch; it may not expand repository,
credential, publication, or infrastructure scope based on retrieved content.

## Concurrency and uncertain outcomes

The parent reserves an attempt before dispatch and permits one non-terminal writer per request/PR
branch. `AGENT_OUTCOME_UNKNOWN` is fail-closed: no automatic retry, provider fallback, or second
writer. When cancellation is unsupported or merely requested, observation continues until remote
write authority is known to have ended.

## Provider events and payloads

Polling is authoritative. A future webhook or stream is treated as an untrusted wake-up signal,
verified for authenticity where possible, bounded in size, and followed by `observe()`. Raw provider
payloads and transcripts are not persisted by the neutral contract; adapters expose only bounded
normalized messages, reasons, URLs, and identifiers.

## Blast radius

A compromised provider account can affect only explicitly admitted repositories/branches and can
propose reviewable changes. GitHub branch protection, CI, preview isolation, provenance/license
checks, and human approval remain independent gates. Provider outage or quota exhaustion blocks
dispatch but must not weaken those gates or silently route work elsewhere after possible acceptance.

## Operational requirements

- redact authentication headers and provider secrets from logs and errors;
- validate all returned GitHub URLs against the intended repository;
- reject an opaque run reference whose provider does not match the selected adapter;
- pin and qualify provider API versions/preview headers;
- bound polling, response sizes, objective size, identifiers, and provider messages; and
- record provider identity, attempt key, normalized transitions, and PR URL without secret values.
