import Link from 'next/link'
import { Container } from '@/components/layout/Container'
import { legalNav, nav, site, socials } from '@/content/site'

/**
 * S9. Three columns, a bottom bar, and one oversized wordmark clipped by the
 * bottom edge of the page. The wordmark costs nothing and closes the document
 * with weight, which is the whole reason it is there.
 *
 * Every fact here comes from docs/brand.md. No address renders, because none was
 * supplied.
 */
export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-border relative z-10 overflow-hidden border-t">
      <Container className="pt-32 pb-16">
        <div className="grid gap-16 md:grid-cols-3">
          <div>
            <p className="text-title text-fg font-black tracking-[-0.02em]">WYRD</p>
            <p className="measure text-body text-fg-muted mt-6">{site.tagline}</p>
            <p className="measure text-body text-fg-muted mt-3">
              A digital and creative studio in {site.location.city}.
            </p>
          </div>

          <nav aria-label="Footer">
            <p className="label text-fg-muted">Site</p>
            <ul className="mt-4 flex flex-col">
              {nav.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="tap text-body text-fg hover:text-accent-on-inverse transition-colors duration-[var(--dur-fast)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="label text-fg-muted">Contact</p>
            <ul className="mt-4 flex flex-col">
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="tap text-body text-fg hover:text-accent-on-inverse transition-colors duration-[var(--dur-fast)]"
                >
                  {site.email}
                </a>
              </li>
              {site.phones.map((phone) => (
                <li key={phone}>
                  <a
                    href={`tel:${phone.replace(/\s+/g, '')}`}
                    className="tap text-body text-fg hover:text-accent-on-inverse transition-colors duration-[var(--dur-fast)]"
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
                    className="tap text-body text-fg hover:text-accent-on-inverse transition-colors duration-[var(--dur-fast)]"
                  >
                    {social.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="hairline-t mt-24 flex flex-wrap items-center justify-between gap-6 pt-8">
          <p className="label text-fg-muted">
            {site.legalName}, {year}
          </p>
          <ul className="flex gap-8">
            {legalNav.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="tap label text-fg-muted hover:text-fg transition-colors duration-[var(--dur-fast)]"
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
