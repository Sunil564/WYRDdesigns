import { Section } from '@/components/layout/Section'
import { ProjectImage } from '@/components/ui/ProjectImage'
import { Reveal } from '@/components/ui/Reveal'
import type { Project } from '@/content/projects'

/**
 * The three body frames, in order. Index 1 is the bleed slot, so the 16:9 frame sits there
 * and the two 4:3 frames take the insets either side of it.
 */
const BLOCK_IMAGES = [
  (project: Project) => project.images.blockInset1,
  (project: Project) => project.images.blockBleed,
  (project: Project) => project.images.blockInset2,
] as const

/**
 * How many body blocks a case study renders. Brief 6.3 asks for three to five.
 *
 * Three, which is now the number of body frames each project has rather than a judgement
 * about how many empty placeholders a reader will tolerate. It was the latter.
 */
const BLOCK_COUNT = BLOCK_IMAGES.length

/**
 * The body of a case study: alternating full bleed and inset visuals. Brief 6.3.
 *
 * There are no captions. A caption on a placeholder visual would be invented copy about a
 * project nobody has described yet, and the rule is that an absent element beats a
 * plausible one. The blocks carry the layout and nothing else until there is something
 * true to say beside them.
 */
export function CaseStudyBlocks({ project }: { project: Project }) {
  return (
    <>
      {Array.from({ length: BLOCK_COUNT }, (_unused, index) => {
        const bleed = index % 2 === 1
        return (
          <Section
            key={index}
            label={`${project.title}, visual ${index + 1}`}
            bleed={bleed}
            rhythm={false}
            className="py-[calc(var(--gutter)*2)]"
          >
            <Reveal y={40}>
              <div className={bleed ? undefined : 'mx-auto max-w-[62rem]'}>
                {/*
                  Three frames alternating bleed and inset. The bleed slot was 21:9 and the
                  inset 16:10; both now take the ratio of the image that fills them, 16:9
                  and 4:3, so nothing is cropped to fit a shape it was not composed for.
                */}
                <ProjectImage
                  image={BLOCK_IMAGES[index]!(project)}
                  sizes={bleed ? '100vw' : '(min-width: 64rem) 992px, 92vw'}
                />
              </div>
            </Reveal>
          </Section>
        )
      })}
    </>
  )
}
