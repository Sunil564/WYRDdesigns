'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { cta, nav, site, socials } from '@/content/site'

type MobileMenuProps = {
  open: boolean
  onClose: () => void
}

const panel = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

const list = {
  hidden: {},
  // 60ms sibling stagger, the site constant. Brief section 5.2.
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
}

/**
 * Full screen overlay menu.
 *
 * Focus is trapped on purpose, which is the one place on this site where that is
 * allowed. It closes on Escape, on a link click, on the close button, and on a
 * route change, and it returns focus to whatever opened it.
 *
 * Scroll is locked while it is open, through Lenis when Lenis is running and
 * through `overflow: hidden` regardless, since Lenis does not exist under reduced
 * motion.
 */
export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const restoreFocusTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    restoreFocusTo.current = document.activeElement as HTMLElement | null

    const lenis = window.__lenis
    lenis?.stop()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // First focusable inside the panel, so a keyboard user lands in the menu
    // rather than at the top of the document behind it.
    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      )

    focusables()[0]?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const elements = focusables()
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      lenis?.start()
      restoreFocusTo.current?.focus()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          variants={panel}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-bg fixed inset-0 z-50 flex flex-col lg:hidden"
        >
          <div className="flex h-20 items-center justify-end px-[var(--gutter)]">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="text-fg hover:text-accent-strong flex size-11 items-center justify-center transition-colors duration-[var(--dur-fast)]"
            >
              <X aria-hidden="true" className="size-6" />
            </button>
          </div>

          <motion.nav
            variants={list}
            initial="hidden"
            animate="visible"
            aria-label="Main"
            className="flex flex-1 flex-col justify-center gap-2 px-[var(--gutter)]"
          >
            {nav.map((link) => (
              <motion.div key={link.href} variants={item}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="text-display text-fg hover:text-accent-strong block py-3 font-bold transition-colors duration-[var(--dur-fast)]"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}

            <motion.div variants={item} className="mt-8">
              <Link
                href={cta.href}
                onClick={onClose}
                className="label accent-surface rounded-pill inline-flex min-h-11 items-center px-6 py-3 font-bold"
              >
                {cta.label}
              </Link>
            </motion.div>
          </motion.nav>

          <motion.div
            variants={item}
            initial="hidden"
            animate="visible"
            className="hairline-t mx-[var(--gutter)] flex flex-wrap items-center justify-between gap-4 py-8"
          >
            <a
              href={`mailto:${site.email}`}
              className="text-body text-fg-muted hover:text-fg transition-colors duration-[var(--dur-fast)]"
            >
              {site.email}
            </a>
            {socials.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="label text-fg-muted hover:text-fg transition-colors duration-[var(--dur-fast)]"
              >
                {social.name}
              </a>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
