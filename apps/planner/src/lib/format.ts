export type Currency = 'USD' | 'EUR' | 'UAH'

export const CURRENCIES: Record<Currency, { symbol: string; label: string }> = {
  USD: { symbol: '$', label: 'Долари, $' },
  EUR: { symbol: '€', label: 'Євро, €' },
  UAH: { symbol: '₴', label: 'Гривні, ₴' },
}

const whole = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 })
const oneDecimal = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 })

export function money(value: number, currency: Currency): string {
  return `${whole.format(Math.round(value))} ${CURRENCIES[currency].symbol}`
}

export function plainNumber(value: number): string {
  return whole.format(Math.round(value))
}

/** 0.155 → "15,5%" */
export function percent(share: number): string {
  return `${oneDecimal.format(share * 100)}%`
}

/** Accepts "1 800,50", "1800.5", "" (→ 0). Returns null for garbage. */
export function parseNumber(text: string): number | null {
  const t = text.replace(/[\s  ]/g, '').replace(',', '.')
  if (t === '' || t === '-') return 0
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}
