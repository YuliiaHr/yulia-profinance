import type { ReactNode } from 'react'

/** Label + control + optional hint, laid out as one row. */
export function Field({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <span className="field__control">{children}</span>
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  )
}

/** Big headline number with a caption. */
export function Stat({ label, value, note, tone }: { label: ReactNode; value: ReactNode; note?: ReactNode; tone?: 'good' | 'bad' | 'accent' }) {
  return (
    <div className={`stat${tone ? ` stat--${tone}` : ''}`}>
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
      {note && <span className="stat__note">{note}</span>}
    </div>
  )
}
