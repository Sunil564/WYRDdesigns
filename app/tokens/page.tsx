import type { Metadata } from 'next'
import { Container } from '@/components/layout/Container'
import { Grid } from '@/components/layout/Grid'
import { Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Field, SelectField, TextAreaField } from '@/components/ui/Field'
import { Placeholder } from '@/components/ui/Placeholder'
import { Reveal } from '@/components/ui/Reveal'

/**
 * Token and primitive showcase. Internal, not linked from anywhere, noindex.
 * It exists so a token change can be looked at rather than reasoned about, which
 * is the Phase 1 acceptance criterion.
 */
export const metadata: Metadata = {
  title: 'Tokens',
  robots: { index: false, follow: false },
}

const colours = [
  { token: '--color-bg', className: 'bg-bg', use: 'page canvas', contrast: 'ground' },
  {
    token: '--color-bg-raised',
    className: 'bg-bg-raised',
    use: 'cards, raised blocks',
    contrast: '1.06 on bg',
  },
  {
    token: '--color-bg-sunken',
    className: 'bg-bg-sunken',
    use: 'hover, inset blocks',
    contrast: '1.17 on bg',
  },
  {
    token: '--color-border',
    className: 'bg-border',
    use: 'hairlines, the Thread at rest',
    contrast: '1.33 on bg',
  },
  { token: '--color-fg', className: 'bg-fg', use: 'primary text', contrast: '19.78 on bg' },
  {
    token: '--color-fg-muted',
    className: 'bg-fg-muted',
    use: 'secondary text, meta',
    contrast: '6.42 on bg',
  },
  {
    token: '--color-accent',
    className: 'bg-accent',
    use: 'large text and graphics only',
    contrast: '3.24 on bg',
  },
  {
    token: '--color-accent-strong',
    className: 'bg-accent-strong',
    use: 'any accent text',
    contrast: '5.08 on bg',
  },
]

const inverseColours = [
  {
    token: '--color-bg-inverse',
    className: 'bg-bg-inverse',
    use: 'dark block ground',
    contrast: 'ground',
  },
  {
    token: '--color-fg-inverse',
    className: 'bg-fg-inverse',
    use: 'text on a dark block',
    contrast: '18.31 on inverse',
  },
  {
    token: '--color-fg-inverse-muted',
    className: 'bg-fg-inverse-muted',
    use: 'secondary text on a dark block',
    contrast: '7.08 on inverse',
  },
  {
    token: '--color-border-inverse',
    className: 'bg-border-inverse',
    use: 'hairline on a dark block',
    contrast: '1.28 on inverse',
  },
  {
    token: '--color-accent-on-inverse',
    className: 'bg-accent-on-inverse',
    use: 'accent inside a dark block',
    contrast: '6.10 on inverse',
  },
]

const type = [
  { token: '--text-mega', className: 'text-mega font-black', sample: 'Mega, hero only' },
  {
    token: '--text-display',
    className: 'text-display font-bold',
    sample: 'Display, section headline',
  },
  {
    token: '--text-title',
    className: 'text-title font-bold',
    sample: 'Title, card and subsection',
  },
  { token: '--text-lead', className: 'text-lead', sample: 'Lead, intro paragraph' },
  { token: '--text-body', className: 'text-body', sample: 'Body, running copy' },
  { token: '--text-label', className: 'label', sample: 'Label, eyebrow and meta' },
]

const space = [
  { value: '4px', utility: '1', className: 'h-1' },
  { value: '8px', utility: '2', className: 'h-2' },
  { value: '12px', utility: '3', className: 'h-3' },
  { value: '16px', utility: '4', className: 'h-4' },
  { value: '24px', utility: '6', className: 'h-6' },
  { value: '32px', utility: '8', className: 'h-8' },
  { value: '48px', utility: '12', className: 'h-12' },
  { value: '64px', utility: '16', className: 'h-16' },
  { value: '96px', utility: '24', className: 'h-24' },
  { value: '128px', utility: '32', className: 'h-32' },
  { value: '192px', utility: '48', className: 'h-48' },
  { value: '256px', utility: '64', className: 'h-64' },
]

const motion = [
  { token: '--ease-out', value: 'cubic-bezier(0.16, 1, 0.3, 1)', use: 'entrances' },
  { token: '--ease-in-out', value: 'cubic-bezier(0.65, 0, 0.35, 1)', use: 'position changes' },
  { token: '--dur-fast', value: '200ms', use: 'hover, micro' },
  { token: '--dur-base', value: '500ms', use: 'most entrances' },
  { token: '--dur-slow', value: '900ms', use: 'large reveals, hero' },
  { token: '--stagger-sibling', value: '60ms', use: 'between siblings' },
  { token: '--stagger-char', value: '18ms', use: 'between characters' },
]

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Section divider>
      <Eyebrow marker>{title}</Eyebrow>
      <div className="mt-12">{children}</div>
    </Section>
  )
}

export default function TokensPage() {
  return (
    <main className="relative z-10">
      <Container as="header" className="pt-32 pb-16">
        <p className="label text-accent-strong">Internal</p>
        <h1 className="text-display mt-6 font-bold">Tokens and primitives</h1>
        <p className="measure text-lead text-fg-muted mt-6">
          Every token in <code>app/globals.css</code> and every primitive in{' '}
          <code>components/</code>, rendered once so a change can be looked at. Not linked from the
          site, not indexed.
        </p>
      </Container>

      <Block title="Colour, light context">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {colours.map((colour) => (
            <div key={colour.token}>
              <div className={`border-border h-24 border ${colour.className}`} />
              <p className="text-body mt-3">{colour.token}</p>
              <p className="text-body text-fg-muted">{colour.use}</p>
              <p className="label text-fg-muted mt-1">{colour.contrast}</p>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Colour, inverse context">
        <div className="bg-bg-inverse grid grid-cols-2 gap-6 p-8 md:grid-cols-4 md:p-12">
          {inverseColours.map((colour) => (
            <div key={colour.token}>
              <div className={`border-border-inverse h-24 border ${colour.className}`} />
              <p className="text-body text-fg-inverse mt-3">{colour.token}</p>
              <p className="text-body text-fg-inverse-muted">{colour.use}</p>
              <p className="label text-fg-inverse-muted mt-1">{colour.contrast}</p>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Type">
        <div className="flex flex-col gap-12">
          {type.map((item) => (
            <div key={item.token}>
              <p className="label text-fg-muted">{item.token}</p>
              <p className={`mt-3 ${item.className}`}>{item.sample}</p>
            </div>
          ))}
          <div>
            <p className="label text-fg-muted">editorial, Instrument Serif italic</p>
            <p className="text-display mt-3">
              One phrase per viewport, <span className="editorial">and never more than one</span>.
            </p>
          </div>
          <div>
            <p className="label text-fg-muted">measure, 68ch cap</p>
            <p className="measure text-body text-fg-muted mt-3">
              Body copy never runs wider than sixty eight characters. Past that the eye loses the
              start of the next line and the reader slows down without knowing why. This paragraph
              is here to show the cap holding at every width, so a long block of running copy has
              somewhere to break.
            </p>
          </div>
        </div>
      </Block>

      <Block title="Space">
        <div className="flex flex-col gap-4">
          {space.map((item) => (
            <div key={item.value} className="flex items-center gap-6">
              <span className="label text-fg-muted w-24">{item.value}</span>
              <span className="label text-fg-muted w-12">{item.utility}</span>
              <span className={`bg-accent block w-full max-w-md ${item.className}`} />
            </div>
          ))}
        </div>
      </Block>

      <Block title="Grid, 12 columns">
        <Grid>
          {Array.from({ length: 12 }, (_unused, index) => (
            <div
              key={index}
              className="label border-border bg-bg-raised text-fg-muted flex h-24 items-end justify-center border pb-2"
            >
              {index + 1}
            </div>
          ))}
        </Grid>
        <p className="text-body text-fg-muted mt-6">
          Four columns below 768px, twelve at and above. Gap matches the gutter.
        </p>
      </Block>

      <Block title="Buttons">
        <div className="flex flex-wrap items-center gap-8">
          <Button href="/contact">Start a project</Button>
          <Button href="/work" variant="outline">
            All work
          </Button>
          <Button href="/studio" variant="link">
            See what we do
          </Button>
          <Button disabled>Disabled</Button>
        </div>
      </Block>

      <Block title="Chips">
        <div className="flex flex-wrap gap-4">
          <Chip selected>Build</Chip>
          <Chip>Reach</Chip>
          <Chip>Show</Chip>
          <Chip>Stage</Chip>
        </div>
      </Block>

      <Block title="Fields">
        <div className="grid gap-8 md:grid-cols-2">
          <Field id="showcase-name" label="Name" required placeholder="Your name" />
          <Field
            id="showcase-email"
            label="Email"
            required
            type="email"
            error="That email address is missing an @."
            defaultValue="not-an-email"
          />
          <SelectField
            id="showcase-timeline"
            label="Timeline"
            options={[
              { value: '', label: 'Select one' },
              { value: 'under-4-weeks', label: 'Under 4 weeks' },
              { value: '1-3-months', label: '1 to 3 months' },
              { value: '3-months-plus', label: '3 months plus' },
              { value: 'exploring', label: 'Exploring' },
            ]}
          />
          <TextAreaField
            id="showcase-message"
            label="Message"
            required
            hint="What are you making, and what is in the way."
          />
        </div>
      </Block>

      <Block title="Placeholder visuals">
        <div className="grid gap-6 md:grid-cols-3">
          <Placeholder seed="tokens-gradient" variant="gradient" note="Showcase only" />
          <Placeholder seed="tokens-mesh" variant="mesh" note="Showcase only" />
          <Placeholder seed="tokens-lines" variant="lines" note="Showcase only" />
        </div>
        <p className="text-body text-fg-muted mt-6">
          Deterministic from a string seed. Same seed, same image, every build.
        </p>
      </Block>

      <Block title="Reveal">
        <div className="flex flex-col gap-6">
          {[0, 60, 120, 180].map((delay) => (
            <Reveal key={delay} delay={delay}>
              <div className="hairline-t flex items-center justify-between py-6">
                <span className="text-title font-bold">Enters once, {delay}ms delay</span>
                <span className="label text-fg-muted">60ms sibling stagger</span>
              </div>
            </Reveal>
          ))}
        </div>
      </Block>

      <Block title="Motion tokens">
        <div className="flex flex-col gap-4">
          {motion.map((item) => (
            <div key={item.token} className="hairline-t flex flex-wrap gap-6 py-4">
              <span className="text-body w-56">{item.token}</span>
              <span className="text-body text-fg-muted w-72">{item.value}</span>
              <span className="label text-fg-muted">{item.use}</span>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Radii and borders">
        <div className="flex flex-wrap items-end gap-8">
          <div>
            <div className="border-border bg-bg-raised h-24 w-40 rounded-none border" />
            <p className="text-body text-fg-muted mt-3">--radius-none, structural</p>
          </div>
          <div>
            <div className="rounded-input border-border bg-bg-raised h-24 w-40 border" />
            <p className="text-body text-fg-muted mt-3">--radius-input, 4px</p>
          </div>
          <div>
            <div className="rounded-pill border-border bg-bg-raised h-12 w-40 border" />
            <p className="text-body text-fg-muted mt-3">--radius-pill, 999px</p>
          </div>
        </div>
        <p className="text-body text-fg-muted mt-6">
          No shadows anywhere. Depth is a surface value shift, void to surface to surface-2.
        </p>
      </Block>
    </main>
  )
}
