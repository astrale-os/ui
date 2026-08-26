# Open-part and host customization contract

Base UI is Astrale UI's internal behavioral substrate because its accessible, unstyled, open-part
model matches the product we want to own. Astrale wrappers may add semantic defaults; they must not
turn that model into sealed components.

## Runtime laws

1. Consumers import only `@astrale-os/ui/*`. Base UI package paths are implementation details.
2. Every emitted visual node has a stable `data-slot`. Behavior state remains visible through
   semantic ARIA and data attributes.
3. Every public leaf accepts `className`, `style`, native attributes, refs where supported, and
   the Base-compatible `render` composition prop when its internal behavioral part supports it.
4. A convenience composite may emit portal/backdrop/positioner/popup/arrow/indicator/close parts,
   but it must either export those parts for manual assembly or expose typed props for each internal
   part. A hard-coded inaccessible internal node is a defect.
5. Astrale classes are defaults merged before host classes. Host classes and inline styles are
   forwarded so they can override defaults without `!important` escalation.
6. Public props use Astrale names and semantics. Consumers never need a Base UI import to customize
   or compose an Astrale component.
7. Presets use semantic tokens and slots; they do not rewrite component source or behavior.

## Pattern and block laws

Registry source is consumer-owned after installation, but that is the final escape hatch, not the
primary customization API.

- Every item exposes `className` and `style` for its root.
- Every emitted host element has a stable `data-slot`, so a root class or scoped stylesheet can
  override every internal class without depending on generated DOM position or private objects.
- Repeated or structural parts expose typed `classNames` and/or `slotProps` when a caller needs a
  per-instance native prop or render override that scoped slot CSS cannot express.
- Consumer content uses `ReactNode` or render callbacks where the host must replace markup.
- State and actions are controlled or injected; style maps never hide behavior objects.
- Defaults are plain exported values or functions when reuse is useful. No frozen module-private
  configuration is the only way to alter layout, labels, timing, or presentation.
- Spreading a host prop object cannot be overridden later by Astrale defaults.

## Qualification

Representative runtime, pattern, and block tests must prove:

- host classes and inline styles reach the intended root and internal parts;
- `render` can replace the underlying element without losing behavior or data slots;
- manual part assembly remains possible for overlays and composite widgets;
- preset changes do not change DOM semantics; and
- installed source typechecks without importing Base UI directly from application code.
