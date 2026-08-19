# WYRD engineering standards

Applies to every client build and to the studio's own site.

---

## 1. Stack

| Layer | Choice |
|---|---|
| Framework | Next.js, App Router, TypeScript strict |
| Styling | Tailwind CSS, tokens defined in `tailwind.config.ts` |
| Motion | Framer Motion, used sparingly |
| Media | Cloudinary |
| Data | Supabase, only when the project needs it |
| Forms | Server action to Resend or a Supabase table |
| Hosting | Vercel |
| Analytics | Vercel Analytics plus Google Analytics 4 |

Free tiers throughout until a project justifies otherwise.

**No CMS on the temporary site.** Content lives in typed constant files. A CMS
is a Phase 2 decision, not a Phase 1 default.

---

## 2. Structure

```
/app
  layout.tsx
  page.tsx
  /work/page.tsx
  /contact/page.tsx
/components
  /sections      one file per page section
  /ui            button, link, rule, eyebrow, doodle
/content
  site.ts        every string on the site
  services.ts    the eight services
  meta.ts        SEO per route
/lib
  motion.ts      shared variants
/public
  /doodles       svg
  /logo          svg
```

**Content separation is a hard rule.** No hardcoded copy inside a component.
Every string imports from `/content`. This is what lets copy change without a
developer.

---

## 3. Code standards

- TypeScript strict, no `any`, no non-null assertion without a comment
- Components under 150 lines. Split when longer.
- Props typed with an explicit interface, never inline
- Server components by default. `"use client"` only where interaction demands it.
- Tailwind tokens only. No arbitrary values like `text-[17px]` outside the
  config. If a value is needed twice, it becomes a token.
- No unused dependencies. Audit before merge.
- Comments explain why, not what.

**Naming.** Files kebab-case. Components PascalCase. Constants SCREAMING_SNAKE.
Booleans read as questions: `isOpen`, `hasSubmitted`.

---

## 4. Performance budget

| Metric | Target |
|---|---|
| Lighthouse performance | 95+ mobile |
| LCP | under 2.0s on 4G |
| CLS | under 0.05 |
| Total JS shipped | under 150kb gzipped |
| Largest image | under 200kb |
| Web fonts | 2 families, 3 weights maximum, `font-display: swap` |

Images through `next/image`, WebP or AVIF, explicit width and height. Video
poster-first, never autoplay-loaded.

---

## 5. SEO baseline

Non-negotiable on every build. The studio sells SEO, so the studio's own site
passes first.

- Unique title and meta description per route
- Open Graph and Twitter card, 1200x630 image
- `Organization` and `LocalBusiness` JSON-LD with Bangalore address
- `sitemap.xml` and `robots.txt` generated
- One h1 per page, headings in order
- Canonical URLs
- Descriptive alt text
- Human-readable slugs, no query strings for content

**GEO note.** The studio sells "get named by AI answer engines". So the site
states facts in plain declarative sentences that a model can lift: what the
studio does, where it is, what it costs, who it serves. Vague brand poetry is
not extractable.

---

## 6. Workflow

1. Plan written to `/docs/plan-<feature>.md` with acceptance criteria
2. Plan approved before code
3. Branch per feature, conventional commits
4. Self-review against the eval checklist
5. Preview deploy shared for review
6. Merge

**Decisions get written down.** Any architectural choice goes in
`/docs/decisions.md` as a dated entry: context, options, choice, reason. Not
in chat.

---

## 7. Handoff

Every project ships with:

- `README.md`: setup, env vars, deploy
- `/docs/decisions.md`
- `.env.example` with every key named and described
- Client-facing note on how to change copy

---

## 8. Security and hygiene

- No secrets in the repo. `.env.local` gitignored, `.env.example` committed.
- Form endpoints rate-limited and honeypot-protected
- Dependencies from npm only, pinned major versions
- Contractor code assigned in writing to the company before merge
