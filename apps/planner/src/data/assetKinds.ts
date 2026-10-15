import type { GlossaryKey } from '../glossary'

/** Kinds of client assets for the "Активи" step. `liquid` = can become cash within days. */
export interface AssetKind {
  id: string
  label: string
  liquid: boolean
  term?: GlossaryKey
}

export const ASSET_KINDS: AssetKind[] = [
  { id: 'cash', label: 'Готівка', liquid: true },
  { id: 'card', label: 'Картка, поточний рахунок', liquid: true },
  { id: 'jar', label: 'Банка, накопичувальний рахунок', liquid: true },
  { id: 'deposit', label: 'Депозит', liquid: true, term: 'deposit' },
  { id: 'ovdp', label: 'ОВДП', liquid: true, term: 'ovdp' },
  { id: 'stablecoin', label: 'Стейблкоїни (USDT, USDC)', liquid: true, term: 'stablecoin' },
  { id: 'investments', label: 'Інвестиції (акції, ETF у брокера)', liquid: true, term: 'etf' },
  { id: 'crypto', label: 'Криптовалюта', liquid: true },
  { id: 'lifeInsurance', label: 'Накопичувальне страхування життя', liquid: false, term: 'lifeSavings' },
  { id: 'pensionFund', label: 'Недержавний пенсійний фонд', liquid: false, term: 'npf' },
  { id: 'rental', label: 'Нерухомість під оренду', liquid: false },
  { id: 'realEstate', label: 'Інша нерухомість', liquid: false },
  { id: 'car', label: 'Автомобіль', liquid: false },
  { id: 'business', label: 'Бізнес, частка в компанії', liquid: false },
  { id: 'loanGiven', label: 'Позика, яку вам винні', liquid: false },
  { id: 'other', label: 'Інше', liquid: false },
]

export const assetKind = (id: string): AssetKind => ASSET_KINDS.find((k) => k.id === id) ?? ASSET_KINDS[ASSET_KINDS.length - 1]

/** Best guess for assets saved before kinds existed. */
export function guessKind(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('готів')) return 'cash'
  if (n.includes('овдп') || n.includes('облігац')) return 'ovdp'
  if (n.includes('депозит')) return 'deposit'
  if (n.includes('банк')) return 'jar'
  if (n.includes('карт') || n.includes('рахун')) return 'card'
  if (n.includes('usdt') || n.includes('usdc')) return 'stablecoin'
  return 'other'
}
