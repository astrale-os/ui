# Goal

Integrate the complete workbook-defined Shadcn Studio component catalog into Astrale UI's local
registry and playground, with every one of the 902 upstream IDs represented exactly once and every
variant retaining its authoritative JSX, DOM anatomy, classes, CSS, behavior, and dependencies.

The migration must:

- use the workbook's 58-family taxonomy without reclassifying by taste;
- map every item to `<component|pattern|block>/<family-slug>/<upstream-id>`;
- retain exact upstream registry JSON and source digests;
- restrict adaptation to import routing, path targets, required client directives, and other
  reversible operational transformations;
- prove mechanically that restoring adapted imports yields the formatted upstream source;
- replace or remove Astrale-authored patterns and blocks only after exact consumer and replacement
  disposition is recorded;
- auto-discover every admitted item and variant in the lazy playground catalog;
- install any admitted address into a clean project through one Astrale CLI command;
- keep `@astrale-os/ui` runtime exports, npm size, and public publication artifacts unchanged; and
- keep all licensed Studio source local and uncommitted.

## Non-goals

- Designing a new variant, visual treatment, class list, DOM structure, animation, or interaction.
- Normalizing different upstream variants into one Astrale abstraction.
- Moving all 902 variants into the npm runtime package.
- Hand-authoring fallback patterns or blocks when an intake fails.
- Treating a listed address, fetched JSON, compiling file, or screenshot as proof of complete
  behavior by itself.
- Importing Studio's separate `@ss-blocks`, `@ss-pages`, templates, or themes catalogs. The supplied
  workbook explicitly scopes this delivery to the 902 numbered `@ss-components` entries.

## Completion condition

Completion is closed-set equality at one exact revision and source snapshot:

```text
workbook IDs
= normalized inventory IDs
= fetched upstream registry items
= source-provenance records
= internal Astrale registry addresses
= canonical lazy catalog previews
= CLI-installable addresses
= qualified items
```

No missing, duplicate, vague family-level, inaccessible, hand-authored, or silently substituted
entry is accepted.
