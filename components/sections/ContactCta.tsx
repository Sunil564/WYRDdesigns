import { Section } from '@/components/layout/Section'
import { MagneticButton } from '@/components/ui/MagneticButton'
import { Reveal } from '@/components/ui/Reveal'
import { contactCta } from '@/content/home'
import { site } from '@/content/site'

/**
 * S8. Full viewport close. Brief 6.1 S8.
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
      rhythm={false}
      divider
      className="flex min-h-svh items-center py-32"
    >
      <div className="w-full">
        <Reveal>
          <h2 className="text-mega text-fg max-w-[24ch] font-black">{contactCta.headline}</h2>
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
            className="tap text-lead text-fg-muted hover:text-fg mt-6 transition-colors duration-[var(--dur-fast)]"
          >
            {site.email}
          </a>
        </Reveal>
      </div>
    </Section>
  )
}
