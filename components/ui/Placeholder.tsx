import { cn, seededRandom } from '@/lib/utils'

export type PlaceholderVariant = 'gradient' | 'mesh' | 'lines'

type PlaceholderProps = {
  /** Same seed, same image, every build. Use the project slug. */
  seed: string
  /** Aspect ratio as width / height. 4 / 3 by default. */
  aspect?: number
  variant?: PlaceholderVariant
  /** What real asset belongs here. Ends up in the DOM and in docs/placeholders.md. */
  note: string
  className?: string
}

/*
  Deterministic abstract visuals from a string seed. Brief section 9.

  No stock photography, no Unsplash, no Picsum. All three make a design heavy
  site look like a template, and the last two are a third party request in the
  render path.

  This is an inline SVG rendered by a server component, so it costs zero client
  JavaScript and it is baked into the static HTML at build time. Every placeholder
  carries `data-placeholder` with its note, so a grep finds all of them.
*/

const PALETTE = [
  'var(--color-bg-sunken)',
  'var(--color-border)',
  'var(--color-fg-muted)',
  'var(--color-accent)',
]

export function Placeholder({
  seed,
  aspect = 4 / 3,
  variant = 'gradient',
  note,
  className,
}: PlaceholderProps) {
  const random = seededRandom(`${seed}:${variant}`)
  const width = 1200
  const height = Math.round(width / aspect)

  // Soft blobs. The accent appears at most once per visual, on a coin flip, so a
  // row of placeholders does not read as four orange smudges.
  const blobCount = 3 + Math.floor(random() * 2)
  const accentIndex = random() > 0.5 ? Math.floor(random() * blobCount) : -1
  const blobs = Array.from({ length: blobCount }, (_unused, index) => {
    const colourIndex = index === accentIndex ? 3 : Math.floor(random() * 3)
    return {
      id: `${seed}-${variant}-${index}`,
      cx: 0.1 + random() * 0.8,
      cy: 0.1 + random() * 0.8,
      r: 0.28 + random() * 0.34,
      colour: PALETTE[colourIndex] ?? PALETTE[0],
      opacity: index === accentIndex ? 0.18 : 0.32 + random() * 0.3,
    }
  })

  const lineCount = variant === 'lines' ? 14 + Math.floor(random() * 10) : 0
  const lines = Array.from({ length: lineCount }, (_unused, index) => ({
    id: `${seed}-line-${index}`,
    x: (index + 0.5) / lineCount,
    skew: (random() - 0.5) * 0.22,
    opacity: 0.25 + random() * 0.5,
  }))

  // Two or three crisp horizontal rules. Soft gradients alone read as a blurred
  // photograph, which is the one thing a placeholder must not look like. A hard
  // edge is what makes the visual read as composed rather than unfinished.
  const ruleCount = 2 + Math.floor(random() * 2)
  const rules = Array.from({ length: ruleCount }, (_unused, index) => ({
    id: `${seed}-rule-${index}`,
    y: 0.16 + random() * 0.68,
    from: random() * 0.4,
    to: 0.6 + random() * 0.4,
    accent: index === 0 && accentIndex !== -1,
  }))

  const gridStep = variant === 'mesh' ? 40 : 80

  return (
    <div
      data-placeholder={note}
      className={cn('bg-bg-raised relative isolate overflow-hidden', className)}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          {blobs.map((blob) => (
            <radialGradient key={blob.id} id={blob.id}>
              <stop offset="0%" stopColor={blob.colour} stopOpacity={blob.opacity} />
              <stop offset="100%" stopColor={blob.colour} stopOpacity="0" />
            </radialGradient>
          ))}
          <pattern
            id={`${seed}-${variant}-grid`}
            width={gridStep}
            height={gridStep}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${gridStep} 0 L 0 0 0 ${gridStep}`}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="1"
              opacity="0.9"
            />
          </pattern>
        </defs>

        <rect width={width} height={height} fill="var(--color-bg-raised)" />

        {blobs.map((blob) => (
          <ellipse
            key={`${blob.id}-shape`}
            cx={blob.cx * width}
            cy={blob.cy * height}
            rx={blob.r * width}
            ry={blob.r * height}
            fill={`url(#${blob.id})`}
          />
        ))}

        {lines.map((line) => (
          <line
            key={line.id}
            x1={line.x * width}
            y1={0}
            x2={(line.x + line.skew) * width}
            y2={height}
            stroke="var(--color-border)"
            strokeWidth="1"
            opacity={line.opacity}
          />
        ))}

        <rect width={width} height={height} fill={`url(#${seed}-${variant}-grid)`} />

        {rules.map((rule) => (
          <line
            key={rule.id}
            x1={rule.from * width}
            y1={rule.y * height}
            x2={rule.to * width}
            y2={rule.y * height}
            stroke={rule.accent ? 'var(--color-accent)' : 'var(--color-fg-muted)'}
            strokeWidth={rule.accent ? 2 : 1}
            opacity={rule.accent ? 0.7 : 0.45}
          />
        ))}

        {/* Inset frame. Holds the composition together at every aspect ratio. */}
        <rect
          x={24}
          y={24}
          width={width - 48}
          height={height - 48}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1"
          opacity="0.8"
        />
      </svg>

      {/* The site grain, so a placeholder shares the canvas texture instead of sitting on top of it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url('/noise.png')] bg-repeat opacity-[0.06] mix-blend-soft-light"
        style={{ backgroundSize: '128px 128px' }}
      />
    </div>
  )
}
