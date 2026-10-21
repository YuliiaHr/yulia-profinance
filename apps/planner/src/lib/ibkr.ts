/**
 * Reads positions from an Interactive Brokers CSV export. Supports:
 *  - Activity Statement CSV: sections like "Open Positions,Header,…" / "Open Positions,Data,Summary,…",
 *    with ISINs from the "Financial Instrument Information" section;
 *  - flat CSV with one header row (Flex Query "Open Positions", portfolio exports).
 * Everything runs in the browser; the file is never uploaded.
 */

export interface IbkrPosition {
  symbol: string
  isin: string
  quantity: number
  price: number
  currency: string
  description: string
}

export interface IbkrReport {
  positions: IbkrPosition[]
  /** Statement period or date, if the file has one. */
  date: string
}

/** CSV line → cells (handles quotes, commas and "" inside quotes). */
export function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') quoted = false
      else cur += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out.map((c) => c.trim())
}

const num = (v: string | undefined) => {
  if (!v) return NaN
  return Number(v.replace(/[\s ,](?=\d{3}\b)/g, '').replace(/[^\d.\-]/g, ''))
}

const COLS = {
  symbol: ['symbol', 'financial instrument', 'instrument', 'ticker'],
  quantity: ['quantity', 'position', 'qty', 'shares'],
  price: ['close price', 'markprice', 'mark price', 'last', 'last price', 'price', 'close'],
  currency: ['currency', 'currencyprimary', 'currency primary'],
  isin: ['isin', 'security id', 'securityid'],
  description: ['description', 'name'],
  assetClass: ['asset category', 'assetclass', 'asset class'],
  discriminator: ['datadiscriminator', 'level of detail', 'levelofdetail'],
}

function indexOf(header: string[], names: string[]): number {
  const h = header.map((x) => x.toLowerCase().replace(/[_"]/g, '').trim())
  for (const n of names) {
    const i = h.indexOf(n)
    if (i >= 0) return i
  }
  return -1
}

function rowToPosition(header: string[], row: string[]): IbkrPosition | null {
  const get = (key: keyof typeof COLS) => {
    const i = indexOf(header, COLS[key])
    return i >= 0 ? row[i] ?? '' : ''
  }
  const disc = get('discriminator').toLowerCase()
  if (disc && disc !== 'summary') return null // skip per-lot rows
  const assetClass = get('assetClass').toLowerCase()
  if (assetClass && /forex|cash|валют/.test(assetClass)) return null
  const symbol = get('symbol').split(/\s+/)[0]
  const quantity = num(get('quantity'))
  const price = num(get('price'))
  if (!symbol || /^total/i.test(symbol) || !Number.isFinite(quantity) || quantity === 0) return null
  return {
    symbol: symbol.toUpperCase(),
    isin: get('isin').toUpperCase(),
    quantity,
    price: Number.isFinite(price) ? price : 0,
    currency: get('currency').toUpperCase(),
    description: get('description'),
  }
}

export function parseIbkrCsv(text: string): IbkrReport {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim())
  const rows = lines.map(parseCsvLine)
  const positions: IbkrPosition[] = []
  let date = ''

  const isSectioned = rows.some((r) => r[1] === 'Header' || r[1] === 'Data')
  if (isSectioned) {
    const headers = new Map<string, string[]>()
    const isinBySymbol = new Map<string, string>()
    for (const r of rows) {
      const [section, kind, ...rest] = r
      if (kind === 'Header') headers.set(section, rest)
      if (kind !== 'Data') continue
      const header = headers.get(section)
      if (!header) continue
      if (section === 'Statement' && /period/i.test(rest[0] ?? '')) date = rest[1] ?? ''
      if (/financial instrument information/i.test(section)) {
        const s = rest[indexOf(header, COLS.symbol)]
        const id = rest[indexOf(header, COLS.isin)]
        if (s && id && /^[A-Z]{2}[A-Z0-9]{10}$/.test(id)) isinBySymbol.set(s.toUpperCase(), id)
      }
      if (/open positions/i.test(section)) {
        const p = rowToPosition(header, rest)
        if (p) positions.push(p)
      }
    }
    for (const p of positions) if (!p.isin) p.isin = isinBySymbol.get(p.symbol) ?? ''
  } else {
    const headerIdx = rows.findIndex((r) => indexOf(r, COLS.symbol) >= 0 && indexOf(r, COLS.quantity) >= 0)
    if (headerIdx >= 0) {
      const header = rows[headerIdx]
      for (const r of rows.slice(headerIdx + 1)) {
        const p = rowToPosition(header, r)
        if (p) positions.push(p)
      }
    }
  }
  return { positions, date }
}

/** Finds the report position for an instrument: by ISIN first, then by ticker. */
export function matchPosition(
  x: { isin: string; ticker: string },
  positions: IbkrPosition[],
): IbkrPosition | undefined {
  return (
    (x.isin && positions.find((p) => p.isin === x.isin)) ||
    positions.find((p) => p.symbol === x.ticker.toUpperCase())
  )
}
