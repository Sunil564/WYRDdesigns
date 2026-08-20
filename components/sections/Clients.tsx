import { Section } from '@/components/layout/Section'
import { ClientLogo } from '@/components/ui/ClientLogo'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Marquee } from '@/components/ui/Marquee'
import { Reveal } from '@/components/ui/Reveal'
import { clientsIntro } from '@/content/home'
import { MARQUEE_THRESHOLD, clients } from '@/content/clients'

/**
 * S5. The only section that uses real supplied assets. Brief 6.1 S5.
 *
 * Six logos were supplied, and the brief sets the marquee threshold at eight, so
 * this renders a single centred static row. A marquee with six logos looks like a
 * marquee with six logos. At eight or more the same data drives `Marquee` instead,
 * with no other change. See ADR 0004.
 *
 * At zero logos the section does not render at all, which is what happens if the
 * operator has not cleared them.
 */
export function Clients() {
  if (clients.length === 0) return null

  const useMarquee = clients.length >= MARQUEE_THRESHOLD

  return (
    <Section id="clients" label="Worked with" divider>
      <Reveal>
        <Eyebrow marker>{clientsIntro.eyebrow}</Eyebrow>
      </Reveal>

      {useMarquee ? (
        <div className="mt-16" data-thread-node>
          <Marquee items={clients} />
        </div>
      ) : (
        <Reveal delay={60}>
          <ul
            className="mt-16 flex flex-wrap items-center justify-center gap-x-16 gap-y-12"
            data-thread-node
          >
            {clients.map((client) => (
              <li
                key={client.name}
                className="text-fg-muted hover:text-fg transition-colors duration-[var(--dur-base)]"
              >
                <ClientLogo client={client} />
              </li>
            ))}
          </ul>
        </Reveal>
      )}
    </Section>
  )
}
