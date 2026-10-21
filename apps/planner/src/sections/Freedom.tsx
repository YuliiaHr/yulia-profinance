import { Field, Stat } from '../components/Field'
import { FreedomChart } from '../components/FreedomChart'
import { NumberInput } from '../components/NumberInput'
import { Term } from '../components/Term'
import { simulateFreedom } from '../lib/freedom'
import { CURRENCIES, money } from '../lib/format'
import type { FreedomSettings } from '../state/plan'
import type { SectionProps } from './types'

export function Freedom({ plan, update, d, go }: SectionProps) {
  const c = plan.currency
  const sym = CURRENCIES[c].symbol
  const f = plan.freedom
  const { freedom: r, freedomInput: input, totals } = d
  const set = (patch: Partial<FreedomSettings>) => update((p) => ({ ...p, freedom: { ...p.freedom, ...patch } }))
  const lastsOk = r.lastsUntilAge === null || r.lastsUntilAge >= f.lifeAge

  const rates = uniq([0.1, 0.2, 0.3, f.saveRate]).sort((a, b) => a - b)
  const ages = uniq([55, 60, 65, f.retireAge]).filter((a) => a > f.age).sort((a, b) => a - b)

  return (
    <div className="stack">
      <div className="split">
        <div className="split__main">
          <p className="lead">
            Скільки треба відкладати, щоб у певному віці жити з власного <Term k="capital">капіталу</Term>, а не з
            роботи. Це і є <Term k="freedom">фінансова свобода</Term>.
          </p>

          <section className="group">
            <h3>Про вас</h3>
            <Field label="Вік зараз"><NumberInput label="Вік зараз" value={f.age} max={100} suffix="р." onChange={(age) => set({ age })} /></Field>
            <Field label="Вихід на пенсію"><NumberInput label="Вік виходу на пенсію" value={f.retireAge} max={100} suffix="р." onChange={(retireAge) => set({ retireAge })} /></Field>
            <Field label={<Term k="lifeAge" />}><NumberInput label="Очікуваний вік дожиття" value={f.lifeAge} max={110} suffix="р." onChange={(lifeAge) => set({ lifeAge })} /></Field>
            <Field
              label="Дохід на місяць"
              hint={f.income === null ? 'Взято з кроку 1.' : <button type="button" className="link-btn" onClick={() => set({ income: null })}>Взяти з кроку 1 ({money(totals.income, c)})</button>}
            >
              <NumberInput label="Дохід на місяць" value={input.income} suffix={sym} onChange={(income) => set({ income })} />
            </Field>
          </section>

          <section className="group">
            <h3>Накопичення</h3>
            <Field label="Відкладати від доходу" hint={`Це ${money(r.monthlySaving, c)} на місяць.`}>
              <NumberInput label="Частка доходу" percent value={f.saveRate} max={100} suffix="%" onChange={(saveRate) => set({ saveRate })} />
            </Field>
            <Field label="Вже накопичено"><NumberInput label="Вже накопичено" value={f.capital} suffix={sym} onChange={(capital) => set({ capital })} /></Field>
            <Field
              label={<>Бажана пенсія на місяць, <Term k="todayMoney">у сьогоднішніх цінах</Term></>}
              hint={f.pension === null ? 'Дорівнює постійним витратам із кроку 1.' : <button type="button" className="link-btn" onClick={() => set({ pension: null })}>Взяти постійні витрати ({money(totals.fixed, c)})</button>}
            >
              <NumberInput label="Бажана пенсія" value={input.pension} suffix={sym} onChange={(pension) => set({ pension })} />
            </Field>
          </section>

          <section className="group">
            <h3>Припущення <button type="button" className="link-btn small" onClick={() => go('assumptions')}>усі припущення й ринкові дані →</button></h3>
            <Field label={<><Term k="returnRate">Дохідність</Term> інвестицій</>} hint={<>Для помірно-консервативного <Term k="riskProfile">ризик-профілю</Term> {c === 'USD' ? 'у доларах — близько 6%.' : 'у доларах беруть близько 6%; для портфеля в євро уточніть цифру.'}</>}>
              <NumberInput label="Дохідність" percent value={f.returnRate} max={50} suffix="% на рік" onChange={(returnRate) => set({ returnRate })} />
            </Field>
            <Field label={<Term k="inflation" />}>
              <NumberInput label="Інфляція" percent value={f.inflation} max={50} suffix="% на рік" onChange={(inflation) => set({ inflation })} />
            </Field>
            <Field label={<Term k="incomeGrowth" />}>
              <NumberInput label="Ріст доходу" percent value={f.incomeGrowth} max={50} suffix="% на рік" onChange={(incomeGrowth) => set({ incomeGrowth })} />
            </Field>
          </section>
        </div>

        <aside className="split__side">
          <div className="card card--ink">
            <Stat
              label={<>Капітал у {f.retireAge} років, <Term k="todayMoney">у сьогоднішніх цінах</Term></>}
              value={money(r.capitalAtRetirementReal, c)}
              tone="accent"
            />
            <hr />
            <p className="overline">Варіант 1 · <Term k="fixedPension" /></p>
            <Stat
              label={`Платите собі ${money(input.pension, c)} на місяць`}
              value={r.lastsUntilAge === null ? 'на все життя' : `до ${r.lastsUntilAge} років`}
              tone={lastsOk ? 'good' : 'bad'}
              note={lastsOk ? '✓ Вистачає з запасом' : `✕ Не вистачає до ${f.lifeAge} років`}
            />
            <hr />
            <p className="overline">Варіант 2 · <Term k="liveOnInterest" /></p>
            <Stat
              label="Пенсія на місяць, у середньому"
              value={money(r.interestPensionReal, c)}
              tone={r.coversPension ? 'good' : 'bad'}
              note={r.coversPension ? '✓ Покриває бажану пенсію' : `✕ Менше бажаної на ${money(input.pension - r.interestPensionReal, c)}`}
            />
          </div>
        </aside>
      </div>

      <section className="group">
        <h3>Як змінюється капітал</h3>
        <p className="small muted">
          До пенсії капітал росте завдяки внескам і <Term k="compound">складному відсотку</Term>. Після — зменшується, бо
          ви платите собі фіксовану пенсію (варіант 1). Суми <Term k="todayMoney">у сьогоднішніх цінах</Term>.
        </p>
        <FreedomChart years={r.years} retireAge={f.retireAge} lifeAge={f.lifeAge} lastsUntilAge={r.lastsUntilAge} currency={c} />
        <details className="details">
          <summary>Показати по роках</summary>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Вік</th><th>Внесок на місяць</th><th>Капітал (сьогоднішні ціни)</th><th>Залишок у варіанті 1</th></tr></thead>
              <tbody>
                {r.years.filter((y) => y.age <= Math.max(f.lifeAge, f.retireAge) + 5).map((y) => (
                  <tr key={y.age} className={y.age === f.retireAge ? 'is-mark' : undefined}>
                    <td>{y.age}</td>
                    <td>{y.age < f.retireAge ? money(y.income * f.saveRate, c) : '—'}</td>
                    <td>{money(y.capitalReal, c)}</td>
                    <td>{y.age >= f.retireAge ? money(y.remainingReal, c) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section className="group">
        <h3>Порівняння сценаріїв</h3>
        <p className="small muted">
          Пенсія на місяць у варіанті 2 (<Term k="liveOnInterest">живете на відсотки</Term>) залежно від того, скільки
          відкладати і коли вийти на пенсію. Зелене — покриває бажану пенсію {money(input.pension, c)}.
        </p>
        <div className="table-wrap">
          <table className="table table--grid">
            <thead>
              <tr><th>Відкладати</th>{ages.map((a) => <th key={a}>Пенсія з {a}</th>)}</tr>
            </thead>
            <tbody>
              {rates.map((rate) => (
                <tr key={rate}>
                  <th>{Math.round(rate * 1000) / 10}% · {money(input.income * rate, c)}</th>
                  {ages.map((a) => {
                    const s = simulateFreedom({ ...input, saveRate: rate, retireAge: a })
                    const current = rate === f.saveRate && a === f.retireAge
                    return (
                      <td key={a} className={`${s.coversPension ? 'is-good' : 'is-bad'}${current ? ' is-current' : ''}`}>
                        {s.coversPension ? '✓ ' : ''}{money(s.interestPensionReal, c)}
                        {current && <span className="tag">ваш план</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted">Податки з інвестиційного доходу в розрахунку не враховані: невідомо, якими вони будуть і де ви житимете.</p>
      </section>
    </div>
  )
}

const uniq = (xs: number[]) => [...new Set(xs.map((x) => Math.round(x * 1e6) / 1e6))]
