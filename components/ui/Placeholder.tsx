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

type Blob = {
  colour: string
  /** Each tint carries its own alpha range. One global range cannot serve both a
   *  near canvas tint, which needs to be almost opaque to register, and an ink
   *  tint, which turns into a smudge above about 20 percent. */
  alpha: [number, number]
}

type ColourSet = {
  base: string
  blobs: Blob[]
  accent: string
  accentAlpha: number
  grid: string
  gridOpacity: number
  rule: string
  ruleOpacity: number
  frame: string
}

const SETS: Record<PlaceholderContext, ColourSet> = {
  /*
    Light. The panel sits at --bg-raised, because a visual at the same value as the
    canvas is not a visual.

    The tuning pass mattered more here than anywhere else in this phase. A direct
    port of the dark generation put --fg-muted blobs at 50 to 85 percent over a
    light panel, which read as exactly the out of focus photograph a placeholder must
    not look like. Ink now appears only at low alpha for depth, the near canvas tints
    do the volume, and the structure carries the composition.
  */
  light: {
    base: 'var(--color-bg-raised)',
    blobs: [
      { colour: 'var(--color-border)', alpha: [0.75, 1] },
      { colour: 'var(--color-bg-sunken)', alpha: [0.85, 1] },
      { colour: 'var(--color-fg-muted)', alpha: [0.09, 0.16] },
    ],
    accent: 'var(--color-accent)',
    accentAlpha: 0.14,
    grid: 'var(--color-fg-muted)',
    gridOpacity: 0.16,
    rule: 'var(--color-fg-muted)',
    ruleOpacity: 0.5,
    frame: 'var(--color-border)',
  },
  /*
    Inverse. The original dark generation, kept for placeholders that sit inside a
    dark block, such as a case study hero frame.
  */
  inverse: {
    base: 'var(--color-bg-inverse)',
    blobs: [
      { colour: 'var(--color-border-inverse)', alpha: [0.4, 0.7] },
      { colour: 'var(--color-fg-inverse-muted)', alpha: [0.16, 0.3] },
      { colour: 'var(--color-border-inverse)', alpha: [0.4, 0.7] },
    ],
    accent: 'var(--color-accent-on-inverse)',
    accentAlpha: 0.18,
    grid: 'var(--color-border-inverse)',
    gridOpacity: 0.9,
    rule: 'var(--color-fg-inverse-muted)',
    ruleOpacity: 0.45,
    frame: 'var(--color-border-inverse)',
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
  const fallbackBlob = set.blobs[0]!
  const random = seededRandom(`${seed}:${variant}`)
  const width = 1200
  const height = Math.round(width / aspect)

  // Soft blobs. The accent appears at most once per visual, on a coin flip, so a
  // row of placeholders does not read as three orange smudges.
  const blobCount = 4 + Math.floor(random() * 2)
  const accentIndex = random() > 0.5 ? Math.floor(random() * blobCount) : -1
  const blobs = Array.from({ length: blobCount }, (_unused, index) => {
    const isAccent = index === accentIndex
    const tint = set.blobs[Math.floor(random() * set.blobs.length)] ?? fallbackBlob
    const [alphaFloor, alphaCeiling] = tint.alpha
    return {
      id: `${seed}-${variant}-${context}-${index}`,
      cx: 0.1 + random() * 0.8,
      cy: 0.1 + random() * 0.8,
      r: 0.26 + random() * 0.32,
      colour: isAccent ? set.accent : tint.colour,
      // The accent is always the quietest thing in the frame.
      opacity: isAccent ? set.accentAlpha : alphaFloor + random() * (alphaCeiling - alphaFloor),
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
              opacity={set.gridOpacity}
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
            // The diagonals carry the whole composition in this variant, so on a
            // light ground they sit back to about half strength: at full strength
            // they read as a scribble over the tints rather than a ruled field.
            opacity={line.opacity * (inverse ? 1 : 0.45)}
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
            opacity={rule.accent ? 0.85 : set.ruleOpacity}
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
            ? "bg-[url('/noise-light.png')] opacity-[0.04] mix-blend-screen"
            : "bg-[url('/noise-dark.png')] opacity-[0.03] mix-blend-multiply",
        )}
        style={{ backgroundSize: '128px 128px' }}
      />
    </div>
  )
}
