# CLI and SDK boundary

## Consumer journey

```bash
# Existing React application.
astrale ui init --preset astrale

# Discover source compositions.
astrale ui list chart
astrale ui view pattern/chart/line/interactive

# Preview, then install consumer-owned source.
astrale ui add pattern/chart/line/interactive --dry-run
astrale ui add pattern/chart/line/interactive

# Inspect later upstream changes without overwriting local edits.
astrale ui diff pattern/chart/line/interactive
```

With no item arguments, `astrale ui add` is an interactive searchable picker. Under `--ci`, a
missing item is a usage error and no prompt opens.

The entire namespace is local-project tooling. It accepts an explicit project path or the current
directory, never opens a Kernel session, never requires an Astrale identity, and never stores UI
project state under the user's global `~/.astrale` CLI state.

## Target command surface

| Command                          | Intent                                                                                          | Important options and behavior                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `astrale ui init [path]`         | initialize Astrale UI in an existing supported project                                          | `--preset <name>`, `--version <exact-or-tag>`, `--dry-run`, `--force`, `--no-install`, `--json` |
| `astrale ui list [query]`        | list or search components, patterns, blocks, and presets                                        | `--type <pattern,block,preset,component>`, `--limit <n>`, `--json`                              |
| `astrale ui view <items...>`     | show metadata, dependencies, files, provenance, and docs without writing                        | `--json`                                                                                        |
| `astrale ui add [items...]`      | preview or install one or more pattern/block items                                              | `--dry-run`, `--diff [path]`, `--overwrite`, `--yes`, `--json`                                  |
| `astrale ui diff [items...]`     | compare installed base, local source, and the selected release                                  | `--path <file>`, `--json`                                                                       |
| `astrale ui doctor [path]`       | verify package, CSS, config, lock, aliases, registry reachability, and installed item integrity | `--json`                                                                                        |
| `astrale ui preset list`         | list qualified preset CSS contracts                                                             | `--json`                                                                                        |
| `astrale ui preset apply <name>` | change preset import and token configuration without rewriting components                       | `--dry-run`, `--force`, `--json`                                                                |

There is intentionally no V1 `update` command. Source installed from the registry is consumer-owned;
`diff` makes change visible and `add --overwrite` is an explicit destructive choice. A future
three-way merge command requires evidence from real customized consumers.

Bare `button`, `dialog`, and other runtime component names are discoverable with `list`, but
`add button` does not copy their source. `init` installs `@astrale-os/ui`, and applications import
those owners from package subpaths. Registry addresses begin with `pattern/` or `block/`. The CLI
may accept a shorter address only when it resolves uniquely and prints the canonical address.

## Initialization contract

`astrale ui init` performs one planned transaction:

1. detect the project root and package manager from lockfiles;
2. verify a supported React and Tailwind v4 topology or return a precise unsupported-project error;
3. resolve an exact public `@astrale-os/ui` version and the matching immutable repository tag;
4. resolve the tag to one commit SHA;
5. preview the package manifest, CSS entry, `components.json`, and lock changes;
6. install `@astrale-os/ui` only when installation is enabled;
7. merge the required CSS imports without adding Tailwind preflight twice;
8. preserve existing shadcn aliases and unrelated configuration;
9. write `astrale-ui.lock.json` only after all preceding writes succeed; and
10. run `doctor` and report actionable next imports.

The lock contains no secret and no user-global state:

```json
{
  "$schema": "https://raw.githubusercontent.com/astrale-os/ui/v1.0.0/schemas/ui-lock.schema.json",
  "version": 1,
  "package": { "name": "@astrale-os/ui", "version": "1.0.0" },
  "registry": {
    "repository": "astrale-os/ui",
    "ref": "v1.0.0",
    "commit": "0000000000000000000000000000000000000000"
  },
  "tooling": { "shadcn": "4.18.0" },
  "preset": "astrale",
  "items": {}
}
```

The zero commit is illustrative only; a real lock rejects anything other than the resolved
40-character SHA. Each installed item records its canonical address, source digest, target files,
and base file digests. Dry runs never create or update the lock.

## Delegation boundary

The installed `@astrale-os/cli` package does not depend on shadcn, React, Base UI, Radix, Tailwind, or
`@astrale-os/ui`.

The top-level CLI owns:

- command registration, help, prompts, `--ci`, `--no-prompt`, and JSON output;
- project/package-manager discovery;
- exact UI release and commit resolution;
- address normalization and lock admission;
- subprocess supervision, cancellation, and error projection; and
- post-operation integrity checks.

An exact shadcn CLI invoked through the detected package runner owns:

- source registry loading at the resolved GitHub commit;
- include and item schema validation;
- alias and target resolution;
- registry and npm dependency expansion;
- file/CSS dry-run, view, and diff behavior; and
- the final file transformation.

The qualified shadcn version comes from the selected release's `tooling/compatibility.json` and is
passed exactly, for example `pnpm dlx shadcn@4.18.0`; production source and CI never execute
`shadcn@latest`. The downloaded tool is an on-demand development tool cached by the consumer's
package manager, not an Astrale CLI or SDK install dependency.

The implementation must update the CLI `program` specification, layout, command-surface law, help
digest, variadic argument contract, command tests, skill documentation, and package dependency
boundary proof in the same change. A registered command with no complete help and machine contract
does not count.

## Machine contract

UI commands preserve the current CLI machine convention rather than inventing an incompatible
envelope: success writes one command-specific JSON value to stdout; rejection writes one JSON line
to stderr and exits nonzero.

```ts
type UiMachineFailure = {
  readonly error:
    | 'UI_PROJECT_UNSUPPORTED'
    | 'UI_CONFIG_MISSING'
    | 'UI_REGISTRY_UNAVAILABLE'
    | 'UI_ITEM_NOT_FOUND'
    | 'UI_ITEM_CONFLICT'
    | 'UI_LOCAL_CHANGES'
    | 'UI_DEPENDENCY_INSTALL_FAILED'
    | 'UI_LOCK_INVALID'
    | 'UI_TOOL_FAILED'
  readonly message: string
  readonly hint?: string
}
```

Unexpected defects remain the CLI's existing `UNEXPECTED_ERROR`; they are not flattened into
`UI_TOOL_FAILED`. Secrets, authorization headers, environment values, and arbitrary source contents
never appear in machine failures.

## Add and diff laws

- Resolve the requested UI release tag to a commit before reading any registry source.
- All root, include, item, and file reads use that one SHA.
- Show exact files, npm dependencies, and package manifest/CSS changes before confirmation.
- `--dry-run`, `view`, and `diff` perform no file, package, or lock write.
- A failed dependency install or file transform cannot advance the lock.
- Repeating an already-installed exact item is a no-op.
- If any installed file differs from its recorded base digest, ordinary add refuses overwrite and
  directs the consumer to `diff`.
- `--overwrite` names every affected local file and requires confirmation unless `--yes`; under
  `--ci`, both flags must be explicit.
- Cancellation settles the child process and leaves no partial lock claim.
- Symlink, parent traversal, absolute target, and project-root escape attempts reject before write.

## SDK and generator integration

### SDK runtime

No integration is needed or allowed in `@astrale-os/sdk`:

- no UI dependency or optional peer;
- no `sdk/ui` namespace;
- no component, theme, or registry re-export;
- no React type in SDK declarations; and
- no install-size change attributable to UI.

This keeps Domain authoring, deployment, execution, and headless projects independent from frontend
selection.

### `create-astrale-domain`

After the public package and CLI qualify, the React generator may add one explicit choice:

```text
--ui astrale | none
```

Interactive React creation recommends `astrale`; automation can always select `none`. Custom and
headless frontends remain `none`. Choosing Astrale changes only the generated application:

- add `@astrale-os/ui` at the exact generator-qualified version;
- add the theme and selected preset CSS imports;
- create compatible `components.json` and `astrale-ui.lock.json` files;
- use one public package import in the starter screen; and
- show `astrale ui add` as the extension journey.

The generator package itself gains no UI, React, Base UI, Radix, shadcn, chart, form, or date dependency.
Its generated-project qualifier installs the packed UI tarball into a fresh project and proves the
same files accepted by `astrale ui doctor`. Until this cross-repository proof exists, the generator
must retain its current UI-neutral output and documentation may offer `astrale ui init` as a
post-create step.

## CLI proof matrix

| Surface            | Required evidence                                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| program contract   | exact command tree/help digest; independent fresh program roots; CLI spec and skill parity                                                    |
| discovery          | list/search pagination, type filters, unique shorthand, no-result behavior, JSON stability                                                    |
| source consistency | moving tag resolves once; all files read from one SHA; ref-resolution failure                                                                 |
| init               | supported clean project; existing shadcn project merge; already initialized no-op; unsupported topology; dry-run; dependency failure rollback |
| add                | single/multiple item; transitive file set; exact deps; confirmation; dry-run; idempotency; local-change rejection; explicit overwrite         |
| diff               | unmodified, modified, deleted, upstream changed, unknown item, selected file                                                                  |
| security           | traversal, symlink escape, malicious manifest target, oversized payload, secret-safe errors, interrupted child                                |
| package runners    | pnpm, npm, yarn, and Bun command construction; spaces in project path; missing runner                                                         |
| SDK boundary       | packed CLI and SDK dependency closures contain no UI or shadcn packages                                                                       |
| generated app      | explicit Astrale and none variants both install, typecheck, build, test, and pack                                                             |
