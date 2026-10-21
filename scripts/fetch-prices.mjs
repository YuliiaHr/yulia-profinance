// Fetches latest prices of the planner's template ETFs from justETF (by ISIN) and writes
// apps/planner/public/prices.json, which ships with the site. Runs in CI on every deploy
// and on the daily schedule. Never fails the build: on errors the planner falls back to
// prices typed by hand.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const templates = readFileSync(join(root, 'apps/planner/src/data/templates.ts'), 'utf8')
const isins = [...new Set([...templates.matchAll(/isin: '([A-Z0-9]{12})'/g)].map((m) => m[1]))]
const out = join(root, 'apps/planner/public/prices.json')

const quotes = {}
for (const isin of isins) {
  try {
    const res = await fetch(`https://www.justetf.com/api/etfs/${isin}/quote?locale=en&currency=USD`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (yulia.profinance planner)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const j = await res.json()
    const price = j?.latestQuote?.raw
    if (typeof price === 'number' && price > 0) {
      quotes[isin] = { price, currency: 'USD', date: j.latestQuoteDate ?? '', source: 'justETF' }
    }
  } catch (e) {
    console.warn(`prices: ${isin} skipped (${e.message})`)
  }
}

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify({ updated: new Date().toISOString(), quotes }, null, 2))
console.log(`prices: ${Object.keys(quotes).length}/${isins.length} written to apps/planner/public/prices.json`)
