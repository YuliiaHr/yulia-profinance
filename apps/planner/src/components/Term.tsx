import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { GLOSSARY, type GlossaryKey } from '../glossary'

/** A word with a plain-language explanation: hover, focus or tap to see it. */
export function Term({ k, children }: { k: GlossaryKey; children?: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btn = useRef<HTMLButtonElement>(null)
  const id = useId()
  const entry = GLOSSARY[k]

  useLayoutEffect(() => {
    if (!open || !btn.current) return
    const r = btn.current.getBoundingClientRect()
    const width = Math.min(300, window.innerWidth - 32)
    const left = Math.min(Math.max(16, r.left + r.width / 2 - width / 2), window.innerWidth - width - 16)
    setPos({ top: r.bottom + 8, left })
  }, [open])

  useEffect(() => {
    if (!open) return
    const close = () => {
      setOpen(false)
      setPinned(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    const onDown = (e: PointerEvent) => !btn.current?.contains(e.target as Node) && close()
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('scroll', close, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('scroll', close)
    }
  }, [open])

  return (
    <>
      <button
        ref={btn}
        type="button"
        className="term"
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => {
          setPinned(!pinned)
          setOpen(!pinned)
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => !pinned && setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => !pinned && setOpen(false)}
      >
        {children ?? entry.term}
      </button>
      {open && (
        <span role="tooltip" id={id} className="term__tip" style={{ top: pos.top, left: pos.left }}>
          <b>{entry.term}.</b> {entry.text}
        </span>
      )}
    </>
  )
}
