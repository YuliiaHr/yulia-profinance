import type { Row } from '../lib/budget'
import { CURRENCIES, money, type Currency } from '../lib/format'
import { uid } from '../state/plan'
import { NumberInput } from './NumberInput'

interface Props {
  rows: Row[]
  onChange: (rows: Row[]) => void
  currency: Currency
  addLabel: string
  total?: string
}

/** Editable list of "name — monthly amount" rows with a total. */
export function RowsEditor({ rows, onChange, currency, addLabel, total }: Props) {
  const set = (id: string, patch: Partial<Row>) => onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const sum = rows.reduce((s, r) => s + r.amount, 0)

  return (
    <div className="rows">
      {rows.map((r) => (
        <div className="rows__row" key={r.id}>
          <input
            className="rows__name"
            aria-label="Назва"
            value={r.name}
            placeholder="Назва"
            onChange={(e) => set(r.id, { name: e.target.value })}
          />
          <NumberInput label={`${r.name || 'Сума'}, на місяць`} value={r.amount} suffix={CURRENCIES[currency].symbol} onChange={(amount) => set(r.id, { amount })} />
          <span className="rows__year" title="На рік">{r.amount ? money(r.amount * 12, currency) : ''}</span>
          <button type="button" className="icon-btn" aria-label={`Видалити «${r.name}»`} onClick={() => onChange(rows.filter((x) => x.id !== r.id))}>
            ×
          </button>
        </div>
      ))}
      <div className="rows__foot">
        <button type="button" className="link-btn" onClick={() => onChange([...rows, { id: uid(), name: '', amount: 0 }])}>
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
