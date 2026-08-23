import { Section } from '@/components/layout/Section'
import { ClientLogo } from '@/components/ui/ClientLogo'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Marquee } from '@/components/ui/Marquee'
import { Reveal } from '@/components/ui/Reveal'
import { clientsIntro } from '@/content/home'
import { CLIENT_ROW_ALLOWANCE, MARQUEE_THRESHOLD, clients } from '@/content/clients'

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
        <div className="mt-16" data-thread-node data-thread-loop>
          <Marquee items={clients} />
        </div>
      ) : (
        <Reveal delay={60}>
          <ul
            className="mt-16 flex flex-wrap items-center justify-center gap-x-16 gap-y-12"
            data-thread-node
            data-thread-loop
          >
            {/*
              No hover treatment on the row. The colour transition that used to live on each
              item drove `currentColor` through the ink masks, and with the masks gone there
              is nothing for it to tint: these are their owners' artwork and we do not
              restyle it on hover. ADR 0027.
            */}
            {/*
              Each cell is the row's allowance tall and centres its mark in it, so the row's
              height is the allowance rather than whichever mark is scaled most. Marks differ
              in rendered height by design and their centre line still agrees.
            */}
            {clients.map((client) => (
              <li
                key={client.name}
                className="flex items-center"
                style={{ height: `${CLIENT_ROW_ALLOWANCE}px` }}
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
