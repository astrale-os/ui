# Astrale Theme Generator V1

| Field | Value |
| --- | --- |
| Status | LOCKED |
| Product | Astrale UI playground theme customizer |
| PRD version | 1.1.0 |
| Generator contract | `astrale-theme-generator` version 1 |
| Date | 2026-08-30 |
| Owners | UI theme tooling and playground |
| Review | Adversarial product, lifecycle, portability, performance, engine V2, and evidence pass complete |

## 1. Executive decision

Astrale Theme Generator V1 is a small probabilistic grammar for themes:

```text
seed
  -> sample a compact ThemeDNA
  -> derive correlated light and dark tokens
  -> solve required contrast and gamut constraints
  -> admit or reject the complete ThemeDocument
```

It randomizes decisions a designer would make, derives decisions a designer would expect to remain
related, and solves properties that must be correct.

V1 has:

- eleven compact design-intent values across palette, typography, and geometry;
- one versioned seeded random source with independent subsystem streams;
- deterministic expansion into the complete Astrale ThemeDocument;
- bounded validation and rejection sampling;
- two user actions: **Variation** and **New direction**;
- three subsystem locks: **Colors**, **Typography**, and **Geometry**; and
- no machine-learning model, optimizer, aesthetic score, prompt model, or remote service.

Global `coherence` is deliberately absent. Coherence is a consequence of shared parent decisions:
surfaces share palette DNA, typography shares compactness and pairing intent, and dimensions share
density and roundness.

## 2. Product boundary

### 2.1 Existing authority retained

The generator is an authoring layer above the current system:

| Existing owner | Retained responsibility |
| --- | --- |
| ThemeDocument admission and schema | Portable token shape, exact keys, migration, and CSS-safe values |
| Theme CSS projection | Deterministic ThemeDocument-to-CSS output |
| Playground workspace | Live preview, history, browser save, import, and export |
| `@astrale-os/ui` | Runtime token consumption and component behavior |
| Registry and CLI | Release/local theme installation and consumer ownership |

The generated ThemeDocument remains the render and export authority. Generator metadata explains
how a design was produced; it never overrides document tokens at render time.

### 2.2 New ownership

Theme Generator V1 owns:

- sampling and perturbing ThemeDNA;
- seeded incidental derivation;
- full token derivation for both modes;
- generated-theme admission rules;
- generation provenance and branch locks;
- offline distribution qualification; and
- the Variation/New direction customizer journey.

It does not own component classes, catalog layout, theme installation, fonts outside the curated UI
catalog, or low-level manual token editing.

## 3. Goals

1. Generate themes that feel related rather than independently randomized.
2. Make the same seed, engine version, and font-catalog version reproduce the same pristine output.
3. Produce light and dark modes as two projections of one intent, never as inversion or unrelated
   random themes.
4. Make accessibility and gamut validity properties of generation rather than post-generation
   repair buttons.
5. Let a user request a nearby refinement or a materially different direction with distinct,
   predictable actions.
6. Let a user preserve Colors, Typography, or Geometry without introducing arbitrary token locks.
7. Keep generation bounded, local, fast, and independent of catalog/gallery size.
8. Preserve all existing manual editing, undo/redo, save, import, export, icon, and install journeys.

## 4. Non-goals

V1 does not include:

- prompt-to-theme generation;
- learned font pairing, palette compatibility, or aesthetic scoring;
- optimization, genetic search, reinforcement learning, or a general constraint solver;
- a public `coherence`, `temperature`, or per-token noise control;
- arbitrary token locks or per-component style generation;
- font generation, arbitrary web-font URLs, or external CSS imports;
- user-authored probability distributions;
- cloud persistence, collaboration, accounts, or runtime analytics;
- component-specific radii, weights, spacing scales, or type scales;
- APCA as a second admission authority; or
- automatic changes to theme name, label, description, routes, or installed source.

## 5. Users and canonical intents

| User | Intent | Required journey |
| --- | --- | --- |
| Explorer | See a genuinely different coherent theme | Choose New direction |
| Refiner | Explore near the current generated idea | Choose Variation |
| Art director | Keep one subsystem while exploring the rest | Lock branch, then generate |
| Theme author | Fine-tune generated tokens manually | Generate, edit existing controls, save/export |
| Reproducer | Reopen or share the exact generated baseline | Export/import versioned generation metadata |
| Maintainer | Detect generator collapse or unsafe outputs | Run deterministic corpus qualification |

## 6. Customizer experience

### 6.1 Primary controls

The existing Randomize action is replaced by two equally visible actions:

- **Variation** — explores near the active generator recipe.
- **New direction** — samples a new high-level intent.

The controls use literal product language. They do not use decorative explanatory copy.

Three compact lock toggles sit with the actions:

- **Colors** maps to the palette branch.
- **Typography** maps to the typography branch.
- **Geometry** maps to geometry, density, effects, and motion.

The UI does not initially expose latent DNA sliders. Low-level theme controls remain the place for
precise manual editing.

### 6.2 First-use behavior

- New direction is always available.
- Variation is disabled when the active theme has no generator recipe. Its accessible description
  is: `Create a new direction before requesting a variation.`
- Variation is also disabled for safe-fallback provenance because the failed DNA is not a valid
  parent recipe.
- Locks may be enabled before the first generation. A pre-generation lock preserves the current
  concrete subsystem output and marks that branch as authored in the new provenance. This is the
  only bootstrap exception to recipe-based locking and avoids inventing an unreliable inverse-DNA
  algorithm.
- Before a recipe exists, lock choices are ephemeral workspace controls: they reset when another
  theme is loaded and are not exported as false generator provenance. The first successful New
  direction captures them in metadata.
- If all three branches are locked, both generation actions are disabled because the result would be
  a no-op.

### 6.3 Action semantics

Each successful action:

1. computes outside the React workspace state transition;
2. produces and admits one complete ThemeDocument;
3. commits exactly one history entry;
4. updates the existing deterministic four-quadrant theme icon;
5. previews through the existing CSS-variable path; and
6. does not write local storage, change the URL, rebuild search, or serialize export artifacts until
   the owning deferred path or explicit save/export action runs.

A failed action leaves the theme, recipe, history, save state, and preview unchanged and returns one
short actionable error.

### 6.4 Manual edits after generation

Manual edits remain first-class and never require regeneration.

- Editing a color marks the palette branch `edited`.
- Editing body, heading, or terminal typography marks the typography branch `edited`.
- Editing radius, control sizing, shadows, or motion marks the geometry branch `edited`.
- Editing name, label, or description does not dirty a generator branch.
- Variation or New direction replaces an edited branch when it is unlocked.
- Locking an edited branch preserves its exact current ThemeDocument tokens. It does not attempt to
  infer new DNA from those tokens.
- The UI shows a compact `Edited` state beside affected locks so replacement is never surprising.
- After generator metadata exists, each lock toggle is one history entry and is persisted/exported
  with that theme. Undoing a generation restores the lock state that was active immediately before
  the action; a second Undo may then revert the lock toggle itself.

### 6.5 Identity, save, and export

Generation never changes `name`, `label`, or `description`. This preserves the distinction between
design exploration and document identity. Existing save semantics continue to key browser themes by
slug; a user who wants multiple saved directions gives each one a distinct slug.

JSON export includes generation provenance. CSS export remains only the deterministic consumer-owned
token projection and contains no generator metadata. CLI installation behavior therefore remains
unchanged.

## 7. Theme DNA

```ts
type PaletteRelation = 'tonal' | 'analogous' | 'complementary' | 'split'

type ThemeDNA = {
  palette: {
    hue: number          // [0, 360)
    relation: PaletteRelation
    colorfulness: number // [0, 1]
    contrast: number     // [0, 1]
    tint: number         // [0, 1]
    warmth: number       // [-1, 1]
  }

  typography: {
    contrast: number     // [0, 1], similar -> contrasting role pairing
    compactness: number  // [0, 1], relaxed -> compact rhythm
  }

  geometry: {
    density: number      // [0, 1], spacious -> dense
    roundness: number    // [0, 1], square -> round
    elevation: number    // [0, 1], flat -> elevated
  }
}
```

There is no `coherence` field. There is no font-family numeric coordinate. Family choice is discrete
and metadata-driven.

## 8. Generation provenance

ThemeDocument V5 adds one optional `generation` member. V4 documents migrate to V5 with no
generation metadata. Manually authored themes remain fully valid.

```ts
type GeneratorBranch = 'palette' | 'typography' | 'geometry'

type GeneratorMetadata = {
  kind: 'astrale.theme-generation'
  version: 1
  engineVersion: 2
  fontCatalogVersion: 1
  seed: string
  derivationSeed: string
  dna: ThemeDNA
  locks: GeneratorBranch[]
  editedBranches: GeneratorBranch[]
  lineage:
    | { kind: 'new-direction' }
    | { kind: 'variation'; parentSeed: string }
    | { kind: 'fallback'; failedAttempts: 12 }
}
```

Structural details may be normalized during specification authoring, but the following semantics are
locked:

1. pristine metadata plus its versioned catalogs reproduces the complete token document;
2. document tokens, not metadata, remain render authority;
3. an edited branch is explicitly represented rather than falsely claimed reproducible;
4. every seed is bounded, portable text with a canonical serialized form;
5. unknown generator versions reject the imported document atomically until an explicit migrator
   exists; import never silently strips or partially trusts provenance; and
6. generation metadata is covered by the existing ThemeDocument size and CSS-injection bounds.

The implementation specification must choose the exact V5 portable shape and mechanically check
TypeScript/schema equivalence. It may split `dna` into typed branch objects, but may not weaken these
semantics.

## 9. Deterministic generation pipeline

```text
action + current document + current metadata + locks
  -> canonical root seed
  -> sample or perturb ThemeDNA
  -> derive keyed palette / typography / geometry streams
  -> derive complete candidate tokens
  -> copy exact locked branch outputs
  -> gamut map
  -> solve required foreground contrast
  -> admit complete candidate
  -> one workspace commit
```

### 9.1 Random source

V1 owns one explicitly versioned deterministic PRNG and the helpers:

```ts
uniform(min, max)
normal(mean, standardDeviation)
beta(alpha, beta)
weightedChoice(values)
```

The exact PRNG and string-to-seed hash are fixed in the implementation specification before corpus
snapshots are accepted. Native `Math.random()` is forbidden. Production actions obtain a fresh
128-bit seed from browser cryptographic randomness and serialize it as 32 lowercase hexadecimal
characters; tests and replay inject that same canonical form. Sampling consumes fixed keyed streams
for `palette`, `typography`, and `geometry`, so adding a typography decision cannot change palette
output for the same version and seed.

Determinism is guaranteed for the tuple:

```text
engineVersion + fontCatalogVersion + seed + derivationSeed + DNA
```

A future engine or catalog change requires a new version. Exported ThemeDocument tokens remain
stable even when old generation engines are no longer available.

### 9.2 Intent versus incidental randomness

- ThemeDNA records meaningful design intent.
- `derivationSeed` records harmless variation within that intent.
- Each subsystem derives its own child seed from `derivationSeed` and stable branch name.
- Validation retries advance only the failed subsystem attempt index; they do not silently resample
  the user's high-level intent.

## 10. Sampling priors

V1 starts with transparent priors, not claims of scientifically optimal taste.

```ts
palette.hue          = uniform(0, 360)
palette.relation     = weightedChoice({ tonal: 1, analogous: 1, complementary: 1, split: 1 })
palette.colorfulness = beta(2.0, 3.0)
palette.contrast     = beta(3.5, 2.0)
palette.tint         = beta(2.0, 5.0)
palette.warmth       = clamp(normal(0, 0.35), -1, 1)

typography.contrast    = beta(2.2, 2.2)
typography.compactness = beta(2.5, 2.5)

geometry.density   = beta(2.5, 2.5)
geometry.roundness = beta(2.0, 2.5)
geometry.elevation = beta(1.7, 3.5)
```

Priors may change only with an engine-version change and updated distribution evidence. They are
not scattered through UI components.

## 11. Palette derivation

### 11.1 Hue relationships

One anchor hue drives the palette. Relationship choice is randomized; individual semantic hues are
not independently random.

| Relation | Primary | Accent family |
| --- | --- | --- |
| tonal | anchor | anchor with bounded ±15° jitter |
| analogous | anchor | signed 25°–55° rotation |
| complementary | anchor | normal distribution around 180° ±12° |
| split | anchor | choose −150° or +150°, then ±10° jitter |

Every hue is normalized into `[0, 360)`. Warmth affects very-low-chroma surface tint and may nudge
decorative hues within a bounded range; it never destroys the selected relationship.

### 11.2 Light and dark are sibling projections

Light and dark modes share DNA and semantic hues but own separate lightness/chroma projections.

They are not inversions. They are not independently sampled. A derivation must be able to change a
mode-specific range without changing the underlying relationship.

Initial surface envelopes are:

| Mode | Root background L | Surface chroma ceiling |
| --- | ---: | ---: |
| Light | 0.965–0.995 | 0.025 × tint |
| Dark | 0.10–0.18 | 0.035 × tint |

Cards, popovers, muted surfaces, borders, inputs, and sidebars derive by bounded lightness/chroma
deltas from the mode root. They are never sampled independently.

### 11.3 Complete ThemeDocument token expansion

All 32 color tokens in both modes must be produced. V1 groups them as follows:

| Derived family | ThemeDocument tokens | Rule |
| --- | --- | --- |
| Root surface | `background`, `foreground` | Mode surface spine plus solved text foreground |
| Elevated surfaces | `card`, `cardForeground`, `popover`, `popoverForeground` | Small ordered deltas from root; foreground solved per actual surface |
| Quiet surfaces | `secondary`, `secondaryForeground`, `muted`, `mutedForeground` | Low-chroma spine variants; no independent hue |
| Accent surface | `accent`, `accentForeground` | Low-chroma accent-hue surface plus solved foreground |
| Brand action | `primary`, `primaryForeground`, `ring` | Primary hue/chroma; foreground solved; ring related but separately contrast-checked |
| Destructive action | `destructive`, `destructiveForeground` | Stable red/orange semantic family with only bounded warmth adjustment |
| Structure | `border`, `input` | Surface-spine deltas with non-text contrast bounds |
| Charts | `chart1`…`chart5` | Deterministic sequence from primary/accent relationships and bounded rotations |
| Sidebar | all eight `sidebar*` tokens | A sibling projection of the same surface and action families, never a second palette |

The destructive hue must remain semantically recognizable. Chart colors must be distinguishable from
their canvas and may not all collapse to the anchor hue. Sidebar pairs must satisfy the same text and
focus requirements as their root equivalents.

### 11.4 Gamut mapping

Derivation operates in OKLCH and emits sRGB-displayable OKLCH values. Out-of-gamut candidates are
mapped by holding lightness and hue stable and reducing chroma until they enter sRGB. Clipping RGB
channels independently is forbidden because it can distort hue relationships.

Contrast is calculated on the gamut-mapped color actually represented by the emitted token.

## 12. Contrast solving and generated-theme admission

Palette contrast determines desired contrast, not a random foreground lightness:

```ts
desiredTextContrast = lerp(5.0, 8.5, dna.palette.contrast)
```

Ordinary surface text may solve foreground lightness to the nearest valid ratio above the hard
floor. Filled semantic controls use a separate on-color policy: choose white or black using contrast
calculated from the rendered sRGB colors. White is preferred when it clears the floor with safety
margin; black is selected for fills too light to support white. Mid-lightness threshold gray is not
an admitted on-color foreground. Dark-mode primary derivation spans both sides of that polarity
boundary so the generator produces white text often without making it the only valid treatment.

This on-color correction changes deterministic palette derivation and therefore advances
`engineVersion` from 1 to 2. Generator contract version and font-catalog version remain 1; exported
engine V1 documents remain token-stable artifacts but their provenance is unsupported by the V2
runtime until an explicit migrator exists.

Hard V1 admission checks are:

1. ThemeDocument schema and TypeScript admission pass.
2. Every ordinary text/background semantic pair is at least 4.5:1 using emitted rendered colors.
3. Every filled semantic foreground is white or black in addition to meeting 4.5:1.
4. Large-display-only pairs may use 3:1 only when the runtime contract proves they are never used for
   ordinary text; V1 otherwise treats them as ordinary text.
5. Focus indicators and required interactive boundaries are at least 3:1 against adjacent surfaces.
6. Surface ordering and minimum deltas remain coherent in both modes.
7. Every emitted color is in sRGB gamut after mapping.
8. Primary, accent, destructive, and chart colors remain within their semantic hue/chroma bounds.
9. Chart colors meet the root canvas contrast floor and a defined minimum perceptual separation from
   immediate neighbors; charts never rely on color alone in runtime components.
10. Font IDs exist, stacks are available from the curated catalog, and selected weights are supported.
11. Typography, geometry, density, shadows, and motion remain within the current ThemeDocument and
    runtime-supported ranges.
12. Locked concrete branches also satisfy generation admission; an invalid locked branch fails the
    action instead of being silently changed.

The implementation specification must single-source the exact semantic pair matrix, surface delta,
chart separation, and range constants. WCAG 2.2 AA is the V1 hard contrast authority; a future APCA
experiment may report diagnostics but may not create a second admission result.

## 13. Typography derivation

### 13.1 Curated font catalog

Generation consumes one centrally owned font catalog. Every entry has:

```ts
type FontMetadata = {
  id: string
  label: string
  stack: string
  kind: 'sans' | 'serif' | 'mono'
  personality: 'neutral' | 'humanist' | 'editorial' | 'book' | 'display' | 'technical'
  display: boolean
  roles: ('body' | 'heading' | 'terminal')[]
  weights: number[]
}
```

V1 begins from the real Astrale catalog, including Avenir Next, System UI, Iowan Old Style,
Charter, and SFMono Regular stacks. Both body and heading draw from the same role-eligible catalog;
classification never dictates role. Terminal draws only from eligible mono entries.

The catalog may contain system stacks or centrally shipped/loaded Astrale fonts. It may not expose a
font name that resolves only through an arbitrary external import. Selection is by stable ID and
supported weight, never by display label or catalog iteration order.

### 13.2 Pairing

Pairing is asymmetric because heading and body have different roles. V1 uses weighted metadata rules,
not a pairwise compatibility matrix.

For a sans body, initial heading-family priors are:

```text
sans or same-family heading  0.50
serif heading                0.35
display heading              0.15
```

`typography.contrast` moves probability from same-family/same-kind choices toward contrasting
kind/personality choices. Body-serif cases use the same principle with role-appropriate weights.
No eligible family may be chosen for a role it does not support.

### 13.3 Rhythm and weight

```ts
bodyLeading     = lerp(1.68, 1.42, compactness)
headingLeading  = lerp(1.28, 1.06, compactness)
bodyTracking    = lerp(0.01, -0.005, compactness)
headingTracking = lerp(-0.005, -0.02, compactness)
```

Metadata applies small bounded corrections:

- display headings tighten tracking by up to `0.015em`;
- serif body faces may add up to `0.04` line height;
- supported body weight is selected near 400–500;
- supported heading weight is selected near 500–700 according to contrast; and
- every value is clamped and serialized to the ThemeDocument V5 typography bounds.

V1 does not generate font sizes, type scales, per-element weights, or arbitrary font-feature settings.

## 14. Geometry, density, effects, and motion

Three values derive the full existing non-color/non-typography surface:

| DNA | Derived ThemeDocument surface |
| --- | --- |
| density | `control`, `controlSmall`, `controlLarge`, and conservative motion timing |
| roundness | `radius` and `panelRadius` with a stable panel/control relationship |
| elevation | `controlShadow` and `panelShadow` from one bounded shadow model |

The relationships are monotonic:

- greater density never produces taller controls;
- greater roundness never produces a smaller radius;
- panel radius is never smaller than the base radius;
- greater elevation never produces a visually weaker panel shadow; and
- denser interfaces may be faster, but motion remains within the existing accessible runtime range.

V1 does not add a spacing scale because the runtime ThemeDocument does not currently expose or
consume one. A future spacing axis requires a separate runtime-token decision; generation may not
invent inert exported knobs.

## 15. Variation, New direction, and locks

### 15.1 Variation

Variation requires generator metadata.

```ts
nextDNA = perturb(currentDNA, {
  continuousSigma: 0.08,
  keepCategoricalProbability: 0.85,
})
```

- Continuous axes use bounded truncated perturbation.
- Categorical palette relation remains unchanged with probability 0.85; otherwise another relation
  is selected.
- Derivation seeds change strongly even when DNA changes little.
- Locked branches preserve exact current output, DNA, and branch derivation seed.
- The result records lineage to the parent seed.

The statistical acceptance criterion, not a single token threshold, defines “nearby”: across the
qualification corpus, variations must be materially closer to their parent DNA and token output than
new directions are.

The implementation specification must define the stable branch-normalized DNA and token-distance
metrics before the corpus gate is written. Those metrics are qualification tools, not aesthetic
scores and not runtime generation inputs.

### 15.2 New direction

- Every unlocked DNA branch is resampled from its V1 priors.
- Every unlocked derivation branch receives a new keyed seed.
- Locked branches remain exact.
- No unlocked family, hue, or geometry value is copied merely to make the result look familiar.

### 15.3 Lock law

A lock freezes one semantic branch, not individual tokens.

```text
palette lock     -> all light/dark appearance tokens
typography lock  -> body, heading, and terminal typography
geometry lock    -> geometry, density, effects, and motion
```

For a pristine generated branch, the lock preserves its DNA, branch seed, and exact derived output.
For an edited or pre-generation branch, the lock preserves exact current tokens and records that the
branch is authored rather than falsely reproducible.

## 16. Bounded failure behavior

Generation is finite:

```ts
for (let attempt = 0; attempt < 12; attempt++) {
  const candidate = deriveFromSameIntent(dna, derivationSeed, attempt)
  const result = admitGeneratedTheme(candidate)
  if (result.ok) return candidate
}
return fallback
```

Retries vary incidental derivation for the failed unlocked subsystem. They do not tweak arbitrary
tokens after the fact and do not change locked branches.

After twelve unsuccessful attempts:

- no invalid candidate is committed;
- the safe fallback is the admitted Observatory ThemeDocument;
- provenance records `fallback` and the failed-attempt count;
- existing identity fields and compatible locked branches are preserved only if the final result
  still passes admission; otherwise the action fails unchanged; and
- development/qualification output records diagnostic reason counts without sending telemetry.

Fallback is a successful but visibly classified outcome: it commits one admitted safe theme and
shows `A safe fallback was used; try a new direction.` It never masquerades as a normal generated
direction and never enables Variation. A locked-branch conflict is instead a failed outcome with no
commit and asks the user to unlock or repair that branch.

The target rejection rate across the fixed 10,000-seed corpus is at most 5%, and safe fallback usage
is at most 0.5%. A higher rate blocks release and requires distribution/derivation correction rather
than a larger attempt count.

## 17. Architecture and performance

### 17.1 Dependency direction

```text
font catalog + generator v1 constants
              |
seed -> DNA -> branch derivation -> generated-theme admission
                                      |
                                      v
                              ThemeDocument V5
                                      |
                        existing workspace + CSS preview
```

The pure generator must not import React, browser storage, catalog previews, the CLI, or registry
installation code. Playground UI may call the pure generator and commit its result.

### 17.2 Scale independence

- Font metadata is indexed into stable role/kind buckets once in O(font catalog size).
- Each generation samples buckets in O(1); it never scans the component/pattern/block catalog.
- Token derivation and admission are bounded by fixed ThemeDocument vocabulary and 12 attempts.
- Opening generation controls does not serialize the theme, rebuild CSS, update storage/history, or
  rerender catalog previews.
- One successful action causes one workspace commit and one preview projection.
- Adding registry items or catalog previews cannot increase generation work.

The initial measured budget is p95 ≤ 8 ms for pure generation and admission on the repository CI
reference workload, excluding React rendering. If evidence cannot meet the budget, implementation may
move pure generation off the main thread without changing semantics; V1 does not preemptively require
a Worker.

## 18. Accessibility, privacy, and security

- Generated ordinary text pairs meet WCAG 2.2 AA contrast; thresholds are never rounded upward.
- Generation controls are keyboard operable, expose pressed/locked/disabled state, and preserve focus.
- Color is not the only indication of locks, errors, edited branches, or action identity.
- Reduced-motion preferences continue to govern preview transitions; generation itself adds no
  animation requirement.
- Seeds, DNA, generation attempts, and saved themes remain local unless the user explicitly exports
  a document.
- V1 sends no telemetry and loads no remote font, model, palette, or scoring service.
- Imported generation metadata is untrusted bounded JSON and must pass the same exact admission as
  the rest of ThemeDocument.
- Generator metadata is data only; it cannot contain CSS, URLs, executable expressions, or arbitrary
  extension objects.

## 19. Offline tuning and collapse detection

The repository owns a deterministic corpus command over seeds `0` through `9,999`. It records simple
histograms, not an aesthetic score:

- palette relationship;
- 12 anchor-hue bins;
- primary chroma and surface tint quantiles;
- text contrast quantiles;
- heading/body family and kind pairing;
- body/heading rhythm and weight;
- density, radius, control height, elevation, and motion;
- retries, rejection reasons, and fallbacks; and
- Variation-versus-New-direction distance distributions.

Initial anti-collapse gates are:

1. every relationship occurs in 20%–30% of the uniform-prior corpus;
2. every hue bin occurs in 5%–12% of the corpus;
3. every eligible font family appears in each supported role often enough to prove reachability;
4. no single heading/body pairing class exceeds 65%;
5. continuous axes populate every quartile;
6. fallback and rejection limits in section 16 hold; and
7. median Variation distance is lower than the tenth percentile of New-direction distance for the
   same unlocked-branch configuration.

Observed histogram artifacts are evidence, not portable ThemeDocument fields. Tuning a prior requires
an engine-version change, new corpus output, and visual review of a stratified sample.

## 20. Acceptance criteria

### 20.1 Pure generator

- [ ] The same version tuple and seed produce byte-identical pristine ThemeDocuments across repeated
      runs.
- [ ] Different subsystem implementation order does not change output.
- [ ] All 10,000 canonical seeds produce admitted output or the explicitly bounded fallback.
- [ ] The corpus meets rejection, fallback, distribution, and performance gates.
- [ ] Light and dark outputs share the same DNA relationships and both pass all pair checks.
- [ ] Every one of the 64 mode/token positions is derived and no stale current-theme token leaks into
      an unlocked branch.
- [ ] Gamut mapping preserves hue/lightness within specified tolerances while reducing chroma.
- [ ] Contrast solving proves the exact emitted colors, including primary, destructive, sidebar, and
      focus pairs.
- [ ] Unsupported font IDs, roles, and weights reject.

### 20.2 Variation and locks

- [ ] Variation is unavailable without a recipe and becomes available after New direction.
- [ ] Variation is statistically nearer than New direction under the locked corpus metric.
- [ ] Each individual lock preserves its exact complete branch across both actions.
- [ ] Every pair and all-three-lock combination is covered; all-three is an explicit no-op state.
- [ ] Edited locked branches remain exact and are never falsely marked pristine.
- [ ] Invalid locked branches fail without mutation.

### 20.3 ThemeDocument and persistence

- [ ] ThemeDocument V5 schema and TypeScript admission mechanically agree.
- [ ] V4 migrates deterministically to V5 without fabricated provenance.
- [ ] Pristine generation metadata replays exactly for its version tuple.
- [ ] Manual edits mark the correct branch and identity edits mark none.
- [ ] Browser save/reload and JSON export/import preserve metadata, locks, lineage, and edited state.
- [ ] CSS output remains unchanged by metadata and remains installable by the existing CLI path.
- [ ] Unknown, oversized, malformed, or injection-bearing metadata rejects safely.

### 20.4 Playground interaction

- [ ] Randomize is removed and replaced by Variation and New direction.
- [ ] One action produces one Undo step; Undo and Redo restore both document and generator metadata.
- [ ] Generation performs no implicit save, URL, route, search-index, or gallery update.
- [ ] Selects, color drags, typography sliders, and manual fields remain responsive after generation.
- [ ] Theme icon and both light/dark previews update from the admitted result.
- [ ] Desktop and phone layouts expose actions, locks, edited states, and failures without overflow.
- [ ] Keyboard, focus, reduced-motion, and automated accessibility journeys remain green.

### 20.5 Distribution and consumers

- [ ] Generated JSON and CSS pass registry/theme contract checks.
- [ ] A generated local theme installs through `astrale ui add ./<theme>.css`, builds, and passes
      `astrale ui doctor`.
- [ ] The generator adds no runtime dependency to `@astrale-os/ui` and no UI dependency to the CLI.
- [ ] Production public chunks do not eagerly load the generator before the customizer opens.

## 21. Implementation sequence

Implementation is not authorized by this PRD alone. Once begun, the dependency-ordered slices are:

1. Define Theme Generator V1 `.spec` API, semantic laws, limits, font catalog, and canonical examples.
2. Define ThemeDocument V5 optional provenance and V4 migration with schema equivalence.
3. Implement seeded PRNG and fixed-stream sampling.
4. Implement palette derivation, sRGB gamut mapping, contrast solver, and full token admission.
5. Implement typography and geometry derivation.
6. Implement Variation/New direction, branch locks, lineage, and edited-branch semantics.
7. Integrate one-commit workspace actions and the minimal customizer controls.
8. Add corpus/histogram qualification, browser journeys, production chunk proof, and external local
   theme installation.
9. Perform independent test-quality and adversarial product reviews before claiming completion.

No slice may weaken existing ThemeDocument admission or bypass the current preview performance
architecture to make generation tests pass.

## 22. Explicit deferrals

| Deferred surface | Reason |
| --- | --- |
| Latent DNA sliders | Low-level editor already exists; first prove the two-action grammar |
| Public temperature/craziness | Coherence should emerge from hierarchy; tune priors first |
| Arbitrary token locks | They break branch derivation and multiply state semantics |
| Inverse DNA from arbitrary themes | Unreliable and unnecessary because bootstrap locks preserve concrete output |
| Learned aesthetic score | Requires data, subjective authority, and optimization not needed for V1 |
| ML font pairing | Curated catalog is small and role metadata is sufficient |
| Compatibility matrix per font pair | Weighted kind/personality rules scale better and remain explainable |
| Spacing scale | No current runtime token consumes it |
| APCA admission | Avoid dual accessibility authorities in V1 |
| Runtime telemetry | Offline deterministic corpus is sufficient and preserves privacy |

## 23. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Themes cluster around safe blue/purple sans designs | Uniform hue/relation priors, corpus histograms, reachability gates |
| Contrast repair washes out brand colors | Solve foreground first, adjust action lightness within bounds, then reject rather than over-repair |
| Out-of-gamut colors shift hue | Constant-lightness/hue OKLCH chroma reduction |
| Font labels become fake choices | Stable catalog IDs, actual stacks, supported roles/weights, no remote imports |
| Locks surprise users after manual edits | Exact branch preservation plus visible Edited state |
| Metadata claims false reproducibility | Explicit edited branches; ThemeDocument tokens remain authority |
| Adding fonts changes old outputs | Versioned font catalog and stable IDs |
| Generator work regresses catalog interaction | Pure bounded module, lazy customizer load, one commit, catalog-size-independent gate |
| Validation rejects too often | Fixed 5% rejection and 0.5% fallback ceilings; tune priors instead of raising attempts |
| Research-inspired rules become pseudo-science | Treat priors as transparent product choices and qualify distributions/constraints, not taste |

## 24. Research basis

The product takes narrow concepts from research without importing their full machinery:

- Tan, Echevarria, and Gingold represent palette relationships with compact axes over perceptual
  color wheels and demonstrate a simple approach without numerical optimization:
  [paper](https://arxiv.org/abs/1804.01225).
- CSS Color 4 defines Oklab/OKLCH and describes perceptual interpolation and gamut mapping through
  constant-lightness, constant-hue chroma reduction:
  [specification](https://www.w3.org/TR/css-color-4/).
- WCAG 2.2 provides the V1 minimum text-contrast authority of 4.5:1 for ordinary text and 3:1 for
  large text, with threshold values not rounded:
  [guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum).
- DesignScape distinguishes refinement suggestions from brainstorming suggestions, directly
  motivating Variation versus New direction:
  [project and paper](https://www.dgp.toronto.edu/~donovan/design/index.html).
- Scout supports exploration through high-level design concepts translated into lower-level
  constraints, motivating a small user-facing grammar rather than token-level randomization:
  [paper](https://arxiv.org/abs/2001.05424).
- Visual Font Pairing identifies heading/body pairing as asymmetric and not reducible to simple
  similarity, motivating role-aware weighted rules while explicitly not adopting its ML system:
  [paper](https://arxiv.org/abs/1811.08015).
- Color Compatibility From Large Datasets is retained as a warning that hue templates are not a
  complete aesthetic theory; V1 therefore does not claim or learn a universal compatibility score:
  [project and paper](https://www.dgp.toronto.edu/~donovan/color/).

## 25. Locked decisions

The final lock covers these product decisions:

1. compact ThemeDNA plus deterministic derivation and admission, not independent token randomization;
2. no explicit coherence axis;
3. two distinct actions named Variation and New direction;
4. three semantic branch locks and no arbitrary token locks;
5. shared-DNA sibling light/dark projections;
6. OKLCH derivation, sRGB gamut mapping, and WCAG 2.2 AA hard admission;
7. discrete metadata-driven font pairing with no ML;
8. density/roundness/elevation as the complete geometry parents for current runtime tokens;
9. versioned provenance in optional ThemeDocument metadata;
10. explicit edited-branch semantics after manual changes;
11. twelve bounded derivation attempts and safe fallback behavior;
12. local-only operation, one workspace commit, and catalog-size-independent work;
13. deterministic 10,000-seed corpus and distribution-collapse gates; and
14. no implementation claim until mapped conformance evidence passes.

## 26. Lock and amendment policy

After the adversarial review, this document is marked `LOCKED`, its exact SHA-256 is recorded in
`LOCK.json`, and implementation may rely on it as the V1 target.

A semantic change requires one of:

- an explicitly reviewed amendment that increments the PRD version, records rationale, reruns the
  omission review, and writes a new digest; or
- a successor PRD for a new generator version.

Formatting-only changes also change the digest and therefore require an explicit re-lock. Source may
not silently redefine a locked decision because an implementation shortcut is convenient.
