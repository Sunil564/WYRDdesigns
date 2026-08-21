import { Section } from '@/components/layout/Section'
import { Placeholder } from '@/components/ui/Placeholder'
import { Reveal } from '@/components/ui/Reveal'
import type { Project } from '@/content/projects'

/** The variants a body block cycles through, so two neighbours never look alike. */
const VARIANTS = ['lines', 'mesh', 'gradient'] as const

/**
 * How many body blocks a case study renders. Brief 6.3 asks for three to five.
 *
 * Three, and it is not a choice about rhythm: every block is a generated placeholder, and
 * five empty frames read as a longer apology than three do. When real project imagery
 * arrives this becomes the length of that imagery, not a constant.
 */
const BLOCK_COUNT = 3

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
                <Placeholder
                  seed={`${project.seed}-block-${index}`}
                  variant={VARIANTS[index % VARIANTS.length]}
                  aspect={bleed ? 21 / 9 : 16 / 10}
                  note={`Body visual ${index + 1} for ${project.title}, pending cleared project imagery`}
                />
              </div>
            </Reveal>
          </Section>
        )
      })}
    </>
  )
}
