export interface ReserveSplit {
  /** Shares of the fund, 0..1 each. */
  cash: number
  bonds: number
  deposits: number
}

export interface ReserveResult {
  /** Fixed expenses × months, rounded to 100 (as in the spreadsheet). */
  target: number
  parts: ReserveSplit
  partsTotal: number
  shareTotal: number
}

const STEP = 100

export const roundTo = (v: number, step = STEP) => Math.round(v / step) * step
// Small epsilon so 2440.0000001 from float math doesn't jump a whole step.
export const roundUpTo = (v: number, step = STEP) => Math.ceil(v / step - 1e-9) * step

export function reserveFund(fixedMonthly: number, months: number, split: ReserveSplit): ReserveResult {
  const target = roundTo(Math.max(0, fixedMonthly) * Math.max(0, months))
  const parts = {
    cash: roundUpTo(target * split.cash),
    bonds: roundUpTo(target * split.bonds),
    deposits: roundUpTo(target * split.deposits),
  }
  return {
    target,
    parts,
    partsTotal: parts.cash + parts.bonds + parts.deposits,
    shareTotal: split.cash + split.bonds + split.deposits,
  }
}
