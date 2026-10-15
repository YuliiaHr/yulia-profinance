import type { Derived } from '../state/derive'
import type { Plan } from '../state/plan'

export interface SectionProps {
  plan: Plan
  update: (change: (p: Plan) => Plan) => void
  d: Derived
  go: (step: StepId) => void
}

export type StepId = 'budget' | 'reserve' | 'goals' | 'freedom' | 'summary'
