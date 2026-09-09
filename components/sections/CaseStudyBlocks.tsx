import { Section } from '@/components/layout/Section'
import { DeviceFrame } from '@/components/ui/DeviceFrame'
import { LoopDiagram } from '@/components/ui/LoopDiagram'
import { Placeholder } from '@/components/ui/Placeholder'
import { ProjectImage } from '@/components/ui/ProjectImage'
import { Reveal } from '@/components/ui/Reveal'
import type { CaseStudyBlock, PendingVisual, Project } from '@/content/projects'

/**
 * The three body frames, in order. Index 1 is the bleed slot, so the 16:9 frame sits there
 * and the two 4:3 frames take the insets either side of it.
 */
const BLOCK_IMAGES = [
  (project: Project) => project.images?.blockInset1,
  (project: Project) => project.images?.blockBleed,
  (project: Project) => project.images?.blockInset2,
] as const

/** How many body blocks the default case study renders. Brief 6.3 asks for three to five. */
const BLOCK_COUNT = BLOCK_IMAGES.length

/** Inset blocks share one measure, so the page has a spine rather than nine widths. */
const INSET = 'mx-auto max-w-[62rem]'

/**
 * The body of a case study. Brief 6.3, extended by ADR 0032.
 *
 * Two shapes, decided by the data rather than by a flag. A project with no `blocks` renders
 * the original three alternating frames and is byte for byte what it was before. A project
 * with `blocks` renders them in order, which is how a visual-first case study gets to put a
 * caption under a screenshot and a diagram at the end.
 *
 * Every visual slot here is pending. `PendingVisual` carries no file path, only a shape and
 * the sentence describing what belongs in it, so the layout is real and reviewable now and
 * nothing is loaded that does not exist.
 */
export function CaseStudyBlocks({ project }: { project: Project }) {
  if (project.blocks && project.blocks.length > 0) {
    return (
      <>
        {project.blocks.map((block, index) => (
          <BlockSection key={index} block={block} project={project} index={index} />
        ))}
      </>
    )
  }

  return (
    <>
      {Array.from({ length: BLOCK_COUNT }, (_unused, index) => {
        const bleed = index % 2 === 1
        const image = BLOCK_IMAGES[index]!(project)
        return (
          <Section
            key={index}
            label={`${project.title}, visual ${index + 1}`}
            bleed={bleed}
            rhythm={false}
            className="py-[calc(var(--gutter)*2)]"
          >
            <Reveal y={40}>
              <div className={bleed ? undefined : INSET}>
                {/*
                  Three frames alternating bleed and inset. The bleed slot was 21:9 and the
                  inset 16:10; both now take the ratio of the image that fills them, 16:9
                  and 4:3, so nothing is cropped to fit a shape it was not composed for.
                */}
                {image ? (
                  <ProjectImage
                    image={image}
                    sizes={bleed ? '100vw' : '(min-width: 64rem) 992px, 92vw'}
                  />
                ) : (
                  <Placeholder
                    seed={`${project.slug}-block-${index}`}
                    aspect={bleed ? 16 / 9 : 4 / 3}
                    note={`Body visual ${index + 1} for ${project.title}`}
                  />
                )}
              </div>
            </Reveal>
          </Section>
        )
      })}
    </>
  )
}

/**
 * One pending slot, at its own shape.
 *
 * Two `Placeholder` elements rather than one, when a slot has a different ratio on a phone.
 * The alternative is one element that changes `aspect-ratio` in CSS, which reserves the
 * wrong box on first paint at one of the two widths, and CLS on this route is 0.
 */
function Slot({ slot, seed }: { slot: PendingVisual; seed: string }) {
  const framed = (aspect: number, className?: string) => (
    <DeviceFrame kind={slot.frame ?? 'none'} className={className}>
      <Placeholder seed={`${seed}-${aspect.toFixed(3)}`} aspect={aspect} note={slot.note} />
    </DeviceFrame>
  )

  if (slot.aspectMobile === undefined) return framed(slot.aspect)

  return (
    <>
      {framed(slot.aspectMobile, 'lg:hidden')}
      {framed(slot.aspect, 'hidden lg:block')}
    </>
  )
}

/**
 * A visual and its caption, as `figure` and `figcaption`.
 *
 * The caption is a field on the block rather than a block of its own, which is one fewer
 * type and the correct markup: a caption belongs to the picture it describes, and a
 * standalone caption block would be a paragraph that happens to sit underneath one.
 */
function Figure({ caption, children }: { caption?: string; children: React.ReactNode }) {
  if (!caption) return <>{children}</>

  return (
    <figure className="m-0">
      {children}
      <figcaption className="measure text-body text-fg-muted mt-6">{caption}</figcaption>
    </figure>
  )
}

function BlockSection({
  block,
  project,
  index,
}: {
  block: CaseStudyBlock
  project: Project
  index: number
}) {
  const seed = `${project.slug}-${index}`
  const bleed = block.kind === 'visual' && block.bleed === true

  return (
    <Section
      label={`${project.title}, ${block.kind} ${index + 1}`}
      bleed={bleed}
      rhythm={false}
      className="py-[calc(var(--gutter)*1.5)]"
    >
      <Reveal y={40}>
        {block.kind === 'copy' && (
          <div className={INSET}>
            {block.lines.map((line) => (
              <p key={line} className="measure text-lead text-fg first:mt-0 mt-4">
                {line}
              </p>
            ))}
          </div>
        )}

        {block.kind === 'visual' && (
          <div className={bleed ? undefined : INSET}>
            <Figure caption={block.caption}>
              <div
                className={
                  block.slots.length > 1
                    ? 'grid gap-[var(--gutter)] sm:grid-cols-2'
                    : undefined
                }
              >
                {block.slots.map((slot, slotIndex) => (
                  <Slot key={slot.note} slot={slot} seed={`${seed}-${slotIndex}`} />
                ))}
              </div>
            </Figure>
          </div>
        )}

        {block.kind === 'loop' && (
          <div className={INSET}>
            <Figure caption={block.caption}>
              {/*
                A still, not a `video`. There is no file yet, and an empty video element is a
                poster attribute pointing at nothing and a request for a source that 404s.
                The element arrives with the clip, along with its `preload="none"`,
                `muted`, `playsinline` and the reduced motion branch that shows the poster.
              */}
              <Slot slot={block.slot} seed={`${seed}-loop`} />
            </Figure>
          </div>
        )}

        {block.kind === 'diagram' && (
          <div className={INSET}>
            <Figure caption={block.caption}>
              <LoopDiagram nodes={block.nodes} />
            </Figure>
          </div>
        )}
      </Reveal>
    </Section>
  )
}
