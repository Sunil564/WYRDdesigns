# 0001. Source ingestion and precedence

Status: accepted
Date: 2026-08-19
Phase: 0

## Context

Section 0.1 of the build brief names `M:\WYRD Projects\WYRD Website\Codebase2` as the authoritative source of brand truth and says `brand.md` is expected there. `CLAUDE.md` says the same folder holds the operator's `brand.md`, the WYRD logo and wordmark, and client logos.

The folder holds the logo, six client logos, and a copy of the brief, `CLAUDE.md`, and `run-phases.sh`. It does not hold `brand.md`.

`brand.md` exists in two sibling folders, `files\brand.md` and `Codebase\brand.md`, byte identical to each other. Those same sibling folders also hold `design-system.md`, `site-spec.md`, `engineering.md`, and `eval-checklist.md`, which describe a different site: a light paper and sage one page temporary build with hand drawn doodles, Poppins and Inter, no WebGL. `site-spec.md` describes itself as "Not the final site. Built to be replaced."

The brief says documents named `design-system.md` or `engineering.md` **in the source folder** override sections 4, 5, and 7. These are not in the source folder.

## Options considered

1. **Stop and ask the operator.** Correct if the resolution were ambiguous. It is not: the brief and `CLAUDE.md` both name `brand.md` explicitly and describe its content accurately, and the file exists, byte identical, in two places one directory up.
2. **Treat every document in the sibling folders as supplied and authoritative.** This would override sections 4, 5, and 7 of the brief with a light palette, a doodle system, and a single page anchor scroll site. It would discard the entire current brief. The brief in `Codebase2` is dated after those documents and is the instruction actually being executed.
3. **Treat `brand.md` as the supplied authoritative brand document, and the other sibling documents as superseded history.** Chosen.

## Decision

`docs/brand.md` is the supplied brand document, copied byte identical from `files\brand.md`. It is authoritative on every brand matter: identity, positioning, service wording, audience, voice, and stated facts. It is never edited. Additions go in a separate file.

The build brief is authoritative on architecture, structure, motion, and process.

`design-system.md`, `site-spec.md`, `engineering.md`, `eval-checklist.md`, and `00-PROJECT-SETUP.md` are committed unmodified to `docs/supplied-superseded/` as history. They do not govern this build. They are not in the source folder, and the visual system they describe is the earlier trial that section 1 of the brief instructs the build to discard.

The reconciled design system and motion system are written to `docs/design-system.md` and `docs/motion.md`, with the origin of each value recorded.

## Consequences

- One brand document, one architecture document, no ambiguity about which wins on what.
- The dark canvas, Satoshi and Instrument Serif, and the WebGL layer stand as specified in the brief.
- The doodle rule from the superseded `design-system.md` is not implemented. If the operator wants it back it needs a new ADR, because a hand drawn blush stroke and this palette are not compatible.
- The operator should be told that `brand.md` is not in `Codebase2` and should be placed there, so the next session finds it where both instruction files say it is.
