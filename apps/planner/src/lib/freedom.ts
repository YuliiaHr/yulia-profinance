/**
 * Financial freedom (retirement) model, ported 1:1 from the "Модель" sheet of the
 * advisor's spreadsheet. Yearly steps; contributions are added at the end of each year.
 */
export interface FreedomInput {
  age: number
  /** Monthly income now. */
  income: number
  retireAge: number
  lifeAge: number
  /** Share of monthly income put aside, 0..1. */
  saveRate: number
  /** Capital already saved. */
  capital: number
  /** Average nominal yearly return, 0..1. */
  returnRate: number
  /** Yearly income growth, 0..1. */
  incomeGrowth: number
  /** Yearly inflation of the plan currency, 0..1. */
  inflation: number
  /** Desired monthly pension in today's money. */
  pension: number
}

export interface FreedomYear {
  age: number
  /** Monthly income (nominal); 0 after retirement. */
  income: number
  /** Capital (nominal) and in today's money. */
  capital: number
  capitalReal: number
  /** Monthly "live on interest" income in today's money; 0 outside retirement. */
  interestPensionReal: number
  /** Option 1: what is left (today's money) if paying yourself the fixed pension. */
  remainingReal: number
}

export interface FreedomResult {
  years: FreedomYear[]
  monthlySaving: number
  capitalAtRetirementReal: number
  /** Last age with money left when paying the fixed pension; null = never runs out within the horizon. */
  lastsUntilAge: number | null
  /** Average monthly "live on interest" income during retirement, today's money. */
  interestPensionReal: number
  coversPension: boolean
}

/** Same horizon as the spreadsheet: 88 rows from the current age. */
export const HORIZON_YEARS = 87

export function simulateFreedom(p: FreedomInput): FreedomResult {
  const years: FreedomYear[] = []
  let capital = p.capital
  let deflator = 1
  let remaining = 0
  let lastPositive = 0
  let interestSum = 0
  let interestCount = 0
  let capitalAtRetirementReal = 0

  for (let t = 0; t <= HORIZON_YEARS; t++) {
    const age = p.age + t
    if (t > 0) deflator /= 1 + p.inflation
    const income = t === 0 ? p.income : age >= p.retireAge ? 0 : p.income * (1 + p.incomeGrowth) ** t

    if (age <= p.retireAge) capital = capital * (1 + p.returnRate) + p.saveRate * income * 12
    const capitalReal = capital * deflator

    const interest = age >= p.retireAge && age <= p.lifeAge ? (capital * p.returnRate) / 12 : 0
    const interestReal = age >= p.retireAge ? interest * deflator : 0
    if (interestReal > 0) {
      interestSum += interestReal
      interestCount++
    }

    const yearlySpend = age >= p.retireAge ? (p.pension / deflator) * 12 : 0
    if (age === p.retireAge) remaining = (capital - yearlySpend) * (1 + p.returnRate)
    else if (age > p.retireAge) remaining = (remaining - yearlySpend) * (1 + p.returnRate)
    if (age >= p.retireAge && remaining > 0) lastPositive = age
    if (age === p.retireAge) capitalAtRetirementReal = capitalReal

    years.push({
      age,
      income,
      capital,
      capitalReal,
      interestPensionReal: interestReal,
      remainingReal: age >= p.retireAge ? Math.max(0, remaining) * deflator : capitalReal,
    })
  }

  const last = years[years.length - 1]
  const interestPensionReal = interestCount ? interestSum / interestCount : 0
  return {
    years,
    monthlySaving: p.income * p.saveRate,
    capitalAtRetirementReal,
    lastsUntilAge: last.age >= p.retireAge && remaining > 0 ? null : lastPositive || null,
    interestPensionReal,
    coversPension: interestPensionReal >= p.pension,
  }
}
