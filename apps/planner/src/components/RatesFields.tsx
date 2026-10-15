import { CURRENCIES, type Currency } from '../lib/format'
import type { SectionProps } from '../sections/types'
import { NumberInput } from './NumberInput'

/** USD/EUR rate inputs: NBU rates by default, typing a number switches the plan to manual rates. */
export function RatesFields({ plan, update, d }: Pick<SectionProps, 'plan' | 'update' | 'd'>) {
  const setRate = (cur: Currency, v: number) =>
    update((p) => ({ ...p, ratesSource: 'manual', rates: { ...d.rates, [cur]: v || 1 } }))

  return (
    <div className="rates-block">
      <div className="rates">
        {(['USD', 'EUR'] as Currency[]).map((cur) => (
          <label key={cur} className="rates__item">
            <span>1 {CURRENCIES[cur].symbol} =</span>
            <NumberInput label={`Курс ${cur}`} value={d.rates[cur]} suffix="₴" onChange={(v) => setRate(cur, v)} />
          </label>
        ))}
      </div>
      <p className="small muted">
        {d.ratesInfo.fromNbu ? (
          <>✓ Офіційний курс НБУ на {d.ratesInfo.date}, оновлюється автоматично. Впишіть свій курс, якщо потрібен інший.</>
        ) : plan.ratesSource === 'manual' ? (
          <>
            Курс вписано вручну.{' '}
            <button type="button" className="link-btn" onClick={() => update((p) => ({ ...p, ratesSource: 'nbu' }))}>
              Брати курс НБУ автоматично
            </button>
          </>
        ) : (
          <>Не вдалося отримати курс НБУ (немає інтернету?) — використовується останній відомий курс.</>
        )}
      </p>
    </div>
  )
}
