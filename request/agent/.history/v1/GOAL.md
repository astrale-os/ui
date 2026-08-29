# Goal

Allow the Astrale UI request pipeline to change managed coding-agent providers without changing:

- `astrale ui request`;
- GitHub request and review semantics;
- the agent's required work product;
- provenance, registry, search, catalog, and preview checks; or
- merge and release policy.

The adapter accepts one complete repository job, starts one remote run, observes its normalized
state, and returns its pull request. A review iteration is another complete job targeting the
existing PR. This makes the repository and PR—not a vendor conversation—the portable continuity
boundary.

## Success

Two materially different managed-agent APIs pass the same conformance suite. The request
orchestrator can select either through composition, persist only an opaque run reference, and
render the same status/failure/PR outcome. Switching providers requires configuration and adapter
qualification, not a CLI, request-schema, or product migration.

## Non-goals

- A universal LLM, chat, prompt, model, tool, MCP, environment, or billing API.
- Hiding meaningful capability differences.
- Provider failover after a start outcome becomes uncertain.
- Concurrent agents writing the same request or PR branch.
- Provider-managed merge, release, npm publication, preview publication, or license approval.
- Sending arbitrary secrets or Astrale credentials into managed sandboxes.
- Supporting non-GitHub repositories in V1.
