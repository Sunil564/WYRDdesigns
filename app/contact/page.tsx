import type { Metadata } from 'next'
import { Section } from '@/components/layout/Section'
import { ContactForm } from '@/components/sections/ContactForm'
import { Button } from '@/components/ui/Button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/ui/Reveal'
import { contactPage } from '@/content/contact'
import { site, socials } from '@/content/site'

/**
 * `/contact`. Brief section 6.5.
 *
 * Two columns: details left, form right, stacking on narrow. The left column renders only
 * what exists, which is the email, the two phone numbers and the city. There is no street
 * address because none was supplied, so the address stops at city, region, country.
 *
 * The form is the only client island on the route. Everything else here is server rendered.
 */
export const metadata: Metadata = {
  title: contactPage.meta.title,
  description: contactPage.meta.description,
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <main className="relative">
      <Section id="contact" label={contactPage.meta.title}>
        <Reveal>
          <Eyebrow marker>{contactPage.eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={60}>
          <h1 className="text-display text-fg mt-8 font-black">{contactPage.headline}</h1>
        </Reveal>
        <Reveal delay={120}>
          <p className="measure text-lead text-fg-muted mt-6">{contactPage.lead}</p>
        </Reveal>

        <div className="mt-16 grid gap-x-[var(--gutter)] gap-y-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-5" delay={180}>
            <div className="flex flex-col gap-10">
              <div>
                <h2 className="label text-fg-muted">{contactPage.details.emailLabel}</h2>
                <div className="mt-3 flex flex-col items-start">
                  <Button href={`mailto:${site.email}`} variant="link">
                    {site.email}
                  </Button>
                </div>
              </div>

              <div>
                <h2 className="label text-fg-muted">{contactPage.details.phoneLabel}</h2>
                <div className="mt-3 flex flex-col items-start gap-2">
                  {site.phones.map((phone) => (
                    <Button key={phone} href={`tel:${phone.replace(/\s/g, '')}`} variant="link">
                      {phone}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="label text-fg-muted">{contactPage.details.locationLabel}</h2>
                {/* No street. None was supplied, so the address stops where the facts do. */}
                <address className="text-body text-fg mt-3 not-italic">
                  {site.location.city}
                  <br />
                  {site.location.region}
                  <br />
                  {site.location.country}
                </address>
              </div>

              {socials.length > 0 && (
                <div>
                  <h2 className="label text-fg-muted">{contactPage.details.socialLabel}</h2>
                  <div className="mt-3 flex flex-col items-start gap-2">
                    {socials.map((social) => (
                      <Button key={social.name} href={social.href} variant="link">
                        {social.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Reveal>

          <Reveal className="lg:col-span-7" delay={240}>
            <ContactForm />
          </Reveal>
        </div>
      </Section>
    </main>
  )
}
