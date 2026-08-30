# UI request pipeline V2 ledger

| Evidence | State | Observation |
| --- | --- | --- |
| Contract and schema checks | pending | Run after formatting. |
| Luna Azure POC | passed | 2026-08-30: pinned Codex 0.151.0, configured `gpt-5.6-luna` / max, Azure Responses completed an exact workspace edit in 13.1 s. Child shell asserted Azure and GitHub credential names absent. Disposable fixture removed. |
| Live max-effort revision observation | failed SLO | Attempt 8 spent 12m39s in proposal (about 7m30s source discovery plus about 4m30s implementation) for one accessibility-only revision, breaching the non-cancelling 6m revision hard value. The preserved candidate remained intact. Default implementation effort is now medium and discovery is low; deterministic qualification and the sole Opus repair remain unchanged. |
| Fast gate baseline 1–5 | passed | Local warm request-tooling workload: 3,458 / 3,443 / 3,374 / 3,299 / 3,168 ms; median 3,374 ms, observed p95 3,458 ms. All within the 90 s target; every observation carried `cancellationRequested: false`. |
| Full four-shard qualification | pending | Run on the implementation PR exact head. |
| Qualification receipt | pending | Verify exact commit/tree/artifact digests. |
| Same-tree receipt rebind | pending | Verify against merged main SHA. |
| Trusted package publish | pending | Verify npm beta, provenance, and GitHub mirror. |
| Live canary | pending | CLI request → issue → Luna → PR preview → comment revision → acceptance → merge → cleanup → beta. |
