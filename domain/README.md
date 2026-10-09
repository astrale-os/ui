# Astrale UI Domain

`ui.astrale.ai` is the control plane for UI ecosystem operations that require identity,
coordination, shared computation, or secret-backed integration. It is not the component library,
registry database, catalog, installer, or implementation agent.

```text
schema/          public Domain contract
queries/         caller-owned Request observation
mutations/       atomic Request identity and lifecycle commits
integrations/    provider-neutral external submission boundary
providers/       GitHub boundary implementation and environment admission
functions/       crash-safe request Workflow
runtime.ts       exact Workflow and Provider composition
domain.ts        Schema and Runtime composition (Domain definition)
tests/           cross-layer executable evidence
.history/v1/     ADR, decisions, questions, and phase gates
```

V1 implements one authenticated, idempotent request-intake capability and stores only the resulting
Request identity and submission receipt. GitHub collaboration remains external. See
[the V1 ADR](./.history/v1/ADR.md).

Copy `.env.example` to `.env.dev` (the `development` Environment) or `.env.prod` (`production`)
and supply one repository-scoped GitHub credential. The credential requires Issues write access to
the configured repository; callers never supply or observe it. `pnpm build` verifies exact callable
and Provider composition without deploying.

`pnpm run deploy development` (or `production`) deploys the current release as one immutable
deployment in the platform dispatch namespace `astrale-platform`, on the readable line of
`ui.astrale.ai` in that Environment, at `https://<label>.platform.astrale.ai`. It prints that URL
(`--json` for the deploy result) and installs on no Kernel. Each deployment signs with a key
generated for it. A deploy of the same release reuses its deployment and rewrites only that
deployment's secrets in place; any change of code or configuration makes a new deployment and
leaves the previous ones serving. `astrale domain install <url> -i <instance>` installs a printed
URL. New installations use this immutable deployment URL; install reports identify the release
and issuer that the instance accepted. Verify the deployment's `/.well-known/astrale/release.json`
against its reported digest. Calling the request function creates real GitHub issues.

Do not deploy until live issue creation and cleanup are explicitly authorized.

Domain projects intentionally own no parallel `.spec` tree: authored `schema/` is the normative
Domain contract and `.history/` retains temporal design evidence. Import authoring contracts through semantic
`@astrale-os/sdk/*` subpaths; never import Kernel Core or DSL directly. Routing remains a normal
frontend concern if a future product View is justified.
