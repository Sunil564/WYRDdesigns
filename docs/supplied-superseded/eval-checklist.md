# WYRD eval checklist

Run before anything is shown to a client or published. Any FAIL blocks ship.
Report each line explicitly. Do not report a pass without checking.

---

## A. Brand

- [ ] Zero long em dashes anywhere in the codebase or copy
- [ ] WYRD is all caps in every instance
- [ ] Name explainer appears exactly once, and does not use "but"
- [ ] No banned phrase from `brand.md` section 5 appears
- [ ] No invented client name, metric, testimonial, or award
- [ ] Service wording matches `brand.md` verbatim
- [ ] Copy reads as short declarative sentences, not agency filler

## B. Design

- [ ] Every colour is a token. No stray hex in components.
- [ ] No pure white `#FFF` and no pure black `#000`
- [ ] Sage used only for labels, links, small accents, one button fill
- [ ] Two type families maximum, three weights maximum
- [ ] Every h2 has emphasis on one phrase, not the whole line
- [ ] Body measure under 68 characters
- [ ] At least one doodle present, no more than two per screen
- [ ] Doodles are single-stroke, uncoloured, off-centre
- [ ] Section rhythm consistent, 120px desktop
- [ ] Border radius 4px maximum, no shadows beyond hover lift

## C. Motion

- [ ] One orchestrated load moment, not scattered effects
- [ ] No parallax, no scroll-jacking, no cursor follower
- [ ] Scroll reveals fire once, not on every pass
- [ ] `prefers-reduced-motion` disables all animation, verified
- [ ] No layout shift caused by any animation

## D. Engineering

- [ ] TypeScript strict passes, zero `any`
- [ ] No hardcoded copy inside a component, all from `/content`
- [ ] No component over 150 lines
- [ ] `"use client"` present only where interaction requires it
- [ ] No unused dependency
- [ ] No secret committed, `.env.example` present and complete
- [ ] Build passes clean, zero warnings

## E. Performance

- [ ] Lighthouse mobile performance 95+
- [ ] LCP under 2.0s
- [ ] CLS under 0.05
- [ ] JS under 150kb gzipped
- [ ] Every image through `next/image` with explicit dimensions
- [ ] No image over 200kb

## F. SEO

- [ ] Unique title and description
- [ ] OG and Twitter tags with 1200x630 image
- [ ] `LocalBusiness` JSON-LD, Bangalore, correct phone and email
- [ ] `sitemap.xml` and `robots.txt` present
- [ ] Exactly one h1, headings in order
- [ ] Alt text on all content images, empty alt on doodles
- [ ] Facts stated in plain extractable sentences for AI answer engines

## G. Accessibility

- [ ] Contrast 4.5:1 body, 3:1 large, sage verified at its actual size
- [ ] Visible keyboard focus on every interactive element
- [ ] Full keyboard path through nav, form, and footer
- [ ] Form inputs have real labels, not placeholder-only
- [ ] Errors announced, not colour-only
- [ ] Touch targets 44px minimum
- [ ] No horizontal scroll at 320px

## H. Function

- [ ] Contact form delivers to hello@wyrddesigns.in, tested live
- [ ] Honeypot blocks a bot submission
- [ ] WhatsApp link opens with the correct number
- [ ] Instagram link correct
- [ ] Both phone numbers are click-to-call on mobile
- [ ] Every anchor link scrolls to the right section
- [ ] 404 route exists and is on-brand

## I. Final

- [ ] Viewed at 320, 768, 1024, 1440, 1920
- [ ] Viewed on a real phone, not just devtools
- [ ] Read aloud once. Anything that sounds like a template gets rewritten.
- [ ] Chanel test: one element removed that the page did not need
