/**
 * Market reference data shown on the "Припущення" page. Updated by hand
 * (ask Claude: «онови припущення»). Sources: docs/research-2026-10.md.
 * `unverified` = no primary source found, shown with a warning.
 */
export const MARKET_AS_OF = '2026-10-15'

/** After this many days the page asks to refresh the numbers. */
export const STALE_AFTER_DAYS = 90

export interface MarketItem {
  label: string
  value: string
  note: string
  source?: { label: string; url: string }
  unverified?: boolean
}

export const MARKET: MarketItem[] = [
  {
    label: 'Інфляція в Україні',
    value: '10,0%',
    note: 'Вересень 2026, рік до року; базова — 8,8%',
    source: { label: 'Держстат / ДТКТ', url: 'https://news.dtkt.ua/state/other/115424-indeks-infliaciyi-za-veresen-2026-roku-1021' },
  },
  {
    label: 'Прогноз інфляції НБУ',
    value: '10% → 6,9% → 5%',
    note: 'Кінець 2026 → 2027 → 2028 (прогноз НБУ, липень 2026)',
    source: { label: 'Mind', url: 'https://mind.ua/publications/amp/20308273' },
  },
  {
    label: 'Облікова ставка НБУ',
    value: '16%',
    note: 'З 17.09.2026; наступне рішення — 29.10.2026',
    source: { label: 'LB.ua', url: 'https://lb.ua/economics/2026/09/17/766852_natsbank_pidvischiv_oblikovu.html' },
  },
  {
    label: 'Депозити в гривні',
    value: '≈ 13,8–14,5%',
    note: 'На рік, до податку 23% (індекс UIRD, 15.09.2026)',
    source: { label: 'kurs.com.ua', url: 'https://kurs.com.ua/novost/1479880-depoziti-u-veresni-skilki-dajut-banki-u-grivni-dolarah-ta-euro' },
  },
  {
    label: 'Депозити в доларах',
    value: '≈ 0,8–1,1%',
    note: 'На рік, до податку 23%',
    source: { label: 'kurs.com.ua', url: 'https://kurs.com.ua/novost/1479880-depoziti-u-veresni-skilki-dajut-banki-u-grivni-dolarah-ta-euro' },
  },
  {
    label: 'Депозити в євро',
    value: '≈ 0,3–0,5%',
    note: 'На рік, до податку 23%',
    source: { label: 'kurs.com.ua', url: 'https://kurs.com.ua/novost/1479880-depoziti-u-veresni-skilki-dajut-banki-u-grivni-dolarah-ta-euro' },
  },
  {
    label: 'ОВДП у гривні',
    value: '≈ 14–17%',
    note: 'На рік, без податку. Уточнити за результатами аукціонів Мінфіну',
    unverified: true,
  },
  {
    label: 'Інфляція долара в довгостроковому плані',
    value: '2,5–3%',
    note: 'Ціль ФРС 2% плюс запас. Це припущення для планування, не статистика',
    unverified: true,
  },
]

export function daysSince(isoDate: string, today = new Date()): number {
  return Math.floor((today.getTime() - new Date(isoDate).getTime()) / 86_400_000)
}
