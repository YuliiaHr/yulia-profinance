import { useEffect, useState } from 'react'
import type { Author } from './plan'

/**
 * Who is using this browser: the advisor or a client. Kept in the browser, not in the plan.
 * A browser that created a client is the advisor's; one that only opened a plan from a file is a client's.
 */
const ROLE_KEY = 'yp.planner.role'

function read(): Author | null {
  try {
    const v = localStorage.getItem(ROLE_KEY)
    return v === 'advisor' || v === 'client' ? v : null
  } catch {
    return null
  }
}

const EVENT = 'yp-role-change'

export function setRole(role: Author) {
  try {
    localStorage.setItem(ROLE_KEY, role)
  } catch {
    // fine: the toggle still works for this visit
  }
  window.dispatchEvent(new CustomEvent<Author>(EVENT, { detail: role }))
}

/** Sets the role only if none is known yet. */
export function setRoleIfUnknown(role: Author) {
  if (!read()) setRole(role)
}

export function useRole(): [Author, (r: Author) => void] {
  const [role, set] = useState<Author>(() => read() ?? 'advisor')
  // Stay in sync when the role changes elsewhere (e.g. a client opens a plan file).
  useEffect(() => {
    const on = (e: Event) => set((e as CustomEvent<Author>).detail)
    window.addEventListener(EVENT, on)
    return () => window.removeEventListener(EVENT, on)
  }, [])
  return [role, setRole]
}

export const AUTHOR_LABEL: Record<Author, string> = { advisor: 'Юлія', client: 'Клієнт' }
