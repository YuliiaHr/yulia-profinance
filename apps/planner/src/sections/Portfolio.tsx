import { useState } from 'react'
import { Stat } from '../components/Field'
import { NumberInput } from '../components/NumberInput'
import { InstrumentEditor, instrumentUrl } from '../components/InstrumentEditor'
import { Term } from '../components/Term'
import { STRATEGY_LINKS } from '../data/templates'
import { money, percent, plainNumber } from '../lib/format'
import { rebalance } from '../lib/portfolio'
import { uid, type Instrument } from '../state/plan'
import type { SectionProps } from './types'

export function Portfolio({ plan, update, d, go }: SectionProps) {
  const c = plan.currency
  const list = plan.portfolio
  const set = (id: string, patch: Partial<Instrument>) =>
    update((p) => ({ ...p, portfolio: p.portfolio.map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
  const monthly = d.freedom.monthlySaving
  const weightTotal = list.reduce((s, x) => s + x.weight, 0)
  const rb = rebalance(list, plan.rebalanceDeposit)
  const [editing, setEditing] = useState<string | null>(null)

  return (
    <div className="stack">
      <p className="lead">
        Інструменти для накопичення на <Term k="freedom">фінансову свободу</Term>: кілька{' '}
        <Term k="etf">ETF</Term> з різними частками. Щомісячний внесок — {money(monthly, c)}{' '}
        <button type="button" className="link-btn" onClick={() => go('freedom')}>(змінити)</button>.
      </p>

      <section className="group">
        <h3>Рекомендовані інструменти</h3>
        <div className="table-wrap">
          <table className="table table--instruments">
            <thead>
              <tr>
                <th>Інструмент</th>
                <th><Term k="allocation">Частка</Term></th>
                <th>На місяць</th>
                <th>На квартал</th>
                <th><Term k="ter">Комісія</Term></th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((x) => (
                <tr key={x.id}>
                  <td>
                    {editing === x.id ? (
                      <InstrumentEditor x={x} set={(patch) => set(x.id, patch)} onDone={() => setEditing(null)} />
                    ) : (
                    <>
                    <span className="inst__class">{x.assetClass || 'Клас не вказано'}</span>
                    <span className="inst__ticker">{x.ticker || '—'}</span>
                    <span className="inst__name">{x.name}</span>
                    {x.description && <span className="inst__desc">{x.description}</span>}
                    <span className="inst__meta">
                      {x.isin && <><Term k="isin">ISIN</Term> {x.isin} · </>}
                      {x.currency}{x.domicile && ` · ${x.domicile}`}
                      {instrumentUrl(x) && <> · <a href={instrumentUrl(x)} target="_blank" rel="noopener">{x.url ? 'Сторінка ↗' : 'justETF ↗'}</a></>}
                      {x.factsheet && <> · <a href={x.factsheet} target="_blank" rel="noopener">Factsheet ↗</a></>}
                    </span>
                    {x.buyNote && <span className="inst__note">! {x.buyNote}</span>}
                    <button type="button" className="link-btn small inst__edit" onClick={() => setEditing(x.id)}>Змінити</button>
                    </>
                    )}
                  </td>
                  <td className="inst__weight"><NumberInput label={`Частка ${x.ticker}`} percent value={x.weight} max={100} suffix="%" onChange={(weight) => set(x.id, { weight })} /></td>
                  <td>{money(monthly * x.weight, c)}</td>
                  <td>{money(monthly * x.weight * 3, c)}</td>
                  <td>{x.ter ? `${String(x.ter).replace('.', ',')}%` : '—'}</td>
                  <td><button type="button" className="icon-btn" aria-label={`Прибрати ${x.ticker}`} onClick={() => update((p) => ({ ...p, portfolio: p.portfolio.filter((y) => y.id !== x.id) }))}>×</button></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>Разом</th>
                <th className={Math.abs(weightTotal - 1) > 0.001 ? 'is-bad-text' : undefined}>{percent(weightTotal)}</th>
                <th>{money(monthly * weightTotal, c)}</th>
                <th>{money(monthly * weightTotal * 3, c)}</th>
                <th colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
        {Math.abs(weightTotal - 1) > 0.001 && <p className="warn">Частки в сумі дають {percent(weightTotal)}, а мають 100%.</p>}
        <div className="rows__foot">
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              const id = uid()
              update((p) => ({ ...p, portfolio: [...p.portfolio, { id, assetClass: '', ticker: '', name: '', isin: '', weight: 0, currency: 'USD', domicile: '', description: '', ter: 0, buyNote: '', qty: 0, price: 0 }] }))
              setEditing(id)
            }}
          >
            + Додати інструмент
          </button>
          <span className="links">
            {STRATEGY_LINKS.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noopener">{l.label} ↗</a>)}
          </span>
        </div>
      </section>

      <section className="group">
        <h3><Term k="rebalance">Ребаланс</Term> портфеля</h3>
        <p className="small muted">
          Раз на рік: впишіть, скільки паперів уже є і їхню поточну ціну (у <Term k="broker">брокера</Term> або на justETF), та суму
          поповнення. Калькулятор покаже, що докупити, щоб повернути частки до плану.
        </p>
        <div className="rebalance-top">
          <label>
            Сума поповнення
            <NumberInput label="Сума поповнення" value={plan.rebalanceDeposit} suffix="$" onChange={(rebalanceDeposit) => update((p) => ({ ...p, rebalanceDeposit }))} />
          </label>
          <Stat label="Портфель зараз" value={`${plainNumber(rb.total)} $`} />
          <Stat label="Після поповнення" value={`${plainNumber(rb.after)} $`} tone="accent" />
          <p className="small muted">Кількість округлено до цілих паперів у менший бік, щоб не вийти за суму.</p>
        </div>
        <div className="table-wrap">
          <table className="table table--rebalance">
            <thead>
              <tr><th>Тікер</th><th>Є, шт</th><th>Ціна, $</th><th>Сума</th><th>Частка: зараз / план</th><th>Купити / продати</th></tr>
            </thead>
            <tbody>
              {list.map((x, i) => {
                const l = rb.lines[i]
                return (
                  <tr key={x.id}>
                    <th>{x.ticker || '—'}</th>
                    <td><NumberInput label={`Кількість ${x.ticker}`} value={x.qty} onChange={(qty) => set(x.id, { qty })} /></td>
                    <td><NumberInput label={`Ціна ${x.ticker}`} value={x.price} onChange={(price) => set(x.id, { price })} /></td>
                    <td>{plainNumber(l.value)} $</td>
                    <td>{percent(l.actualWeight)} / {percent(x.weight)}</td>
                    <td className={l.tradeWhole > 0 ? 'is-good-text' : l.tradeWhole < 0 ? 'is-bad-text' : undefined}>
                      {x.price > 0 ? (
                        <span className="trade">
                          <b>{l.tradeWhole > 0 ? 'купити ' : l.tradeWhole < 0 ? 'продати ' : ''}{Math.abs(l.tradeWhole)} шт</b>
                          <span className="muted">≈ {plainNumber(Math.abs(l.tradeValue))} $</span>
                        </span>
                      ) : <span className="muted">впишіть ціну</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
