# Ratification gate

Status: **managed-execution slice implemented; broader Request V1 not ratified**.

The public draft command, GitHub form, durable attempt record, serialized trusted workflow,
provider-neutral dispatcher, and managed-agent Port were authorized and promoted into production
tooling. Their exact current contract lives in `request/.spec` and `request/agent/.spec`; this
historical folder is not runtime authority.

The broader source-research, provenance/license admission, deterministic adaptation checker,
candidate CI, visual evidence, live preview, and review-comment automation described by Request V1
remain candidate work. They must not be inferred from the managed-execution implementation.

## Remaining production evidence

- [ ] A GitHub Copilot task reaches one disposable PR with the configured production credential.
- [ ] A Cursor task reaches one disposable PR with an independently configured credential.
- [ ] The broader intake/provenance/preview acceptance items are implemented and qualified.
- [ ] Exact live revisions, environments, commands, outputs, and cleanup are recorded in the
      ledger.

Current live evidence is deliberately narrower: GitHub list/read/reconciliation succeeded, start
returned HTTP 412, and no Cursor credential was available. Fixture qualification is retained as
fixture qualification, not presented as live delivery.
