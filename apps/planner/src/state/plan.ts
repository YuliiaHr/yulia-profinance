import type { Row } from '../lib/budget'
import type { Currency } from '../lib/format'
import type { ReserveSplit } from '../lib/reserve'

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

export interface Plan {
  id: string
  client: string
  updatedAt: number
  currency: Currency
  income: Row[]
  fixed: Row[]
  wants: Row[]
  charity: Row[]
  reserve: { months: number; split: ReserveSplit; saved: number; date: string }
  goals: Goal[]
  protection: ChosenInsurance[]
  freedom: FreedomSettings
}

export const uid = () => Math.random().toString(36).slice(2, 10)

const row = (name: string, amount = 0): Row => ({ id: uid(), name, amount })

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
    reserve: { months: 6, split: { cash: 0.4, bonds: 0.4, deposits: 0.2 }, saved: 0, date: monthFromNow(12) },
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
  const amounts: Record<string, number> = {
    Зарплата: 2000, Житло: 450, Продукти: 320, Комунальні: 80, 'Здоров’я': 70, Транспорт: 40,
    Кафе: 60, Одяг: 120, Краса: 80, Подорожі: 200, Підписки: 25, 'Розваги, інше': 70, Благодійність: 40,
  }
  for (const list of [p.income, p.fixed, p.wants, p.charity]) {
    for (const r of list) r.amount = amounts[r.name] ?? 0
  }
  p.reserve.saved = 1500
  p.goals = [
    { id: uid(), name: 'Автомобіль', cost: 8000, saved: 0, date: monthFromNow(36) },
    { id: uid(), name: 'Подорож', cost: 1500, saved: 300, date: monthFromNow(8) },
  ]
  p.freedom = { ...p.freedom, age: 31, retireAge: 60, saveRate: 0.15 }
  return p
}
