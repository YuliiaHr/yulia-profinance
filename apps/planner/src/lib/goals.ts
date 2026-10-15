/** Whole months from `from` to a "YYYY-MM" month. Past or invalid dates → 0. */
export function monthsUntil(target: string, from: Date = new Date()): number {
  const m = /^(\d{4})-(\d{2})$/.exec(target)
  if (!m) return 0
  const diff = Number(m[1]) * 12 + (Number(m[2]) - 1) - (from.getFullYear() * 12 + from.getMonth())
  return Math.max(0, diff)
}

/** Monthly amount to put aside so the goal is funded by its date (no interest assumed). */
export function monthlyForGoal(cost: number, saved: number, months: number): number {
  const left = Math.max(0, cost - saved)
  if (left === 0) return 0
  return months > 0 ? left / months : left
}
