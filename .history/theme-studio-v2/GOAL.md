# Theme Studio V2 goal

Make the playground theme drawer a complete, live editor for the portable Astrale theme document
without inventing component styling. Intake the color picker and starter themes from authoritative
registries, preserve their source character, expose every supported token, and keep the editor out
of the initial catalog graph.

## Constraints

- Component markup and classes come from the cited upstream registry source. Astrale adaptations
  are limited to owned import paths, formatting, registry metadata, and runtime integration.
- Starter colors, typography, radii, and shadows remain the values published by Shadcn Studio.
- A saved or exported document must be deterministic, migratable, and installable as consumer-owned
  source.
- The public playground must not load the editor or its color engine before the drawer opens.
- Exact upstream themes are not silently recolored to satisfy a different contrast policy.

## Acceptance

- An owned, installable `component/color-picker` exists with source-fidelity proof.
- The drawer edits brand, base, menu/sidebar, and chart colors in light and dark modes.
- Heading, body, and monospace typography are configurable.
- Radius, control sizing, shadows, and motion are configurable.
- Every committed starter theme is discovered automatically; no drawer list is hand-maintained.
- Undo, redo, randomize, save, reload, import, export, and one-command ownership remain functional.
- Public and internal production chunk boundaries, accessibility journeys, registry installation, and
  external package consumption are qualified.
