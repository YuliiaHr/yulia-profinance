import { budgetTotals } from '../lib/budget'
import { simulateFreedom, type FreedomInput } from '../lib/freedom'
import { monthlyForGoal, monthsUntil } from '../lib/goals'
import { reserveFund } from '../lib/reserve'
import { convert, splitCash } from '../lib/fx'
import type { Plan } from './plan'

export interface AllocationLine {
  target: string
  name: string
  /** What the target needs; null when open-ended (financial freedom). */
  need: number | null
  have: number
}

export interface GoalLine {
  id: string
  name: string
  cost: number
  saved: number
  date: string
  monthly: number
  /** Comes from another step and is edited there. */
  auto?: 'reserve' | 'freedom'
}

/** All numbers the screens show, computed from the plan in one place. */
export function derive(plan: Plan, today = new Date()) {
  const totals = budgetTotals(plan)
  const reserve = reserveFund(totals.fixed, plan.reserve.months, plan.reserve.split)
  const reserveMonths = monthsUntil(plan.reserve.date, today)
  const reserveMonthly = monthlyForGoal(reserve.target, plan.reserve.saved, reserveMonths)

  const f = plan.freedom
  const freedomInput: FreedomInput = {
    age: f.age,
    income: f.income ?? totals.income,
    retireAge: f.retireAge,
    lifeAge: f.lifeAge,
    saveRate: f.saveRate,
    capital: f.capital,
    returnRate: f.returnRate,
    incomeGrowth: f.incomeGrowth,
    inflation: f.inflation,
    pension: f.pension ?? totals.fixed,
  }
  const freedom = simulateFreedom(freedomInput)
  const retireYear = today.getFullYear() + Math.max(0, f.retireAge - f.age)

  const goals: GoalLine[] = [
    {
      id: 'reserve', name: 'Резервний фонд', cost: reserve.target, saved: plan.reserve.saved,
      date: plan.reserve.date, monthly: reserveMonthly, auto: 'reserve',
    },
    ...plan.goals.map((g) => ({ ...g, monthly: monthlyForGoal(g.cost, g.saved, monthsUntil(g.date, today)) })),
    {
      id: 'freedom', name: 'Фінансова свобода', cost: freedom.capitalAtRetirementReal, saved: f.capital,
      date: `${retireYear}-01`, monthly: freedom.monthlySaving, auto: 'freedom',
    },
  ]
  const goalsMonthly = goals.reduce((s, g) => s + g.monthly, 0)

  // Assets earmarked for each target, in the plan currency.
  const toPlan = (amount: number, cur: typeof plan.currency) => convert(amount, cur, plan.currency, plan.rates)
  const assetsTotal = plan.assets.reduce((sum, a) => sum + toPlan(a.amount, a.currency), 0)
  const allocated = (target: string) =>
    plan.assets.filter((a) => a.target === target).reduce((sum, a) => sum + toPlan(a.amount, a.currency), 0)
  const allocation: AllocationLine[] = [
    { target: 'reserve.cash', name: 'Резервний фонд · готівка', need: reserve.parts.cash, have: allocated('reserve.cash') },
    { target: 'reserve.bonds', name: 'Резервний фонд · ОВДП', need: reserve.parts.bonds, have: allocated('reserve.bonds') },
    { target: 'reserve.deposits', name: 'Резервний фонд · депозит, рахунок', need: reserve.parts.deposits, have: allocated('reserve.deposits') },
    ...plan.goals.map((g) => ({ target: g.id, name: g.name || 'Ціль без назви', need: g.cost, have: allocated(g.id) })),
    { target: 'freedom', name: 'Фінансова свобода', need: null, have: allocated('freedom') },
  ]
  const unallocated = allocated('')
  const cashByCurrency = splitCash(reserve.parts.cash, plan.currency, plan.reserve.cashSplit, plan.rates)
  const ladderTotal = plan.reserve.ladder.reduce((sum, b) => sum + toPlan(b.qty * b.price, b.currency), 0)

  const protectionYear = plan.protection.reduce((sum, x) => sum + x.price, 0)

  return { assetsTotal, allocation, unallocated, cashByCurrency, ladderTotal, protectionYear, totals, reserve, reserveMonths, reserveMonthly, freedomInput, freedom, goals, goalsMonthly }
}

export type Derived = ReturnType<typeof derive>
