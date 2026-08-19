import { Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { studioStrip } from '@/content/home'

/**
 * S7. Short, quiet, three facts. Brief 6.1 S7.
 *
 * Text reveal only. No photos of laptops, no stock imagery of people pointing at
 * whiteboards. The page needs a quiet section before the close, and a section that
 * says little is the right place to spend nothing.
 */
export function StudioStrip() {
  return (
    <Section id="studio-strip" label="The studio" divider>
      <div className="max-w-[46rem]" data-thread-node>
        {studioStrip.lines.map((line, index) => (
          <Reveal key={line} delay={index * 60}>
            <p className="text-title text-paper font-bold">{line}</p>
          </Reveal>
        ))}
        <Reveal delay={studioStrip.lines.length * 60}>
          <div className="mt-10">
            <Button href={studioStrip.link.href} variant="link">
              {studioStrip.link.label}
            </Button>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
