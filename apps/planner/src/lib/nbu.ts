import { useEffect, useState } from 'react'

/** Official NBU exchange rates (open API, allows browser requests). */
export interface NbuRates {
  USD: number
  EUR: number
  /** Date the NBU set the rate for, "DD.MM.YYYY". */
  date: string
}

const URL = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json'
const KEY = 'yp.nbu.v1'
const MAX_AGE_MS = 6 * 60 * 60 * 1000

interface Cached {
  rates: NbuRates
  fetchedAt: number
}

export function parseNbu(json: unknown): NbuRates | null {
  if (!Array.isArray(json)) return null
  const find = (cc: string) => json.find((r) => r && r.cc === cc) as { rate?: number; exchangedate?: string } | undefined
  const usd = find('USD')
  const eur = find('EUR')
  if (!usd?.rate || !eur?.rate) return null
  return { USD: usd.rate, EUR: eur.rate, date: usd.exchangedate ?? '' }
}

function readCache(): Cached | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Cached) : null
  } catch {
    return null
  }
}

/** Latest NBU rates; null while loading or if the NBU is unreachable (the plan then uses its own rates). */
export function useNbuRates(): NbuRates | null {
  const cached = readCache()
  const [rates, setRates] = useState<NbuRates | null>(cached?.rates ?? null)

  useEffect(() => {
    if (cached && Date.now() - cached.fetchedAt < MAX_AGE_MS) return
    let alive = true
    fetch(URL)
      .then((r) => r.json())
      .then((json) => {
        const parsed = parseNbu(json)
        if (!parsed || !alive) return
        setRates(parsed)
        try {
          localStorage.setItem(KEY, JSON.stringify({ rates: parsed, fetchedAt: Date.now() }))
        } catch {
          // no storage — fine, we'll just fetch again next time
        }
      })
      .catch(() => {
        // offline or NBU down: keep cached/plan rates
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return rates
}
