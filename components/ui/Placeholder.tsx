import { cn, seededRandom } from '@/lib/utils'

export type PlaceholderVariant = 'gradient' | 'mesh' | 'lines'

/** Which token set the visual is generated from. Phase 4b section 9. */
export type PlaceholderContext = 'light' | 'inverse'

type PlaceholderProps = {
  /** Same seed, same image, every build. Use the project slug. */
  seed: string
  /** Aspect ratio as width / height. 4 / 3 by default. */
  aspect?: number
  variant?: PlaceholderVariant
  /**
   * The context this placeholder sits in. Passed explicitly, never inferred from a
   * parent, so a card knows what it is rendering on. Phase 4b criterion 12.
   */
  context?: PlaceholderContext
  /** What real asset belongs here. Ends up in the DOM and in docs/placeholders.md. */
  note: string
  className?: string
}

/*
  Deterministic abstract visuals from a string seed. Brief section 9, regenerated
  for the light canvas in Phase 4b section 9.

  No stock photography, no Unsplash, no Picsum. All three make a design heavy site
  look like a template, and the last two are a third party request in the render
  path.

  This is an inline SVG rendered by a server component, so it costs zero client
  JavaScript and it is baked into the static HTML at build time. Every placeholder
  carries `data-placeholder` with its note, so a grep finds all of them.
*/

type ColourSet = {
  base: string
  blobs: string[]
  accent: string
  grid: string
  rule: string
  frame: string
  /** Blob opacity range. Tints on a light ground have to be stronger to read. */
  blobAlpha: [number, number]
}

const SETS: Record<PlaceholderContext, ColourSet> = {
  /*
    Light. The panel sits at --bg-raised rather than pure white, because a visual
    that is the same value as the canvas is not a visual. Tints step down from
    there through --bg-sunken and --border, with one sparing accent.
  */
  light: {
    base: 'var(--color-bg-raised)',
    blobs: ['var(--color-bg-sunken)', 'var(--color-border)', 'var(--color-fg-muted)'],
    accent: 'var(--color-accent)',
    grid: 'var(--color-border)',
    rule: 'var(--color-fg-muted)',
    frame: 'var(--color-border)',
    blobAlpha: [0.5, 0.85],
  },
  /*
    Inverse. The original dark generation, kept for placeholders that sit inside a
    dark block, such as a case study hero frame.
  */
  inverse: {
    base: 'var(--color-bg-inverse)',
    blobs: [
      'var(--color-border-inverse)',
      'var(--color-fg-inverse-muted)',
      'var(--color-border-inverse)',
    ],
    accent: 'var(--color-accent-on-inverse)',
    grid: 'var(--color-border-inverse)',
    rule: 'var(--color-fg-inverse-muted)',
    frame: 'var(--color-border-inverse)',
    blobAlpha: [0.32, 0.62],
  },
}

export function Placeholder({
  seed,
  aspect = 4 / 3,
  variant = 'gradient',
  context = 'light',
  note,
  className,
}: PlaceholderProps) {
  const set = SETS[context]
  const inverse = context === 'inverse'
  const fallbackBlob = set.blobs[0] ?? 'var(--color-border)'
  const random = seededRandom(`${seed}:${variant}`)
  const width = 1200
  const height = Math.round(width / aspect)

  // Soft blobs. The accent appears at most once per visual, on a coin flip, so a
  // row of placeholders does not read as three orange smudges.
  const blobCount = 3 + Math.floor(random() * 2)
  const accentIndex = random() > 0.5 ? Math.floor(random() * blobCount) : -1
  const [alphaFloor, alphaCeiling] = set.blobAlpha
  const blobs = Array.from({ length: blobCount }, (_unused, index) => {
    const isAccent = index === accentIndex
    const colourIndex = Math.floor(random() * set.blobs.length)
    return {
      id: `${seed}-${variant}-${context}-${index}`,
      cx: 0.1 + random() * 0.8,
      cy: 0.1 + random() * 0.8,
      r: 0.28 + random() * 0.34,
      colour: isAccent ? set.accent : (set.blobs[colourIndex] ?? fallbackBlob),
      // The accent is always the quietest thing in the frame.
      opacity: isAccent ? 0.16 : alphaFloor + random() * (alphaCeiling - alphaFloor),
    }
  })

  const lineCount = variant === 'lines' ? 14 + Math.floor(random() * 10) : 0
  const lines = Array.from({ length: lineCount }, (_unused, index) => ({
    id: `${seed}-line-${context}-${index}`,
    x: (index + 0.5) / lineCount,
    skew: (random() - 0.5) * 0.22,
    opacity: 0.3 + random() * 0.5,
  }))

  // Two or three crisp horizontal rules. Soft gradients alone read as a blurred
  // photograph, which is the one thing a placeholder must not look like. A hard
  // edge is what makes the visual read as composed rather than unfinished.
  const ruleCount = 2 + Math.floor(random() * 2)
  const rules = Array.from({ length: ruleCount }, (_unused, index) => ({
    id: `${seed}-rule-${context}-${index}`,
    y: 0.16 + random() * 0.68,
    from: random() * 0.4,
    to: 0.6 + random() * 0.4,
    accent: index === 0 && accentIndex !== -1,
  }))

  const gridStep = variant === 'mesh' ? 40 : 80

  return (
    <div
      data-placeholder={note}
      data-placeholder-context={context}
      className={cn('relative isolate overflow-hidden', className)}
      style={{ aspectRatio: `${width} / ${height}`, backgroundColor: set.base }}
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
            id={`${seed}-${variant}-${context}-grid`}
            width={gridStep}
            height={gridStep}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${gridStep} 0 L 0 0 0 ${gridStep}`}
              fill="none"
              stroke={set.grid}
              strokeWidth="1"
              opacity="0.9"
            />
          </pattern>
        </defs>

        <rect width={width} height={height} fill={set.base} />

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
            stroke={set.grid}
            strokeWidth="1"
            opacity={line.opacity}
          />
        ))}

        <rect width={width} height={height} fill={`url(#${seed}-${variant}-${context}-grid)`} />

        {rules.map((rule) => (
          <line
            key={rule.id}
            x1={rule.from * width}
            y1={rule.y * height}
            x2={rule.to * width}
            y2={rule.y * height}
            stroke={rule.accent ? set.accent : set.rule}
            strokeWidth={rule.accent ? 2 : 1}
            opacity={rule.accent ? 0.8 : 0.45}
          />
        ))}

        {/* Inset frame. Holds the composition together at every aspect ratio. */}
        <rect
          x={24}
          y={24}
          width={width - 48}
          height={height - 48}
          fill="none"
          stroke={set.frame}
          strokeWidth="1"
          opacity="0.9"
        />
      </svg>

      {/*
        The grain, so a placeholder shares the page texture rather than sitting on
        top of it. Which texture depends on the context: dark speckles multiplied on
        the light canvas, light speckles screened inside an inverse block.
      */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 bg-repeat',
          inverse
            ? "bg-[url('/noise-light.png')] mix-blend-screen opacity-[0.04]"
            : "bg-[url('/noise-dark.png')] mix-blend-multiply opacity-[0.03]",
        )}
        style={{ backgroundSize: '128px 128px' }}
      />
    </div>
  )
}
