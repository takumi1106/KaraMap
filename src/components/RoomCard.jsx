import { assetUrl } from '../utils/paths.js'
import Tag from './Tag'
import './RoomCard.scss'

function getMachineVariant(machine) {
  if (machine === 'DAM') return 'dam'
  if (machine === 'JOYSOUND') return 'joysound'

  return 'secondary'
}

function RoomCard({ room }) {
  const machines = room.machines ?? []
  const price =
    room.price == null
      ? '料金未設定'
      : `￥${Number(room.price).toLocaleString('ja-JP')}${room.priceFrom ? '〜' : ''}/${room.priceUnit ?? '1時間'}`

  return (
    <article className="room-card">
      {room.image && (
        <img
          className="room-card__image"
          src={assetUrl(room.image)}
          alt={room.imageAlt ?? `${room.name ?? '部屋'}の室内`}
          loading="lazy"
        />
      )}

      <div className="room-card__summary">
        {room.name && <h3 className="room-card__name">{room.name}</h3>}
        {room.type && <span className="room-card__type">{room.type}</span>}
        {room.capacityLabel && (
          <span className="room-card__capacity">{room.capacityLabel}</span>
        )}
      </div>

      <div className="room-card__details">
        <span className="room-card__price">{price}</span>
        {machines.length > 0 && (
          <ul className="room-card__machines" aria-label="対応機種">
            {machines.map((machine) => (
              <li className="room-card__machine" key={machine}>
                <Tag className="room-card__tag" variant={getMachineVariant(machine)}>
                  {machine}
                </Tag>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}

export default RoomCard
