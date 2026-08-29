# Candidate specification

## Public journey

```text
astrale ui request <query> [--json]
```

`query` is one required free-text statement of need. Admission normalizes line endings and trims
leading/trailing whitespace; it preserves case, punctuation, internal whitespace, and wording.
There is no public classification, provider, license, model, repository, or agent flag. The
requester describes intent and observable behavior; the pipeline determines placement only after
inspecting the selected source.

The V1 command prepares and opens the canonical GitHub issue form. Form submission—not opening the
URL—is the request-creation boundary and pipeline trigger. This avoids a second GitHub login or a
GitHub token inside the Astrale CLI. Human output must say that the form was opened and still needs
submission. `--json` does not open a browser and returns [api.d.ts](./api.d.ts), enabling an agent to
open and submit the same form with the user's existing GitHub session. If human-mode browser opening
is unavailable, the CLI prints the same form URL and succeeds rather than discarding the draft.

Canonical JSON shape:

```json
{
  "query": "accessible combobox with async creation",
  "submissionUrl": "https://github.com/astrale-os/ui/issues/new?template=ui-request.yml&need=accessible%20combobox%20with%20async%20creation"
}
```

The form contains:

- the prefilled need;
- optional observable acceptance constraints;
- optional reference URLs or screenshots; and
- an acknowledgement that the issue and its attachments are public and that public-source and
  license evidence are required.

It must not ask the requester to choose component, pattern, block, runtime package, provider, or
implementation technology.

An empty, transport-oversized, or otherwise unusable query fails as `UI_REQUEST_QUERY_INVALID`.
Missing or incompatible canonical request configuration fails as `UI_REQUEST_UNAVAILABLE`. A form
draft is not reported as a created issue.

## Request authority and lifecycle

GitHub owns the mutable collaboration state; `request/` must not duplicate it in a database.
[state.ts](./state.ts) is the single candidate transition topology. Its ordinary success projection
is:

```text
submitted -> accepted -> researching -> proposed -> completed
```

- `submitted`: the issue exists and owns the requested outcome.
- `accepted`: a trusted maintainer admits the request for agent work.
- `needs-input`: research or review needs a material user decision.
- `researching`: an agent is comparing sources and checking existing Astrale coverage.
- `proposed`: one linked PR owns the candidate source, evidence, and iteration.
- `completed`: the linked candidate merged; the issue closes.
- `declined`: duplicate, no admissible source, no product fit, or explicitly rejected.

`completed` and `declined` are terminal. Any non-terminal research/review state may request input
or decline exactly as declared by the topology; `needs-input` resumes through trusted acceptance
rather than remembering a hidden previous state.

The exact GitHub labels are an adapter projection, not a second state authority. Public submission
may run bounded parsing or duplicate hints, but it must not trigger privileged writes or unbounded
agent work until trusted triage accepts it. Normal PR review comments drive iteration. No public
slash-command language is part of V1.

After acceptance, the trusted dispatcher compiles the issue, constraints, source-fidelity rules,
and current repository target into one provider-independent managed-agent job. It injects one
configured [`ManagedAgent`](../../agent/.history/v1/api.d.ts); neither public input nor CLI output
contains a provider, model, credential, environment, or tool choice. The dispatcher reserves each
attempt before dispatch and persists the opaque run reference on the request for restart-safe
polling.

A managed run succeeds only when it yields exactly one PR in the intended repository. Provider
completion does not mean the request is complete: CI, preview, provenance/license admission, review,
merge, and release retain their current owners. A review revision is a fresh run targeting the
existing PR. The one-writer and uncertain-outcome laws are specified in the child agent contract.

One request yields one PR when the entries form one coherent installable need. A source may map to
several entries when its real anatomy requires them. Unrelated needs are split rather than hidden
inside one large PR.

## Research semantics

The agent follows this order:

1. Search the current Astrale corpus to detect an existing match, close variant, or missing
   behavior in an existing family.
2. Search current shadcn-compatible registries through the documented programmatic API with
   partial-provider failure enabled.
3. Search public repositories, package indexes, and authoritative project documentation beyond the
   directory.
4. Inspect actual source, demos, dependencies, accessibility behavior, maintenance signals, and
   license evidence for plausible candidates.
5. Select the smallest source that satisfies the request with the least visual or behavioral
   invention.

The shadcn directory is dynamic discovery input, not a provider allowlist, availability guarantee,
quality score, or license authority. Registry health may prioritize investigation but cannot admit
source. A provider outage yields partial research evidence, not pipeline-wide failure.

Candidate comparison is judgment, not a fixed weighted score. The PR states sources considered and
why the selected source best matches behavior, accessibility, dependency fit, theming openness,
maintenance, adaptation cost, and license compatibility. One candidate is sufficient only when it
is the exact authoritative source or all other observed candidates are inadmissible; the reason is
recorded.

## Placement and duplication

Classification is an output, never a request filter:

- an existing visual runtime owner is extended only when the source belongs to that ubiquitous,
  low-dependency package surface;
- independently installable UI enters the registry at the narrowest address matching its real
  source anatomy;
- focused reusable compositions remain patterns;
- application-scale sections or pages remain blocks; and
- portable character/token output remains a theme.

These names organize ownership; they must not alter source merely to fit a label. Review may change
the placement without changing the original request.

Before adding an address, the agent searches package exports, registry identities, source behavior,
and family variants. A close match becomes an improvement or variant when that preserves the
source's semantics. Exact identity closure is deterministic; semantic duplication remains an
explicit review judgment.

## Adaptation rule

Astrale copies the selected source faithfully and owns the resulting code. Mechanical changes may
adapt imports, aliases, file targets, package paths, registry metadata, and language/runtime
compatibility. Every upstream-to-owned delta is visible and classified in the retained intake
record.

No agent may invent or silently change default classes, CSS, tokens, DOM anatomy, interaction,
accessibility behavior, responsive behavior, or product copy. A non-mechanical change requires an
authoritative source, an explicit request/review decision, and a separately described delta. If
the requested design cannot be obtained without invention, the agent returns to `needs-input`
instead of improvising.

## Candidate pull request

The agent opens a true branch and PR linked with `Resolves #<request>`. The PR body contains:

1. requested outcome and resulting addresses;
2. selected source and concise fit rationale;
3. alternatives considered and disposition;
4. license/provenance summary with exact retained record path;
5. mechanical and reviewed non-mechanical adaptations;
6. dependencies and installation consequences;
7. direct live preview URL when a preview adapter is configured;
8. canonical screenshot evidence and artifact link; and
9. focused and repository qualification results, with skips stated.

The PR contains canonical preview modules and fixtures under the existing catalog convention.
Generated catalog/search/registry output follows existing owners. The request pipeline never adds a
manually maintained catalog entry.

## Visual evidence

Every visual entry has a direct playground URL using the existing `?preview=<id>` contract. The PR
preview is rebuilt from each head revision, isolated on an origin with no production cookies,
credentials, or privileged APIs. Closing the PR removes or expires it.

CI captures one deterministic canonical screenshot per new visual preview. Responsive or
state-sensitive source adds only the extra viewport/state evidence needed to prove its authored
behavior. The PR embeds a compact representative image and links the complete screenshot artifact;
it does not become an unscalable wall of images.

A hosting provider is an adapter. GitHub's deployment URL is the PR-facing seam. An unprivileged
job builds and admits a bounded static artifact. A separate base-controlled publisher may transfer
that artifact as inert bytes with a narrowly scoped deployment credential; it must never execute,
import, install, or accept commands/configuration/paths from the artifact. Until such an adapter is
selected, screenshots and the built playground artifact remain valid evidence, but V1 cannot be
ratified as satisfying the live-preview goal.

## Merge and publication

Request PRs use the repository's ordinary required reviews and CI. They never publish packages.
Merge closes the request and feeds the existing release workflow; publication remains separately
qualified release evidence.
