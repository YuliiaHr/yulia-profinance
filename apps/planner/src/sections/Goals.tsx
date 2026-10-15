import { Stat } from '../components/Field'
import { NumberInput } from '../components/NumberInput'
import { Term } from '../components/Term'
import { CURRENCIES, money } from '../lib/format'
import { uid, type Goal } from '../state/plan'
import type { SectionProps } from './types'

export function Goals({ plan, update, d, go }: SectionProps) {
  const c = plan.currency
  const sym = CURRENCIES[c].symbol
  const setGoal = (id: string, patch: Partial<Goal>) =>
    update((p) => ({ ...p, goals: p.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) }))
  const addGoal = () => {
    const next = new Date()
    next.setFullYear(next.getFullYear() + 1)
    const date = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
    update((p) => ({ ...p, goals: [...p.goals, { id: uid(), name: '', cost: 0, saved: 0, date }] }))
  }
  const left = d.totals.savings - d.goalsMonthly

  return (
    <div className="stack">
      <div>
        <p className="lead">
          Кожна <Term k="goal">ціль</Term> має ціну й дату. Так видно, скільки на неї відкладати щомісяця і чи вистачає
          на все <Term k="savings">вікна заощаджень</Term>.
        </p>

        <div className="goals" role="table" aria-label="Фінансові цілі">
          <div className="goals__head" role="row">
            <span role="columnheader">Ціль</span>
            <span role="columnheader">Вартість</span>
            <span role="columnheader">Вже є</span>
            <span role="columnheader">Коли</span>
            <span role="columnheader">На місяць</span>
            <span />
          </div>
          {d.goals.map((g) => {
            const own = plan.goals.find((x) => x.id === g.id)
            return (
              <div className={`goals__row${g.auto ? ' goals__row--auto' : ''}`} role="row" key={g.id}>
                {own ? (
                  <>
                    <input className="goals__name" aria-label="Назва цілі" placeholder="Назва цілі" value={own.name} onChange={(e) => setGoal(g.id, { name: e.target.value })} />
                    <NumberInput label="Вартість" value={own.cost} suffix={sym} onChange={(cost) => setGoal(g.id, { cost })} />
                    <NumberInput label="Вже відкладено" value={own.saved} suffix={sym} onChange={(saved) => setGoal(g.id, { saved })} />
                    <input type="month" className="month" aria-label="Дата" value={own.date} onChange={(e) => setGoal(g.id, { date: e.target.value })} />
                  </>
                ) : (
                  <>
                    <span className="goals__name">
                      {g.auto === 'reserve' ? <Term k="reserve" /> : <Term k="freedom" />}
                    </span>
                    <span className="goals__cell" data-label="Вартість">{money(g.cost, c)}</span>
                    <span className="goals__cell" data-label="Вже є">{money(g.saved, c)}</span>
                    <span className="goals__cell" data-label="Коли">{g.auto === 'freedom' ? `з ${plan.freedom.retireAge} років` : formatMonth(g.date)}</span>
                  </>
                )}
                <b className="goals__monthly" data-label="На місяць">{money(g.monthly, c)}</b>
                {own ? (
                  <button type="button" className="icon-btn" aria-label={`Видалити «${own.name}»`} onClick={() => update((p) => ({ ...p, goals: p.goals.filter((x) => x.id !== g.id) }))}>×</button>
                ) : (
                  <button type="button" className="link-btn small" onClick={() => go(g.auto === 'reserve' ? 'reserve' : 'freedom')}>змінити</button>
                )}
              </div>
            )
          })}
        </div>
        <button type="button" className="link-btn" onClick={addGoal}>+ Додати ціль</button>
        <p className="small muted">
          Сума на місяць = (вартість − вже є) ÷ місяців до дати, без урахування відсотків. Для фінансової свободи — сума
          з кроку 5.
        </p>
      </div>

      <div className="card card--ink card--row">
          <Stat label="На всі цілі щомісяця" value={money(d.goalsMonthly, c)} />
          <Stat label={<Term k="savings" />} value={money(d.totals.savings, c)} />
          {left >= 0 ? (
            <Stat label="Лишається вільними" value={money(left, c)} tone="good" note="✓ На всі цілі вистачає" />
          ) : (
            <Stat label="Не вистачає" value={money(-left, c)} tone="bad" note="Перенесіть дату, зменшіть суму цілі або перегляньте витрати." />
          )}
      </div>
    </div>
  )
}

const MONTHS = ['січ', 'лют', 'бер', 'квіт', 'трав', 'черв', 'лип', 'серп', 'вер', 'жовт', 'лист', 'груд']
export function formatMonth(ym: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(ym)
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : '—'
}
