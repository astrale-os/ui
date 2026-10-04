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
application.ts   Schema and Runtime composition
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
URL. The stable Worker `ui.astrale.ai` keeps the code it runs today: no Environment deploys it.
While an installation still pins it, rotate one of its secrets in place with
`wrangler secret put <NAME> --name <script>`, where `<script>` is the Worker that serves the
`ui.astrale.ai` route; never redeploy it.

Do not deploy until live issue creation and cleanup are explicitly authorized.

### Moving an installation to a deployment (OPS-5b)

Run only as an authorized operation, one instance at a time, never on an instance of the 1Pact
Host. Installations that pin the stable Worker move by an explicit, consented install:

1. Deploy: `pnpm run deploy production --json`, with `CLOUDFLARE_ACCOUNT_ID` and
   `CLOUDFLARE_API_TOKEN` for the platform namespace (provisioned by OPS-1). Keep `url` and
   `release.digest`.
2. Inventory, read-only. For each instance of the astrale Host:
   `astrale introspect ui.astrale.ai -i <instance> --json`. A `publication.identity.issuer` of
   `https://ui.astrale.ai` pins the stable Worker; `DOMAIN_NOT_INSTALLED` means there is nothing
   to move. The Host must run a Kernel that lists installed releases and records issuer consent
   (K11b); an older Kernel refuses the consent below (`KERNEL_RELEASE_UNSUPPORTED`). Also read the
   Fleet catalog, `astrale domain list --json`: an entry for `ui.astrale.ai` whose `url` is the
   stable Worker keeps sending catalog installs there. Record it as a separate follow-up; this
   runbook does not change it.
3. Install with consent to the issuer change. The stable Worker and the deployment are on
   different lines, so consent names the origin:
   `astrale domain install <url> --allow-issuer-change=ui.astrale.ai -i <instance>`. Without it,
   a non-interactive install (or `--json`) is refused before anything is sent
   (`ISSUER_CHANGE_NOT_CONSENTED`, line `cross`); at a terminal the CLI asks you to type the
   origin. The previous issuer drains by default.
4. Verify: `<url>/.well-known/astrale/release.json` serves the kept release digest, and the
   install report names `<url>` as the issuer of `ui.astrale.ai` on that instance. Do not call
   the request function to check: it opens real GitHub issues.
5. Roll back if needed by reinstalling the stable Worker, which still serves unchanged:
   `astrale domain install https://ui.astrale.ai --allow-issuer-change=ui.astrale.ai -i <instance>`.
   This move back to a legacy `domain.json` source is not yet proven for this Domain. Before the
   first production instance, rehearse steps 3 to 5 on a local Host that runs the same Kernel,
   with a source that serves the stable Worker's `domain.json`.

Domain projects intentionally own no parallel `.spec` tree: authored `schema/` is the normative
Domain contract and `.history/` retains temporal design evidence. Import authoring contracts through semantic
`@astrale-os/sdk/*` subpaths; never import Kernel Core or DSL directly. Routing remains a normal
frontend concern if a future product View is justified.
