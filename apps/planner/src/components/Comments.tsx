import { useState } from 'react'
import { uid, type Comment, type Plan } from '../state/plan'
import { AUTHOR_LABEL } from '../state/role'
import type { Author } from '../state/plan'

interface Props {
  step: string
  plan: Plan
  update: (change: (p: Plan) => Plan) => void
  role: Author
  /** Local mode only: let the user say who is writing. */
  setRole?: (r: Author) => void
}

const when = (at: number) =>
  new Date(at).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Comment thread at the bottom of each step: questions from the client, notes from the advisor. */
export function Comments({ step, plan, update, role, setRole }: Props) {
  const [text, setText] = useState('')
  const list = plan.comments.filter((c) => c.step === step)
  const open = list.filter((c) => !c.resolved).length
  const set = (id: string, patch: Partial<Comment>) =>
    update((p) => ({ ...p, comments: p.comments.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))

  const add = () => {
    const t = text.trim()
    if (!t) return
    update((p) => ({ ...p, comments: [...p.comments, { id: uid(), step, author: role, text: t, at: Date.now(), resolved: false }] }))
    setText('')
  }

  return (
    <section className="comments no-print" aria-label="Коментарі до цього кроку">
      <h3>
        Коментарі {list.length > 0 && <span className="comments__count">{open > 0 ? `${open} невирішен${open === 1 ? 'ий' : 'их'}` : 'усі вирішено'}</span>}
      </h3>
      {list.length > 0 && (
        <ul className="comments__list">
          {list.map((c) => (
            <li key={c.id} className={`comment comment--${c.author}${c.resolved ? ' is-resolved' : ''}`}>
              <div className="comment__head">
                <b>{AUTHOR_LABEL[c.author]}</b>
                <span className="muted">{when(c.at)}</span>
                <span className="comment__tools">
                  <label className="check">
                    <input type="checkbox" checked={c.resolved} onChange={(e) => set(c.id, { resolved: e.target.checked })} />
                    Вирішено
                  </label>
                  {c.author === role && (
                    <button type="button" className="icon-btn" aria-label="Видалити коментар" onClick={() => update((p) => ({ ...p, comments: p.comments.filter((x) => x.id !== c.id) }))}>×</button>
                  )}
                </span>
              </div>
              <p className="comment__text">{c.text}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="comments__form">
        <textarea
          aria-label="Новий коментар"
          rows={2}
          placeholder={role === 'client' ? 'Що незрозуміло або що варто змінити?' : 'Коментар або пояснення для клієнта'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) add()
          }}
        />
        <div className="comments__actions">
          {setRole ? (
            <span className="comments__role">
              Пишу як:
              {(['advisor', 'client'] as const).map((r) => (
                <button key={r} type="button" className={`chip-btn chip-btn--sm${role === r ? ' is-active' : ''}`} onClick={() => setRole(r)}>
                  {AUTHOR_LABEL[r]}
                </button>
              ))}
            </span>
          ) : (
            <span className="comments__role">Пишу як: <b>{AUTHOR_LABEL[role]}</b></span>
          )}
          <button type="button" className="btn btn--sm" onClick={add} disabled={!text.trim()}>Додати коментар</button>
        </div>
      </div>
    </section>
  )
}
