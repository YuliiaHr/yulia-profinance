export interface Row {
  id: string
  name: string
  /** Monthly amount, net (after taxes). */
  amount: number
}

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

export const sumRows = (rows: Row[]): number => rows.reduce((s, r) => s + (r.amount || 0), 0)

export function budgetTotals(b: Budget): BudgetTotals {
  const income = sumRows(b.income)
  const fixed = sumRows(b.fixed)
  const wants = sumRows(b.wants)
  const charity = sumRows(b.charity)
  const expenses = fixed + wants + charity
  return { income, fixed, wants, charity, expenses, savings: income - expenses }
}
