# Astrale UI Domain

`ui.astrale.ai` is the control plane for UI ecosystem operations that require identity,
coordination, shared computation, or secret-backed integration. It is not the component library,
registry database, catalog, installer, or implementation agent.

```text
schema/          public Domain contract
states/          semantic lifecycle authority used by Schema
queries/         caller-owned Request observation
mutations/       atomic Request identity and lifecycle commits
integrations/    provider-neutral external submission boundary
providers/       GitHub boundary implementation and environment admission
functions/       crash-safe request Workflow
runtime.ts       exact Workflow and Provider composition
application.ts   Schema and Runtime composition
tests/           cross-layer executable evidence
.history/v1/     ADR, decisions, questions, and phase gates
```

V1 implements one authenticated, idempotent request-intake capability and stores only the resulting
Request identity and submission receipt. GitHub collaboration remains external. See
[the V1 ADR](./.history/v1/ADR.md).

Copy `.env.example` to `.env.dev`, supply one repository-scoped GitHub credential, and run
`pnpm dev`. This watches and remotely deploys the `development` Environment; it starts no local
Worker or tunnel and installs on no Kernel. `pnpm prod` remains the explicit one-shot production
deployment. Stopping development leaves its remote Worker running. The credential requires Issues
write access to the configured repository; callers never
supply or observe it. `pnpm build` verifies exact callable and Provider composition without
deploying.

Do not deploy until live issue creation and cleanup are explicitly authorized.

Domain projects intentionally own no parallel `.spec` tree: authored `schema/` is the normative
Domain contract and `.history/` retains temporal design evidence. Import authoring contracts through semantic
`@astrale-os/sdk/*` subpaths; never import Kernel Core or DSL directly. Routing remains a normal
frontend concern if a future product View is justified.
