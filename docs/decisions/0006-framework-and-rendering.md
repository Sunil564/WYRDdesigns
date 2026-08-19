# 0006. Framework and rendering strategy

Status: accepted
Date: 2026-08-19
Phase: 0b

## Context

The brief specifies Next.js 15, App Router, TypeScript strict. Next.js 16 is the current major release. The site is five routes of content that changes only when the operator edits a file, plus one server action for the contact form.

## Options considered

1. **Next.js 16.** Current, and Cache Components would matter on a site with dynamic data. This site has none: every route is static. The gain is a version number, and the cost is that the brief specifies 15 and every acceptance criterion was written against it.
2. **A static site generator, Astro or similar.** Lighter for a content site. It loses Server Actions for the form, which the brief specifies, and it substitutes the entire framework layer.
3. **Next.js 15, App Router, static by default.** Chosen.

## Decision

Next.js 15.5.23, App Router, React 19.2.8, TypeScript 5.9.3 strict, with `noUncheckedIndexedAccess`, `noUnusedLocals`, and `noUnusedParameters` on top of the default strict set.

Rendering: static by default. Every route prerenders at build time. No route opts into runtime rendering. The contact form is a Server Action, which does not make its route dynamic.

Client boundaries sit as low in the tree as they can. A section is a server component that renders a small client leaf for its motion.

## Consequences

- Five static documents on a CDN, which is the right shape for the performance budget.
- Upgrading to 16 is a one ADR decision later. Nothing here depends on a 15 only API.
- React 19 is required by `@react-three/fiber` 9, which Phase 2b installs. Satisfied.
- TypeScript 7 exists and stays out of this build, because `typescript-eslint` 8 and `eslint-config-next` 15 are validated against TypeScript 5, and a lint toolchain that half works is worse than a slightly older compiler.
