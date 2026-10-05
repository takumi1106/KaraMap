import './ReservationCard.scss'

function ReservationIcon({ name }) {
  if (name === 'calendar') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="5" width="17" height="16" rx="2" />
        <path d="M7.5 3v4M16.5 3v4M4 9h16M7 12h2m3 0h2m3 0h1M7 15h2m3 0h2m3 0h1M7 18h2m3 0h2" />
      </svg>
    )
  }

  if (name === 'smoking') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9.5" />
        <path d="m5.3 5.3 13.4 13.4M7 14.5h8m1.5 0H19m-3-2.5v-2m2 2V9" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3.5 20v-1.5a5.5 5.5 0 0 1 11 0V20Zm12 0v-1.5a4.5 4.5 0 0 1 5-4.5" />
    </svg>
  )
}

function ReservationCard({ reservation, onClick }) {
  return (
    <button
      className="reservation-card"
      type="button"
      aria-label={`${reservation.storeName}の予約詳細を開く`}
      onClick={onClick}
    >
      <h3 className="reservation-card__store-name">{reservation.storeName}</h3>
      <p className="reservation-card__detail">
        <span className="reservation-card__icon"><ReservationIcon name="calendar" /></span>
        <span>{reservation.date}{'\u3000'}{reservation.time}</span>
      </p>
      <p className="reservation-card__detail">
        <span className="reservation-card__icon"><ReservationIcon name="smoking" /></span>
        <span>{reservation.partySize}名</span>
      </p>
      <p className="reservation-card__detail">
        <span className="reservation-card__icon"><ReservationIcon name="people" /></span>
        <span>{reservation.conditions.join('・')}</span>
      </p>
    </button>
  )
}

export default ReservationCard
