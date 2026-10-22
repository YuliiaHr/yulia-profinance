import { useState, type FormEvent } from 'react'
import type { PlansApi } from '../state/api'

/** Advisor: give the client of this plan a login, reset their password or close access. */
export function ClientAccess({ access, client }: { access: NonNullable<PlansApi['access']>; client: string }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState<{ email: string; password: string | null } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const site = `${location.origin}${location.pathname}`

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(`Не вдалося: ${(e as Error).message}`)
    }
    setBusy(false)
  }

  const grant = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      const { password } = await access.grant(email)
      setInfo({ email: email.trim().toLowerCase(), password })
      setEmail('')
    })
  }

  const text = info?.password
    ? `Ваш фінансовий план: ${site}\nЛогін: ${info.email}\nПароль: ${info.password}\nПісля входу пароль можна змінити.`
    : ''

  return (
    <div className="access">
      {access.email ? (
        <p className="access__line">
          <b>Доступ клієнта:</b> {access.email} ·{' '}
          <button type="button" className="link-btn" disabled={busy} onClick={() => run(async () => setInfo({ email: access.email!, password: await access.resetPassword() }))}>
            новий пароль
          </button>{' '}
          ·{' '}
          <button type="button" className="link-btn" disabled={busy} onClick={() => confirm(`Закрити доступ ${access.email} до плану «${client}»?`) && run(async () => { await access.revoke(); setInfo(null) })}>
            закрити доступ
          </button>
        </p>
      ) : (
        <form className="access__form" onSubmit={grant}>
          <b>Доступ клієнта:</b>
          <input type="email" required placeholder="email клієнта" aria-label="Email клієнта" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit" className="btn btn--sm btn--ink" disabled={busy}>{busy ? 'Створюю…' : 'Відкрити доступ'}</button>
        </form>
      )}
      {error && <p className="warn">{error}</p>}
      {info && (
        <div className="access__info" role="status">
          {info.password ? (
            <>
              <p>Надішліть клієнту особисто (лише цей текст, без інших даних):</p>
              <pre>{text}</pre>
              <button type="button" className="btn btn--sm" onClick={() => navigator.clipboard?.writeText(text)}>Скопіювати</button>
            </>
          ) : (
            <p>У {info.email} вже є акаунт — клієнт входить зі своїм паролем і тепер бачить цей план.</p>
          )}
        </div>
      )}
    </div>
  )
}

/** Advisor: what the client changed since the advisor last looked. */
export function ReviewBanner({ review }: { review: NonNullable<PlansApi['review']> }) {
  return (
    <div className="review" role="status">
      <p><b>Клієнт змінив план:</b></p>
      <ul>{review.changes.slice(0, 40).map((c) => <li key={c}>{c}</li>)}</ul>
      <button type="button" className="btn btn--sm btn--ink" onClick={review.markSeen}>Переглянуто</button>
    </div>
  )
}
