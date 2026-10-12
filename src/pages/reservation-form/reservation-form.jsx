import { useState } from 'react'
import { assetUrl } from '../../utils/paths.js'
import Button from '../../components/Button.jsx'
import { filterGroups } from '../search-filter/searchFilterData.js'
import './reservation-form.scss'

const machineOptions = filterGroups.find((group) => group.id === 'machine').options
const featureOptions = filterGroups.find((group) => group.id === 'features').options

function ReservationForm({ shopName = 'ジャンカラ 名駅東口店', conditions = '禁煙・DAM', onBack }) {
  const conditionItems = conditions.split(/[・,、]/).map((item) => item.trim())
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00〜13:00')
  const [partySize, setPartySize] = useState('2')
  const [selectedMachine, setSelectedMachine] = useState(() => {
    return conditionItems.some((item) => item.toUpperCase().startsWith('JOYSOUND')) ? 'joysound' : 'dam'
  })
  const [selectedFeatures, setSelectedFeatures] = useState(() => {
    const selected = featureOptions.filter((option) => conditionItems.includes(option.label)).map((option) => option.value)
    return selected.length > 0 ? selected : ['aiScoring']
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const otherConditions = conditions
    .split(/[・,、]/)
    .map((item) => item.trim())
    .filter((item) => item && !item.toUpperCase().startsWith('DAM') && !item.toUpperCase().startsWith('JOYSOUND') && !featureOptions.some((option) => option.label === item))

  const conditionSummary = [
    ...otherConditions,
    machineOptions.find((option) => option.value === selectedMachine)?.label,
    ...featureOptions.filter((option) => selectedFeatures.includes(option.value)).map((option) => option.label),
  ].join('・') || '指定なし'

  function toggleFeature(value) {
    setSelectedFeatures((current) => current.includes(value)
      ? current.filter((feature) => feature !== value)
      : [...current, value])
  }

  function handleBack() {
    if (isSubmitted) {
      setIsSubmitted(false)
      return
    }
    onBack?.()
  }

  return (
    <main className="reservation-form-page">
      <header className="reservation-form-page__header">
        <Button className="reservation-form-page__back" onClick={handleBack} aria-label="検索結果に戻る">
          <svg className="reservation-form-page__back-icon" aria-hidden="true">
            <use href={assetUrl('/images/icons.svg#chevron')} />
          </svg>
        </Button>
        <h1 className="reservation-form-page__title">{isSubmitted ? '予約内容' : '予約'}</h1>
      </header>

      <section className="reservation-form-page__section" aria-live="polite">
        {isSubmitted ? (
          <div className="reservation-form-page__confirmation">
            <h2>予約を受け付けました</h2>
            <p>これは画面確認用のデモです。店舗への予約送信は行われていません。</p>
            <Button className="reservation-form-page__action" onClick={handleBack}>検索結果に戻る</Button>
          </div>
        ) : (
          <>
            <h2 className="reservation-form-page__shop-name">{shopName}</h2>
            <form className="reservation-form-page__form" onSubmit={(event) => {
              event.preventDefault()
              setIsSubmitted(true)
            }}>
              <label className="reservation-form-page__field">
                <span>利用日</span>
                <input type="date" min={getToday()} value={date} required onChange={(event) => setDate(event.target.value)} />
              </label>
              <label className="reservation-form-page__field">
                <span>利用時間</span>
                <span className="reservation-form-page__select">
                  <select value={time} onChange={(event) => setTime(event.target.value)}>
                    <option>10:00〜13:00</option>
                    <option>13:00〜16:00</option>
                    <option>16:00〜19:00</option>
                    <option>19:00〜22:00</option>
                  </select>
                </span>
              </label>
              <label className="reservation-form-page__field">
                <span>人数</span>
                <span className="reservation-form-page__select">
                  <select value={partySize} onChange={(event) => setPartySize(event.target.value)}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
                      <option key={count} value={count}>{count}名</option>
                    ))}
                  </select>
                </span>
              </label>
              <fieldset className="reservation-form-page__choice-group">
                <legend>機種</legend>
                <div className="reservation-form-page__choice-options">
                  {machineOptions.map((option) => (
                    <label
                      className={`reservation-form-page__choice${selectedMachine === option.value ? ' reservation-form-page__choice--selected' : ''}`}
                      key={option.value}
                    >
                      <input
                        type="radio"
                        name="machine"
                        value={option.value}
                        checked={selectedMachine === option.value}
                        onChange={() => setSelectedMachine(option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="reservation-form-page__choice-group">
                <legend>採点・録音</legend>
                <div className="reservation-form-page__choice-options">
                  {featureOptions.map((option) => (
                    <label
                      className={`reservation-form-page__choice${selectedFeatures.includes(option.value) ? ' reservation-form-page__choice--selected' : ''}`}
                      key={option.value}
                    >
                      <input
                        type="checkbox"
                        value={option.value}
                        checked={selectedFeatures.includes(option.value)}
                        onChange={() => toggleFeature(option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <p className="reservation-form-page__conditions">条件：{conditionSummary}</p>
              <Button className="reservation-form-page__action" type="submit">この内容で予約する</Button>
            </form>
          </>
        )}
      </section>
    </main>
  )
}

function getToday() {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${today.getFullYear()}-${month}-${day}`
}

export default ReservationForm
