import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type DeviceFrameKind = 'none' | 'phone' | 'browser'

/**
 * A phone or browser outline around a screenshot. See ADR 0032.
 *
 * A screenshot on a white page with no frame reads as a floating rectangle, and the reader
 * has to work out whether they are looking at a phone, a page, or a crop of something else.
 * The frame answers that in one glance and costs nothing: it is a border, a radius and two
 * hairlines, drawn from tokens. No image asset, no device mockup library, no bezel art.
 *
 * Deliberately plain. A photorealistic handset would be the loudest thing on a page whose
 * whole argument is the screen inside it.
 */
export function DeviceFrame({
  kind,
  children,
  className,
}: {
  kind: DeviceFrameKind
  children: ReactNode
  className?: string
}) {
  if (kind === 'none') return <div className={className}>{children}</div>

  if (kind === 'phone') {
    return (
      /*
        Capped, and centred in whatever column it lands in. Uncapped, a 9:16 slot fills its
        column and draws a phone 460px wide on desktop and 412px on a phone, which reads as a
        tall grey tower rather than as a handset. Two of those stacked is most of a screen.
      */
      <div
        className={cn(
          'border-border bg-bg-raised mx-auto w-full max-w-[18rem] rounded-[1.75rem] border p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
          className,
        )}
      >
        {/* The speaker slot. One hairline pill, which is all it takes to read as a phone. */}
        <div aria-hidden="true" className="flex justify-center pt-1 pb-2">
          <span className="bg-border rounded-pill block h-1 w-12" />
        </div>
        <div className="overflow-hidden rounded-[1.25rem]">{children}</div>
      </div>
    )
  }

  return (
    <div className={cn('border-border bg-bg-raised overflow-hidden rounded-lg border', className)}>
      {/* The chrome bar. Three dots and a hairline, no address text to invent a URL with. */}
      <div
        aria-hidden="true"
        className="border-border flex items-center gap-1.5 border-b px-3 py-2.5"
      >
        <span className="bg-border block size-2 rounded-full" />
        <span className="bg-border block size-2 rounded-full" />
        <span className="bg-border block size-2 rounded-full" />
      </div>
      {children}
    </div>
  )
}
