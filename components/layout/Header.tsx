'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { Wordmark } from '@/components/layout/Wordmark'
import { Button } from '@/components/ui/Button'
import { cta, nav } from '@/content/site'
import { cn } from '@/lib/utils'

/** Scroll distance at which the header stops being transparent. Brief Phase 2. */
const SOLID_AFTER = 80

export function Header() {
  const [solid, setSolid] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Read on mount too, since a reload part way down the page starts scrolled.
    let frame = 0
    const read = () => {
      frame = 0
      setSolid(window.scrollY > SOLID_AFTER)
    }
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(read)
    }

    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  // A route change closes the menu. Without this, navigating from inside the
  // overlay leaves it covering the new page.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  return (
    <>
      <a
        href="#content"
        className="label focus-visible:rounded-pill focus-visible:bg-signal focus-visible:text-void sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-60 focus-visible:px-4 focus-visible:py-3"
      >
        Skip to content
      </a>

      <header
        data-state={solid ? 'solid' : 'transparent'}
        className={cn(
          'fixed inset-x-0 top-0 z-40',
          'transition-colors duration-[var(--dur-base)] ease-[var(--ease-out)]',
          solid ? 'border-line bg-surface border-b' : 'border-b border-transparent bg-transparent',
        )}
      >
        <Container className="flex h-20 items-center justify-between gap-8">
          <Link
            href="/"
            aria-label="WYRD Designs, home"
            className="tap transition-opacity duration-[var(--dur-fast)] hover:opacity-80"
          >
            <Wordmark />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-10 lg:flex">
            {nav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? 'page' : undefined}
                className={cn(
                  'tap label transition-colors duration-[var(--dur-fast)]',
                  pathname === link.href ? 'text-paper' : 'text-muted hover:text-paper',
                )}
              >
                {link.label}
              </Link>
            ))}
            <Button href={cta.href}>{cta.label}</Button>
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="text-paper hover:text-signal flex size-11 items-center justify-center transition-colors duration-[var(--dur-fast)] lg:hidden"
          >
            <Menu aria-hidden="true" className="size-6" />
          </button>
        </Container>
      </header>

      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </>
  )
}
