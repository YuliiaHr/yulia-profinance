import { describe, expect, it } from 'vitest'
import { budgetTotals } from './budget'
import { reserveFund } from './reserve'
import { monthlyForGoal, monthsUntil } from './goals'
import { simulateFreedom, type FreedomInput } from './freedom'
import { parseNumber } from './format'
import { CATEGORIES, PROGRAMS } from '../data/insurance'

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
  it('converts hryvnia rows into the plan currency', () => {
    const toUsd = (amount: number, cur?: string) => (cur === 'UAH' ? amount / 40 : amount)
    const t = budgetTotals(
      { income: [{ id: 'a', name: '', amount: 80000, currency: 'UAH' }, { id: 'b', name: '', amount: 500 }], fixed: [], wants: [], charity: [] },
      toUsd,
    )
    expect(t.income).toBe(2500)
  })

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

describe('insurance data', () => {
  it('uses only known categories and row keys, with unique ids', () => {
    const ids = new Set<string>()
    for (const p of PROGRAMS) {
      const cat = CATEGORIES.find((c) => c.id === p.category)
      expect(cat, p.id).toBeDefined()
      const keys = new Set(cat!.rows.map((r) => r.key))
      for (const k of Object.keys(p.facts)) expect(keys.has(k), `${p.id}.${k}`).toBe(true)
      expect(ids.has(p.id), p.id).toBe(false)
      ids.add(p.id)
    }
  })
  it('has no Russian-only letters left', () => {
    const text = JSON.stringify([CATEGORIES, PROGRAMS.map((p) => [p.name, p.facts])])
    expect(text).not.toMatch(/[ыэъё]/i)
  })
})

import { convert, splitCash, DEFAULT_RATES } from './fx'
import { rebalance } from './portfolio'

describe('fx', () => {
  it('converts through hryvnia', () => {
    expect(convert(100, 'USD', 'UAH', DEFAULT_RATES)).toBeCloseTo(4350)
    expect(convert(4350, 'UAH', 'USD', DEFAULT_RATES)).toBeCloseTo(100)
    expect(convert(118, 'EUR', 'USD', { UAH: 1, USD: 43.5, EUR: 43.5 * 1.18 })).toBeCloseTo(139.24)
  })
  it('splits reserve cash like the spreadsheet', () => {
    // 'Резервний фонд'!C12:C14 with cash = 2500 $
    const r = splitCash(2500, 'USD', { UAH: 0.2, USD: 0.4, EUR: 0.4 }, { UAH: 1, USD: 43.5, EUR: 43.5 * 1.18 })
    expect(r).toEqual({ UAH: 22000, USD: 1000, EUR: 900 })
  })
})

describe('rebalance', () => {
  it('splits a deposit to reach target weights', () => {
    const r = rebalance(
      [
        { ticker: 'A', weight: 0.6, qty: 10, price: 10 },
        { ticker: 'B', weight: 0.4, qty: 10, price: 10 },
      ],
      100,
    )
    expect(r.total).toBe(200)
    expect(r.lines[0].trade).toBeCloseTo(8)
    expect(r.lines[1].trade).toBeCloseTo(2)
    expect(r.lines[0].actualWeight).toBeCloseTo(0.5)
  })
  it('rounds whole shares towards zero', () => {
    const r = rebalance([{ ticker: 'A', weight: 1, qty: 0, price: 30 }], 100)
    expect(r.lines[0].trade).toBeCloseTo(3.333, 2)
    expect(r.lines[0].tradeWhole).toBe(3)
    expect(r.lines[0].tradeValue).toBe(90)
  })
})

import { MARKET, MARKET_AS_OF } from '../data/assumptions'

describe('market assumptions', () => {
  it('has a valid date and either a source or an explicit warning', () => {
    expect(Number.isNaN(new Date(MARKET_AS_OF).getTime())).toBe(false)
    for (const m of MARKET) expect(Boolean(m.source) || m.unverified, m.label).toBe(true)
  })
})

import { parseNbu } from './nbu'
import { derive } from '../state/derive'
import { newPlan } from '../state/plan'

describe('NBU rates', () => {
  const sample = [
    { r030: 840, txt: 'Долар США', rate: 44.9801, cc: 'USD', exchangedate: '15.10.2026' },
    { r030: 978, txt: 'Євро', rate: 52.1, cc: 'EUR', exchangedate: '15.10.2026' },
  ]
  it('parses the NBU response', () => {
    expect(parseNbu(sample)).toEqual({ USD: 44.9801, EUR: 52.1, date: '15.10.2026' })
    expect(parseNbu({ error: 1 })).toBeNull()
  })
  it('uses NBU rates unless the plan has manual rates', () => {
    const nbu = parseNbu(sample)
    const p = newPlan()
    expect(derive(p, nbu).rates.USD).toBe(44.9801)
    expect(derive({ ...p, ratesSource: 'manual' }, nbu).rates.USD).toBe(p.rates.USD)
    expect(derive(p, null).rates.USD).toBe(p.rates.USD)
  })
})
