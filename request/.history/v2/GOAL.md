# UI request pipeline V2 goal

Reduce the request-to-preview and revision loop by roughly one order of magnitude without weakening
source fidelity, credential isolation, exact-revision review, or recoverability.

The system uses a fast Luna worker, one bounded Opus repair, cumulative checkpoints, diff-derived
fast gates, a maintainer-owned full acceptance gate, four browser shards, and reusable qualification
receipts. Latency thresholds report violations but never kill work.
