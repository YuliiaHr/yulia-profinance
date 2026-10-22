import { guessKind } from '../data/assetKinds'
import { newPlan, type Plan } from './plan'

/** Fills fields that plans saved by older versions don't have. */
export function upgrade(p: Plan): Plan {
  const fresh = newPlan()
  // Plans in hryvnias are no longer supported: switch to dollars (rare, early test plans).
  const currency = (p.currency as string) === 'UAH' ? 'USD' : p.currency
  const assets = (p.assets ?? []).map((a) => (a.kind ? a : { ...a, kind: guessKind(a.name) }))
  return { ...fresh, ...p, currency, assets, reserve: { ...fresh.reserve, ...p.reserve } }
}
