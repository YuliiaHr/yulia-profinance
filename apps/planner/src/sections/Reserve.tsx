import { Field, Stat } from '../components/Field'
import { NumberInput } from '../components/NumberInput'
import { ReserveChart } from '../components/ReserveChart'
import { Term } from '../components/Term'
import { CURRENCIES, money, percent } from '../lib/format'
import type { ReserveSplit } from '../lib/reserve'
import type { Currency } from '../lib/format'
import { uid, type Bond } from '../state/plan'
import type { SectionProps } from './types'

export function Reserve({ plan, update, d, go }: SectionProps) {
  const c = plan.currency
  const sym = CURRENCIES[c].symbol
  const r = plan.reserve
  const { reserve, totals } = d
  const setSplit = (patch: Partial<ReserveSplit>) =>
    update((p) => ({ ...p, reserve: { ...p.reserve, split: { ...p.reserve.split, ...patch } } }))
  const setReserve = (patch: Partial<typeof r>) => update((p) => ({ ...p, reserve: { ...p.reserve, ...patch } }))
  const setBond = (id: string, patch: Partial<Bond>) =>
    setReserve({ ladder: r.ladder.map((b) => (b.id === id ? { ...b, ...patch } : b)) })
  const shareOk = Math.abs(reserve.shareTotal - 1) < 0.001

  return (
    <div className="split">
      <div className="split__main">
        <p className="lead">
          <Term k="reserve" /> захищає план від несподіванок. Рахуємо його від{' '}
          <Term k="fixed">постійних витрат</Term>: зараз це {money(totals.fixed, c)} на місяць{' '}
          <button type="button" className="link-btn" onClick={() => go('budget')}>(змінити)</button>.
        </p>

        <section className="group">
          <h3>Розмір</h3>
          <Field label="На скільки місяців" hint="Зазвичай 3–6. Якщо дохід нестабільний або ви єдиний годувальник — 6 і більше.">
            <NumberInput label="Місяців" value={r.months} max={24} suffix="міс" onChange={(months) => setReserve({ months })} />
          </Field>
          <Field label="Вже відкладено">
            <NumberInput label="Вже відкладено" value={r.saved} suffix={sym} onChange={(saved) => setReserve({ saved })} />
          </Field>
          <Field label="Зібрати до">
            <input type="month" className="month" value={r.date} onChange={(e) => setReserve({ date: e.target.value })} />
          </Field>
        </section>

        <section className="group">
          <h3>Де тримати</h3>
          <p className="small muted">
            Гроші резервного фонду мають бути доступні швидко (висока <Term k="liquidity">ліквідність</Term>), тому
            ділимо їх на три частини.
          </p>
          <ReserveChart target={reserve.target} parts={reserve.parts} shares={r.split} cashByCurrency={d.cashByCurrency} cashShares={r.cashSplit} ladder={r.ladder} currency={c} />
          <Field label="Готівка" hint="Під рукою в перші дні. Краще в різних валютах: приблизно 20% гривні, 40% долари, 40% євро.">
            <NumberInput label="Готівка, частка" percent value={r.split.cash} max={100} suffix="%" onChange={(cash) => setSplit({ cash })} />
          </Field>
          <Field label={<Term k="ovdp" />} hint="Гроші працюють і захищені від інфляції. Продати можна за кілька хвилин у застосунку банку, кошти надходять на рахунок протягом одного робочого дня.">
            <NumberInput label="ОВДП, частка" percent value={r.split.bonds} max={100} suffix="%" onChange={(bonds) => setSplit({ bonds })} />
          </Field>
          <Field label={<><Term k="deposit">Депозит</Term>, рахунок, <Term k="stablecoin">стейблкоїни</Term></>}>
            <NumberInput label="Депозити, частка" percent value={r.split.deposits} max={100} suffix="%" onChange={(deposits) => setSplit({ deposits })} />
          </Field>
          {!shareOk && <p className="warn">Частки в сумі дають {percent(reserve.shareTotal)}, а мають 100%.</p>}
        </section>

        <section className="group">
          <h3>Готівка в різних валютах</h3>
          <p className="small muted">Щоб не залежати від курсу однієї валюти. Курси — на кроці «Активи».</p>
          <div className="cash-split">
            {CASH_CURRENCIES.map((cur) => (
              <div key={cur} className="cash-split__item">
                <span className="cash-split__label">{CASH_LABELS[cur]}</span>
                <NumberInput
                  label={`Частка готівки, ${cur}`}
                  percent
                  value={r.cashSplit[cur]}
                  max={100}
                  suffix="%"
                  onChange={(v) => setReserve({ cashSplit: { ...r.cashSplit, [cur]: v } })}
                />
                <b>{money(d.cashByCurrency[cur], cur)}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="group">
          <h3><Term k="ladder" /></h3>
          <p className="small muted">Облігації Моно, Сенс, Приват з різними строками: частина грошей повертається щокварталу.</p>
          <div className="ladder" role="table" aria-label="Драбина облігацій">
            {r.ladder.length > 0 && (
              <div className="ladder__head" role="row">
                <span>Кількість</span><span>Номінал</span><span>Валюта</span><span>Погашення</span><span>Примітка</span><span />
              </div>
            )}
            {r.ladder.map((b) => (
              <div className="ladder__row" role="row" key={b.id}>
                <NumberInput label="Кількість" value={b.qty} suffix="шт" onChange={(qty) => setBond(b.id, { qty })} />
                <NumberInput label="Номінал" value={b.price} onChange={(price) => setBond(b.id, { price })} />
                <select aria-label="Валюта" value={b.currency} onChange={(e) => setBond(b.id, { currency: e.target.value as Currency })}>
                  {CASH_CURRENCIES.map((cur) => <option key={cur} value={cur}>{CURRENCIES[cur].symbol}</option>)}
                </select>
                <NumberInput label="Погашення через" value={b.months} suffix="міс" onChange={(months) => setBond(b.id, { months })} />
                <input aria-label="Примітка" className="ladder__note" value={b.note} onChange={(e) => setBond(b.id, { note: e.target.value })} />
                <button type="button" className="icon-btn" aria-label="Видалити облігацію" onClick={() => setReserve({ ladder: r.ladder.filter((x) => x.id !== b.id) })}>×</button>
              </div>
            ))}
          </div>
          <div className="rows__foot">
            <button
              type="button"
              className="link-btn"
              onClick={() => setReserve({ ladder: [...r.ladder, { id: uid(), qty: 1, price: 1000, currency: c, months: 12, note: 'Після погашення купити нову на 12 міс' }] })}
            >
              + Додати облігацію
            </button>
            {r.ladder.length > 0 && <span className="rows__total">Разом: <b>{money(d.ladderTotal, c)}</b> <span className="muted">(орієнтовно)</span></span>}
          </div>
        </section>
      </div>

      <aside className="split__side">
        <div className="card card--ink">
          <Stat label="Резервний фонд" value={money(reserve.target, c)} note={`${r.months} міс × ${money(totals.fixed, c)}`} tone="accent" />
          <ul className="list">
            <li><span>Готівка</span><b>{money(reserve.parts.cash, c)}</b></li>
            <li><span>ОВДП</span><b>{money(reserve.parts.bonds, c)}</b></li>
            <li><span>Депозит, рахунок, стейблкоїни</span><b>{money(reserve.parts.deposits, c)}</b></li>
          </ul>
          <hr />
          {d.reserveMonthly > 0 ? (
            <Stat
              label="Відкладати щомісяця"
              value={money(d.reserveMonthly, c)}
              note={d.reserveMonths > 0 ? `щоб зібрати ще ${money(reserve.target - r.saved, c)} за ${d.reserveMonths} міс` : 'дата вже минула — це вся сума, що лишилась'}
            />
          ) : (
            <p className="good">Фонд уже зібрано ✓</p>
          )}
        </div>
      </aside>
    </div>
  )
}

const CASH_CURRENCIES: Currency[] = ['UAH', 'USD', 'EUR']
const CASH_LABELS: Record<Currency, string> = { UAH: 'Гривні', USD: 'Долари', EUR: 'Євро' }
