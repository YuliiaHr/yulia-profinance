export interface Holding {
  ticker: string
  /** Target share of the portfolio, 0..1. */
  weight: number
  /** Shares held now. */
  qty: number
  /** Current price of one share. */
  price: number
}

export interface RebalanceLine {
  ticker: string
  value: number
  actualWeight: number
  /** Exact number of shares to buy (+) or sell (−) to reach the target. */
  trade: number
  /** Whole shares: rounded towards zero so you never overspend. */
  tradeWhole: number
  tradeValue: number
}

/** Ported from the "Ребаланс Фін.свобода" sheet. */
export function rebalance(holdings: Holding[], deposit: number) {
  const total = holdings.reduce((s, h) => s + h.qty * h.price, 0)
  const after = total + deposit
  const lines: RebalanceLine[] = holdings.map((h) => {
    const value = h.qty * h.price
    const trade = h.price > 0 ? (after * h.weight) / h.price - h.qty : 0
    const tradeWhole = Math.trunc(trade + (trade > 0 ? 1e-9 : -1e-9))
    return {
      ticker: h.ticker,
      value,
      actualWeight: total > 0 ? value / total : 0,
      trade,
      tradeWhole,
      tradeValue: tradeWhole * h.price,
    }
  })
  return { total, after, lines, weightTotal: holdings.reduce((s, h) => s + h.weight, 0) }
}
