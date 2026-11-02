import { useEffect, useState } from 'react'
import { assetUrl, pageUrl } from '../../utils/paths.js'
import Button from '../../components/Button.jsx'
import { guestOptions, startTimes, validateReservation } from './reservationTime.js'
import { saveDemoReservation, withReservationLock } from '../../services/reservation-history/reservationHistory.js'
import useActiveReservation from '../../hooks/useActiveReservation.js'
import './reservation-form.scss'

function ReservationForm({ shopId, searchContext = '', shopName = '店舗情報未確認', conditions = '設備情報未確認', room, onBack, backLabel = '検索結果に戻る', originLabel }) {
  const active = useActiveReservation()
  const [saving, setSaving] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('1')
  const guests = guestOptions(room)
  const [partySize, setPartySize] = useState(() => String(guests.includes(2) ? 2 : guests[0] ?? ''))
  const [error, setError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const options = startTimes(now)
  const validTime = options.some((option) => option.value === time && !option.disabled)
  const selectedTime = startTimes(new Date(Number(time) || now.getTime())).find((option) => option.value === time)?.label
  const noStartTimes = options.every((option) => option.disabled)
  const conditionSummary = room ? `${room.machineModel ?? '機種未確認'}・設備情報：未確認` : conditions

  useEffect(() => {
    const refresh = () => setNow(new Date())
    const timer = setInterval(refresh, 15000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

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
        <Button className="reservation-form-page__back" onClick={handleBack} aria-label={backLabel}>
          <svg className="reservation-form-page__back-icon" aria-hidden="true">
            <use href={assetUrl('/images/icons.svg#chevron')} />
          </svg>
        </Button>
        <h1 className="reservation-form-page__title">{isSubmitted ? '予約内容' : '予約'}</h1>
      </header>

      <section className="reservation-form-page__section" aria-live="polite">
        {originLabel && <p>{originLabel}</p>}
        {isSubmitted ? (
          <div className="reservation-form-page__confirmation">
            <h2>予約内容の確認（デモ）</h2>
            <p>{shopName}</p>
            {room && <p>{room.name}・{room.machineModel}</p>}
            <p>開始時刻：{selectedTime}</p>
            <p>利用時間：{duration}時間</p>
            <p>人数：{partySize}名</p>
            <p>これは画面確認用のデモです。店舗への予約送信・空室確保は行われていません。</p>
            <p>このブラウザの予約履歴に保存しました（最新3件）。</p>
            <Button className="reservation-form-page__action" onClick={() => window.location.assign(pageUrl('/reservation-history'))}>予約履歴を見る</Button>
            <Button className="reservation-form-page__action" onClick={onBack}>{backLabel}</Button>
          </div>
        ) : (
          <>
            <h2 className="reservation-form-page__shop-name">{shopName}</h2>
            {room && <p className="reservation-form-page__conditions">指定部屋：{room.name}{guests.length > 0 ? `（${guests[0]}〜${guests[guests.length - 1]}名）` : '（定員未確認）'}</p>}
            <p>予約は同じブラウザ内で同時に1件までです。アカウント単位の制限ではありません。デモのため店舗への予約送信・空室確保は行いません。</p>
            {active.reservation && <p role="status">現在予約中の店舗があります。新しい予約は、利用終了後またはマイページで取り消した後にできます。</p>}
            {active.error && <p role="alert">{active.error}</p>}
            {(active.reservation || active.error) && <Button onClick={() => window.location.assign(pageUrl('/mypage'))}>マイページで予約を確認する</Button>}
            <form className="reservation-form-page__form" onSubmit={async (event) => {
              event.preventDefault()
              const current = new Date()
              setNow(current)
              const message = validateReservation({ start: time, duration, guests: partySize, room }, current)
              setError(message ?? '')
              if (message) return
              setSaving(true)
              try {
                await withReservationLock(() => saveDemoReservation({ id: crypto.randomUUID(), shopId, shopName, room, start: time, duration, guests: partySize, context: searchContext }, window.localStorage, new Date()))
                setIsSubmitted(true)
              } catch (saveError) {
                setError(saveError.code === 'ACTIVE_RESERVATION' ? '現在予約中の店舗があります' : '予約を保存できませんでした。開始時刻・ブラウザの保存設定を確認してください。')
              } finally {
                setSaving(false)
                active.refresh()
              }
            }}>
              <label className="reservation-form-page__field">
                <span>利用開始時間</span>
                <span className="reservation-form-page__select">
                  <select value={validTime ? time : ''} required onFocus={() => setNow(new Date())} onChange={(event) => { setTime(event.target.value); setError('') }}>
                    <option value="" disabled>開始時刻を選択</option>
                    {options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
                  </select>
                </span>
              </label>
              {noStartTimes && <p role="status">本日選択できる開始時刻はありません。</p>}
              {!noStartTimes && time && !validTime && <p role="status">選択した時刻を過ぎました。開始時刻を選び直してください。</p>}
              <label className="reservation-form-page__field">
                <span>利用時間</span>
                <span className="reservation-form-page__select">
                  <select value={duration} required onChange={(event) => setDuration(event.target.value)} aria-describedby="free-time-note">
                    <option value="1">1時間</option>
                    <option value="2">2時間</option>
                    <option value="3">3時間</option>
                    <option value="free" disabled>フリータイム（利用条件未確認）</option>
                  </select>
                </span>
              </label>
              <p className="reservation-form-page__conditions" id="free-time-note">フリータイムは利用条件が未確認のため選択できません。営業時間・料金も未確認です。</p>
              <label className="reservation-form-page__field">
                <span>利用人数</span>
                <span className="reservation-form-page__select">
                  <select value={partySize} required disabled={!guests.length} onChange={(event) => setPartySize(event.target.value)}>
                    {!guests.length && <option value="">部屋の定員未確認</option>}
                    {guests.map((count) => <option key={count} value={count}>{count}名</option>)}
                  </select>
                </span>
              </label>
              {!guests.length && <p role="status">定員を確認できる部屋を選択してください。</p>}
              {error && <p role="alert">{error}</p>}
              <p className="reservation-form-page__conditions">条件：{conditionSummary}</p>
              <Button className="reservation-form-page__action" type="submit" disabled={saving || Boolean(active.reservation) || Boolean(active.error) || noStartTimes || !guests.length}>{saving ? '保存中…' : 'この内容で予約する（デモ）'}</Button>
            </form>
          </>
        )}
      </section>
    </main>
  )
}

export default ReservationForm
