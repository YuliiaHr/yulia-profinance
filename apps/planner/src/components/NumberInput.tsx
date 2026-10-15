import { useState } from 'react'
import { parseNumber, plainNumber } from '../lib/format'

interface Props {
  value: number
  onChange: (v: number) => void
  /** Text shown after the number: "$", "%", "років"… */
  suffix?: string
  /** Stored as a share (0.06), shown as percent (6). */
  percent?: boolean
  label: string
  min?: number
  max?: number
  placeholder?: string
}

export function NumberInput({ value, onChange, suffix, percent, label, min = 0, max, placeholder }: Props) {
  const shown = percent ? round(value * 100, 2) : value
  const [text, setText] = useState<string | null>(null)

  const commit = (t: string) => {
    const n = parseNumber(t)
    if (n === null) return
    const clamped = Math.min(max ?? Infinity, Math.max(min, n))
    onChange(percent ? clamped / 100 : clamped)
  }

  return (
    <span className="num">
      <input
        aria-label={label}
        inputMode="decimal"
        placeholder={placeholder ?? '0'}
        value={text ?? (shown === 0 ? '' : percent ? String(shown).replace('.', ',') : plainNumber(shown))}
        onFocus={(e) => {
          setText(shown === 0 ? '' : String(shown).replace('.', ','))
          requestAnimationFrame(() => e.target.select())
        }}
        onChange={(e) => {
          setText(e.target.value)
          commit(e.target.value)
        }}
        onBlur={() => setText(null)}
      />
      {suffix && <span className="num__suffix">{suffix}</span>}
    </span>
  )
}

const round = (v: number, digits: number) => Math.round(v * 10 ** digits) / 10 ** digits
