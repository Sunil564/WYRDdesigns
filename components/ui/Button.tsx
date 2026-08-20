import Link from 'next/link'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'filled' | 'outline' | 'link'

type CommonProps = {
  children: ReactNode
  variant?: ButtonVariant
  className?: string
}

type AnchorProps = CommonProps & { href: string } & Omit<
    ComponentPropsWithoutRef<'a'>,
    'href' | 'className' | 'children'
  >

type NativeButtonProps = CommonProps & { href?: undefined } & Omit<
    ComponentPropsWithoutRef<'button'>,
    'className' | 'children'
  >

export type ButtonProps = AnchorProps | NativeButtonProps

/*
  Three variants, and no fourth without a reason.

  filled  the accent-fill utility: --accent-strong with a white label, 5.08:1.
          White on the brighter --accent is 3.24:1 and fails AA for a 13px label,
          which is why the fill is the stronger value. Load bearing, not stylistic.
          See docs/design-system.md section 1.3.
  outline hairline border, --fg label. Secondary actions.
  link    text with an underline that draws in from the left on hover and focus.
          The underline is a scaled pseudo element, so it animates on transform
          and never on width.

  Every variant clears a 44px touch target.
*/
const base =
  'group relative inline-flex min-h-11 items-center justify-center gap-2 ' +
  'font-medium transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] ' +
  'disabled:pointer-events-none disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  filled:
    'accent-fill rounded-pill px-6 py-3 ' + 'text-label uppercase tracking-[0.12em] font-bold',
  outline:
    'rounded-pill border border-border px-6 py-3 text-fg hover:border-fg hover:bg-bg-sunken ' +
    'text-label uppercase tracking-[0.12em] font-medium',
  link: 'text-fg hover:text-accent-strong',
}

function Underline() {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-current',
        'transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)]',
        'group-hover:scale-x-100 group-focus-visible:scale-x-100',
      )}
    />
  )
}

export function Button(props: ButtonProps) {
  const { children, variant = 'filled', className } = props
  const classes = cn(base, variants[variant], className)

  if (props.href !== undefined) {
    const { href, children: _children, variant: _variant, className: _class, ...rest } = props
    const external =
      href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')

    if (external) {
      return (
        <a className={classes} href={href} {...rest}>
          {children}
          {variant === 'link' && <Underline />}
        </a>
      )
    }

    return (
      <Link className={classes} href={href} {...rest}>
        {children}
        {variant === 'link' && <Underline />}
      </Link>
    )
  }

  const { children: _children, variant: _variant, className: _class, ...rest } = props
  return (
    <button className={classes} type={rest.type ?? 'button'} {...rest}>
      {children}
      {variant === 'link' && <Underline />}
    </button>
  )
}
