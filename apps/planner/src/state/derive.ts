import { budgetTotals } from '../lib/budget'
import { simulateFreedom, type FreedomInput } from '../lib/freedom'
import { monthlyForGoal, monthsUntil } from '../lib/goals'
import { reserveFund } from '../lib/reserve'
import type { Plan } from './plan'

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

  const protectionYear = plan.protection.reduce((sum, x) => sum + x.price, 0)

  return { protectionYear, totals, reserve, reserveMonths, reserveMonthly, freedomInput, freedom, goals, goalsMonthly }
}

export type Derived = ReturnType<typeof derive>
