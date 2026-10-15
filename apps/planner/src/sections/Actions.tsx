import { STAGES, STATUSES, USEFUL_LINKS, type TaskStage, type TaskStatus } from '../data/templates'
import { uid, type Task } from '../state/plan'
import type { SectionProps } from './types'

export function Actions({ plan, update }: SectionProps) {
  const tasks = plan.tasks
  const set = (id: string, patch: Partial<Task>) =>
    update((p) => ({ ...p, tasks: p.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
  const done = tasks.filter((t) => t.status === 'done').length

  return (
    <div className="stack">
      <div className="progress">
        <p className="lead">Покроковий план: що зробити, щоб фінансовий план запрацював. Відмічайте статус і дату.</p>
        <div className="progress__bar" role="progressbar" aria-valuemin={0} aria-valuemax={tasks.length} aria-valuenow={done} aria-label="Виконано завдань">
          <span style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }} />
        </div>
        <p className="small"><b>Виконано {done} з {tasks.length}</b></p>
      </div>

      {(Object.keys(STAGES) as TaskStage[]).map((stage) => (
        <section className="group" key={stage}>
          <h3>{STAGES[stage]}</h3>
          <ul className="tasks">
            {tasks.filter((t) => t.stage === stage).map((t) => (
              <li key={t.id} className={`task task--${t.status}`}>
                <select aria-label="Статус" className="task__status" value={t.status} onChange={(e) => set(t.id, { status: e.target.value as TaskStatus })}>
                  {(Object.keys(STATUSES) as TaskStatus[]).map((s) => <option key={s} value={s}>{STATUSES[s]}</option>)}
                </select>
                <input className="task__title" aria-label="Завдання" placeholder="Завдання" value={t.title} onChange={(e) => set(t.id, { title: e.target.value })} />
                <input className="task__date" type="date" aria-label="Термін" value={t.date} onChange={(e) => set(t.id, { date: e.target.value })} />
                <button type="button" className="icon-btn" aria-label={`Видалити «${t.title}»`} onClick={() => update((p) => ({ ...p, tasks: p.tasks.filter((x) => x.id !== t.id) }))}>×</button>
                <input className="task__note" aria-label="Примітка" placeholder="Примітка" value={t.note} onChange={(e) => set(t.id, { note: e.target.value })} />
                {t.link && <a className="task__link" href={t.link} target="_blank" rel="noopener">Відкрити ↗</a>}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="link-btn"
            onClick={() => update((p) => ({ ...p, tasks: [...p.tasks, { id: uid(), stage, title: '', status: 'todo', date: '', note: '' }] }))}
          >
            + Додати завдання
          </button>
        </section>
      ))}

      <section className="group">
        <h3>Корисні посилання</h3>
        <ul className="useful">
          {USEFUL_LINKS.map((l) => (
            <li key={l.url}><a href={l.url} target="_blank" rel="noopener">{l.label} ↗</a></li>
          ))}
        </ul>
      </section>
    </div>
  )
}
