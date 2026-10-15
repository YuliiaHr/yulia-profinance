import { Stat } from '../components/Field'
import { NumberInput } from '../components/NumberInput'
import { RatesFields } from '../components/RatesFields'
import { Term } from '../components/Term'
import { CURRENCIES, money, type Currency } from '../lib/format'
import { uid, type Asset } from '../state/plan'
import type { SectionProps } from './types'

const ALL: Currency[] = ['UAH', 'USD', 'EUR']

export function Assets({ plan, update, d, go }: SectionProps) {
  const c = plan.currency
  const setAsset = (id: string, patch: Partial<Asset>) =>
    update((p) => ({ ...p, assets: p.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) }))
  const targets = [
    { value: '', label: 'Не розподілено' },
    { value: 'reserve.cash', label: 'Резерв · готівка' },
    { value: 'reserve.bonds', label: 'Резерв · ОВДП' },
    { value: 'reserve.deposits', label: 'Резерв · депозит, рахунок' },
    ...plan.goals.map((g) => ({ value: g.id, label: g.name || 'Ціль без назви' })),
    { value: 'freedom', label: 'Фінансова свобода' },
  ]

  const reserveHave = d.allocation.filter((l) => l.target.startsWith('reserve.')).reduce((s, l) => s + l.have, 0)
  const freedomHave = d.allocation.find((l) => l.target === 'freedom')!.have
  const goalHave = (id: string) => d.allocation.find((l) => l.target === id)?.have ?? 0
  const inSync =
    Math.round(plan.reserve.saved) === Math.round(reserveHave) &&
    Math.round(plan.freedom.capital) === Math.round(freedomHave) &&
    plan.goals.every((g) => Math.round(g.saved) === Math.round(goalHave(g.id)))
  const sync = () =>
    update((p) => ({
      ...p,
      reserve: { ...p.reserve, saved: Math.round(reserveHave) },
      goals: p.goals.map((g) => ({ ...g, saved: Math.round(goalHave(g.id)) })),
      freedom: { ...p.freedom, capital: Math.round(freedomHave) },
    }))

  return (
    <div className="split">
      <div className="split__main">
        <p className="lead">
          Запишіть усі <Term k="assets">активи</Term>, які вже є: готівку, депозити, облігації, банки. Для кожного оберіть
          ціль — так видно, чого вистачає, а що ще треба докласти.
        </p>

        <section className="group">
          <h3><Term k="rates">Курси валют</Term></h3>
          <RatesFields plan={plan} update={update} d={d} />
        </section>

        <section className="group">
          <h3>Що вже є</h3>
          <div className="assets" role="table" aria-label="Активи">
            {plan.assets.map((a) => (
              <div className="assets__row" role="row" key={a.id}>
                <input className="rows__name" aria-label="Назва" placeholder="Напр. готівка, депозит до 11.2026" value={a.name} onChange={(e) => setAsset(a.id, { name: e.target.value })} />
                <NumberInput label={`${a.name || 'Сума'}`} value={a.amount} onChange={(amount) => setAsset(a.id, { amount })} />
                <select aria-label="Валюта" value={a.currency} onChange={(e) => setAsset(a.id, { currency: e.target.value as Currency })}>
                  {ALL.map((cur) => <option key={cur} value={cur}>{CURRENCIES[cur].symbol}</option>)}
                </select>
                <select aria-label="На яку ціль" className="assets__target" value={a.target} onChange={(e) => setAsset(a.id, { target: e.target.value })}>
                  {targets.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <button type="button" className="icon-btn" aria-label={`Видалити «${a.name}»`} onClick={() => update((p) => ({ ...p, assets: p.assets.filter((x) => x.id !== a.id) }))}>×</button>
              </div>
            ))}
          </div>
          <div className="rows__foot">
            <button type="button" className="link-btn" onClick={() => update((p) => ({ ...p, assets: [...p.assets, { id: uid(), name: '', amount: 0, currency: p.currency, target: '' }] }))}>
              + Додати актив
            </button>
            <span className="rows__total">Разом: <b>{money(d.assetsTotal, c)}</b></span>
          </div>
        </section>
      </div>

      <aside className="split__side">
        <div className="card card--ink">
          <p className="overline">Розподіл на цілі</p>
          <ul className="alloc">
            {d.allocation.filter((l) => l.need !== null || l.have > 0).map((l) => {
              const diff = l.need === null ? null : l.have - l.need
              return (
                <li key={l.target}>
                  <span>{l.name}</span>
                  <span className="alloc__nums">
                    {money(l.have, c)}
                    {l.need !== null && <span className="muted"> з {money(l.need, c)}</span>}
                  </span>
                  {diff !== null && l.need! > 0 && (
                    <span className={`alloc__diff ${diff >= 0 ? 'is-good' : 'is-bad'}`}>
                      {diff >= 0 ? `✓ ${diff > 0 ? `залишок ${money(diff, c)}` : 'рівно'}` : `не вистачає ${money(-diff, c)}`}
                    </span>
                  )}
                  {l.need !== null && l.need > 0 && (
                    <span className="bars__track"><span style={{ width: `${Math.min(100, (l.have / l.need) * 100)}%` }} /></span>
                  )}
                </li>
              )
            })}
          </ul>
          <hr />
          <Stat label="Не розподілено" value={money(d.unallocated, c)} note="Можна спрямувати на цілі або інвестиції." />
          {inSync ? (
            <p className="good small">✓ Суми «вже відкладено» в цілях збігаються з активами</p>
          ) : (
            <>
              <button type="button" className="btn btn--sm" onClick={sync}>Перенести в «вже відкладено»</button>
              <p className="small muted">Оновить суми в резервному фонді, цілях і фінансовій свободі.</p>
            </>
          )}
          <p className="small muted">Цілі додаються на кроці <button type="button" className="link-btn" onClick={() => go('goals')}>«Цілі»</button>.</p>
        </div>
      </aside>
    </div>
  )
}
