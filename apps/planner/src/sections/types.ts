import type { Derived } from '../state/derive'
import type { Plan } from '../state/plan'

export interface SectionProps {
  plan: Plan
  update: (change: (p: Plan) => Plan) => void
  d: Derived
  go: (step: StepId) => void
  /** Plans are stored in the cloud (saved automatically). */
  cloud?: boolean
}

export type StepId = 'intro' | 'budget' | 'reserve' | 'protection' | 'goals' | 'assets' | 'freedom' | 'portfolio' | 'actions' | 'summary' | 'assumptions'
