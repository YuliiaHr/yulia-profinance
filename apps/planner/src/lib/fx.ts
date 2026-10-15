import type { Currency } from './format'

/** Price of 1 unit of each currency in hryvnias (UAH is always 1). */
export type Rates = Record<Currency, number>

export const DEFAULT_RATES: Rates = { UAH: 1, USD: 43.5, EUR: 51.3 }

export function convert(amount: number, from: Currency, to: Currency, rates: Rates): number {
  if (from === to) return amount
  return (amount * rates[from]) / rates[to]
}

/** Cash part of the reserve held in several currencies, rounded up like in the spreadsheet. */
export function splitCash(
  cash: number,
  planCurrency: Currency,
  shares: Record<Currency, number>,
  rates: Rates,
): Record<Currency, number> {
  const out = {} as Record<Currency, number>
  for (const cur of Object.keys(shares) as Currency[]) {
    const step = cur === 'UAH' ? 1000 : 100
    const v = convert(cash * shares[cur], planCurrency, cur, rates)
    out[cur] = Math.ceil(v / step - 1e-9) * step
  }
  return out
}
