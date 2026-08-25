# Execution goal

Deliver Public UI V1 as a complete, qualified cutover on exact revisions, pausing only where the
external first-publication gate must create the public registry artifact needed by downstream
lockfiles.

## Required outcome

The repository must provide:

1. one publishable runtime package, `@astrale-os/ui`, with flat public component subpaths, a curated
   root facade, emitted ESM/declarations, explicit CSS entrypoints, MIT licensing, and no legacy
   package dependency;
2. the current shadcn Base UI/Nova component set absorbed into semantic owners, with dependency-rich
   compositions moved out of the runtime package;
3. a coherent theme contract with opt-in reset and materially distinct Astrale, compact, and
   expressive presets;
4. a valid source registry containing useful multi-variant pattern families and off-the-shelf,
   controlled blocks that import only public `@astrale-os/ui` paths;
5. a local `astrale ui` CLI namespace for initialization, discovery, preview, add, diff, doctor, and
   preset selection without adding UI or shadcn dependencies to the installed Astrale CLI;
6. no UI dependency, export, peer, or runtime weight in `@astrale-os/sdk`;
7. the real GUI consumer and explicit generated-React journey migrated without compatibility
   facades;
8. behavior, API, package, registry, accessibility, visual, consumer, security, and release evidence
   proportionate to the shipped contract; and
9. Release Please and `publish.yml` ready for one public package and npm trusted publishing.

## Completion boundary

Pre-publication source completion requires all implementation-owned criteria in
[ACCEPTANCE.md](./ACCEPTANCE.md) that do not depend on a public artifact to pass on the exact
reviewed revisions, every material test-review finding to be resolved, and every UI-repository
legacy package/import/workflow reference to be removed or classified as historical. After the
bootstrap, execution resumes with public-package observation, real consumer lockfiles, and the
generated-React journey before the overall goal is complete.

The following remain external and are not silently performed:

- changing the GitHub repository from private to public;
- the first public npm publish;
- configuring npm's trusted publisher; and
- assigning the stable `latest` tag.

At that boundary, hand the user the exact revision, tarball, integrity, dependency/size census, CI
configuration, remaining external steps, and the first-prerelease command. Do not call the work
published or live before those observations exist.

## Non-goals

- no second runtime package, plugin system, bespoke component engine, or compatibility wrapper;
- no reimplementation of shadcn's registry transformer;
- no application router, auth, fetching, persistence, analytics, or desktop-shell policy in UI;
- no arbitrary component-count or coverage target;
- no speculative update merger, registry service, Storybook deployment, or public documentation
  platform before real consumers require it; and
- no visual novelty that weakens accessibility, performance, or predictable component behavior.

## Working rules

- Implement in isolated exact-main worktrees and preserve unrelated dirty checkouts.
- Change the owning public contract before implementation and derive exports/tests from it.
- Prefer adapting proven current component source over rewriting stable behavior.
- Preserve Base UI's open-part philosophy: host applications can render, style, class, replace, or
  omit every visual part through public Astrale wrappers or installed registry source.
- Keep patterns useful and varied, but do not manufacture dozens of cosmetic aliases.
- Measure package weight before setting budgets.
- Run focused checks after each slice and the complete qualification after the final cutover.
- Perform an adversarial architecture/API review and the required two-agent test review before
  completion.
