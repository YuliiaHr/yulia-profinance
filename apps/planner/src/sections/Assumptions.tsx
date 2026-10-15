import { Field } from '../components/Field'
import { NumberInput } from '../components/NumberInput'
import { Term } from '../components/Term'
import { MARKET, MARKET_AS_OF, STALE_AFTER_DAYS, daysSince } from '../data/assumptions'
import { CURRENCIES, type Currency } from '../lib/format'
import type { FreedomSettings } from '../state/plan'
import type { SectionProps } from './types'

export const formatDate = (iso: string) => new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })

export function Assumptions({ plan, update, go }: SectionProps) {
  const f = plan.freedom
  const setF = (patch: Partial<FreedomSettings>) => update((p) => ({ ...p, freedom: { ...p.freedom, ...patch } }))
  const stale = daysSince(MARKET_AS_OF) > STALE_AFTER_DAYS
  const inflationHint =
    plan.currency === 'UAH'
      ? 'Зараз інфляція в Україні 10%, НБУ прогнозує зниження до 5% у 2028 році. Для довгого плану розумно взяти значення між ними.'
      : 'Для долара й євро в довгому плані зазвичай беруть 2–3% на рік.'

  return (
    <div className="split">
      <div className="split__main">
        <p className="lead">
          Усі розрахунки плану спираються на кілька цифр. Тут вони зібрані разом: змініть цифру — і план перерахується
          на всіх кроках.
        </p>

        <section className="group">
          <h3>Припущення цього плану</h3>
          <Field label={<>Валюта плану</>} hint="Змінюється вгорі сторінки.">
            <b>{CURRENCIES[plan.currency].label}</b>
          </Field>
          <Field label={<><Term k="inflation" />, {CURRENCIES[plan.currency].symbol}</>} hint={inflationHint}>
            <NumberInput label="Інфляція" percent value={f.inflation} max={50} suffix="% на рік" onChange={(inflation) => setF({ inflation })} />
          </Field>
          <Field label={<><Term k="returnRate">Дохідність</Term> інвестицій</>} hint={<>Середня на рік, до податків. Для помірно-консервативного <Term k="riskProfile">ризик-профілю</Term> у доларах — близько 6%.</>}>
            <NumberInput label="Дохідність" percent value={f.returnRate} max={50} suffix="% на рік" onChange={(returnRate) => setF({ returnRate })} />
          </Field>
          <Field label={<Term k="incomeGrowth" />}>
            <NumberInput label="Ріст доходу" percent value={f.incomeGrowth} max={50} suffix="% на рік" onChange={(incomeGrowth) => setF({ incomeGrowth })} />
          </Field>
          {(['USD', 'EUR'] as Currency[]).map((cur) => (
            <Field key={cur} label={<><Term k="rates">Курс</Term> {CURRENCIES[cur].symbol}</>} hint={cur === 'USD' ? 'Для перерахунку активів і готівки в різних валютах.' : undefined}>
              <NumberInput label={`Курс ${cur}`} value={plan.rates[cur]} suffix="₴" onChange={(v) => update((p) => ({ ...p, rates: { ...p.rates, [cur]: v || 1 } }))} />
            </Field>
          ))}
          <p className="small muted">
            Де використовується: інфляція, дохідність і ріст доходу — на кроці{' '}
            <button type="button" className="link-btn" onClick={() => go('freedom')}>«Свобода»</button>; курси — на кроках{' '}
            <button type="button" className="link-btn" onClick={() => go('reserve')}>«Резерв»</button> і{' '}
            <button type="button" className="link-btn" onClick={() => go('assets')}>«Активи»</button>.
          </p>
        </section>
      </div>

      <aside className="split__side">
        <div className="card card--ink">
          <p className="overline">Ринкові дані · станом на {formatDate(MARKET_AS_OF)}</p>
          {stale && (
            <p className="warn">Цим даним понад {STALE_AFTER_DAYS} днів. Попросіть Claude «онови припущення».</p>
          )}
          <ul className="market">
            {MARKET.map((m) => (
              <li key={m.label}>
                <span className="market__label">{m.label}</span>
                <b className="market__value">{m.value}</b>
                <span className="market__note">
                  {m.note}
                  {m.unverified && <span className="market__flag"> · ⚠ не підтверджено першоджерелом</span>}
                  {m.source && <> · <a href={m.source.url} target="_blank" rel="noopener">{m.source.label} ↗</a></>}
                </span>
              </li>
            ))}
          </ul>
          <p className="small muted">Це довідка для розмови з клієнтом. Цифри плану ліворуч ви обираєте самі.</p>
        </div>
      </aside>
    </div>
  )
}
