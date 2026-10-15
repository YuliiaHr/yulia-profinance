import type { Row } from '../lib/budget'
import type { Currency, PlanCurrency } from '../lib/format'
import type { ReserveSplit } from '../lib/reserve'
import { DEFAULT_RATES, type Rates } from '../lib/fx'
import { BOND_LADDER, INSTRUMENTS, TASKS, type TaskStage, type TaskStatus } from '../data/templates'

export interface Goal {
  id: string
  name: string
  cost: number
  saved: number
  /** "YYYY-MM" */
  date: string
}

export interface FreedomSettings {
  age: number
  retireAge: number
  lifeAge: number
  saveRate: number
  capital: number
  returnRate: number
  incomeGrowth: number
  inflation: number
  /** null → use total monthly income from the budget. */
  income: number | null
  /** null → use fixed expenses from the budget. */
  pension: number | null
}

export interface ChosenInsurance {
  /** Program id from data/insurance.ts */
  id: string
  /** Yearly price in the plan currency, typed by the advisor. */
  price: number
}

/** Where an asset is earmarked: a reserve part, a goal id, 'freedom' or '' (free). */
export type AssetTarget = string

export interface Asset {
  id: string
  name: string
  amount: number
  currency: Currency
  target: AssetTarget
}

export interface Bond {
  id: string
  qty: number
  price: number
  currency: Currency
  months: number
  note: string
}

export interface Instrument {
  id: string
  assetClass: string
  ticker: string
  name: string
  isin: string
  weight: number
  currency: string
  domicile: string
  description: string
  ter: number
  buyNote: string
  factsheet?: string
  /** For the rebalance calculator. */
  qty: number
  price: number
}

export interface Task {
  id: string
  stage: TaskStage
  title: string
  status: TaskStatus
  date: string
  note: string
  link?: string
}

export interface Plan {
  id: string
  client: string
  updatedAt: number
  currency: PlanCurrency
  income: Row[]
  fixed: Row[]
  wants: Row[]
  charity: Row[]
  reserve: {
    months: number
    split: ReserveSplit
    saved: number
    date: string
    /** Shares of the cash part kept in each currency. */
    cashSplit: Record<Currency, number>
    ladder: Bond[]
  }
  /** Manual rates; used when ratesSource is 'manual' or the NBU is unreachable. */
  rates: Rates
  ratesSource: 'nbu' | 'manual'
  assets: Asset[]
  portfolio: Instrument[]
  rebalanceDeposit: number
  tasks: Task[]
  goals: Goal[]
  protection: ChosenInsurance[]
  freedom: FreedomSettings
}

export const uid = () => Math.random().toString(36).slice(2, 10)

/** Template rows are in hryvnias: most clients count their budget in UAH. */
const row = (name: string, amount = 0, currency: Currency = 'UAH'): Row => ({ id: uid(), name, amount, currency })

function monthFromNow(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Empty plan with the usual categories, for a new client. */
export function newPlan(client = 'Новий клієнт'): Plan {
  return {
    id: uid(),
    client,
    updatedAt: Date.now(),
    currency: 'USD',
    income: [row('Зарплата'), row('Премії, бонуси'), row('Підробітки')],
    fixed: [row('Житло'), row('Продукти'), row('Комунальні'), row('Здоров’я'), row('Транспорт')],
    wants: [row('Кафе'), row('Одяг'), row('Краса'), row('Подорожі'), row('Підписки'), row('Розваги, інше')],
    charity: [row('Благодійність')],
    reserve: {
      months: 6, split: { cash: 0.4, bonds: 0.4, deposits: 0.2 }, saved: 0, date: monthFromNow(12),
      cashSplit: { UAH: 0.2, USD: 0.4, EUR: 0.4 }, ladder: [],
    },
    rates: { ...DEFAULT_RATES },
    ratesSource: 'nbu',
    assets: [],
    portfolio: INSTRUMENTS.map((x) => ({ ...x, id: uid(), qty: 0, price: 0 })),
    rebalanceDeposit: 0,
    tasks: TASKS.map((t) => ({ ...t, id: uid(), status: 'todo' as const, date: '' })),
    goals: [],
    protection: [],
    freedom: {
      age: 30, retireAge: 60, lifeAge: 85, saveRate: 0.1, capital: 0,
      returnRate: 0.06, incomeGrowth: 0, inflation: 0.02, income: null, pension: null,
    },
  }
}

/** Filled-in example shown on first visit, so it's clear how the planner works. */
export function examplePlan(): Plan {
  const p = newPlan('Приклад')
  // Salary and rent in dollars, everyday spending in hryvnias — a typical mix.
  const amounts: Record<string, [number, Currency]> = {
    Зарплата: [2000, 'USD'], Житло: [450, 'USD'], Продукти: [14000, 'UAH'], Комунальні: [3500, 'UAH'],
    'Здоров’я': [3000, 'UAH'], Транспорт: [1800, 'UAH'], Кафе: [2600, 'UAH'], Одяг: [5000, 'UAH'],
    Краса: [3500, 'UAH'], Подорожі: [200, 'USD'], Підписки: [1000, 'UAH'], 'Розваги, інше': [3000, 'UAH'],
    Благодійність: [1700, 'UAH'],
  }
  for (const list of [p.income, p.fixed, p.wants, p.charity]) {
    for (const r of list) {
      const [amount, currency] = amounts[r.name] ?? [0, 'UAH']
      r.amount = amount
      r.currency = currency
    }
  }
  p.reserve.saved = 1500
  p.reserve.ladder = BOND_LADDER.map((b) => ({ ...b, id: uid() }))
  p.assets = [
    { id: uid(), name: 'Готівка', amount: 1000, currency: 'USD', target: 'reserve.cash' },
    { id: uid(), name: 'ОВДП', amount: 500, currency: 'USD', target: 'reserve.bonds' },
    { id: uid(), name: 'Банка на подорож', amount: 13000, currency: 'UAH', target: '' },
  ]
  const trip = uid()
  p.goals = [
    { id: uid(), name: 'Автомобіль', cost: 8000, saved: 0, date: monthFromNow(36) },
    { id: trip, name: 'Подорож', cost: 1500, saved: 300, date: monthFromNow(8) },
  ]
  p.assets[2].target = trip
  p.freedom = { ...p.freedom, age: 31, retireAge: 60, saveRate: 0.15 }
  return p
}
