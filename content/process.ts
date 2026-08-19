/**
 * The four process steps. Brief section 6.1 S6, verbatim.
 *
 * Numbered because it is a real sequence, not for decoration.
 */

export type ProcessStep = {
  index: string
  name: string
  line: string
}

export const processSteps: ProcessStep[] = [
  {
    index: '01',
    name: 'Understand',
    line: 'We ask what the business actually needs before we discuss what to make.',
  },
  {
    index: '02',
    name: 'Direct',
    line: 'We decide the idea and the look, and we write the decisions down.',
  },
  {
    index: '03',
    name: 'Make',
    line: 'Design, build, shoot, install. Whatever the job needs.',
  },
  {
    index: '04',
    name: 'Hand over',
    line: 'You get the files, the access, and someone who picks up the phone.',
  },
]
