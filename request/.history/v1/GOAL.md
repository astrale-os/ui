# Goal

Make a missing UI need cheap to express and rigorous to fulfill:

```text
astrale ui request "accessible combobox with async creation"
```

The command should lead to one structured GitHub request. A replaceable AI agent researches the
current Astrale corpus, shadcn-compatible registries, and the wider public web; compares legitimate
sources; mechanically adapts the best fit; and opens a normal pull request containing one or more
coherent Astrale entries.

The pull request must make judgment reviewable and everything else deterministic:

- why the entry is needed and why the selected source fits;
- which alternatives were considered;
- exact immutable or content-addressed source evidence;
- exact license evidence and retained notices;
- every intentional deviation from upstream;
- generated registry, search, install, and catalog closure;
- an automatically refreshed direct playground preview; and
- canonical screenshots and qualification results.

## Success

A maintainer can request UI without knowing whether the result belongs in the runtime package or
under a component, pattern, block, or theme address. They review working source and visual evidence
in a PR, comment normally, see the same PR and preview update, and merge through the repository's
existing release path.

Adding the ten-thousandth entry must not require adding a source-registry-specific branch, a component
record to request code, or a manually maintained catalog row.

## Non-goals

- Replacing `astrale ui search` or `astrale ui add`.
- Searching only the shadcn directory.
- Automatically approving a license, a design, or a behavior choice.
- Generating original visual styling when no source matches.
- Executing untrusted candidate code with repository credentials or secrets.
- Adding an agent runtime, model SDK, database, queue, vector index, or preview vendor to the UI
  runtime package.
- Publishing from a request PR.
