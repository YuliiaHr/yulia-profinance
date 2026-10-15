import { useCallback, useEffect, useState } from 'react'
import { examplePlan, newPlan, type Plan } from './plan'

/** Everything stays in this browser (decision in docs/decisions.md). */
const KEY = 'yp.planner.v1'

interface Saved {
  plans: Plan[]
  currentId: string
}

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as Saved
      // Plans saved by older versions miss newer fields.
      if (s.plans?.length) return { ...s, plans: s.plans.map(upgrade) }
    }
  } catch {
    // storage blocked or corrupted — start fresh
  }
  const p = examplePlan()
  return { plans: [p], currentId: p.id }
}

function upgrade(p: Plan): Plan {
  const fresh = newPlan()
  return { ...fresh, ...p, reserve: { ...fresh.reserve, ...p.reserve } }
}

export function usePlans() {
  const [state, setState] = useState<Saved>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // nothing to do: the planner still works, just without memory
    }
  }, [state])

  const plan = state.plans.find((p) => p.id === state.currentId) ?? state.plans[0]

  const update = useCallback((change: (p: Plan) => Plan) => {
    setState((s) => ({
      ...s,
      plans: s.plans.map((p) => (p.id === s.currentId ? { ...change(p), updatedAt: Date.now() } : p)),
    }))
  }, [])

  const select = (id: string) => setState((s) => ({ ...s, currentId: id }))

  const create = () => {
    const p = newPlan()
    setState((s) => ({ plans: [...s.plans, p], currentId: p.id }))
  }

  const remove = (id: string) =>
    setState((s) => {
      const plans = s.plans.filter((p) => p.id !== id)
      if (!plans.length) plans.push(newPlan())
      return { plans, currentId: plans[0].id }
    })

  return { plans: state.plans, plan, update, select, create, remove }
}
