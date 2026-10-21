import type { Instrument } from '../state/plan'
import { NumberInput } from './NumberInput'
import { Term } from './Term'

const ASSET_CLASSES = ['Акції', 'Облігації', 'Дорогоцінні метали', 'Нерухомість (REIT)', 'Короткі облігації, грошовий ринок', 'Інше']

/** Link to the instrument page: the advisor's own link, or justETF by ISIN. */
export const instrumentUrl = (x: Instrument) =>
  x.url || (x.isin ? `https://www.justetf.com/en/etf-profile.html?isin=${x.isin}` : '')

interface Props {
  x: Instrument
  set: (patch: Partial<Instrument>) => void
  onDone: () => void
}

/** Form with every field of a portfolio instrument. */
export function InstrumentEditor({ x, set, onDone }: Props) {
  // A <div>, not a <label>: a tooltip button inside a label would capture clicks meant for the input.
  const text = (key: keyof Instrument, label: React.ReactNode, ariaLabel: string, placeholder = '', transform?: (v: string) => string) => (
    <div className="inst-form__field">
      <span>{label}</span>
      <input
        aria-label={ariaLabel}
        value={(x[key] as string | undefined) ?? ''}
        placeholder={placeholder}
        onChange={(e) => set({ [key]: transform ? transform(e.target.value) : e.target.value } as Partial<Instrument>)}
      />
    </div>
  )

  return (
    <div className="inst-form">
      <label className="inst-form__field">
        <span>Клас активу</span>
        <input list="asset-classes" value={x.assetClass} placeholder="Оберіть або впишіть" onChange={(e) => set({ assetClass: e.target.value })} />
        <datalist id="asset-classes">
          {ASSET_CLASSES.map((a) => <option key={a} value={a} />)}
        </datalist>
      </label>
      {text('ticker', 'Тікер', 'Тікер', 'Напр. VWCE', (v) => v.toUpperCase())}
      <div className="inst-form__wide">{text('name', 'Назва', 'Назва', 'Напр. Vanguard FTSE All-World UCITS ETF (Acc)')}</div>
      {text('isin', <Term k="isin">ISIN</Term>, 'ISIN', 'Напр. IE00BK5BQT80', (v) => v.toUpperCase().replace(/\s/g, ''))}
      {text('currency', 'Валюта', 'Валюта', 'USD')}
      {text('domicile', <Term k="domicile">Країна реєстрації</Term>, 'Країна реєстрації', 'Ірландія')}
      <div className="inst-form__field">
        <span><Term k="ter">Комісія фонду</Term>, % на рік</span>
        <NumberInput label="Комісія фонду" value={x.ter} suffix="%" onChange={(ter) => set({ ter })} />
      </div>
      <div className="inst-form__wide">{text('description', 'Опис', 'Опис', 'Що всередині: напр. акції компаній з усього світу')}</div>
      <div className="inst-form__wide">{text('buyNote', 'Порада щодо купівлі', 'Порада щодо купівлі', 'Напр. купувати раз на квартал')}</div>
      <div className="inst-form__wide">{text('url', 'Посилання на інструмент', 'Посилання на інструмент', 'Якщо порожньо — justETF за ISIN')}</div>
      <div className="inst-form__wide">{text('factsheet', 'Посилання на factsheet', 'Посилання на factsheet', 'https://…')}</div>
      <div className="inst-form__wide inst-form__actions">
        {instrumentUrl(x) && <a href={instrumentUrl(x)} target="_blank" rel="noopener">Перевірити посилання ↗</a>}
        <button type="button" className="btn btn--sm btn--ink" onClick={onDone}>Готово</button>
      </div>
    </div>
  )
}
