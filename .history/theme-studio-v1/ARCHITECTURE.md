# Architecture

## Owners

| Owner | Owns | Does not own |
| --- | --- | --- |
| `packages/ui` | runtime behavior, slots, semantic CSS contract, packaged presets | draft persistence or registry installation |
| `tooling/theme-document` | TypeScript admission and deterministic JSON-to-CSS projection | browser UX or project mutation |
| `schemas/theme.schema.json` | portable versioned JSON structure | contextual UI state |
| `registry/themes` | release-qualified starter documents and generated installable CSS | consumer edits after installation |
| `playground` | complete specimens, live preview, history, browser save, import/export | public runtime API or remote persistence |
| `astrale ui` | safe project discovery, local/registry theme installation, imports, rollback, lock evidence | theme semantics or authoring UX |

## Dependency direction

```text
theme schema
    ^
    |
theme-document admission + CSS projection
    ^                         ^
    |                         |
registry themes          playground workspace
    ^                         |
    |                         v
astrale ui installer     public @astrale-os/ui + registry specimens
```

The runtime package never imports the playground, registry, CLI, or theme-document tooling. The
playground imports runtime components only through public `@astrale-os/ui` entrypoints. Registry
compositions import only public package entrypoints.

## Representation flow

```text
starter or imported JSON
  -> exact admission
  -> editable ThemeDocument timeline
  -> live CSS projection
  -> browser save or JSON/CSS export
  -> registry item or local CSS path
  -> astrale ui add
  -> components/astrale/theme/<slug>.css + host CSS import + lock digest
```

The JSON document is the portable editable representation. CSS is a deterministic projection and
the consumer-owned installed representation. Browser local storage is only a convenience copy of
admitted JSON; it is never the source of registry or release truth.

## Compatibility

- Existing `@astrale-os/ui/theme.css` and packaged presets remain supported.
- Registry pattern/block addresses and lock records remain valid.
- Theme addresses add a third registry family: `theme/<slug>`.
- Local CSS installation uses `astrale ui add ./<slug>.css` and never invokes shadcn.
- A package release is required before released CLI discovery can see new registry themes.
