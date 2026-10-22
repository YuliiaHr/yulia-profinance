import type { MergeResult } from './backup'
import type { Author, Plan } from './plan'

/** What the planner UI needs from a plan store — local (browser) or cloud (Supabase). */
export interface PlansApi {
  mode: 'local' | 'cloud'
  plans: Plan[]
  plan: Plan | undefined
  update: (change: (p: Plan) => Plan) => void
  select: (id: string) => void
  create: () => void
  remove: (id: string) => void
  importPlans: (incoming: Plan[]) => MergeResult
  /** Who is writing comments. */
  role: Author
  /** Local mode only: role can be switched by hand. */
  setRole?: (r: Author) => void
  canManage: boolean
  /** Cloud only. */
  saveState?: 'saved' | 'saving' | 'error'
  review?: { changes: string[]; markSeen: () => void }
  access?: {
    email: string | null
    grant: (email: string) => Promise<{ password: string | null }>
    revoke: () => Promise<void>
    resetPassword: () => Promise<string>
  }
}
