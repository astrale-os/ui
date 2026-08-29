# Theme Generator architecture

The generator is a pure authoring module. It consumes a current ThemeDocument, a canonical seed,
and branch locks; it returns one complete admitted ThemeDocument or a classified failure.

```text
playground workspace
  -> generation request
  -> seeded branch-independent grammar
  -> palette / typography / geometry derivation
  -> generated-theme admission
  -> one complete ThemeDocument V5 result
  -> existing CSS-variable preview and history
```

ThemeDocument owns portable provenance structure. The generator owns provenance meaning and
derivation. The playground owns browser entropy, ephemeral pre-generation locks, history, and
interaction feedback. Runtime UI, registry installation, and CLI source ownership remain outside
this module.

The module imports no React, browser storage, catalog, registry, or CLI code. Its work is bounded by
the fixed theme vocabulary and attempt limit; font metadata is indexed once independently of catalog
gallery size.
