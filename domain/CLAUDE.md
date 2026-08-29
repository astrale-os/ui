# Astrale domain

Load the `astrale-domain` skill before changing Schema, Rules, Queries, Mutations, Actions,
Workflows, Integrations, Providers, Views, UI, migrations, or security. Install it user-level if
needed:

```bash
npx skills add astrale-os/cli -g
```

This scaffold is intentionally minimal. React and custom projects include one schema-declared
application View to prove frontend delivery; `--frontend none` is callable-only. Start each real
behavior in its semantic submodule, keep owners explicit, put focused tests in `__tests__`, use
registered package `#` imports across owners, and keep `runtime.ts` and `application.ts` limited to
their exact composition responsibilities.
Actions perform one semantic asynchronous operation; Workflows name every explicit multi-step operation.

Add a `states/<lifecycle>/` owner only when an application entity has a finite persisted lifecycle
with real illegal transitions. Declare it once with `stateMachine`, use `machine.stateSchema` in
Schema, initialize with `machine.initial`, and persist allowed decisions through
`mutation.transition`. Keep guards, authority, provider effects, retries, and deletion outside
the relation. The scaffold configures `#states` aliases but deliberately generates no empty States
layer.

`pnpm pack` runs the single `astrale-domain package` journey. The published package exposes its
Schema contract at the package root. Runtime, handlers, Providers, frontend code, and deployment
adapters remain implementation inputs and are not published. Do not add a parallel build or
declaration-rewrite script.

`pnpm dev` owns the complete development session. With the managed Astrale adapter it acquires
private ingress, starts Worker and optional Vite hot reload, reconciles the Domain installation on
the configured or active instance, and opens the View when one exists. Stop closes only local
processes; it retains the installation and local reconciliation evidence for the next run. Do not
add a parallel tunnel, install loop, frontend watcher, or automatic shutdown uninstall.

Domain projects do not contain `.spec` directories. Do not add one: public SDK types, package
facades, the Domain knowledge rules, and executable tests are the contract guardrails. Import Core
and DSL authoring values only from the matching `@astrale-os/sdk/*` semantic subpath; never import
`@astrale-os/kernel-core` or `@astrale-os/kernel-dsl` directly.
