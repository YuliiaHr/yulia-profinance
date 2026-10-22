import type { Plan } from './plan'
import { diffPlans } from './diff'

/** Backup file of all client plans. The file stays with the advisor; nothing is uploaded. */
export interface BackupFile {
  app: 'yp-planner'
  version: 1
  exportedAt: string
  plans: Plan[]
}

export function makeBackup(plans: Plan[], now = new Date()): BackupFile {
  return { app: 'yp-planner', version: 1, exportedAt: now.toISOString(), plans }
}

export function readBackup(text: string): Plan[] {
  const data = JSON.parse(text) as Partial<BackupFile>
  if (data?.app !== 'yp-planner' || !Array.isArray(data.plans)) throw new Error('not a planner backup')
  return data.plans.filter((p) => p && typeof p.id === 'string' && typeof p.client === 'string')
}

export interface MergeResult {
  plans: Plan[]
  added: number
  updated: number
  kept: number
  /** For each replaced plan: what changed («Що змінив клієнт»). */
  changes: Record<string, string[]>
}

/** Adds plans from a backup: new ones are added, the same plan is replaced only by a newer copy. */
export function mergePlans(current: Plan[], incoming: Plan[]): MergeResult {
  const byId = new Map(current.map((p) => [p.id, p]))
  let added = 0
  let updated = 0
  let kept = 0
  const changes: Record<string, string[]> = {}
  for (const p of incoming) {
    const existing = byId.get(p.id)
    if (!existing) {
      byId.set(p.id, p)
      added++
    } else if ((p.updatedAt ?? 0) > (existing.updatedAt ?? 0)) {
      changes[p.id] = diffPlans(existing, p)
      byId.set(p.id, p)
      updated++
    } else kept++
  }
  return { plans: [...byId.values()], added, updated, kept, changes }
}

export const planFileName = (client: string, now = new Date()) =>
  `план-${(client || 'клієнт').trim().replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '-')}-${now.toISOString().slice(0, 10)}.json`

export const backupFileName = (now = new Date()) =>
  `плани-клієнтів-${now.toISOString().slice(0, 10)}.json`
