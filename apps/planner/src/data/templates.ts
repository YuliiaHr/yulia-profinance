/**
 * Starting content for a new plan, taken from the advisor's prototype sheet
 * (tabs ROADMAP, Фін.свобода, Корисні посилання). Client-specific data
 * (dates, statuses, contacts) and referral links are left out.
 */
import type { Currency } from '../lib/format'

export type TaskStage = 'plan' | 'prep' | 'do'
export type TaskStatus = 'todo' | 'doing' | 'done'

export interface TaskTemplate {
  stage: TaskStage
  title: string
  note: string
  link?: string
}

export const STAGES: Record<TaskStage, string> = {
  plan: 'І. Планування',
  prep: 'ІІ. Підготовка',
  do: 'ІІІ. Виконання плану',
}

export const STATUSES: Record<TaskStatus, string> = {
  todo: 'Не розпочато',
  doing: 'В процесі',
  done: 'Завершено',
}

export const TASKS: TaskTemplate[] = [
  { stage: 'plan', title: 'Упорядкувати витрати (бюджет)', note: 'Підлаштувати шаблон бюджету під себе, подивитися, де можна оптимізувати витрати', link: 'https://docs.google.com/spreadsheets/d/1qSqaognfYntCFMA3A5dMSHjQaF6DQBpp/edit' },
  { stage: 'plan', title: 'Поставити цілі', note: 'Приблизно оцінити вартість кожної цілі та бажаний час її досягнення' },
  { stage: 'plan', title: 'Обрати програми страхування здоров’я', note: '' },
  { stage: 'plan', title: 'Затвердити інвестиційну стратегію', note: 'На наступній зустрічі', link: 'https://docs.google.com/document/d/1fkoWm9tZDG5_F_VZYZ6MEO6uYqGkf_BS/edit' },
  { stage: 'prep', title: 'Зареєструватися в Interactive Brokers (IB)', note: 'Покрокова інструкція', link: 'https://drive.google.com/file/d/11B625oTh_piFpuT-XtW_RWcJQ8bb6RMB/view' },
  { stage: 'prep', title: 'Змінити тарифний план в IB на Tiered', note: 'Settings → Account configuration → IBKR pricing plan → Tiered' },
  { stage: 'prep', title: 'Відкрити рахунок TransferGo (EUR)', note: 'Для переказів на брокерський рахунок', link: 'https://www.transfergo.com/' },
  { stage: 'prep', title: 'Зареєструватися на Binance', note: 'Для частини резервного фонду в USDT', link: 'https://www.binance.com/' },
  { stage: 'prep', title: 'Відкрити рахунки в банках для вигідного обміну валюти', note: 'Прямі перекази: Моно, Приват, Глобус, ПУМБ — 0,9%. Списання через застосунок: Кредобанк — 0%, Моно — 0%' },
  { stage: 'prep', title: 'Купити валюту онлайн', note: 'Ліміт — 50 тис грн на місяць в одному банку. Найкращі курси', link: 'https://uainvest.com.ua/p2p-abroad' },
  { stage: 'prep', title: 'Переказати кошти на IB', note: 'Відеоінструкція', link: 'https://drive.google.com/file/d/1Yv69NMEAZKbr6Zdpf7svW3PSBt_2snpw/view' },
  { stage: 'do', title: 'Укласти договори зі страховими компаніями', note: 'Програми — на кроці «Захист»' },
  { stage: 'do', title: 'Купити готівкові євро', note: 'Для резервного фонду', link: 'https://minfin.com.ua/ua/currency/auction/eur/sell/kiev/?order=course_asc' },
  { stage: 'do', title: 'Купити перші облігації (Моно, Приват, Сенс, ICU)', note: 'Для резервного фонду, див. драбину облігацій' },
  { stage: 'do', title: 'Купити перші цінні папери в IB', note: 'Див. крок «Портфель»' },
  { stage: 'do', title: 'Скласти заповіт у нотаріуса', note: 'Зразок', link: 'https://docs.google.com/document/d/1o5G4RyS3zChYAR4KznbiH62cVRbSPv5wKqkVhtyJY7k/edit' },
  { stage: 'do', title: 'Ребаланс портфеля раз на рік', note: 'Калькулятор — на кроці «Портфель»' },
]

export interface InstrumentTemplate {
  assetClass: string
  ticker: string
  name: string
  isin: string
  weight: number
  currency: string
  domicile: string
  description: string
  ter: number
  buyNote: string
  factsheet?: string
}

export const INSTRUMENTS: InstrumentTemplate[] = [
  {
    assetClass: 'Акції', ticker: 'IMID', isin: 'IE00B3YLTY66', weight: 0.6, currency: 'USD', domicile: 'Ірландія', ter: 0.17,
    name: 'SPDR MSCI All Country World Investable Market UCITS ETF (Acc)',
    description: 'Акції компаній з усього світу та різних секторів економіки',
    buyNote: '',
    factsheet: 'https://api.fundinfo.com/document/33b06bf1b4d9a09d8e48a67bb4095c56_483372/MR_DE_de_IE000716YHJ7_YES_2026-03-31.pdf',
  },
  {
    assetClass: 'Облігації', ticker: 'AGAC', isin: 'IE000FHBZDZ8', weight: 0.35, currency: 'USD', domicile: 'Ірландія', ter: 0.1,
    name: 'iShares Core Global Aggregate Bond UCITS ETF USD (Acc)',
    description: 'Облігації високого рейтингу з усього світу',
    buyNote: 'Купувати в штуках раз на місяць або квартал',
    factsheet: 'https://api.fundinfo.com/document/7b2add138076907b43a8fb5081478be4_221138/MR_DE_en_IE000FHBZDZ8_YES_2026-03-31.pdf',
  },
  {
    assetClass: 'Дорогоцінні метали', ticker: 'XGDU', isin: 'DE000A2T0VU5', weight: 0.05, currency: 'USD', domicile: 'Ірландія', ter: 0.11,
    name: 'Xtrackers IE Physical Gold ETC Securities',
    description: 'Фізично забезпечене золотом',
    buyNote: 'Купувати по 1 шт раз на квартал',
  },
]

export const STRATEGY_LINKS = [
  { label: 'Інвестиційна стратегія', url: 'https://docs.google.com/document/d/1fkoWm9tZDG5_F_VZYZ6MEO6uYqGkf_BS/edit' },
  { label: 'Симуляція портфеля (Portfolio Visualizer)', url: 'https://www.portfoliovisualizer.com/monte-carlo-simulation?s=y&sl=mPdN1p8T0pJjguj4kvE6p' },
]

export const USEFUL_LINKS = [
  { label: 'Шаблон бюджету', url: 'https://docs.google.com/spreadsheets/d/1qSqaognfYntCFMA3A5dMSHjQaF6DQBpp/edit' },
  { label: 'Firekit — відстеження інвестиційного портфеля', url: 'https://firekit.space/demo/forecast' },
  { label: 'Тарифи на перекази за кордон (P2P)', url: 'https://uainvest.com.ua/p2p-abroad' },
  { label: 'Обмін валют онлайн: вигідні курси', url: 'https://uainvest.com.ua/uah-usd-online' },
]

export interface BondTemplate {
  qty: number
  price: number
  currency: Currency
  months: number
  note: string
}

export const BOND_LADDER: BondTemplate[] = [
  { qty: 1, price: 1000, currency: 'USD', months: 3, note: 'Після погашення купити нову на 12 міс' },
  { qty: 1, price: 1000, currency: 'USD', months: 6, note: 'Після погашення купити нову на 12 міс' },
  { qty: 1, price: 1000, currency: 'USD', months: 9, note: 'Після погашення купити нову на 12 міс' },
  { qty: 8, price: 1000, currency: 'UAH', months: 12, note: 'Після погашення купити нові на 12 міс' },
]
