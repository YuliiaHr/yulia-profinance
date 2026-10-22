import { useRef, useState } from 'react'
import { backupFileName, makeBackup, planFileName, readBackup, type MergeResult } from '../state/backup'
import type { Plan } from '../state/plan'

const LAST_KEY = 'yp.planner.lastBackup'
const REMIND_AFTER_DAYS = 14

interface Props {
  plans: Plan[]
  current: Plan
  onImport: (plans: Plan[]) => MergeResult
}

function readLast(): number | null {
  try {
    const v = localStorage.getItem(LAST_KEY)
    return v ? Number(v) : null
  } catch {
    return null
  }
}

/** Save all plans to a file / restore them from a file. */
export function Backup({ plans, current, onImport }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [last, setLast] = useState<number | null>(readLast)
  const [message, setMessage] = useState<string | null>(null)
  const [changes, setChanges] = useState<string[]>([])

  const download = (list: Plan[], name: string) => {
    const blob = new Blob([JSON.stringify(makeBackup(list), null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const saveOne = () => {
    setChanges([])
    download([current], planFileName(current.client))
    setMessage(
      `Збережено план «${current.client || 'без імені'}». Надішліть файл клієнту особисто разом із посиланням на планер (${location.origin}${location.pathname}). ` +
        'Клієнт натискає «Відкрити файл», заповнює свої дані й так само зберігає план у файл, який повертає вам.',
    )
  }

  const save = () => {
    setChanges([])
    download(plans, backupFileName())
    const now = Date.now()
    try {
      localStorage.setItem(LAST_KEY, String(now))
    } catch {
      // reminder just won't be remembered
    }
    setLast(now)
    setMessage(`Збережено копію всіх планів: ${plans.length} ${plans.length === 1 ? 'план' : 'планів'}. Покладіть файл у надійне місце, наприклад на Google Диск.`)
  }

  const restore = async (file: File) => {
    try {
      const incoming = readBackup(await file.text())
      const r = onImport(incoming)
      setChanges(incoming.length === 1 ? r.changes[incoming[0].id] ?? [] : [])
      if (incoming.length === 1) {
        setMessage(
          r.added ? `Відкрито новий план «${incoming[0].client}».`
            : r.updated ? `План «${incoming[0].client}» оновлено версією з файлу. ${(r.changes[incoming[0].id] ?? []).length ? 'Що змінилося:' : 'Змін у цифрах немає.'}`
              : `План «${incoming[0].client}» у планері вже новіший або такий самий — нічого не змінено.`,
        )
        return
      }
      const parts = [
        r.added && `додано ${r.added}`,
        r.updated && `оновлено ${r.updated}`,
        r.kept && `${r.kept} без змін (у планері новіша або та сама версія)`,
      ].filter(Boolean)
      setMessage(`Відновлено з файлу: ${parts.join(', ') || 'нічого нового'}.`)
    } catch {
      setMessage('Не вдалося прочитати файл. Оберіть файл, збережений цим планером.')
    }
  }

  const days = last ? Math.floor((Date.now() - last) / 86_400_000) : null
  const remind = days === null || days >= REMIND_AFTER_DAYS

  return (
    <div className="backup">
      <div className="backup__buttons">
        <button type="button" className="btn btn--sm btn--ghost-ink" onClick={saveOne}>Зберегти цей план у файл</button>
        <button type="button" className="btn btn--sm btn--ghost-ink" onClick={save}>Копія всіх планів</button>
        <button type="button" className="btn btn--sm btn--ghost-ink" onClick={() => input.current?.click()}>Відкрити файл</button>
        <input
          ref={input}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) restore(f)
            e.target.value = ''
          }}
        />
      </div>
      <p className={`backup__status${remind ? ' is-remind' : ''}`}>
        {days === null
          ? 'Копію планів ще не зберігали'
          : days === 0
            ? 'Копію збережено сьогодні'
            : `Остання копія — ${days} дн. тому`}
        {remind && ' · збережіть копію, щоб не втратити дані'}
      </p>
      {message && <p className="backup__message" role="status">{message}</p>}
      {changes.length > 0 && (
        <ul className="backup__changes">
          {changes.slice(0, 40).map((c) => <li key={c}>{c}</li>)}
          {changes.length > 40 && <li>…і ще {changes.length - 40}</li>}
        </ul>
      )}
    </div>
  )
}
