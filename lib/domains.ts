export interface DomainConfig {
  name:        string
  icon:        string
  tutor:       string
  tutorIcon:   string
  levels?:     string[]
  levelLabels?: Record<string, string>
}

export const DOMAINS = {
  japanese: {
    name: 'Nihongo', icon: '日', tutor: '先生 Sensei', tutorIcon: '先',
    levels: ['n5','n4','n3','n2','n1'],
    levelLabels: { n5:'N5', n4:'N4', n3:'N3', n2:'N2', n1:'N1' },
  },
  english: {
    name: 'English', icon: 'A', tutor: 'Beeno', tutorIcon: 'B',
    levels: ['a1','a2','b1','b2','c1','c2'],
    levelLabels: { a1:'A1', a2:'A2', b1:'B1', b2:'B2', c1:'C1', c2:'C2' },
  },
  math: {
    name: 'Math', icon: '∑', tutor: 'Dr. Morti', tutorIcon: '∑',
    // levels resolved via getDomainLevels(domain, mathLevelMode)
  },
} satisfies Record<string, DomainConfig>

export type Domain = keyof typeof DOMAINS

export const MATH_LEVEL_MODES = {
  topic: {
    keys:   ['arithmetic','algebra','geometry','trigonometry','calculus','statistics'],
    labels: ['Arithmetic','Algebra','Geometry','Trigonometry','Calculus','Statistics'],
  },
  tier: {
    keys:   ['l1','l2','l3','l4','l5'],
    labels: ['Foundational','Elementary','Intermediate','Advanced','University'],
  },
  combined: {
    keys:   ['arithmetic-1','arithmetic-2','algebra-1','algebra-2','geometry','calculus-1','calculus-2','statistics'],
    labels: ['Arithmetic I','Arithmetic II','Algebra I','Algebra II','Geometry','Calculus I','Calculus II','Statistics'],
  },
} as const

export type MathLevelMode = keyof typeof MATH_LEVEL_MODES

export function getDomainLevels(domain: Domain, mathLevelMode: MathLevelMode = 'topic') {
  if (domain === 'math') {
    return MATH_LEVEL_MODES[mathLevelMode]
  }
  const d = DOMAINS[domain]
  return {
    keys:   d.levels ?? [],
    labels: Object.values(d.levelLabels ?? {}),
  }
}
