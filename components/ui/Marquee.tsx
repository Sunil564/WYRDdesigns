'use client'

import { useEffect, useRef, useState } from 'react'
import { ClientLogo } from '@/components/ui/ClientLogo'
import type { Client } from '@/content/clients'

type MarqueeProps = {
  items: Client[]
  /** Seconds per full pass. Brief 6.1 S5 asks for roughly 40. */
  duration?: number
}

/**
 * Two rows moving in opposite directions, slow, paused on hover. Brief 6.1 S5.
 *
 * Built but currently unused: six logos were supplied and the threshold is eight,
 * so `Clients` renders the static row instead. It exists now so that adding the
 * seventh and eighth logo is a content change and not a build.
 *
 * CSS transform animation, not JavaScript, and not a carousel library. It stops
 * when out of view, pauses on hover, and does not run at all under reduced motion.
 */
export function Marquee({ items, duration = 40 }: MarqueeProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let inView = false
    const sync = () => setRunning(inView && !document.hidden)

    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? false
        sync()
      },
      { threshold: 0 },
    )
    observer.observe(host)

    const onVisibility = () => sync()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const half = Math.ceil(items.length / 2)
  const rows = [items.slice(0, half), items.slice(half)]

  return (
    <div ref={hostRef} className="marquee" data-running={running ? 'true' : 'false'}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="marquee-row">
          {/* Duplicated once so the translation can loop seamlessly. */}
          <div
            className="marquee-track"
            style={{
              animationDuration: `${duration}s`,
              animationDirection: rowIndex === 1 ? 'reverse' : 'normal',
            }}
          >
            {[...row, ...row].map((client, index) => (
              <span
                key={`${client.name}-${index}`}
                className="text-fg-muted hover:text-fg transition-colors duration-[var(--dur-base)]"
                // The duplicate half is decorative: the accessible name is on the
                // first copy only, so a screen reader hears each client once.
                aria-hidden={index >= row.length ? true : undefined}
              >
                <ClientLogo client={client} />
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
