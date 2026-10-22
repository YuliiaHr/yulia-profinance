import { useCallback, useEffect, useRef, useState } from 'react'
import { generatePassword, signupClient, supabase } from '../lib/cloud'
import type { PlansApi } from './api'
import { mergePlans } from './backup'
import { diffPlans } from './diff'
import { newPlan, type Plan } from './plan'
import { upgrade } from './upgrade'

/** A row of public.plans (see supabase/schema.sql). */
interface Row {
  id: string
  client_id: string | null
  client_email: string | null
  data: Plan
  updated_at: string
  updated_by: string | null
  advisor_snapshot: Plan | null
}

const SAVE_DELAY_MS = 800
const REFRESH_MS = 30_000

/** Cloud mode: plans live in Supabase; the advisor sees all, a client sees only their own. */
export function useCloudPlans(userId: string, isAdvisor: boolean): PlansApi & { loading: boolean; loadError: string | null } {
  const db = supabase!
  const [rows, setRows] = useState<Row[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved')
  const rowsRef = useRef(rows)
  rowsRef.current = rows
  const dirty = useRef(new Set<string>())
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const fromDb = (r: Row): Row => ({ ...r, data: upgrade({ ...r.data, id: r.id }) })

  const fetchRows = useCallback(async () => {
    const { data, error } = await db.from('plans').select('*').order('updated_at', { ascending: false })
    if (error) throw error
    return (data as Row[]).map(fromDb)
  }, [db])

  // Initial load.
  useEffect(() => {
    let alive = true
    fetchRows()
      .then((r) => {
        if (!alive) return
        setRows(r)
        setCurrentId((id) => id ?? r[0]?.id ?? null)
      })
      .catch(() => alive && setLoadError('Не вдалося завантажити плани. Перевірте інтернет і оновіть сторінку.'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [fetchRows])

  // Pick up changes made elsewhere (the client or the advisor on another device).
  useEffect(() => {
    const refresh = () =>
      fetchRows()
        .then((remote) =>
          setRows((local) => {
            const merged = remote.map((r) => {
              const l = local.find((x) => x.id === r.id)
              if (l && dirty.current.has(r.id)) return l
              return l && l.updated_at >= r.updated_at ? l : r
            })
            for (const l of local) if (dirty.current.has(l.id) && !merged.some((m) => m.id === l.id)) merged.push(l)
            return merged
          }),
        )
        .catch(() => {
          // offline: try again later
        })
    const onFocus = () => document.visibilityState === 'visible' && refresh()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    const t = setInterval(refresh, REFRESH_MS)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
      clearInterval(t)
    }
  }, [fetchRows])

  const pendingReview = (r: Row) =>
    isAdvisor && r.updated_by !== null && r.updated_by !== userId && r.advisor_snapshot !== null && diffPlans(r.advisor_snapshot, r.data).length > 0

  const save = useCallback(
    async (id: string) => {
      const row = rowsRef.current.find((r) => r.id === id)
      if (!row) return
      setSaveState('saving')
      // The advisor's own edits count as reviewed — unless the client's changes are still unread.
      const payload: Partial<Row> = { data: row.data }
      if (isAdvisor && !pendingReview(row)) payload.advisor_snapshot = row.data
      const { data, error } = await db.from('plans').update(payload).eq('id', id).select('updated_at, updated_by').single()
      if (error) {
        setSaveState('error')
        return
      }
      dirty.current.delete(id)
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...(data as Partial<Row>), advisor_snapshot: payload.advisor_snapshot ?? r.advisor_snapshot } : r)))
      setSaveState(dirty.current.size ? 'saving' : 'saved')
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, isAdvisor, userId],
  )

  const scheduleSave = useCallback(
    (id: string) => {
      dirty.current.add(id)
      setSaveState('saving')
      clearTimeout(timers.current.get(id))
      timers.current.set(id, setTimeout(() => save(id), SAVE_DELAY_MS))
    },
    [save],
  )

  // Don't lose the last keystrokes when the tab closes.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current.size) e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  const current = rows.find((r) => r.id === currentId) ?? rows[0]

  const update = useCallback(
    (change: (p: Plan) => Plan) => {
      const id = current?.id
      if (!id) return
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, data: { ...change(r.data), updatedAt: Date.now() } } : r)))
      scheduleSave(id)
    },
    [current?.id, scheduleSave],
  )

  const create = () => {
    if (!isAdvisor) return
    const p = newPlan()
    const row: Row = { id: p.id, client_id: null, client_email: null, data: p, updated_at: new Date().toISOString(), updated_by: userId, advisor_snapshot: p }
    setRows((rs) => [row, ...rs])
    setCurrentId(p.id)
    db.from('plans').insert({ id: p.id, data: p, advisor_snapshot: p }).then(({ error }) => error && setSaveState('error'))
  }

  const remove = (id: string) => {
    if (!isAdvisor) return
    setRows((rs) => rs.filter((r) => r.id !== id))
    setCurrentId(null)
    db.from('plans').delete().eq('id', id).then(({ error }) => error && setSaveState('error'))
  }

  const importPlans = (incoming: Plan[]) => {
    const merged = mergePlans(rows.map((r) => r.data), incoming.map(upgrade))
    if (!isAdvisor) return { ...merged, added: 0, updated: 0, kept: incoming.length, changes: {} }
    const changed = merged.plans.filter((p) => incoming.some((i) => i.id === p.id) && (merged.changes[p.id] || !rows.some((r) => r.id === p.id)))
    for (const p of changed) {
      const existing = rows.find((r) => r.id === p.id)
      if (existing) {
        setRows((rs) => rs.map((r) => (r.id === p.id ? { ...r, data: p } : r)))
        scheduleSave(p.id)
      } else {
        const row: Row = { id: p.id, client_id: null, client_email: null, data: p, updated_at: new Date().toISOString(), updated_by: userId, advisor_snapshot: p }
        setRows((rs) => [row, ...rs])
        db.from('plans').insert({ id: p.id, data: p, advisor_snapshot: p }).then(({ error }) => error && setSaveState('error'))
      }
    }
    if (incoming.length === 1) setCurrentId(incoming[0].id)
    return merged
  }

  const setRow = (id: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const review =
    current && pendingReview(current)
      ? {
          changes: diffPlans(current.advisor_snapshot!, current.data),
          markSeen: () => {
            setRow(current.id, { advisor_snapshot: current.data })
            db.from('plans').update({ advisor_snapshot: current.data }).eq('id', current.id).then(({ error }) => error && setSaveState('error'))
          },
        }
      : undefined

  const access =
    isAdvisor && current
      ? {
          email: current.client_email,
          grant: async (email: string) => {
            const clean = email.trim().toLowerCase()
            const password = generatePassword()
            const { error } = await signupClient()!.auth.signUp({ email: clean, password })
            const exists = !!error && /already|registered|exists/i.test(error.message)
            if (error && !exists) throw new Error(error.message)
            const { data: clientId, error: linkError } = await db.rpc('link_client', { plan_id: current.id, email: clean })
            if (linkError) throw new Error(linkError.message)
            setRow(current.id, { client_id: clientId as string, client_email: clean })
            return { password: exists ? null : password }
          },
          revoke: async () => {
            const { error } = await db.rpc('unlink_client', { plan_id: current.id })
            if (error) throw new Error(error.message)
            setRow(current.id, { client_id: null, client_email: null })
          },
          resetPassword: async () => {
            const password = generatePassword()
            const { error } = await db.rpc('reset_client_password', { plan_id: current.id, new_password: password })
            if (error) throw new Error(error.message)
            return password
          },
        }
      : undefined

  return {
    mode: 'cloud',
    plans: rows.map((r) => r.data),
    plan: current?.data,
    update,
    select: setCurrentId,
    create,
    remove,
    importPlans,
    role: isAdvisor ? 'advisor' : 'client',
    canManage: isAdvisor,
    saveState,
    review,
    access,
    loading,
    loadError,
  }
}
