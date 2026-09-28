import Tag from './Tag.jsx'
import './RoomCard.scss'

function RoomCard({ room }) {
  return (
    <article className="room-card">
      {room.image && <img className="room-card__image" src={room.image} alt={room.imageAlt ?? `${room.name}の室内`} loading="lazy" />}
      <div className="room-card__summary">
        <h3 className="room-card__name">{room.name}</h3>
        <span>{room.type}</span>
        <span>{room.capacityLabel}</span>
      </div>
      <div className="room-card__details">
        <span className="room-card__price">￥{room.price.toLocaleString('ja-JP')}{room.priceFrom ? '〜' : ''}/{room.priceUnit}</span>
        <ul className="room-card__machines" aria-label="対応機種">
          {room.machines.map((machine) => (
            <li key={machine}>
              <Tag className="room-card__tag" variant={machine === 'DAM' ? 'dam' : machine === 'JOYSOUND' ? 'joysound' : 'secondary'}>{machine}</Tag>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

export default RoomCard
