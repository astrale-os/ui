# Astrale UI variants

This collection contains 902 copy-owned Astrale components, patterns, and blocks. Each item has an
independent install address, source directory, compact family manifest, and catalog preview.

The source was initially adapted from MIT-licensed Shadcn Studio components. Astrale owns this
tracked copy and its maintenance lifecycle. Upstream acquisition records and refresh tooling are not
part of the repository.

The collection is distributed through the Astrale shadcn registry and is intentionally absent from
the `@astrale-os/ui` runtime package. Consumers install and own only the variants they select.

Every installed file lands in the consumer's `components/astrale/` folder. A variant's `support/`
directory mirrors that folder: `support/components/ui/calendar.tsx` installs at
`components/astrale/components/ui/calendar.tsx` and is imported as
`@/components/astrale/components/ui/calendar`. Dependencies are npm packages with version ranges.

The variants are built with the root registry in one `shadcn build`, so every built item names its
source files by the release-root paths the root index declares.
