import { Container } from '@/components/layout/Container'
import { Grid } from '@/components/layout/Grid'
import { HeroFieldLayer } from '@/components/sections/HeroFieldLayer'
import { HeroIntro } from '@/components/sections/HeroIntro'
import { hero } from '@/content/home'

/**
 * S1. Full viewport, content vertically centred, left aligned from column 2 on
 * desktop. Brief 6.1 S1.
 *
 * Three layers, in the order the brief builds them:
 *
 * 1. The headline reveal, in `HeroIntro`.
 * 2. The particle field, in `HeroFieldLayer`, tiered per ADR 0015.
 * 3. The Thread origin, the hairline leaving the bottom centre of the hero, which
 *    is the visual handoff into S2. The Thread itself lands in Phase 4.
 *
 * This file is a server component. Only the two leaves below are client code, so
 * the hero's markup and copy are in the static HTML and the headline is the LCP
 * element.
 */
export function Hero() {
  return (
    <section
      id="hero"
      aria-label="Introduction"
      className="relative flex min-h-svh items-center overflow-hidden"
    >
      {/* Layer 2. Behind the content, never over it, never clickable. */}
      <HeroFieldLayer />

      <Container className="relative z-10 py-32">
        <Grid>
          {/* Twelve column grid, content starting at column 2. Brief 6.1 S1. */}
          <div className="col-span-4 md:col-span-11 md:col-start-2">
            <HeroIntro
              eyebrow={hero.eyebrow}
              lines={hero.headline}
              lead={hero.lead}
              primary={hero.actions.primary}
              secondary={hero.actions.secondary}
            />
          </div>
        </Grid>
      </Container>

      {/* Layer 3. The Thread leaves here, bottom centre, and picks up in S2. */}
      <div
        aria-hidden="true"
        data-thread-origin
        className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center"
      >
        <span className="to-line block h-24 w-px bg-gradient-to-b from-transparent" />
      </div>
    </section>
  )
}
