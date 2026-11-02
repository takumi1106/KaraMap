import Button from './Button.jsx'
import Tag from './Tag.jsx'
import './ReservationCard.scss'

function ReservationCard({ reservation, onClick }) {
  return (
    <article className="reservation-card">
      <header className="reservation-card__header">
        <h3 className="reservation-card__store-name">{reservation.storeName}</h3>
        {reservation.status && <p className="reservation-card__date">{reservation.status === 'cancelled' ? '取消済み（デモ）' : reservation.status === 'ended' ? '利用終了（デモ）' : '予約中（デモ）'}</p>}
        <p className="reservation-card__date">利用日：{reservation.date || '未確認'}</p>
      </header>
      <div className="reservation-card__summary">
        <dl className="reservation-card__details">
          <div className="reservation-card__field">
            <dt>開始時刻</dt><dd>{reservation.time || '未確認'}</dd>
          </div>
          {reservation.roomName && <div className="reservation-card__field"><dt>部屋</dt><dd>{reservation.roomName}</dd></div>}
          {reservation.durationHours != null && <div className="reservation-card__field"><dt>利用時間</dt><dd>{reservation.durationHours}時間</dd></div>}
          <div className="reservation-card__field">
            <dt>人数</dt><dd>{reservation.partySize == null ? '未確認' : `${reservation.partySize}名`}</dd>
          </div>
          <div className="reservation-card__field">
            <dt>条件</dt>
            <dd className="reservation-card__tags">
              {reservation.conditions?.length ? reservation.conditions.map((condition) => <Tag key={condition} variant={condition === 'DAM' ? 'dam' : condition === 'JOYSOUND' ? 'joysound' : 'secondary'}>{condition}</Tag>) : '未確認'}
            </dd>
          </div>
        </dl>
      </div>
      <Button className="reservation-card__action" aria-label={`${reservation.storeName}の予約詳細を開く`} onClick={onClick}>予約詳細を見る</Button>
    </article>
  )
}

export default ReservationCard
