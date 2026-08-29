# Provenance and license contract

## Retained record

Each request PR adds one small, reviewable record at the proposed path:

```text
request/intakes/<github-issue>-<slug>.json
```

The record groups all outputs of one coherent request. It is retained supply-chain evidence, not
ephemeral agent scratch data and not a manually maintained component index.

Candidate structural shape:

```json
{
  "$schema": "../schemas/intake.schema.json",
  "request": "https://github.com/astrale-os/ui/issues/123",
  "outputs": ["pattern/combobox/async-create"],
  "sources": [
    {
      "name": "upstream async combobox",
      "sourceUrl": "https://raw.githubusercontent.com/owner/repo/<commit>/combobox.tsx",
      "sourceDigest": "sha256:<64 lowercase hex>",
      "retrievedAt": "2026-08-28",
      "license": {
        "spdx": "MIT",
        "url": "https://raw.githubusercontent.com/owner/repo/<commit>/LICENSE",
        "digest": "sha256:<64 lowercase hex>"
      },
      "ownedPaths": ["registry/patterns/combobox/async-create/async-create.tsx"],
      "adaptations": ["imports", "registry-metadata"]
    }
  ]
}
```

The eventual schema is the structural authority. It must require unique outputs and owned paths,
canonical repository-relative paths, HTTPS sources, SHA-256 digests, a source retrieval date, SPDX
identity, exact license evidence, and at least one source mapping for every imported owned path.
Semantic laws own the relationships a JSON Schema cannot prove.

## Laws

- **REQ-PROV-CLOSED**: every newly imported or materially refreshed owned source path maps to
  exactly one retained source entry; every declared owned path exists in the PR.
- **REQ-SOURCE-EXACT**: retained source bytes hash to `sourceDigest`; mutable registry URLs alone
  are insufficient evidence.
- **REQ-LICENSE-EXACT**: the license evidence covers the exact source revision or distribution
  from which bytes were taken. A directory listing or repository homepage is not license proof.
- **REQ-NOTICES-RETAINED**: copyright, attribution, and notice obligations required by the admitted
  license remain present in the repository or distributed output.
- **REQ-DELTA-DECLARED**: every owned/upstream delta is either an admitted mechanical category or a
  separately reviewed non-mechanical change.
- **REQ-OUTPUT-OWNED**: after adaptation, public metadata names Astrale as the distribution owner
  while retained provenance continues to identify upstream authorship.

## V1 admission policy

Automatic admission is intentionally narrower than legal possibility:

- exact MIT source with matching retained license evidence may pass the deterministic license gate;
- missing, ambiguous, generated-without-license, proprietary, source-available, or incompatible
  evidence blocks the PR;
- any other license requires an explicit policy extension and maintainer/legal approval rather than
  an agent guess;
- dependencies are reviewed through package manifests and lockfiles separately from copied-source
  licensing; and
- assets, fonts, icons, images, and copied documentation require their own covering evidence when
  the source license does not clearly include them.

The shadcn registry directory does not currently provide item-level license authority. Registry
metadata may locate source, but source revision and license evidence must be resolved independently.

## Adaptation categories

The eventual checker should admit only named, observable categories:

- `imports`: Astrale/public package import and alias rewrites;
- `file-targets`: paths and filenames required by the owned layout;
- `registry-metadata`: canonical address, dependencies, title, description, and install targets;
- `language-compatibility`: mechanical React/TypeScript syntax corrections with no DOM, class, or
  behavior change;
- `notices`: required copyright/license notice placement; and
- `reviewed-non-mechanical`: an exceptional, explicitly justified source/behavior change.

The category does not excuse the diff. Visual classes, CSS, tokens, DOM anatomy, interaction, and
copy never become mechanical merely because an agent labels them so.

Rejected candidate comparisons belong in the issue/PR rationale, not the retained supply-chain
record. This keeps permanent provenance small without erasing the review trail.
