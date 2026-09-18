import type { Engagement } from '@/content/engagements'

type EngagementRowProps = {
  engagement: Engagement
  /**
   * Heading level for the client name, as a number.
   *
   * It cannot be baked in. On the homepage the list sits under an S4 `h2`, so the name is
   * an `h3`. On `/work` the list sits directly under the page `h1`, so an `h3` skips a
   * level and Lighthouse fails `heading-order`. The caller knows what it nested this
   * inside; the row does not. Same contract the card had.
   */
  headingLevel?: 2 | 3
}

/**
 * One current engagement. Used by `/work` and by homepage S4, so it is one component.
 *
 * **A row, not a card.** The card this replaces was a bordered frame built around a 4:5
 * image, and emptying it leaves a box whose only remaining job is to look like a picture
 * that failed to load. Four short text fields want a rule above them and nothing else.
 *
 * Nothing here links anywhere. There are no case studies behind these engagements yet, so
 * a link would either 404 or go somewhere that says less than this row already does. The
 * hover affordance and the VIEW cursor went with it: an element that lights up under the
 * pointer and then does nothing is worse than one that never offered.
 *
 * No image, no year, no outcome. Those are the fields that do not exist yet, and a row
 * that rendered empty slots for them would be advertising what is missing.
 */
export function EngagementRow({ engagement, headingLevel = 3 }: EngagementRowProps) {
  const Heading = `h${headingLevel}` as const

  return (
    <article
      data-engagement
      className="border-border grid gap-x-[var(--gutter)] gap-y-4 border-t pt-8 md:grid-cols-12"
    >
      <div className="md:col-span-4">
        <Heading className="text-title text-fg font-bold">{engagement.name}</Heading>
        <p className="label text-fg-muted mt-2">{engagement.sector}</p>
      </div>

      <div className="md:col-span-8">
        <p className="measure text-body text-fg">{engagement.line}</p>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
          {engagement.services.map((service) => (
            <li key={service} className="label text-fg-muted">
              {service}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
