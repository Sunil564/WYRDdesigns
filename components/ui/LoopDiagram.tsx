/**
 * Labelled nodes joined by a line. See ADR 0032.
 *
 * The closing argument of a case study, drawn rather than written. It is the Thread's own
 * gesture at the scale of a diagram: a hairline in `--color-border` with an accent node on
 * it, and nothing else.
 *
 * Not an image, and not an SVG asset either. It is markup and tokens, so it recolours with
 * the theme, reflows at every width, and reads to a screen reader as the ordered list it
 * is. A row of columns above `sm`, a column of rows below it, with the connecting line
 * turning to match.
 *
 * The geometry is arithmetic rather than guesswork. With `n` equal columns and the node at
 * the left edge of each, the first and last nodes sit at `1/2n` and `1 - 1/2n` of the width,
 * so the horizontal line spans exactly `(n-1)/n` of it. That is the inline width below, and
 * it is the only inline style here: everything else is a token.
 */
const NODE = 10 // px. Matches size-2.5 on the node itself.

export function LoopDiagram({ nodes }: { nodes: string[] }) {
  const span = nodes.length > 1 ? ((nodes.length - 1) / nodes.length) * 100 : 0

  return (
    <div className="relative">
      {/* The horizontal line, desktop only, from the first node's centre to the last. */}
      <span
        aria-hidden="true"
        className="bg-border absolute hidden h-px sm:block"
        style={{ top: `${NODE / 2}px`, left: `${NODE / 2}px`, width: `${span}%` }}
      />

      <ol className="relative flex flex-col sm:flex-row">
        {nodes.map((node, index) => (
          <li
            key={node}
            className="relative flex items-start gap-4 pb-10 last:pb-0 sm:flex-1 sm:flex-col sm:gap-0 sm:pb-0"
          >
            {/*
              The vertical connector, mobile only. It runs from just under this node to just
              under the next one's top margin, so the chain reads as one line rather than as
              four segments with gaps in them.
            */}
            {index < nodes.length - 1 && (
              <span
                aria-hidden="true"
                className="bg-border absolute bottom-[-0.25rem] block w-px sm:hidden"
                style={{ left: `${NODE / 2 - 0.5}px`, top: `${NODE + 4}px` }}
              />
            )}

            <span
              aria-hidden="true"
              className="bg-accent-strong rounded-pill relative z-10 mt-1 block size-2.5 shrink-0 sm:mt-0"
            />

            <span className="label text-fg sm:mt-6">{node}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
