import { describe, expect, it } from 'vitest'
import { budgetTotals } from './budget'
import { reserveFund } from './reserve'
import { monthlyForGoal, monthsUntil } from './goals'
import { simulateFreedom, type FreedomInput } from './freedom'
import { parseNumber } from './format'

// Reference numbers come from the advisor's spreadsheet (sheets "Розрахунок пенсії" / "Модель").
const base: FreedomInput = {
  age: 31, income: 2500, retireAge: 60, lifeAge: 80, saveRate: 0.1, capital: 0,
  returnRate: 0.06, incomeGrowth: 0, inflation: 0.02, pension: 1310.3448275862067,
}

describe('simulateFreedom matches the spreadsheet', () => {
  const cases: Array<[number, number, number, number, number | null]> = [
    // retireAge, saveRate, capital at retirement (today's money), avg interest pension, lasts until
    [60, 0.1, 131866.5759033492, 544.7795481350522, 68],
    [55, 0.19, 190885.72990696592, 753.3913402258297, 69],
    [60, 0.19, 250546.49421636362, 1035.0811414565997, 82],
    [55, 0.33, 331538.37299630913, 1308.521801444862, 95],
    [60, 0.33, 435159.7004810525, 1797.7725088456725, null],
  ]
  it.each(cases)('retire %i, save %f', (retireAge, saveRate, capital, pension, lasts) => {
    const r = simulateFreedom({ ...base, retireAge, saveRate })
    expect(r.capitalAtRetirementReal).toBeCloseTo(capital, 4)
    expect(r.interestPensionReal).toBeCloseTo(pension, 4)
    expect(r.lastsUntilAge).toBe(lasts)
    expect(r.monthlySaving).toBeCloseTo(2500 * saveRate, 6)
  })

  it('reports whether interest covers the pension', () => {
    expect(simulateFreedom({ ...base, retireAge: 60, saveRate: 0.33 }).coversPension).toBe(true)
    expect(simulateFreedom({ ...base, retireAge: 60, saveRate: 0.1 }).coversPension).toBe(false)
  })
})

describe('reserveFund', () => {
  it('rounds the target to 100 and parts up to 100, like the spreadsheet', () => {
    const fixed = 430 + 200 + 14000 / 43.5 + 3000 / 43.5 // ≈ 1020.8
    const r = reserveFund(fixed, 6, { cash: 0.4, bonds: 0.4, deposits: 0.2 })
    expect(r.target).toBe(6100)
    expect(r.parts).toEqual({ cash: 2500, bonds: 2500, deposits: 1300 })
    expect(r.shareTotal).toBeCloseTo(1)
  })
})

describe('budgetTotals', () => {
  it('computes the savings window', () => {
    const row = (amount: number) => ({ id: String(amount), name: '', amount })
    const t = budgetTotals({ income: [row(1800)], fixed: [row(500), row(100)], wants: [row(300)], charity: [row(50)] })
    expect(t).toEqual({ income: 1800, fixed: 600, wants: 300, charity: 50, expenses: 950, savings: 850 })
  })
})

describe('goals', () => {
  const from = new Date(2026, 9, 15) // Oct 2026
  it('counts whole months to a target month', () => {
    expect(monthsUntil('2027-10', from)).toBe(12)
    expect(monthsUntil('2026-01', from)).toBe(0)
    expect(monthsUntil('nonsense', from)).toBe(0)
  })
  it('spreads what is left over the months', () => {
    expect(monthlyForGoal(6000, 0, 12)).toBe(500)
    expect(monthlyForGoal(6000, 1200, 12)).toBe(400)
    expect(monthlyForGoal(6000, 7000, 12)).toBe(0)
    expect(monthlyForGoal(6000, 0, 0)).toBe(6000)
  })
})

describe('parseNumber', () => {
  it('accepts Ukrainian formatting', () => {
    expect(parseNumber('1 800,5')).toBe(1800.5)
    expect(parseNumber('')).toBe(0)
    expect(parseNumber('abc')).toBeNull()
  })
})
