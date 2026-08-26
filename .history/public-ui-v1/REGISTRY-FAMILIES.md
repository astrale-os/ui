# Registry families

## Category test

Use the lowest category that truthfully owns the surface:

| Category  | Distributed as           | Owns                                                                               | Must not own                                                     |
| --------- | ------------------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| component | runtime or registry source | one upstream-faithful reusable component and its declared dependencies              | application I/O or a multi-component product journey              |
| pattern   | registry source          | one reusable interaction or presentation family with multiple types and variants   | a full application region or hidden external effects             |
| block     | registry source          | an off-the-shelf page or feature region composed from components and pattern logic | authentication, routing, fetching, persistence, or domain policy |
| preset    | package CSS subpath      | coherent visual character across every component and registry preview              | component behavior or application theme persistence              |

A pattern family is not a component filename. Every family owns a registry manifest, a documented
public contract shared by its variants, and several independently installable items.

## Physical and address model

```text
registry/patterns/chart/
├── registry.json
├── line/
│   ├── basic/
│   │   ├── chart-line-basic.tsx
│   │   └── chart-line-basic.test.tsx
│   └── interactive/
│       ├── chart-line-interactive.tsx
│       └── use-chart-range.ts
├── bar/
│   ├── basic/
│   └── stacked/
└── pie/
    ├── basic/
    └── donut/
```

The physical path expresses family, type, and variant. The install address mirrors it:

```text
pattern/chart/line/basic
pattern/chart/line/interactive
pattern/chart/bar/stacked
pattern/chart/pie/donut
```

The root `registry.json` explicitly includes each family `registry.json`. Family manifests own item
metadata and file paths relative to themselves. Duplicate item names, parent traversal, remote
source file paths, and implicit globs fail validation.

## Initial pattern ledger

The listed variants are the minimum V1 family breadth, not an exhaustive product promise. A family
does not qualify if it contains only one showcase renamed as a family.

| Family            | Minimum independently installable V1 items                                                                                                            | Shared headless or controlled contract                                                         | Item-local optional dependencies                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `calendar`        | single/basic; single/controlled; range/basic; range/multi-month; localized                                                                            | selected values, visible month, disabled dates, locale, callbacks                              | date engine and calendar presentation library                                                            |
| `carousel`        | horizontal/basic; horizontal/responsive; vertical/basic; controlled; autoplay                                                                         | active slide, orientation, navigation actions, item count                                      | carousel engine and autoplay plugin only where used                                                      |
| `chart`           | line/basic; line/multiple; line/interactive; area/basic; bar/basic; bar/stacked; pie/basic; pie/donut; radial/basic; radar/basic; composed; sparkline | typed series, semantic palette, accessible description, formatter callbacks, interaction state | chart engine only in installed chart items                                                               |
| `combobox`        | single/basic; single/creatable; multiple; grouped; remote-controlled                                                                                  | query, selected values, open state, option identity, loading/empty state                       | no fetch client; virtualization only in the relevant item                                                |
| `command-palette` | dialog/basic; grouped; nested; controlled                                                                                                             | open state, query, actions, groups, shortcuts                                                  | none beyond package command/dialog owners                                                                |
| `data-table`      | basic; sort-filter-page; selectable; expandable; server-controlled; virtualized                                                                       | columns, selection, sorting, filters, pagination, row identity                                 | table or virtualization engine per item; no data client                                                  |
| `date-picker`     | single; range; presets; date-time; localized                                                                                                          | value, open state, disabled dates, timezone/locale presentation callbacks                      | calendar/date engine only in installed item                                                              |
| `form`            | native; react-hook-form; tanstack-form; formisch; wizard-controlled                                                                                   | field state, errors, submit state, reset, validation adapter                                   | exactly one selected form/validation adapter per item                                                    |
| `message`         | bubble/basic; thread; attachment/list; marker/citations; scroller/follow-tail; streaming-controlled                                                   | message identity, role, parts, status, follow-tail state, attachment actions                   | no AI SDK, upload client, storage, markdown engine, or transport unless the item explicitly declares one |
| `questionnaire`   | single-page; multi-step; validated; branching-controlled                                                                                              | questions, answers, validation results, current step, branch decisions, submit callback        | validation adapter only in the relevant item                                                             |
| `sidebar`         | application; inset; floating; icon-collapsible; mobile-controlled                                                                                     | open/collapsed/mobile state, breakpoint input, shortcut adapter, navigation data               | no router, cookie, local storage, media hook, or navigation effect hidden inside the pattern             |
| `toast`           | basic-provider; actions; promise; controlled-queue                                                                                                    | enqueue/dismiss API, provider placement, action callbacks, duration                            | toast engine only in installed items                                                                     |
| `typography`      | prose; article; documentation; dense-data                                                                                                             | semantic element map and theme typography tokens                                               | markdown renderer only when an item explicitly owns it                                                   |

Every row must gain an exact source path, registry item address, owner test, catalog story, and
visual/accessibility evidence before the family is `qualified`.

## Initial block ledger

Blocks are intentionally broader than patterns but remain application-neutral:

| Family              | Minimum V1 compositions                                          | Injected responsibilities                                                |
| ------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `application-shell` | sidebar/header; compact command navigation; responsive workspace | routes, current location, navigation actions, identity menu actions      |
| `authentication`    | sign-in/card; sign-up/card; recovery; verification               | submit handlers, identity provider choices, validation and server errors |
| `communication`     | inbox; conversation; composer                                    | loading, messages, attachments, send/retry actions, pagination           |
| `dashboard`         | overview; analytics; operations                                  | metrics, ranges, drill-down actions, refresh state                       |
| `data-management`   | collection browser; details panel; create/edit form              | rows, query state, pagination, mutations, permissions                    |
| `onboarding`        | welcome; multi-step setup; empty-to-first-value                  | progress, completion, validation, navigation actions                     |
| `settings`          | profile; appearance; team; notifications                         | values, validation, save state, permission and mutation handlers         |

A block may ship `controller.ts` or a hook when reusable state transitions are real. The view accepts
the controller result or explicit controlled props. It never calls Astrale, `fetch`, a router,
storage, an auth client, or analytics by itself.

## Registry item laws

Every pattern and block item must satisfy all of the following:

1. The item installs from the public repository at one resolved commit SHA.
2. The manifest validates against the current shadcn registry schema.
3. All files are beneath the declaring family; targets cannot escape the consumer-owned UI tree.
4. Production imports use only `@astrale-os/ui` public paths, item-local files, and declared npm
   dependencies.
5. The item has no repository-private, catalog, test, SDK, Shell, Admin, or GUI import.
6. Dependencies are item-specific. Installing a line chart cannot install form, calendar, carousel,
   toast, sidebar, or block dependencies.
7. The item supports controlled state for every application-significant value.
8. Headless logic has behavior tests independent from visual screenshots.
9. Every interactive view passes keyboard, focus, labeling, disabled, and error-state evidence.
10. Every item renders under each supported preset, light and dark mode, RTL where meaningful, and
    mobile and desktop viewports where responsive.
11. A dry run lists exact files, dependencies, and CSS changes and performs no write.
12. Reinstalling the same item and digest is idempotent.
13. Locally changed installed files are detected. Normal add never overwrites them.
14. Installed source contains no telemetry, network endpoint, secret, or environment assumption.
15. A block's included pattern logic is read from the same repository SHA; V1 never follows an
    unpinned same-repository dependency to a moving branch.

## Catalog obligations

The catalog is executable product documentation, not registry authority. For every component,
pattern item, block item, and preset it shows:

- canonical usage through public imports;
- default, empty, loading, error, disabled, destructive, overflow, and long-content states where
  meaningful;
- controlled and uncontrolled behavior when both are supported;
- keyboard and focus instructions;
- light, dark, RTL, reduced-motion, high-contrast, mobile, and desktop previews;
- exact dependencies and installed files for registry items; and
- the upstream provenance and current Astrale ownership status.

Catalog stories compile against packed `@astrale-os/ui` and built registry items. They may not
silently consume workspace source paths that a public consumer cannot resolve.

## Upstream refresh protocol

An upstream refresh PR must:

1. update the exact shadcn CLI version intentionally;
2. regenerate a query-only inventory of official docs and registry items;
3. fail if an official surface is unledgered;
4. obtain candidate files with `shadcn add --dry-run`, `--view`, or `--diff`, never raw ad hoc copy;
5. record old and new upstream digests;
6. classify additions, removals, dependency changes, API changes, and visual changes;
7. preserve Astrale API, tokens, stable slots, and local fixes unless a reviewed breaking change is
   approved;
8. rerun the complete mapped component or registry evidence; and
9. update the provenance record only after the Astrale-owned result qualifies.

"Latest" therefore means the exact upstream version proven by the current refresh PR, never a
moving `latest` dependency in source or CI.
