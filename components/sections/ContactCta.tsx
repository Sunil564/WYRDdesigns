import { Section } from '@/components/layout/Section'
import { MagneticButton } from '@/components/ui/MagneticButton'
import { Reveal } from '@/components/ui/Reveal'
import { contactCta } from '@/content/home'
import { site } from '@/content/site'

/**
 * S8. Full viewport close. Brief 6.1 S8, inverted in Phase 4b section 4.
 *
 * The page closes on black, which is what gives the scroll an ending. The footer
 * continues the same dark ground, so the two read as one base.
 *
 * The four Thread strands reconverge into one line that terminates at the button,
 * which is drawn by `Thread`. This section provides the target: the button carries
 * `data-thread-converge`.
 */
export function ContactCta() {
  return (
    <Section
      id="contact-cta"
      label="Start a project"
      variant="inverse"
      rhythm={false}
      className="flex min-h-svh items-center py-32"
    >
      <div className="w-full">
        <Reveal>
          <h2 className="text-mega text-fg-inverse max-w-[24ch] font-black">
            {contactCta.headline}
          </h2>
        </Reveal>

        <Reveal delay={60}>
          {/* The negative margin cancels the magnet's catch area padding. */}
          <div className="mt-12 -ml-8">
            <MagneticButton href={contactCta.action.href}>{contactCta.action.label}</MagneticButton>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <a
            href={`mailto:${site.email}`}
            className="tap text-lead text-fg-inverse-muted hover:text-fg-inverse mt-6 transition-colors duration-[var(--dur-fast)]"
          >
            {site.email}
          </a>
        </Reveal>
      </div>
    </Section>
  )
}
