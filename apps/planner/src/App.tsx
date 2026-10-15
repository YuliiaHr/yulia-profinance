import { useEffect, useMemo, useState } from 'react'
import { CURRENCIES, type Currency } from './lib/format'
import { Budget } from './sections/Budget'
import { Freedom } from './sections/Freedom'
import { Actions } from './sections/Actions'
import { Assets } from './sections/Assets'
import { Goals } from './sections/Goals'
import { Portfolio } from './sections/Portfolio'
import { Protection } from './sections/Protection'
import { Reserve } from './sections/Reserve'
import { Summary } from './sections/Summary'
import type { SectionProps, StepId } from './sections/types'
import { derive } from './state/derive'
import { usePlans } from './state/store'

const STEPS: Array<{ id: StepId; n: string; title: string; short: string; Screen: (p: SectionProps) => JSX.Element }> = [
  { id: 'budget', n: '1', title: 'Доходи і витрати', short: 'Доходи', Screen: Budget },
  { id: 'reserve', n: '2', title: 'Резервний фонд', short: 'Резерв', Screen: Reserve },
  { id: 'protection', n: '3', title: 'Захист', short: 'Захист', Screen: Protection },
  { id: 'goals', n: '4', title: 'Цілі', short: 'Цілі', Screen: Goals },
  { id: 'assets', n: '5', title: 'Активи і розподіл на цілі', short: 'Активи', Screen: Assets },
  { id: 'freedom', n: '6', title: 'Фінансова свобода', short: 'Свобода', Screen: Freedom },
  { id: 'portfolio', n: '7', title: 'Інвестиційний портфель', short: 'Портфель', Screen: Portfolio },
  { id: 'actions', n: '8', title: 'План дій', short: 'План дій', Screen: Actions },
  { id: 'summary', n: '✓', title: 'Підсумок', short: 'Підсумок', Screen: Summary },
]

const stepFromHash = (): StepId => {
  const h = window.location.hash.slice(1)
  return STEPS.some((s) => s.id === h) ? (h as StepId) : 'budget'
}

export default function App() {
  const { plans, plan, update, select, create, remove } = usePlans()
  const [step, setStep] = useState<StepId>(stepFromHash)
  const d = useMemo(() => derive(plan), [plan])

  useEffect(() => {
    const onHash = () => setStep(stepFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.title = `${plan.client || 'План'} · Фінансовий планер`
  }, [plan.client])

  const go = (id: StepId) => {
    window.location.hash = id
    setStep(id)
    window.scrollTo({ top: 0 })
  }

  const index = STEPS.findIndex((s) => s.id === step)
  const current = STEPS[index]
  const next = STEPS[index + 1]
  const props: SectionProps = { plan, update, d, go }

  return (
    <>
      <header className="bar no-print">
        <div className="wrap bar__in">
          <a className="logo" href="../">yulia<span>.</span>profinance</a>
          <div className="bar__plans">
            <label className="sr-only" htmlFor="plan-select">Клієнт</label>
            <select id="plan-select" value={plan.id} onChange={(e) => select(e.target.value)}>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.client || 'Без імені'}</option>)}
            </select>
            <button type="button" className="btn btn--sm" onClick={() => { create(); go('budget') }}>+ Новий клієнт</button>
          </div>
        </div>
      </header>

      <main className="wrap">
        <div className="plan-head no-print">
          <div className="plan-head__name">
            <label htmlFor="client">Клієнт</label>
            <input id="client" value={plan.client} placeholder="Ім’я клієнта" onChange={(e) => update((p) => ({ ...p, client: e.target.value }))} />
          </div>
          <div className="plan-head__name">
            <label htmlFor="currency">Валюта плану</label>
            <select id="currency" value={plan.currency} onChange={(e) => update((p) => ({ ...p, currency: e.target.value as Currency }))}>
              {Object.entries(CURRENCIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <button
            type="button"
            className="link-btn small"
            onClick={() => confirm(`Видалити план «${plan.client}»? Його не можна буде відновити.`) && remove(plan.id)}
          >
            Видалити план
          </button>
        </div>

        <nav className="steps no-print" aria-label="Кроки плану">
          {STEPS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="steps__item" aria-current={s.id === step ? 'step' : undefined} onClick={(e) => { e.preventDefault(); go(s.id) }}>
              <span className="steps__n">{s.n}</span>
              <span className="steps__t">{s.short}</span>
            </a>
          ))}
        </nav>

        <h1 className="no-print">{current.title}</h1>
        <current.Screen {...props} />

        {next && (
          <div className="next no-print">
            <button type="button" className="btn btn--ink" onClick={() => go(next.id)}>Далі: {next.title} →</button>
          </div>
        )}
      </main>

      <footer className="foot no-print">
        <div className="wrap small muted">Дані зберігаються лише в цьому браузері й нікуди не надсилаються.</div>
      </footer>
    </>
  )
}
