# 0009. Content in code, not a CMS

Status: accepted
Date: 2026-08-19
Phase: 0b

## Context

Five routes. A short project list that will grow slowly. One operator. Service wording is fixed by `docs/brand.md` and should not be casually editable. The hard rule that matters most on this site is that no fact may be invented and every fact must be traceable to a source.

## Options considered

1. **A hosted CMS, Sanity or Contentful.** A monthly cost, a schema to maintain, and a second place where a fact can appear without provenance. For five routes and one editor the cost is real and the benefit is theoretical.
2. **A git backed CMS, Tina or Keystatic.** Cheaper, still a build layer and an admin surface to maintain for a handful of files.
3. **Typed TypeScript modules in `content/`, plus MDX for long form legal pages.** Chosen.

## Decision

Content lives in `content/` as typed modules. Long form legal copy lives in MDX. No CMS, no admin UI, no content API.

The invariant that makes this safe: **a field with no verified value is `null`, and the component checks for `null` and renders nothing.** No placeholder string ever stands in for a fact. `content/projects.ts` carries an explicit `placeholder: true` flag per entry, and an outcome block with no numbers does not render at all.

Every content module names its source in a comment. `content/services.ts` says the wording is verbatim from `docs/brand.md` section 3. `content/clients.ts` derives from `public/logos/manifest.json`, which is generated from the source folder by `scripts/process-assets.py`.

## Consequences

- Zero cost, zero latency, no network dependency, and every content change arrives as a git diff.
- A type error is the guard rail: adding a project without a required field fails the build.
- The operator edits TypeScript to add a project. That is a real cost, mitigated by keeping the shape flat and the files commented, and it buys the traceability the no invented facts rule needs.
- Migration path: content modules are plain data behind a typed interface, and sections never fetch or derive content, they receive it. Swapping to a CMS means rewriting the files in `content/` and nothing else.
