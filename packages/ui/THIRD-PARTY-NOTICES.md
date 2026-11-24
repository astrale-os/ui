# Third-party notices

Astrale UI incorporates and adapts source generated from
[shadcn/ui](https://github.com/shadcn-ui/ui), which is distributed under the MIT License.

Astrale UI vendors the pinned shadcn Tailwind support stylesheet, the `tw-animate-css` stylesheet
and Tailwind CSS Preflight, all distributed under the MIT License. Exact component source retains upstream runtime dependencies;
the current cohort is MIT-licensed except `class-variance-authority`, which is Apache-2.0-licensed,
and `lucide-react`, which is ISC-licensed.

The `astrale` preset ships the variable latin and latin-ext subsets of
[Hanken Grotesk](https://github.com/marcologous/hanken-grotesk), Copyright 2021 The Hanken Grotesk
Project Authors, distributed under the SIL Open Font License 1.1, unmodified, with its license under
`dist/fonts/HankenGrotesk-OFL.txt`. `@astrale-os/ui/fonts/hanken-grotesk-inline` carries the same
latin file, base64-encoded.

Focused runtime dependencies retain their own package licenses. The release qualification checks
the exact lockfile and packed dependency graph for license and notice drift.
