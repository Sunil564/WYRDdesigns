'use client'

import { useEffect, useRef, useState } from 'react'
import { lerp } from '@/lib/utils'

type CursorLabelProps = {
  /** The element the label follows. Native cursor is hidden while inside it. */
  targetRef: React.RefObject<HTMLElement | null>
  label: string
}

/** Brief 6.1 S4 fixes the smoothing at 0.15. */
const LERP = 0.15

/**
 * A label that replaces the native cursor inside a work card. Brief 6.1 S4.
 *
 * Runs one RAF loop while the pointer is inside the target and stops the frame it
 * leaves. Never mounted on a coarse pointer or under reduced motion: a finger has
 * no hover, and a follower is exactly the kind of motion reduced motion means.
 */
export function CursorLabel({ targetRef, label }: CursorLabelProps) {
  const labelRef = useRef<HTMLDivElement | null>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const target = targetRef.current
    const element = labelRef.current
    if (!target || !element) return

    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const pointer = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }
    let frame = 0
    let inside = false

    const tick = () => {
      current.x = lerp(current.x, pointer.x, LERP)
      current.y = lerp(current.y, pointer.y, LERP)
      element.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate(-50%, -50%)`
      frame = inside ? window.requestAnimationFrame(tick) : 0
    }

    const onMove = (event: PointerEvent) => {
      const rect = target.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
    }

    const onEnter = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      inside = true
      setActive(true)
      onMove(event)
      // Start where the pointer is, so the label does not fly in from the corner.
      current.x = pointer.x
      current.y = pointer.y
      if (!frame) frame = window.requestAnimationFrame(tick)
    }

    const onLeave = () => {
      inside = false
      setActive(false)
    }

    target.addEventListener('pointerenter', onEnter)
    target.addEventListener('pointermove', onMove, { passive: true })
    target.addEventListener('pointerleave', onLeave)

    return () => {
      inside = false
      if (frame) window.cancelAnimationFrame(frame)
      target.removeEventListener('pointerenter', onEnter)
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerleave', onLeave)
    }
  }, [targetRef])

  return (
    <div
      ref={labelRef}
      aria-hidden="true"
      data-active={active ? 'true' : 'false'}
      className="cursor-label label"
    >
      {label}
    </div>
  )
}
