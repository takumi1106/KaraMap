import { useState } from 'react'
import Button from '../../components/Button.jsx'
import ReservationCard from '../../components/ReservationCard.jsx'
import './reservation-history.scss'

const sampleReservations = [
  { id: 'reservation-1', storeName: 'ジャンカラ 名駅東口店', date: '9月30日（水）', time: '10:00〜13:00', partySize: 2, conditions: ['禁煙', 'DAM'] },
  { id: 'reservation-2', storeName: 'ジャンカラ 名駅東口店', date: '9月30日（水）', time: '10:00〜13:00', partySize: 2, conditions: ['禁煙', 'DAM'] },
  { id: 'reservation-3', storeName: 'ジャンカラ 名駅東口店', date: '9月30日（水）', time: '10:00〜13:00', partySize: 2, conditions: ['禁煙', 'DAM'] },
]

function returnToMyPage() {
  window.location.assign('/mypage')
}

function ReservationHistory({ reservations = sampleReservations, onBack = returnToMyPage }) {
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [isRebooking, setIsRebooking] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00〜13:00')
  const [partySize, setPartySize] = useState('2')

  function handleBack() {
    if (isComplete) {
      setIsComplete(false)
      return
    }

    if (isRebooking) {
      setIsRebooking(false)
      return
    }

    if (selectedReservation) {
      setSelectedReservation(null)
      return
    }

    onBack()
  }

  function openDetails(reservation) {
    setSelectedReservation(reservation)
    setIsRebooking(false)
    setIsComplete(false)
  }

  function startRebooking() {
    setDate('')
    setTime(selectedReservation.time)
    setPartySize(String(selectedReservation.partySize))
    setIsRebooking(true)
  }

  function submitRebooking(event) {
    event.preventDefault()
    setIsComplete(true)
  }

  const pageTitle = isComplete
    ? '受付内容'
    : isRebooking
      ? '再予約'
      : selectedReservation
        ? '予約詳細'
        : '予約履歴'

  return (
    <main className="reservation-history">
      <header className="reservation-history__header">
        <Button className="reservation-history__back" onClick={handleBack} aria-label="前の画面に戻る">
          <svg className="reservation-history__back-icon" aria-hidden="true">
            <use href="/images/icons.svg#chevron" />
          </svg>
        </Button>
        <h1 className="reservation-history__title">{pageTitle}</h1>
      </header>

      {isComplete ? (
        <section className="reservation-history__section" aria-live="polite">
          <p className="reservation-history__message">
            再予約内容を受け付けました。これは画面確認用のデモで、店舗への送信は行われていません。
          </p>
          <Button className="reservation-history__action" onClick={() => {
            setIsComplete(false)
            setIsRebooking(false)
            setSelectedReservation(null)
          }}>
            予約履歴に戻る
          </Button>
        </section>
      ) : isRebooking && selectedReservation ? (
        <section className="reservation-history__section" aria-labelledby="rebook-heading">
          <h2 className="reservation-history__section-title" id="rebook-heading">{selectedReservation.storeName}</h2>
          <form className="reservation-history__form" onSubmit={submitRebooking}>
            <label className="reservation-history__field">
              <span>利用日</span>
              <input type="date" min={getToday()} value={date} required onChange={(event) => setDate(event.target.value)} />
            </label>
            <label className="reservation-history__field">
              <span>利用時間</span>
              <select value={time} onChange={(event) => setTime(event.target.value)}>
                <option>10:00〜13:00</option>
                <option>13:00〜16:00</option>
                <option>16:00〜19:00</option>
                <option>19:00〜22:00</option>
              </select>
            </label>
            <label className="reservation-history__field">
              <span>人数</span>
              <select value={partySize} onChange={(event) => setPartySize(event.target.value)}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
                  <option key={count} value={count}>{count}名</option>
                ))}
              </select>
            </label>
            <p className="reservation-history__conditions">条件：{selectedReservation.conditions.join('・')}</p>
            <Button className="reservation-history__action" type="submit">この内容で再予約する</Button>
          </form>
        </section>
      ) : selectedReservation ? (
        <section className="reservation-history__section" aria-labelledby="reservation-detail-heading">
          <article className="reservation-history__detail">
            <h2 className="reservation-history__detail-title" id="reservation-detail-heading">
              {selectedReservation.storeName}
            </h2>
            <dl className="reservation-history__detail-list">
              <div><dt>利用日</dt><dd>{selectedReservation.date}</dd></div>
              <div><dt>利用時間</dt><dd>{selectedReservation.time}</dd></div>
              <div><dt>人数</dt><dd>{selectedReservation.partySize}名</dd></div>
              <div><dt>条件</dt><dd>{selectedReservation.conditions.join('・')}</dd></div>
            </dl>
          </article>
          <Button className="reservation-history__action" onClick={startRebooking}>
            同じ内容で再予約する
          </Button>
        </section>
      ) : (
        <section className="reservation-history__section" aria-labelledby="past-reservations-heading">
          <h2 className="reservation-history__section-title" id="past-reservations-heading">過去の予約</h2>
          {reservations.length > 0 ? (
            <ul className="reservation-history__list">
              {reservations.map((reservation) => (
                <li className="reservation-history__item" key={reservation.id}>
                  <ReservationCard reservation={reservation} onClick={() => openDetails(reservation)} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="reservation-history__empty">予約履歴はありません。</p>
          )}
        </section>
      )}
    </main>
  )
}

function getToday() {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${today.getFullYear()}-${month}-${day}`
}

export default ReservationHistory
