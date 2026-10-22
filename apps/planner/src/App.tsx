import { useEffect, useMemo, useState } from 'react'
import { CURRENCIES, PLAN_CURRENCIES, type PlanCurrency } from './lib/format'
import { Budget } from './sections/Budget'
import { Freedom } from './sections/Freedom'
import { Actions } from './sections/Actions'
import { Assets } from './sections/Assets'
import { Assumptions } from './sections/Assumptions'
import { Goals } from './sections/Goals'
import { Intro } from './sections/Intro'
import { Portfolio } from './sections/Portfolio'
import { Protection } from './sections/Protection'
import { Reserve } from './sections/Reserve'
import { Summary } from './sections/Summary'
import type { SectionProps, StepId } from './sections/types'
import { derive } from './state/derive'
import { useLocalPlans } from './state/store'
import { useCloudPlans } from './state/cloudStore'
import type { PlansApi } from './state/api'
import type { Plan } from './state/plan'
import { supabase } from './lib/cloud'
import { useNbuRates } from './lib/nbu'
import { Backup } from './components/Backup'
import { Comments } from './components/Comments'
import { AccountBar, Login, Splash, useIsAdvisor, useSession } from './components/Auth'
import { ClientAccess, ReviewBanner } from './components/ClientAccess'

const STEPS: Array<{ id: StepId; n: string; title: string; short: string; Screen: (p: SectionProps) => JSX.Element }> = [
  { id: 'intro', n: '0', title: 'Ваш фінансовий план', short: 'Вступ', Screen: Intro },
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

/** Pages reachable by link but not shown as numbered steps. */
const EXTRA_PAGES: typeof STEPS = [
  { id: 'assumptions', n: '', title: 'Припущення', short: 'Припущення', Screen: Assumptions },
]
const PAGES = [...STEPS, ...EXTRA_PAGES]

const stepFromHash = (): StepId => {
  const h = window.location.hash.slice(1)
  return PAGES.some((s) => s.id === h) ? (h as StepId) : 'intro'
}

/** Cloud mode when Supabase is configured; otherwise plans stay in this browser. */
export default function App() {
  return supabase ? <CloudApp /> : <LocalApp />
}

function LocalApp() {
  const api = useLocalPlans()
  return <Planner api={api} account={null} />
}

function CloudApp() {
  const session = useSession()
  if (session === undefined) return <Splash />
  if (!session) return <Login />
  return <CloudUser key={session.user.id} userId={session.user.id} email={session.user.email ?? ''} />
}

function CloudUser({ userId, email }: { userId: string; email: string }) {
  const isAdvisor = useIsAdvisor(userId)
  if (isAdvisor === null) return <Splash />
  return <CloudPlans userId={userId} email={email} isAdvisor={isAdvisor} />
}

function CloudPlans({ userId, email, isAdvisor }: { userId: string; email: string; isAdvisor: boolean }) {
  const api = useCloudPlans(userId, isAdvisor)
  if (api.loading) return <Splash text="Завантажую плани…" />
  if (api.loadError) return <Splash text={api.loadError} />
  return <Planner api={api} account={{ email }} />
}

function Planner({ api, account }: { api: PlansApi; account: { email: string } | null }) {
  const { plans, plan } = api
  const cloud = api.mode === 'cloud'

  if (!plan) {
    return (
      <>
        <TopBar api={api} account={account} plan={undefined} onCreate={api.create} />
        <main className="wrap empty">
          {api.canManage ? (
            <>
              <h1>Ще немає жодного плану</h1>
              <p className="lead">Створіть план для першого клієнта або перенесіть плани з файлу «Копія всіх планів».</p>
              <div className="empty__actions">
                <button type="button" className="btn" onClick={api.create}>+ Новий клієнт</button>
              </div>
            </>
          ) : (
            <>
              <h1>Для вас ще немає плану</h1>
              <p className="lead">Юлія відкриє вам доступ, щойно план буде готовий. Якщо вже маєте отримати план — напишіть їй.</p>
            </>
          )}
        </main>
      </>
    )
  }

  return <PlanView api={api} account={account} plan={plan} plans={plans} cloud={cloud} />
}

function TopBar({ api, account, plan, onCreate }: { api: PlansApi; account: { email: string } | null; plan: Plan | undefined; onCreate: () => void }) {
  return (
    <header className="bar no-print">
      <div className="wrap bar__in">
        <a className="logo" href="../">yulia<span>.</span>profinance</a>
        {account && <AccountBar email={account.email} saveState={api.saveState} />}
        {api.canManage && (
          <div className="bar__plans">
            {plan && (
              <>
                <label className="sr-only" htmlFor="plan-select">Клієнт</label>
                <select id="plan-select" value={plan.id} onChange={(e) => api.select(e.target.value)}>
                  {api.plans.map((p) => <option key={p.id} value={p.id}>{p.client || 'Без імені'}</option>)}
                </select>
              </>
            )}
            <button type="button" className="btn btn--sm" onClick={onCreate}>+ Новий клієнт</button>
          </div>
        )}
      </div>
    </header>
  )
}

function PlanView({ api, account, plan, plans, cloud }: { api: PlansApi; account: { email: string } | null; plan: Plan; plans: Plan[]; cloud: boolean }) {
  const { update } = api
  const [step, setStep] = useState<StepId>(stepFromHash)
  const nbu = useNbuRates()
  const d = useMemo(() => derive(plan, nbu), [plan, nbu])

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

  const openComments = (id: string) =>
    id === 'summary' ? plan.comments.filter((c) => !c.resolved).length : plan.comments.filter((c) => c.step === id && !c.resolved).length
  const index = STEPS.findIndex((s) => s.id === step)
  const current = PAGES.find((s) => s.id === step)!
  const next = index >= 0 ? STEPS[index + 1] : undefined
  const props: SectionProps = { plan, update, d, go, cloud }

  return (
    <>
      <TopBar api={api} account={account} plan={plan} onCreate={() => { api.create(); go('intro') }} />

      <main className="wrap">
        <div className="plan-head no-print">
          <div className="plan-head__name">
            <label htmlFor="client">Клієнт</label>
            <input id="client" value={plan.client} placeholder="Ім’я клієнта" readOnly={!api.canManage} onChange={(e) => update((p) => ({ ...p, client: e.target.value }))} />
          </div>
          <div className="plan-head__name">
            <label htmlFor="currency">Валюта плану</label>
            <select id="currency" value={plan.currency} onChange={(e) => update((p) => ({ ...p, currency: e.target.value as PlanCurrency }))}>
              {PLAN_CURRENCIES.map((k) => <option key={k} value={k}>{CURRENCIES[k].label}</option>)}
            </select>
          </div>
          <button
            type="button"
            className={`chip-btn${step === 'assumptions' ? ' is-active' : ''}`}
            aria-current={step === 'assumptions' ? 'page' : undefined}
            onClick={() => go('assumptions')}
          >
            Припущення
          </button>
          <Backup plans={plans} current={plan} canManage={api.canManage} cloud={cloud} onImport={api.importPlans} />
          {api.canManage && (
            <button
              type="button"
              className="link-btn small plan-head__delete"
              onClick={() => confirm(`Видалити план «${plan.client}»? Його не можна буде відновити.`) && api.remove(plan.id)}
            >
              Видалити план
            </button>
          )}
        </div>

        {api.access && <ClientAccess key={plan.id} access={api.access} client={plan.client} />}
        {api.review && <ReviewBanner review={api.review} />}

        <nav className="steps no-print" aria-label="Кроки плану">
          {STEPS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="steps__item" aria-current={s.id === step ? 'step' : undefined} onClick={(e) => { e.preventDefault(); go(s.id) }}>
              <span className="steps__n">{s.n}</span>
              <span className="steps__t">{s.short}</span>
              {openComments(s.id) > 0 && <span className="steps__badge" title="Невирішені коментарі">{openComments(s.id)}</span>}
            </a>
          ))}
        </nav>

        <h1 className="no-print">{current.title}</h1>
        <current.Screen {...props} />
        {step !== 'intro' && step !== 'assumptions' && (
          <Comments step={step} plan={plan} update={update} role={api.role} setRole={api.setRole} />
        )}

        {next && step !== 'intro' && (
          <div className="next no-print">
            <button type="button" className="btn btn--ink" onClick={() => go(next.id)}>Далі: {next.title} →</button>
          </div>
        )}
      </main>

      <footer className="foot no-print">
        <div className="wrap small muted">
          {cloud
            ? 'План зберігається автоматично в захищеній базі. Бачать його лише клієнт і Юлія.'
            : 'Дані зберігаються лише в цьому браузері й нікуди не надсилаються. Час від часу зберігайте «Копію всіх планів» кнопкою вгорі.'}
        </div>
      </footer>
    </>
  )
}
