import type { Row, ToPlan } from '../lib/budget'
import { CURRENCIES, money, type Currency, type PlanCurrency } from '../lib/format'
import { uid } from '../state/plan'
import { NumberInput } from './NumberInput'

interface Props {
  rows: Row[]
  onChange: (rows: Row[]) => void
  currency: PlanCurrency
  /** Converts a row amount into the plan currency (uses the plan's FX rates). */
  toPlan: ToPlan
  addLabel: string
  total?: string
}

/**
 * Editable list of "name — monthly amount" rows. Each amount can be typed in hryvnias or
 * in the plan currency; hryvnia amounts are shown converted next to the field.
 */
export function RowsEditor({ rows, onChange, currency, toPlan, addLabel, total }: Props) {
  const set = (id: string, patch: Partial<Row>) => onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const sum = rows.reduce((s, r) => s + toPlan(r.amount, r.currency), 0)
  const rowCurrency = (r: Row): Currency => r.currency ?? currency
  // New rows use the currency of the last row, so a UAH budget stays in UAH.
  const nextCurrency: Currency = rows.length ? rowCurrency(rows[rows.length - 1]) : 'UAH'

  return (
    <div className="rows">
      {rows.map((r) => {
        const cur = rowCurrency(r)
        const inPlan = toPlan(r.amount, r.currency)
        return (
          <div className="rows__row" key={r.id}>
            <input
              className="rows__name"
              aria-label="Назва"
              value={r.name}
              placeholder="Назва"
              onChange={(e) => set(r.id, { name: e.target.value })}
            />
            <span className="amount">
              <NumberInput label={`${r.name || 'Сума'}, на місяць`} value={r.amount} onChange={(amount) => set(r.id, { amount })} />
              <select
                className="amount__cur"
                aria-label={`Валюта: ${r.name}`}
                value={cur === 'UAH' ? 'UAH' : 'plan'}
                // The switch only says which currency the typed number is in; the number stays.
                onChange={(e) => set(r.id, { currency: e.target.value === 'UAH' ? 'UAH' : currency })}
              >
                <option value="UAH">₴</option>
                <option value="plan">{CURRENCIES[currency].symbol}</option>
              </select>
            </span>
            <span className="rows__conv" title={cur === 'UAH' ? 'Перераховано у валюту плану' : 'На рік'}>
              {r.amount
                ? cur === 'UAH'
                  ? <>≈ {money(inPlan, currency)}</>
                  : <>{money(inPlan * 12, currency)}<span className="muted">/рік</span></>
                : ''}
            </span>
            <button type="button" className="icon-btn" aria-label={`Видалити «${r.name}»`} onClick={() => onChange(rows.filter((x) => x.id !== r.id))}>
              ×
            </button>
          </div>
        )
      })}
      <div className="rows__foot">
        <button type="button" className="link-btn" onClick={() => onChange([...rows, { id: uid(), name: '', amount: 0, currency: nextCurrency }])}>
          + {addLabel}
        </button>
        {total && (
          <span className="rows__total">
            {total}: <b>{money(sum, currency)}</b>
            <span className="muted"> / міс</span>
          </span>
        )}
      </div>
    </div>
  )
}
