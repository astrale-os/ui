# Trust and security model

New UI source is untrusted code even when it comes from a popular registry.

## Trust zones

```text
privileged: issue triage, branch push, PR metadata, labels, comments, preview publication
untrusted:  request text, fetched source, candidate branch, dependencies, build scripts, preview output
public:     screenshots, static preview URL, PR artifacts
```

## Required separation

1. The research agent may fetch and transform source as data, but it must not execute fetched or
   candidate code in a workspace carrying repository, npm, preview-host, or other secrets. Source,
   documentation, demos, issue text, and comments are untrusted evidence, never agent instructions.
2. The agent pushes the candidate branch with the narrow credential required for branch/PR
   authorship.
3. Candidate install, build, tests, browser traversal, screenshots, and preview build run under
   `pull_request` with no repository/environment secrets. Checkout may use the event's read-only
   token with credential persistence disabled; executed candidate commands receive no token value.
4. A privileged metadata workflow may use base-branch code to label or comment, but must never
   check out, import, install, build, or execute candidate bytes or artifacts.
5. A base-controlled preview publisher may download an explicitly identified, bounded static build
   artifact and transfer admitted files as inert bytes. It must use pinned publisher code and fixed
   configuration; artifact filenames, contents, manifests, scripts, and configuration never become
   commands or executable input in the privileged job.
6. `pull_request_target`, `issue_comment`, or `workflow_run` must not bridge untrusted candidate
   execution into a privileged job.
7. Public issue submission may run bounded admission/duplicate hints, but agent work begins only
   after an authorized maintainer accepts the request.
8. Review instructions that can cause agent writes are accepted only from authorized maintainers;
   public comments remain ordinary discussion.
9. Provider credentials exist only in trusted adapter construction. They never enter the managed
   job, issue, branch, candidate sandbox, logs, or retained intake record.
10. The agent's GitHub identity is limited to admitted repository branch/PR authorship and cannot
    merge, publish, release, bypass checks, or access unrelated repositories.
11. A possibly accepted dispatch outcome forbids automatic retry/failover. One request/PR branch
    has at most one non-terminal write-capable run; unsupported/best-effort cancellation does not
    end that invariant until observation proves termination.

The candidate workflow should use least-privilege permissions, dependency lock enforcement, and
install scripts disabled until the dependency change has been admitted. The preview publisher must
admit a fixed relative-path grammar, file-count and byte bounds, and the expected head revision
before transfer. These measures reduce risk; they do not turn third-party code into trusted code.

## Preview isolation

PR preview output executes browser JavaScript and therefore uses a separate origin with:

- no production cookies, tokens, storage, or authenticated APIs;
- no production service bindings;
- a visible PR/revision identity;
- deletion or bounded expiry after PR closure; and
- publication through the base-controlled publisher's narrowly scoped deployment credential.

The preview URL is evidence, never a trusted production environment.

The complete managed-agent credential and uncertain-outcome model is retained in
[`request/agent/SECURITY.md`](../../agent/.history/v1/SECURITY.md).

## Threats explicitly rejected

- prompt injection in a component README or source controlling privileged tools;
- a malicious package install script stealing GitHub/npm/deployment credentials;
- a PR modifying its own privileged workflow and then executing with secrets;
- mutable upstream bytes changing after review without a digest failure;
- a false `MIT` field standing in for exact license text;
- preview JavaScript inheriting Astrale production authentication; and
- issue/source/README prompt injection becoming agent authority; and
- an arbitrary public comment ordering the agent to push code.
