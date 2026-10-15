import { useMemo, useState } from 'react'
import { Stat } from '../components/Field'
import { NumberInput } from '../components/NumberInput'
import { Term } from '../components/Term'
import {
  CATEGORIES, COVER_LABELS, INSURANCE_UPDATED, PROGRAMS,
  type Category, type CategoryId, type Cover, type Program, type Where,
} from '../data/insurance'
import { CURRENCIES, money } from '../lib/format'
import { uid } from '../state/plan'
import type { SectionProps } from './types'

const MAX_COMPARE = 3
const INSURANCE_ROW = 'Страхування'

export function Protection({ plan, update, d }: SectionProps) {
  const c = plan.currency
  const age = plan.freedom.age
  const [catId, setCatId] = useState<CategoryId>('critical')
  const [covers, setCovers] = useState<Cover[]>([])
  const [where, setWhere] = useState<Where | 'any'>('any')
  const [fitsAge, setFitsAge] = useState(true)
  const [compare, setCompare] = useState<string[]>([])
  const [open, setOpen] = useState<string | null>(null)

  const cat = CATEGORIES.find((x) => x.id === catId)!
  const all = PROGRAMS.filter((p) => p.category === catId)
  const list = useMemo(
    () =>
      all.filter((p) => {
        if (catId !== 'critical') return true
        if (covers.some((cv) => !p.covers?.includes(cv))) return false
        // 'ua' = treatment only in Ukraine; 'abroad' = treatment abroad is possible.
        if (where === 'ua' && p.where?.includes('abroad')) return false
        if (where === 'abroad' && !p.where?.includes('abroad')) return false
        if (fitsAge && p.maxEntryAge !== undefined && age > p.maxEntryAge) return false
        return true
      }),
    [all, catId, covers, where, fitsAge, age],
  )
  const chosen = plan.protection
  const isChosen = (id: string) => chosen.some((x) => x.id === id)
  const compared = compare.map((id) => PROGRAMS.find((p) => p.id === id)!).filter(Boolean)

  const switchCat = (id: CategoryId) => {
    setCatId(id)
    setCompare([])
    setOpen(null)
  }
  const toggleCompare = (id: string) =>
    setCompare((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : xs.length >= MAX_COMPARE ? xs : [...xs, id]))
  const toggleChosen = (id: string) =>
    update((p) => ({
      ...p,
      protection: isChosen(id) ? p.protection.filter((x) => x.id !== id) : [...p.protection, { id, price: 0 }],
    }))
  const setPrice = (id: string, price: number) =>
    update((p) => ({ ...p, protection: p.protection.map((x) => (x.id === id ? { ...x, price } : x)) }))

  const monthly = d.protectionYear / 12
  const insuranceRow = plan.fixed.find((r) => r.name === INSURANCE_ROW)
  const syncBudget = () =>
    update((p) => ({
      ...p,
      fixed: insuranceRow
        ? p.fixed.map((r) => (r.id === insuranceRow.id ? { ...r, amount: Math.round(monthly), currency: p.currency } : r))
        : [...p.fixed, { id: uid(), name: INSURANCE_ROW, amount: Math.round(monthly), currency: p.currency }],
    }))

  return (
    <div className="stack stack--tight">
      <p className="lead">
        <Term k="insurance">Страхування</Term> захищає план від подій, на які не вистачить жодного резервного фонду:
        тяжкої хвороби, втрати працездатності, руйнування житла. Порівняйте програми й додайте обрані в план клієнта.
      </p>

      <div className="chips" role="tablist" aria-label="Вид страхування">
        {CATEGORIES.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={x.id === catId}
            className="chip-btn"
            onClick={() => switchCat(x.id)}
          >
            {x.title} <span className="chip-btn__n">{PROGRAMS.filter((p) => p.category === x.id).length}</span>
          </button>
        ))}
      </div>

      <div className="split split--side-first">
        <div className="split__main">
          <p className="cat-lead">
            {cat.term && <><Term k={cat.term}>{cat.title}</Term>. </>}
            {cat.lead}
          </p>

          {catId === 'critical' && (
            <div className="filters" aria-label="Фільтри">
              <div className="filters__group">
                <span className="filters__label">Покриває</span>
                {(Object.keys(COVER_LABELS) as Cover[]).map((cv) => (
                  <label key={cv} className="check">
                    <input
                      type="checkbox"
                      checked={covers.includes(cv)}
                      onChange={() => setCovers((xs) => (xs.includes(cv) ? xs.filter((x) => x !== cv) : [...xs, cv]))}
                    />
                    {COVER_LABELS[cv]}
                  </label>
                ))}
              </div>
              <div className="filters__group">
                <span className="filters__label">Лікування</span>
                {([['any', 'Будь-де'], ['ua', 'Лише в Україні'], ['abroad', 'Є лікування за кордоном']] as const).map(([v, label]) => (
                  <label key={v} className="check">
                    <input type="radio" name="where" checked={where === v} onChange={() => setWhere(v)} />
                    {label}
                  </label>
                ))}
              </div>
              <label className="check">
                <input type="checkbox" checked={fitsAge} onChange={(e) => setFitsAge(e.target.checked)} />
                Лише ті, що можна оформити у {age} {age % 10 === 1 && age % 100 !== 11 ? 'рік' : 'років'}
              </label>
              <p className="filters__count" aria-live="polite">
                Показано {list.length} з {all.length}
                {list.length < all.length && (
                  <>
                    {' · '}
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => {
                        setCovers([])
                        setWhere('any')
                        setFitsAge(false)
                      }}
                    >
                      скинути фільтри
                    </button>
                  </>
                )}
              </p>
            </div>
          )}

          {compared.length >= 2 && <Compare cat={cat} programs={compared} onClose={() => setCompare([])} />}

          {list.length === 0 ? (
            <p className="warn">Жодна програма не відповідає фільтрам. Спробуйте прибрати кілька галочок.</p>
          ) : (
            <div className="cards">
              {list.map((p) => (
                <ProgramCard
                  key={p.id}
                  p={p}
                  cat={cat}
                  open={open === p.id}
                  onToggleOpen={() => setOpen(open === p.id ? null : p.id)}
                  compared={compare.includes(p.id)}
                  compareFull={compare.length >= MAX_COMPARE}
                  onCompare={() => toggleCompare(p.id)}
                  chosen={isChosen(p.id)}
                  onChoose={() => toggleChosen(p.id)}
                />
              ))}
            </div>
          )}
          <p className="small muted">
            Дані з таблиці Юлії станом на {INSURANCE_UPDATED}. Ціни орієнтовні — точну вартість називає страхова після анкети.
            {cat.note && <> {cat.note}</>}
          </p>
        </div>

        <aside className="split__side">
          <div className="card card--ink">
            <p className="overline">План захисту клієнта</p>
            {chosen.length === 0 ? (
              <p className="small muted">Поки нічого не обрано. Натисніть «Додати в план» на картці програми.</p>
            ) : (
              <>
                <ul className="chosen">
                  {chosen.map((x) => {
                    const p = PROGRAMS.find((pr) => pr.id === x.id)
                    if (!p) return null
                    return (
                      <li key={x.id}>
                        <span className="chosen__name">
                          <span className="muted">{p.company}</span>
                          {p.name}
                        </span>
                        <span className="chosen__price">
                          <NumberInput label={`Ціна на рік: ${p.name}`} value={x.price} suffix={`${CURRENCIES[c].symbol}/рік`} onChange={(v) => setPrice(x.id, v)} />
                        </span>
                        <button type="button" className="icon-btn icon-btn--light" aria-label={`Прибрати «${p.name}»`} onClick={() => toggleChosen(x.id)}>×</button>
                      </li>
                    )
                  })}
                </ul>
                <hr />
                <Stat label="Разом" value={money(d.protectionYear, c)} note={`на рік · ${money(monthly, c)} на місяць`} tone="accent" />
                {d.protectionYear > 0 && (
                  insuranceRow && Math.round(d.toPlan(insuranceRow.amount, insuranceRow.currency)) === Math.round(monthly) ? (
                    <p className="good small">✓ Враховано в постійних витратах</p>
                  ) : (
                    <button type="button" className="btn btn--sm" onClick={syncBudget}>
                      {insuranceRow ? 'Оновити' : 'Додати'} в постійні витрати: {money(monthly, c)}/міс
                    </button>
                  )
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function FactLabel({ row }: { row: Category['rows'][number] }) {
  return row.term ? <Term k={row.term}>{row.label}</Term> : <>{row.label}</>
}

interface CardProps {
  p: Program
  cat: Category
  open: boolean
  onToggleOpen: () => void
  compared: boolean
  compareFull: boolean
  onCompare: () => void
  chosen: boolean
  onChoose: () => void
}

function ProgramCard({ p, cat, open, onToggleOpen, compared, compareFull, onCompare, chosen, onChoose }: CardProps) {
  const keyRows = cat.rows.filter((r) => cat.keyRows.includes(r.key) && p.facts[r.key])
  const restRows = cat.rows.filter((r) => !cat.keyRows.includes(r.key) && p.facts[r.key])
  return (
    <article className={`pcard${chosen ? ' pcard--chosen' : ''}`}>
      <p className="pcard__company">{p.company}</p>
      <h3 className="pcard__name">{p.name}</h3>
      {p.covers && (
        <ul className="tags">
          {p.covers.map((cv) => <li key={cv}>{COVER_LABELS[cv]}</li>)}
        </ul>
      )}
      <dl className="facts">
        {keyRows.map((r) => (
          <div key={r.key}>
            <dt><FactLabel row={r} /></dt>
            <dd>{p.facts[r.key]}</dd>
          </div>
        ))}
      </dl>
      {open && (
        <dl className="facts facts--more">
          {restRows.map((r) => (
            <div key={r.key}>
              <dt><FactLabel row={r} /></dt>
              <dd>{p.facts[r.key]}</dd>
            </div>
          ))}
          {p.links.length > 0 && (
            <div>
              <dt>Посилання</dt>
              <dd className="links">
                {p.links.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noopener">{l.label} ↗</a>)}
              </dd>
            </div>
          )}
        </dl>
      )}
      <div className="pcard__actions">
        <button type="button" className="link-btn" aria-expanded={open} onClick={onToggleOpen}>
          {open ? 'Згорнути' : 'Детальніше'}
        </button>
        <label className={`check${!compared && compareFull ? ' is-disabled' : ''}`}>
          <input type="checkbox" checked={compared} disabled={!compared && compareFull} onChange={onCompare} />
          Порівняти
        </label>
        <button type="button" className={`btn btn--sm ${chosen ? 'btn--ink' : ''}`} onClick={onChoose}>
          {chosen ? '✓ У плані' : 'Додати в план'}
        </button>
      </div>
    </article>
  )
}

function Compare({ cat, programs, onClose }: { cat: Category; programs: Program[]; onClose: () => void }) {
  const rows = cat.rows.filter((r) => programs.some((p) => p.facts[r.key]))
  return (
    <section className="compare" aria-label="Порівняння програм">
      <div className="compare__head">
        <h3>Порівняння</h3>
        <button type="button" className="link-btn small" onClick={onClose}>Закрити</button>
      </div>
      <div className="table-wrap">
        <table className="table table--compare">
          <thead>
            <tr>
              <th />
              {programs.map((p) => (
                <th key={p.id}>
                  <span className="muted">{p.company}</span>
                  <br />
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row"><FactLabel row={r} /></th>
                {programs.map((p) => <td key={p.id}>{p.facts[r.key] || '—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
