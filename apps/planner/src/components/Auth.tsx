import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/cloud'

/** Current Supabase session; undefined while checking. */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  useEffect(() => {
    supabase!.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase!.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])
  return session
}

/** null while checking. */
export function useIsAdvisor(userId: string): boolean | null {
  const [is, setIs] = useState<boolean | null>(null)
  useEffect(() => {
    supabase!.rpc('is_advisor').then(({ data }) => setIs(data === true))
  }, [userId])
  return is
}

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) setError(/invalid/i.test(error.message) ? 'Невірний email або пароль.' : 'Не вдалося увійти. Перевірте інтернет і спробуйте ще раз.')
  }

  return (
    <div className="login">
      <a className="logo login__logo" href="../">yulia<span>.</span>profinance</a>
      <form className="login__card" onSubmit={submit}>
        <h1>Фінансовий план</h1>
        <p className="muted">Увійдіть, щоб переглянути свій план.</p>
        <label className="login__field">
          <span>Email</span>
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="login__field">
          <span>Пароль</span>
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="warn">{error}</p>}
        <button type="submit" className="btn" disabled={busy}>{busy ? 'Входимо…' : 'Увійти'}</button>
        <p className="small muted">Немає доступу або забули пароль? Напишіть Юлії — вона надішле новий.</p>
      </form>
    </div>
  )
}

export function Splash({ text = 'Завантаження…' }: { text?: string }) {
  return <div className="splash">{text}</div>
}

/** Email, save status, change password, sign out — shown in the top bar in cloud mode. */
export function AccountBar({ email, saveState }: { email: string; saveState?: 'saved' | 'saving' | 'error' }) {
  const [changing, setChanging] = useState(false)
  const [pwd, setPwd] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const change = async (e: FormEvent) => {
    e.preventDefault()
    if (pwd.length < 8) return setMsg('Щонайменше 8 символів.')
    const { error } = await supabase!.auth.updateUser({ password: pwd })
    setMsg(error ? 'Не вдалося змінити пароль.' : 'Пароль змінено.')
    if (!error) {
      setPwd('')
      setTimeout(() => setChanging(false), 1500)
    }
  }

  return (
    <div className="account">
      {saveState && (
        <span className={`account__save account__save--${saveState}`}>
          {saveState === 'saved' ? '✓ Збережено' : saveState === 'saving' ? 'Зберігаю…' : '⚠ Не збережено — перевірте інтернет'}
        </span>
      )}
      <span className="account__email">{email}</span>
      <button type="button" className="account__link" onClick={() => { setChanging(!changing); setMsg(null) }}>Змінити пароль</button>
      <button type="button" className="account__link" onClick={() => supabase!.auth.signOut()}>Вийти</button>
      {changing && (
        <form className="account__pwd" onSubmit={change}>
          <input type="password" autoComplete="new-password" placeholder="Новий пароль" aria-label="Новий пароль" value={pwd} onChange={(e) => setPwd(e.target.value)} />
          <button type="submit" className="btn btn--sm">Зберегти</button>
          {msg && <span className="small">{msg}</span>}
        </form>
      )}
    </div>
  )
}
