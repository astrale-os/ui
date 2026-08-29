# Theme Generator V1

This directory freezes the product contract for coherent, seeded theme generation inside the
Astrale UI playground.

- [PRD.md](./PRD.md) is the decision-complete product requirements document.
- `LOCK.json` is added only after the adversarial review and records the exact SHA-256 digest of the
  locked PRD.
- `qualification/corpus-v1.json` preserves the accepted engine V1 qualification.
- `qualification/corpus-v2.json` records the accepted 10,000-seed engine V2 distribution,
  on-color polarity, distance, fallback, retry, and runtime evidence produced by
  `pnpm theme-generator:qualify`.

The PRD is target design, not an implementation or conformance claim. Current ThemeDocument,
playground, registry, and CLI source remain implementation evidence until the target is delivered
and qualified.
