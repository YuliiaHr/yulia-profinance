import { Stat } from '../components/Field'
import { RowsEditor } from '../components/RowsEditor'
import { Term } from '../components/Term'
import { CURRENCIES, money, percent } from '../lib/format'
import type { SectionProps } from './types'

export function Budget({ plan, update, d }: SectionProps) {
  const { totals } = d
  const c = plan.currency
  const parts = [
    { key: 'fixed', label: 'Постійні витрати', value: totals.fixed },
    { key: 'wants', label: 'Бажання', value: totals.wants },
    { key: 'charity', label: 'Благодійність', value: totals.charity },
    { key: 'savings', label: 'Вікно заощаджень', value: Math.max(0, totals.savings) },
  ]
  const base = Math.max(totals.income, totals.expenses, 1)

  return (
    <div className="split">
      <div className="split__main">
        <p className="lead">
          Запишіть доходи й витрати за звичайний місяць. Суми — <Term k="netto">нетто</Term>, тобто ті, що реально
          приходять на картку. Кожну суму можна вписати в гривнях (₴) або у валюті плану ({CURRENCIES[c].symbol}) —
          гривні перераховуються за курсом {d.ratesInfo.fromNbu ? `НБУ на ${d.ratesInfo.date}` : 'з «Припущень»'}: 1 {CURRENCIES[c].symbol} = {d.rates[c].toLocaleString('uk-UA')} ₴.
        </p>

        <section className="group">
          <h3>Доходи</h3>
          <RowsEditor rows={plan.income} onChange={(income) => update((p) => ({ ...p, income }))} currency={c} toPlan={d.toPlan} addLabel="Додати дохід" total="Усього доходів" />
        </section>
        <section className="group">
          <h3><Term k="fixed" /></h3>
          <RowsEditor rows={plan.fixed} onChange={(fixed) => update((p) => ({ ...p, fixed }))} currency={c} toPlan={d.toPlan} addLabel="Додати витрату" total="Разом" />
        </section>
        <section className="group">
          <h3><Term k="wants" /></h3>
          <RowsEditor rows={plan.wants} onChange={(wants) => update((p) => ({ ...p, wants }))} currency={c} toPlan={d.toPlan} addLabel="Додати витрату" total="Разом" />
        </section>
        <section className="group">
          <h3>Благодійність</h3>
          <RowsEditor rows={plan.charity} onChange={(charity) => update((p) => ({ ...p, charity }))} currency={c} toPlan={d.toPlan} addLabel="Додати" />
        </section>
      </div>

      <aside className="split__side">
        <div className="card card--ink">
          <Stat
            label={<Term k="savings" />}
            value={money(totals.savings, c)}
            note={`на місяць · ${money(totals.savings * 12, c)} на рік`}
            tone={totals.savings > 0 ? 'accent' : 'bad'}
          />
          {totals.savings < 0 && (
            <p className="warn">Витрати більші за доходи на {money(-totals.savings, c)}. Почніть із перегляду бажань.</p>
          )}
          <ul className="bars" aria-label="Куди йдуть гроші">
            {parts.map((p) => (
              <li key={p.key} className={p.key === 'savings' ? 'bars--acc' : undefined}>
                <span className="bars__label">{p.label}</span>
                <span className="bars__value">
                  {money(p.value, c)} <span className="muted">{totals.income > 0 ? percent(p.value / totals.income) : ''}</span>
                </span>
                <span className="bars__track"><span style={{ width: `${(p.value / base) * 100}%` }} /></span>
              </li>
            ))}
          </ul>
          <p className="small muted">Частки — від усіх доходів ({money(totals.income, c)} на місяць).</p>
        </div>
      </aside>
    </div>
  )
}
