import { useEffect, useState } from 'react'
import { assetUrl, pageUrl } from '../../utils/paths.js'
import Button from '../../components/Button.jsx'
import ReservationCard from '../../components/ReservationCard.jsx'
import { historyStorageKey, readReservationHistory } from '../../services/reservation-history/reservationHistory.js'
import { reservationPath } from '../../services/search-flow/searchFlow.js'
import './reservation-history.scss'

function loadHistory() {
  try { return { reservations: readReservationHistory(), error: '' } }
  catch { return { reservations: [], error: '予約履歴を読み込めませんでした。ブラウザの保存設定をご確認ください。' } }
}

function returnToMyPage() {
  window.location.assign(pageUrl('/mypage'))
}

function ReservationHistory({ reservations: suppliedReservations, onBack = returnToMyPage }) {
  const [saved, setSaved] = useState(loadHistory)
  const [selectedReservation, setSelectedReservation] = useState(null)
  const reservations = suppliedReservations ?? saved.reservations

  useEffect(() => {
    function reload(event) {
      if (!event || event.type !== 'storage' || event.key === historyStorageKey || event.key === null) setSaved(loadHistory())
    }
    window.addEventListener('storage', reload)
    window.addEventListener('focus', reload)
    return () => {
      window.removeEventListener('storage', reload)
      window.removeEventListener('focus', reload)
    }
  }, [])

  function handleBack() {
    if (selectedReservation) setSelectedReservation(null)
    else onBack()
  }

  return <main className="reservation-history">
    <header className="reservation-history__header">
      <Button className="reservation-history__back" onClick={handleBack} aria-label="前の画面に戻る">
        <svg className="reservation-history__back-icon" aria-hidden="true"><use href={assetUrl('/images/icons.svg#chevron')} /></svg>
      </Button>
      <h1 className="reservation-history__title">{selectedReservation ? '予約詳細' : '予約履歴'}</h1>
    </header>
    <section className="reservation-history__section">
      <p>このブラウザに保存した予約デモです。店舗への送信・空室確保は行われていません。</p>
      {suppliedReservations === undefined && saved.error && <p role="alert">{saved.error}<Button onClick={() => setSaved(loadHistory())}>再読み込み</Button></p>}
      {selectedReservation ? <>
        <article className="reservation-history__detail">
          <h2 className="reservation-history__detail-title">{selectedReservation.storeName}</h2>
          <dl className="reservation-history__detail-list">
            <div><dt>部屋</dt><dd>{selectedReservation.roomName}</dd></div>
            <div><dt>機種</dt><dd>{selectedReservation.machineModel ?? '未確認'}</dd></div>
            <div><dt>利用日</dt><dd>{selectedReservation.date}</dd></div>
            <div><dt>開始時刻</dt><dd>{selectedReservation.time}</dd></div>
            <div><dt>利用時間</dt><dd>{selectedReservation.durationHours}時間</dd></div>
            <div><dt>人数</dt><dd>{selectedReservation.partySize}名</dd></div>
          </dl>
        </article>
        <Button className="reservation-history__action" onClick={() => window.location.assign(pageUrl(reservationPath(selectedReservation.shopId, selectedReservation.roomId, new URLSearchParams(selectedReservation.context))))}>この部屋でもう一度予約する（デモ）</Button>
      </> : <>
        <h2 className="reservation-history__section-title">最近の予約（最大3件）</h2>
        {reservations.length ? <ul className="reservation-history__list">
          {reservations.slice(0, 3).map((reservation) => <li className="reservation-history__item" key={reservation.id}>
            <ReservationCard reservation={reservation} onClick={() => setSelectedReservation(reservation)} />
          </li>)}
        </ul> : !saved.error && <p className="reservation-history__empty">予約履歴はありません。</p>}
      </>}
    </section>
  </main>
}

export default ReservationHistory
