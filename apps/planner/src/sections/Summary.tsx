import { Fragment } from 'react'
import { money, percent, type Currency } from '../lib/format'
import { PROGRAMS } from '../data/insurance'
import { assetKind } from '../data/assetKinds'
import { STAGES, STATUSES, type TaskStage } from '../data/templates'
import { formatMonth } from './Goals'
import { MARKET_AS_OF } from '../data/assumptions'
import { formatDate } from './Assumptions'
import type { SectionProps } from './types'

/** One-page overview of the plan; this is what goes into the PDF. */
export function Summary({ plan, d }: SectionProps) {
  const c = plan.currency
  const { totals, reserve, freedom: r, freedomInput: input } = d
  const f = plan.freedom
  const left = totals.savings - d.goalsMonthly
  const today = new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="summary">
      <div className="summary__actions no-print">
        <button type="button" className="btn" onClick={() => window.print()}>Зберегти PDF</button>
        <span className="small muted">У вікні друку оберіть «Зберегти як PDF».</span>
      </div>

      <header className="summary__head">
        <p className="overline">Фінансовий план · {today}</p>
        <h2>{plan.client || 'Без імені'}</h2>
        <p className="small muted">Усі суми в {IN_CURRENCY[c]}, на місяць, якщо не сказано інше.</p>
      </header>

      <section className="summary__block">
        <h3>1. Доходи і витрати</h3>
        <dl className="kv">
          <dt>Доходи</dt><dd>{money(totals.income, c)}</dd>
          <dt>Постійні витрати</dt><dd>{money(totals.fixed, c)}</dd>
          <dt>Бажання</dt><dd>{money(totals.wants, c)}</dd>
          <dt>Благодійність</dt><dd>{money(totals.charity, c)}</dd>
          <dt><b>Вікно заощаджень</b></dt><dd><b>{money(totals.savings, c)}</b> {totals.income > 0 && <span className="muted">({percent(totals.savings / totals.income)} доходу)</span>}</dd>
        </dl>
      </section>

      <section className="summary__block">
        <h3>2. Резервний фонд</h3>
        <dl className="kv">
          <dt>Розмір</dt><dd>{money(reserve.target, c)} <span className="muted">({plan.reserve.months} міс постійних витрат)</span></dd>
          <dt>Готівка</dt><dd>{money(reserve.parts.cash, c)}</dd>
          <dt>ОВДП</dt><dd>{money(reserve.parts.bonds, c)}</dd>
          <dt>Депозит, рахунок, стейблкоїни</dt><dd>{money(reserve.parts.deposits, c)}</dd>
          <dt>Вже відкладено</dt><dd>{money(plan.reserve.saved, c)}</dd>
        </dl>
      </section>

      <section className="summary__block">
        <h3>3. Захист</h3>
        {plan.protection.length === 0 ? (
          <p className="muted">Програми страхування не обрано.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Програма</th><th>На рік</th></tr></thead>
              <tbody>
                {plan.protection.map((x) => {
                  const p = PROGRAMS.find((pr) => pr.id === x.id)
                  return p ? <tr key={x.id}><td>{p.company} · {p.name}</td><td>{money(x.price, c)}</td></tr> : null
                })}
              </tbody>
              <tfoot>
                <tr><th>Разом</th><th>{money(d.protectionYear, c)} <span className="muted">({money(d.protectionYear / 12, c)} на місяць)</span></th></tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <section className="summary__block">
        <h3>4. Цілі</h3>
        <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Ціль</th><th>Вартість</th><th>Коли</th><th>На місяць</th></tr></thead>
          <tbody>
            {d.goals.map((g) => (
              <tr key={g.id}>
                <td>{g.name || 'Без назви'}</td>
                <td>{money(g.cost, c)}</td>
                <td>{g.auto === 'freedom' ? `з ${f.retireAge} р.` : formatMonth(g.date)}</td>
                <td>{money(g.monthly, c)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><th colSpan={3}>Разом на цілі</th><th>{money(d.goalsMonthly, c)}</th></tr>
            <tr><th colSpan={3}>{left >= 0 ? 'Лишається вільними' : 'Не вистачає'}</th><th>{money(Math.abs(left), c)}</th></tr>
          </tfoot>
        </table>
        </div>
      </section>

      <section className="summary__block">
        <h3>5. Активи</h3>
        {plan.assets.length === 0 ? (
          <p className="muted">Активи не внесено.</p>
        ) : (
          <dl className="kv">
            <dt>Усього активів</dt><dd>{money(d.assetsTotal, c)}</dd>
            {plan.assets.filter((a) => a.amount > 0).map((a) => (
              <Fragment key={a.id}>
                <dt className="muted">· {assetKind(a.kind).label}{a.name && ` (${a.name})`}</dt>
                <dd className="muted">{money(d.toPlan(a.amount, a.currency), c)}</dd>
              </Fragment>
            ))}
            {d.allocation.filter((l) => l.have > 0 || (l.need ?? 0) > 0).map((l) => (
              <Fragment key={l.target}>
                <dt>{l.name}</dt>
                <dd>{money(l.have, c)}{l.need !== null && <span className="muted"> з {money(l.need, c)}</span>}</dd>
              </Fragment>
            ))}
            <dt>Вільні кошти без цілі</dt><dd>{money(d.unallocated, c)}</dd>
            {d.unallocatedLongTerm > 0 && <><dt>Довгострокові активи без цілі</dt><dd>{money(d.unallocatedLongTerm, c)}</dd></>}
          </dl>
        )}
      </section>

      <section className="summary__block">
        <h3>6. Фінансова свобода</h3>
        <dl className="kv">
          <dt>Відкладати</dt><dd>{money(r.monthlySaving, c)} <span className="muted">({percent(f.saveRate)} доходу) до {f.retireAge} років</span></dd>
          <dt>Капітал у {f.retireAge} років</dt><dd>{money(r.capitalAtRetirementReal, c)} <span className="muted">у сьогоднішніх цінах</span></dd>
          <dt>Варіант 1: пенсія {money(input.pension, c)}</dt><dd>{r.lastsUntilAge === null ? 'вистачить на все життя' : `вистачить до ${r.lastsUntilAge} років`}</dd>
          <dt>Варіант 2: жити на відсотки</dt><dd>{money(r.interestPensionReal, c)} {r.coversPension ? '✓ покриває бажану пенсію' : '✕ менше бажаної пенсії'}</dd>
        </dl>
        <p className="small muted">
          Припущення: дохідність {percent(f.returnRate)} на рік, інфляція {percent(f.inflation)}, ріст доходу{' '}
          {percent(f.incomeGrowth)}, планування до {f.lifeAge} років. Податки не враховані.
        </p>
      </section>

      <section className="summary__block">
        <h3>7. Інвестиційний портфель</h3>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Інструмент</th><th>Частка</th><th>На місяць</th></tr></thead>
            <tbody>
              {plan.portfolio.map((x) => (
                <tr key={x.id}><td>{x.ticker} <span className="muted">{x.name}</span></td><td>{percent(x.weight)}</td><td>{money(r.monthlySaving * x.weight, c)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="summary__block">
        <h3>8. План дій</h3>
        {(Object.keys(STAGES) as TaskStage[]).map((stage) => (
          <div key={stage} className="summary__tasks">
            <p className="overline">{STAGES[stage]}</p>
            <ul>
              {plan.tasks.filter((t) => t.stage === stage).map((t) => (
                <li key={t.id} className={t.status === 'done' ? 'is-done' : undefined}>
                  <span>{t.status === 'done' ? '✓' : t.status === 'doing' ? '◐' : '○'} {t.title}</span>
                  <span className="muted">{STATUSES[t.status]}{t.date && ` · ${new Date(t.date).toLocaleDateString('uk-UA')}`}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="summary__block">
        <h3>Припущення плану</h3>
        <dl className="kv">
          <dt>Інфляція ({c})</dt><dd>{percent(f.inflation)} на рік</dd>
          <dt>Дохідність інвестицій (до податків)</dt><dd>{percent(f.returnRate)} на рік</dd>
          <dt>Ріст доходу</dt><dd>{percent(f.incomeGrowth)} на рік</dd>
          <dt>Курси{d.ratesInfo.fromNbu ? ` (НБУ на ${d.ratesInfo.date})` : ''}</dt><dd>1 $ = {d.rates.USD.toLocaleString('uk-UA')} ₴ · 1 € = {d.rates.EUR.toLocaleString('uk-UA')} ₴</dd>
        </dl>
        <p className="small muted">Ринкові дані для довідки — станом на {formatDate(MARKET_AS_OF)}.</p>
      </section>

      <p className="small muted summary__note">
        Розрахунок орієнтовний і не є гарантією дохідності. Підготовлено з yulia.profinance.
      </p>
    </div>
  )
}

const IN_CURRENCY: Record<Currency, string> = { USD: 'доларах', EUR: 'євро', UAH: 'гривнях' }
