# Third-party notices

Astrale UI incorporates and adapts source generated from
[shadcn/ui](https://github.com/shadcn-ui/ui), which is distributed under the MIT License.

The registry additionally vendors, with import-only adaptation, source from
[rutopio/shadcn-heatmap](https://github.com/rutopio/shadcn-heatmap) at revision
`6cdef1109364760536410d5325ac0d1af451196e`, which is distributed under the MIT License. The exact
upstream bytes and their license are preserved under
`tooling/upstream/providers/heatmap/`.

The observability log viewer block adapts source from
[Reckless98/logpilot](https://github.com/Reckless98/logpilot) at revision
`a0ac783c7dc6c579714f960731a2392043185dc6`, which is distributed under the MIT License, and
reproduces the follow-tail, clipboard, and stream error behavior of
[rivet-dev/actors](https://github.com/rivet-dev/actors) at revision
`b5cac54a50103c0739b618f519ce32778119c3b4`, which is distributed under the Apache License 2.0. The
exact upstream bytes and their licenses are preserved under
`tooling/upstream/providers/logpilot/` and `tooling/upstream/providers/rivet/`.

The scheduling schedule editor block adapts source from
[wardian-app/Wardian](https://github.com/wardian-app/Wardian) at revision
`0ae5b57a2229f7c98711d646b837be744748c6cc`, which is distributed under the MIT License, and
reproduces the timezone picker, recurrence validation, and keyboard semantics of
[ascentspark/react-calendar](https://github.com/ascentspark/react-calendar) at revision
`39041349e5ab0ac54202ffd17193b6860696a8b1`, which is distributed under the MIT License. The exact
upstream bytes and their licenses are preserved under
`tooling/upstream/providers/wardian/` and `tooling/upstream/providers/ascentspark/`.

The runtime package composes focused React libraries including Radix UI, cmdk, Input OTP,
react-resizable-panels, and Vaul. Their licenses and notices remain available in their distributed
packages. This file records copied or adapted source; ordinary dependency licenses are additionally
checked from the exact release lockfile during qualification.
