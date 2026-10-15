import type { Currency } from './format'

export interface Row {
  id: string
  name: string
  /** Monthly amount, net (after taxes), in `currency`. */
  amount: number
  /** Currency the amount was typed in; missing = plan currency. */
  currency?: Currency
}

/** Converts a row amount into the plan currency. */
export type ToPlan = (amount: number, currency?: Currency) => number

export interface Budget {
  income: Row[]
  fixed: Row[]
  wants: Row[]
  charity: Row[]
}

export interface BudgetTotals {
  income: number
  fixed: number
  wants: number
  charity: number
  expenses: number
  /** "Вікно заощаджень": what is left every month after all expenses. */
  savings: number
}

const same: ToPlan = (amount) => amount

export const sumRows = (rows: Row[], toPlan: ToPlan = same): number =>
  rows.reduce((s, r) => s + toPlan(r.amount || 0, r.currency), 0)

export function budgetTotals(b: Budget, toPlan: ToPlan = same): BudgetTotals {
  const income = sumRows(b.income, toPlan)
  const fixed = sumRows(b.fixed, toPlan)
  const wants = sumRows(b.wants, toPlan)
  const charity = sumRows(b.charity, toPlan)
  const expenses = fixed + wants + charity
  return { income, fixed, wants, charity, expenses, savings: income - expenses }
}
