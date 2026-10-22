import type { Row } from '../lib/budget'
import { CURRENCIES, type Currency } from '../lib/format'
import type { Plan } from './plan'
import { PROGRAMS } from '../data/insurance'
import { STATUSES } from '../data/templates'

/**
 * Human-readable list of what changed between two versions of the same plan,
 * shown when the advisor opens a file the client sent back.
 */
export function diffPlans(before: Plan, after: Plan): string[] {
  const out: string[] = []
  const amount = (v: number, cur: Currency) => `${v.toLocaleString('uk-UA', { maximumFractionDigits: 2 })} ${CURRENCIES[cur].symbol}`
  const pct = (v: number) => `${Math.round(v * 1000) / 10}%`

  if (before.client !== after.client) out.push(`Ім’я: «${before.client}» → «${after.client}»`)
  if (before.currency !== after.currency) out.push(`Валюта плану: ${before.currency} → ${after.currency}`)

  const rows = (title: string, a: Row[], b: Row[]) => {
    const cur = (r: Row) => r.currency ?? after.currency
    for (const r of b) {
      const old = a.find((x) => x.id === r.id)
      if (!old) {
        if (r.amount || r.name) out.push(`${title} · додано «${r.name || 'без назви'}»: ${amount(r.amount, cur(r))}`)
      } else if (old.amount !== r.amount || cur(old) !== cur(r)) {
        out.push(`${title} · ${r.name || old.name}: ${amount(old.amount, cur(old))} → ${amount(r.amount, cur(r))}`)
      } else if (old.name !== r.name) out.push(`${title} · перейменовано «${old.name}» → «${r.name}»`)
    }
    for (const r of a) if (!b.some((x) => x.id === r.id) && (r.amount || r.name)) out.push(`${title} · видалено «${r.name}»`)
  }
  rows('Доходи', before.income, after.income)
  rows('Постійні витрати', before.fixed, after.fixed)
  rows('Бажання', before.wants, after.wants)
  rows('Благодійність', before.charity, after.charity)

  const r0 = before.reserve
  const r1 = after.reserve
  if (r0.months !== r1.months) out.push(`Резервний фонд: ${r0.months} → ${r1.months} міс`)
  if (r0.saved !== r1.saved) out.push(`Резервний фонд · вже відкладено: ${amount(r0.saved, after.currency)} → ${amount(r1.saved, after.currency)}`)
  if (r0.date !== r1.date) out.push(`Резервний фонд · зібрати до: ${r0.date} → ${r1.date}`)

  for (const g of after.goals) {
    const old = before.goals.find((x) => x.id === g.id)
    if (!old) out.push(`Цілі · додано «${g.name}»: ${amount(g.cost, after.currency)} до ${g.date}`)
    else {
      if (old.cost !== g.cost) out.push(`Цілі · ${g.name}: вартість ${amount(old.cost, after.currency)} → ${amount(g.cost, after.currency)}`)
      if (old.saved !== g.saved) out.push(`Цілі · ${g.name}: вже є ${amount(old.saved, after.currency)} → ${amount(g.saved, after.currency)}`)
      if (old.date !== g.date) out.push(`Цілі · ${g.name}: дата ${old.date} → ${g.date}`)
      if (old.name !== g.name) out.push(`Цілі · перейменовано «${old.name}» → «${g.name}»`)
    }
  }
  for (const g of before.goals) if (!after.goals.some((x) => x.id === g.id)) out.push(`Цілі · видалено «${g.name}»`)

  for (const a of after.assets) {
    const old = before.assets.find((x) => x.id === a.id)
    const label = a.name || a.kind
    if (!old) out.push(`Активи · додано «${label}»: ${amount(a.amount, a.currency)}`)
    else if (old.amount !== a.amount || old.currency !== a.currency) out.push(`Активи · ${label}: ${amount(old.amount, old.currency)} → ${amount(a.amount, a.currency)}`)
  }
  for (const a of before.assets) if (!after.assets.some((x) => x.id === a.id)) out.push(`Активи · видалено «${a.name || a.kind}»`)

  const f0 = before.freedom
  const f1 = after.freedom
  const years: Array<[keyof typeof f0, string]> = [['age', 'вік'], ['retireAge', 'вихід на пенсію'], ['lifeAge', 'вік дожиття']]
  for (const [k, label] of years) if (f0[k] !== f1[k]) out.push(`Свобода · ${label}: ${f0[k]} → ${f1[k]}`)
  const shares: Array<[keyof typeof f0, string]> = [['saveRate', 'відкладати'], ['returnRate', 'дохідність'], ['inflation', 'інфляція'], ['incomeGrowth', 'ріст доходу']]
  for (const [k, label] of shares) if (f0[k] !== f1[k]) out.push(`Свобода · ${label}: ${pct(f0[k] as number)} → ${pct(f1[k] as number)}`)
  if (f0.capital !== f1.capital) out.push(`Свобода · вже накопичено: ${amount(f0.capital, after.currency)} → ${amount(f1.capital, after.currency)}`)

  const name = (id: string) => PROGRAMS.find((p) => p.id === id)?.name ?? id
  for (const x of after.protection) if (!before.protection.some((y) => y.id === x.id)) out.push(`Захист · додано «${name(x.id)}»`)
  for (const x of before.protection) if (!after.protection.some((y) => y.id === x.id)) out.push(`Захист · прибрано «${name(x.id)}»`)

  for (const t of after.tasks) {
    const old = before.tasks.find((x) => x.id === t.id)
    if (old && old.status !== t.status) out.push(`План дій · ${t.title}: ${STATUSES[old.status]} → ${STATUSES[t.status]}`)
    if (!old) out.push(`План дій · додано «${t.title}»`)
  }

  const fresh = after.comments.filter((c) => !before.comments.some((x) => x.id === c.id))
  if (fresh.length) out.push(`Нових коментарів: ${fresh.length}`)
  return out
}
