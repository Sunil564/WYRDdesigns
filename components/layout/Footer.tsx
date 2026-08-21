import Link from 'next/link'
import { Container } from '@/components/layout/Container'
import { Wordmark } from '@/components/layout/Wordmark'
import { legalNav, nav, site, socials } from '@/content/site'

/**
 * S9. Three columns, a bottom bar, and one oversized wordmark clipped by the bottom
 * edge of the page. The wordmark costs nothing and closes the document with weight,
 * which is the whole reason it is there.
 *
 * An inverse block, continuing the dark ground from S8 so the two read as one base.
 * Phase 4b section 4. It is a single context component: the footer is never light,
 * so it reads the inverse tokens directly rather than taking a variant.
 *
 * Every fact here comes from docs/brand.md. No address renders, because none was
 * supplied.
 */
export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-bg-inverse relative z-10 overflow-hidden">
      {/* The light grain, so the dark base carries texture rather than flat ink. */}
      <span aria-hidden="true" className="grain-inverse" />

      <Container className="relative pt-32 pb-16">
        <div className="grid gap-16 md:grid-cols-3">
          <div>
            {/*
              The white artwork, at the same size the header renders the black one. Until the
              white variant was supplied this was the word set in Satoshi, which read as a
              second logo sitting a few hundred pixels below the real one. Same mark, same
              size, different ground.
            */}
            <Wordmark variant="inverse" />
            <p className="measure text-body text-fg-inverse-muted mt-6">{site.tagline}</p>
            <p className="measure text-body text-fg-inverse-muted mt-3">
              A digital and creative studio in {site.location.city}.
            </p>
          </div>

          <nav aria-label="Footer">
            <p className="label text-fg-inverse-muted">Site</p>
            <ul className="mt-4 flex flex-col">
              {nav.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="tap text-body text-fg-inverse hover:text-accent-on-inverse transition-colors duration-[var(--dur-fast)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="label text-fg-inverse-muted">Contact</p>
            <ul className="mt-4 flex flex-col">
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="tap text-body text-fg-inverse hover:text-accent-on-inverse transition-colors duration-[var(--dur-fast)]"
                >
                  {site.email}
                </a>
              </li>
              {site.phones.map((phone) => (
                <li key={phone}>
                  <a
                    href={`tel:${phone.replace(/\s+/g, '')}`}
                    className="tap text-body text-fg-inverse hover:text-accent-on-inverse transition-colors duration-[var(--dur-fast)]"
                  >
                    {phone}
                  </a>
                </li>
              ))}
              {socials.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="tap text-body text-fg-inverse hover:text-accent-on-inverse transition-colors duration-[var(--dur-fast)]"
                  >
                    {social.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-border-inverse mt-24 flex flex-wrap items-center justify-between gap-6 border-t pt-8">
          <p className="label text-fg-inverse-muted">
            {site.legalName}, {year}
          </p>
          <ul className="flex gap-8">
            {legalNav.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="tap label text-fg-inverse-muted hover:text-fg-inverse transition-colors duration-[var(--dur-fast)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      {/*
        The closing wordmark. Set at viewport width and clipped by the page edge.
        Decorative, so it is hidden from assistive technology: the name is already
        in the footer copy above and in the header.
      */}
      <div aria-hidden="true" className="pointer-events-none select-none">
        <p className="wordmark-close">WYRD</p>
      </div>
    </footer>
  )
}
