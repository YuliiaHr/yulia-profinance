import { useRef, useState } from 'react'
import { backupFileName, makeBackup, readBackup, type MergeResult } from '../state/backup'
import type { Plan } from '../state/plan'

const LAST_KEY = 'yp.planner.lastBackup'
const REMIND_AFTER_DAYS = 14

interface Props {
  plans: Plan[]
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
export function Backup({ plans, onImport }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [last, setLast] = useState<number | null>(readLast)
  const [message, setMessage] = useState<string | null>(null)

  const save = () => {
    const blob = new Blob([JSON.stringify(makeBackup(plans), null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = backupFileName()
    a.click()
    URL.revokeObjectURL(a.href)
    const now = Date.now()
    try {
      localStorage.setItem(LAST_KEY, String(now))
    } catch {
      // reminder just won't be remembered
    }
    setLast(now)
    setMessage(`Збережено копію ${plans.length} ${plans.length === 1 ? 'плану' : 'планів'}. Покладіть файл у надійне місце, наприклад на Google Диск.`)
  }

  const restore = async (file: File) => {
    try {
      const incoming = readBackup(await file.text())
      const r = onImport(incoming)
      const parts = [
        r.added && `додано ${r.added}`,
        r.updated && `оновлено ${r.updated}`,
        r.kept && `${r.kept} без змін (у планері новіша або та сама версія)`,
      ].filter(Boolean)
      setMessage(`Відновлено з файлу: ${parts.join(', ') || 'нічого нового'}.`)
    } catch {
      setMessage('Не вдалося прочитати файл. Оберіть файл копії, збережений кнопкою «Зберегти копію».')
    }
  }

  const days = last ? Math.floor((Date.now() - last) / 86_400_000) : null
  const remind = days === null || days >= REMIND_AFTER_DAYS

  return (
    <div className="backup">
      <div className="backup__buttons">
        <button type="button" className="btn btn--sm btn--ghost-ink" onClick={save}>Зберегти копію</button>
        <button type="button" className="btn btn--sm btn--ghost-ink" onClick={() => input.current?.click()}>Відновити з файлу</button>
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
    </div>
  )
}
