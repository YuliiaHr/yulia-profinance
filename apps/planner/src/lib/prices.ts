import { useEffect, useState } from 'react'

/** ETF quotes shipped with the site (scripts/fetch-prices.mjs, refreshed daily). */
export interface Quote {
  price: number
  currency: string
  /** "YYYY-MM-DD" */
  date: string
  source: string
}

export type Quotes = Record<string, Quote>

export function usePrices(): Quotes {
  const [quotes, setQuotes] = useState<Quotes>({})
  useEffect(() => {
    // Relative URL: works at /planner/ on the site and at / locally.
    fetch('./prices.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j?.quotes && setQuotes(j.quotes))
      .catch(() => {
        // no prices: the rebalance table uses prices typed by hand
      })
  }, [])
  return quotes
}

/** Price used for an instrument: the quote, unless the advisor typed their own. */
export function effectivePrice(x: { isin: string; price: number; priceManual?: boolean }, quotes: Quotes) {
  const q = quotes[x.isin]
  return !x.priceManual && q ? { price: q.price, quote: q } : { price: x.price, quote: undefined }
}
