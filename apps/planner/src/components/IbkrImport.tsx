import { useRef, useState } from 'react'
import { convert, type Rates } from '../lib/fx'
import { CURRENCIES, type Currency, type PlanCurrency } from '../lib/format'
import { matchPosition, parseIbkrCsv, type IbkrPosition } from '../lib/ibkr'
import { uid, type Instrument } from '../state/plan'

interface Props {
  instruments: Instrument[]
  currency: PlanCurrency
  rates: Rates
  onApply: (instruments: Instrument[]) => void
}

const KNOWN: Currency[] = ['USD', 'EUR', 'UAH']

/** "Завантажити звіт IBKR": fills quantities and prices of the rebalance table from a CSV export. */
export function IbkrImport({ instruments, currency, rates, onApply }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [result, setResult] = useState<{ updated: string[]; unmatched: IbkrPosition[]; error?: string } | null>(null)

  const toPlan = (p: IbkrPosition) => {
    const from = KNOWN.includes(p.currency as Currency) ? (p.currency as Currency) : currency
    return Math.round(convert(p.price, from, currency, rates) * 100) / 100
  }
  const note = (date: string) => `з IBKR${date ? `, ${ukDate(date)}` : ''}`
  const price2 = (v: number) => `${v.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${CURRENCIES[currency].symbol}`

  const onFile = async (file: File) => {
    try {
      const report = parseIbkrCsv(await file.text())
      if (!report.positions.length) {
        setResult({ updated: [], unmatched: [], error: 'У файлі не знайдено позицій. Потрібен CSV-звіт з розділом «Open Positions».' })
        return
      }
      const used = new Set<IbkrPosition>()
      const updated: string[] = []
      const next = instruments.map((x) => {
        const p = matchPosition(x, report.positions)
        if (!p) return x
        used.add(p)
        updated.push(`${x.ticker} — ${p.quantity} шт по ${price2(toPlan(p))}`)
        return { ...x, qty: p.quantity, price: toPlan(p), priceManual: p.price > 0, priceNote: note(report.date) }
      })
      onApply(next)
      setResult({ updated, unmatched: report.positions.filter((p) => !used.has(p)) })
    } catch {
      setResult({ updated: [], unmatched: [], error: 'Не вдалося прочитати файл. Перевірте, що це CSV-звіт з Interactive Brokers.' })
    }
  }

  const addUnmatched = (p: IbkrPosition) => {
    onApply([
      ...instruments,
      {
        id: uid(), assetClass: '', ticker: p.symbol, name: p.description, isin: p.isin, weight: 0, currency: p.currency || currency,
        domicile: '', description: '', ter: 0, buyNote: '', qty: p.quantity, price: toPlan(p), priceManual: p.price > 0, priceNote: 'з IBKR',
      },
    ])
    setResult((r) => r && { ...r, unmatched: r.unmatched.filter((x) => x !== p) })
  }

  return (
    <div className="ibkr">
      <input
        ref={input}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
      <button type="button" className="btn btn--sm btn--ink" onClick={() => input.current?.click()}>
        Завантажити звіт IBKR (CSV)
      </button>
      <details className="ibkr__help">
        <summary>Як отримати звіт</summary>
        <ol>
          <li>У кабінеті Interactive Brokers відкрийте <b>Performance &amp; Reports → Statements</b>.</li>
          <li>Оберіть <b>Activity Statement</b>, період — останній день, формат — <b>CSV</b>, і завантажте файл.</li>
          <li>Або: <b>Flex Queries</b> з розділом <b>Open Positions</b> у форматі CSV.</li>
        </ol>
        <p className="small muted">Назви меню можуть трохи відрізнятися. Файл читається лише у вашому браузері й нікуди не надсилається.</p>
      </details>
      {result && (
        <div className={`ibkr__result${result.error ? ' is-error' : ''}`} role="status">
          {result.error ? (
            <p>{result.error}</p>
          ) : (
            <>
              <p><b>Оновлено {result.updated.length} з {instruments.length}:</b> {result.updated.join('; ') || 'жоден інструмент портфеля не знайдено у звіті'}</p>
              {result.unmatched.length > 0 && (
                <>
                  <p className="small">У звіті є ще позиції, яких немає в портфелі:</p>
                  <ul>
                    {result.unmatched.map((p) => (
                      <li key={`${p.symbol}-${p.isin}`}>
                        <b>{p.symbol}</b> {p.quantity} шт{p.description && ` · ${p.description}`}{' '}
                        <button type="button" className="link-btn" onClick={() => addUnmatched(p)}>додати в портфель</button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/** "October 1, 2026 - October 20, 2026" → "20.10.2026"; unknown formats are kept as is. */
function ukDate(raw: string): string {
  const last = raw.split(/\s+-\s+/).pop() ?? raw
  const d = new Date(last)
  return Number.isNaN(d.getTime()) ? raw : d.toLocaleDateString('uk-UA')
}
