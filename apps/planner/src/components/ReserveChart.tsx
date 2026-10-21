import { useState } from 'react'
import { money, percent, type Currency, type PlanCurrency } from '../lib/format'
import type { Bond } from '../state/plan'
import { Term } from './Term'

interface Props {
  target: number
  parts: { cash: number; bonds: number; deposits: number }
  /** Shares as set by the advisor (0..1) — shown instead of shares of rounded amounts. */
  shares: { cash: number; bonds: number; deposits: number }
  cashByCurrency: Record<Currency, number>
  /** Shares of the cash part per currency (0..1). */
  cashShares: Record<Currency, number>
  ladder: Bond[]
  currency: PlanCurrency
}

// Validated with the dataviz palette checker on the cream surface (CVD-safe, ≥3:1 contrast).
const PARTS = [
  {
    key: 'cash' as const,
    color: '#E2580B',
    title: 'Готівка',
    access: 'Одразу — навіть без світла та зв’язку',
    role: 'На перші дні надзвичайної ситуації',
  },
  {
    key: 'bonds' as const,
    color: '#2F6DB5',
    title: 'ОВДП',
    access: 'Продаж за кілька хвилин, кошти — до 1 робочого дня',
    role: 'Основна частина: гроші працюють і захищені від інфляції',
  },
  {
    key: 'deposits' as const,
    color: '#5E8C4F',
    title: 'Депозит, рахунок, стейблкоїни',
    access: 'Рахунок і стейблкоїни — одразу; строковий депозит — після закінчення строку',
    role: 'Запас, що приносить відсоток',
  },
]

const CASH_TINTS: Array<[Currency, string, string]> = [
  ['UAH', 'Гривні', '#E2580B'],
  ['USD', 'Долари', '#EE8A4F'],
  ['EUR', 'Євро', '#F5B48C'],
]

/** Infographic: how the emergency fund is split and how fast each part can be used. */
export function ReserveChart({ target, parts, shares, cashByCurrency, cashShares, ladder, currency }: Props) {
  const [hover, setHover] = useState<string | null>(null)
  const total = parts.cash + parts.bonds + parts.deposits
  const shareSum = shares.cash + shares.bonds + shares.deposits || 1
  if (target <= 0 || total <= 0) {
    return <p className="small muted">Схема з’явиться, щойно будуть постійні витрати на кроці «Доходи».</p>
  }
  const cashShareSum = CASH_TINTS.reduce((s, [cur]) => s + (cashShares[cur] || 0), 0)

  return (
    <figure className="rchart" aria-label="Як розподілити резервний фонд">
      <div className="rchart__bar" role="img" aria-label={PARTS.map((p) => `${p.title} ${money(parts[p.key], currency)}`).join(', ')}>
        {PARTS.filter((p) => shares[p.key] > 0).map((p) => {
          const share = shares[p.key] / shareSum
          return (
            <div
              key={p.key}
              className={`rchart__seg${hover && hover !== p.key ? ' is-dim' : ''}`}
              style={{ flexGrow: share, background: p.color }}
              onPointerEnter={() => setHover(p.key)}
              onPointerLeave={() => setHover(null)}
              title={`${p.title}: ${money(parts[p.key], currency)} (${percent(share)})`}
            >
              {share >= 0.14 && <span>{percent(share)}</span>}
            </div>
          )
        })}
      </div>

      <div className="rchart__cards">
        {PARTS.map((p) => {
          const share = shares[p.key] / shareSum
          return (
            <div
              key={p.key}
              className={`rchart__card${hover === p.key ? ' is-hover' : ''}`}
              onPointerEnter={() => setHover(p.key)}
              onPointerLeave={() => setHover(null)}
            >
              <p className="rchart__title">
                <i style={{ background: p.color }} aria-hidden="true" />
                {p.key === 'bonds' ? <Term k="ovdp" /> : p.title}
              </p>
              <p className="rchart__amount">
                {money(parts[p.key], currency)} <span className="muted">{percent(share)}</span>
              </p>
              <p className="rchart__role">{p.role}</p>
              <p className="rchart__access"><b>Доступ:</b> {p.access}</p>

              {p.key === 'cash' && cashShareSum > 0 && (
                <div className="rchart__sub">
                  <div className="rchart__minibar" aria-hidden="true">
                    {CASH_TINTS.map(([cur, , color]) =>
                      cashShares[cur] > 0 ? <span key={cur} style={{ flexGrow: cashShares[cur] / cashShareSum, background: color }} /> : null,
                    )}
                  </div>
                  <ul>
                    {CASH_TINTS.map(([cur, label, color]) => (
                      <li key={cur}><i style={{ background: color }} aria-hidden="true" />{label}: <b>{money(cashByCurrency[cur], cur)}</b> <span className="muted">{percent(cashShares[cur] || 0)}</span></li>
                    ))}
                  </ul>
                </div>
              )}

              {p.key === 'bonds' && ladder.length > 0 && (
                <div className="rchart__sub">
                  <p className="small"><Term k="ladder">Драбина</Term>: погашення через</p>
                  <ol className="rchart__steps">
                    {[...ladder].sort((a, b) => a.months - b.months).map((b) => (
                      <li key={b.id} style={{ height: `${12 + Math.min(b.months, 24) * 2}px` }} title={`${b.qty} шт × ${b.price}`}>
                        <span>{b.months} міс</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <figcaption className="small muted">
        Фонд — {money(target, currency)}; суми частин округлено вгору до сотень. Частки змінюються в полях нижче — схема оновлюється одразу.
      </figcaption>
    </figure>
  )
}
