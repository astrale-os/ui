# Goal

Create one private Vite playground inside the UI repository that serves as:

1. the complete living catalog for every public runtime component;
2. an explorer for every registry pattern, block, and theme;
3. a live light/dark theme authoring workbench with undo, redo, starters, randomization, import,
   browser-local save, and deterministic export; and
4. the authoring front end for a portable theme artifact that a host project can install and own
   with one `astrale ui add` command.

The playground must consume Astrale UI public paths and registry source. It may own application
layout and browser persistence, but it must not introduce a second component library, runtime theme
provider, account service, remote database, AI backend, or package dependency in `@astrale-os/ui`.

V1 explicitly excludes cloud synchronization, collaboration, hosted arbitrary-user theme URLs,
and prompt-based generation. Portable JSON/CSS and browser-local drafts keep those additions
possible without inventing their security or lifecycle contracts now.
