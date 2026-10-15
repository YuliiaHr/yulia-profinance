import { useLayoutEffect, useRef, useState } from 'react'
import type { FreedomYear } from '../lib/freedom'
import { money, type Currency } from '../lib/format'

interface Props {
  years: FreedomYear[]
  retireAge: number
  lifeAge: number
  lastsUntilAge: number | null
  currency: Currency
}

const H = 280
const PAD = { top: 28, right: 16, bottom: 34, left: 64 }

/** Capital in today's money: grows until retirement, then is spent on the fixed pension. */
export function FreedomChart({ years, retireAge, lifeAge, lastsUntilAge, currency }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const [hover, setHover] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const endAge = Math.max(lifeAge, retireAge + 1) + 5
  const data = years.filter((y) => y.age <= endAge)
  if (data.length < 2) return null

  const maxV = Math.max(1, ...data.map((d) => d.remainingReal))
  const ticks = niceTicks(maxV)
  const top = ticks[ticks.length - 1]
  const x0 = data[0].age
  const x1 = data[data.length - 1].age
  const iw = width - PAD.left - PAD.right
  const ih = H - PAD.top - PAD.bottom
  const sx = (age: number) => PAD.left + ((age - x0) / (x1 - x0)) * iw
  const sy = (v: number) => PAD.top + ih - (v / top) * ih

  const line = data.map((d, i) => `${i ? 'L' : 'M'}${sx(d.age).toFixed(1)},${sy(d.remainingReal).toFixed(1)}`).join('')
  const area = `${line}L${sx(x1)},${sy(0)}L${sx(x0)},${sy(0)}Z`
  const ageStep = x1 - x0 > 40 ? 10 : 5
  const ageTicks = data.filter((d) => d.age % ageStep === 0).map((d) => d.age)
  const hovered = hover === null ? null : data.find((d) => d.age === hover)
  const depleted = lastsUntilAge !== null && lastsUntilAge + 1 <= x1 ? lastsUntilAge + 1 : null

  const onMove = (clientX: number) => {
    const r = wrap.current!.getBoundingClientRect()
    const age = Math.round(x0 + ((clientX - r.left - PAD.left) / iw) * (x1 - x0))
    setHover(Math.min(x1, Math.max(x0, age)))
  }

  return (
    <div className="chart" ref={wrap}>
      <svg width={width} height={H} role="img" aria-label="Капітал у сьогоднішніх цінах за віком">
        {ticks.map((t) => (
          <g key={t}>
            <line className="chart__grid" x1={PAD.left} x2={width - PAD.right} y1={sy(t)} y2={sy(t)} />
            <text className="chart__tick" x={PAD.left - 8} y={sy(t)} dy="0.32em" textAnchor="end">
              {compact(t)}
            </text>
          </g>
        ))}
        {ageTicks.map((a) => (
          <text key={a} className="chart__tick" x={sx(a)} y={H - 12} textAnchor="middle">
            {a}
          </text>
        ))}
        <path className="chart__area" d={area} />
        <path className="chart__line" d={line} />
        <g>
          <line className="chart__marker" x1={sx(retireAge)} x2={sx(retireAge)} y1={PAD.top - 8} y2={sy(0)} />
          <text className="chart__label" x={sx(retireAge)} y={PAD.top - 14} textAnchor={sx(retireAge) > width - 120 ? 'end' : 'middle'}>
            Пенсія з {retireAge}
          </text>
        </g>
        {depleted !== null && (
          <g>
            <circle className="chart__dot" cx={sx(depleted)} cy={sy(0)} r={5} />
            <text className="chart__label" x={sx(depleted)} y={sy(0) - 12} textAnchor={sx(depleted) > width - 120 ? 'end' : 'middle'}>
              Гроші закінчуються в {depleted}
            </text>
          </g>
        )}
        {hovered && (
          <g>
            <line className="chart__cross" x1={sx(hovered.age)} x2={sx(hovered.age)} y1={PAD.top} y2={sy(0)} />
            <circle className="chart__dot" cx={sx(hovered.age)} cy={sy(hovered.remainingReal)} r={5} />
          </g>
        )}
        <rect
          x={PAD.left}
          y={0}
          width={iw}
          height={H}
          fill="transparent"
          onPointerMove={(e) => onMove(e.clientX)}
          onPointerDown={(e) => onMove(e.clientX)}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
      {hovered && (
        <div className="chart__tip" style={{ left: Math.min(width - 170, Math.max(0, sx(hovered.age) - 85)) }}>
          <b>{hovered.age} років</b>
          <span>{money(hovered.remainingReal, currency)}</span>
          <span className="muted">{hovered.age < retireAge ? 'накопичуєте' : 'витрачаєте'}</span>
        </div>
      )}
    </div>
  )
}

function niceTicks(max: number): number[] {
  const raw = max / 4
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  const out: number[] = []
  for (let v = 0; v < max + step; v += step) out.push(v)
  return out
}

function compact(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toLocaleString('uk-UA', { maximumFractionDigits: 1 })} млн`
  if (v >= 1e3) return `${(v / 1e3).toLocaleString('uk-UA', { maximumFractionDigits: 0 })} тис`
  return String(v)
}
