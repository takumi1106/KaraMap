import Button from '../../components/Button.jsx'
import Tag from '../../components/Tag.jsx'
import RoomCard from '../../components/RoomCard.jsx'
import { sampleShop } from './shopDetailData.js'
import './shop-detail.scss'

function returnToResults() {
  window.location.assign('/search')
}

function ShopDetail({
  shop = sampleShop,
  onBack = returnToResults,
  onReserve,
  bottomNavigation = null,
}) {
  const availability = shop.availableRooms == null
    ? '空室状況未確認'
    : shop.availableRooms > 0
      ? `空室あり（残り${shop.availableRooms}部屋）`
      : '満室'

  return (
    <div className="shop-detail">
      <main className="shop-detail__main">
        <header className="shop-detail__header">
          <Button className="shop-detail__back" onClick={onBack} aria-label="検索結果に戻る">
            <svg className="shop-detail__back-icon" aria-hidden="true"><use href="/images/icons.svg#chevron" /></svg>
          </Button>
          <h1 className="shop-detail__title">店舗情報</h1>
        </header>
        <img className="shop-detail__hero" src={shop.image} alt={shop.imageAlt ?? `${shop.name}の店内`} width="750" height="360" fetchPriority="high" />
        <div className="shop-detail__content">
          <section className="shop-detail__overview" aria-labelledby="shop-name">
            <h2 className="shop-detail__name" id="shop-name">
              <svg className="shop-detail__crown" aria-hidden="true"><use href="/images/icons.svg#crown" /></svg>
              <span>{shop.name}</span>
            </h2>
            <div className="shop-detail__meta">
              <span className="shop-detail__distance">
                <svg className="shop-detail__pin" aria-hidden="true"><use href="/images/icons.svg#pin" /></svg>
                徒歩{shop.walkingMinutes}分({shop.distanceMeters}m)
              </span>
              <span className="shop-detail__rating">
                <span className="shop-detail__star" aria-hidden="true">★</span>
                {shop.rating == null ? '評価なし' : <><span aria-label={`評価5点中${shop.rating}点`}>{shop.rating}</span>（口コミ {shop.reviewCount}件）</>}
              </span>
            </div>
            <div className="shop-detail__statuses">
              <Tag className="shop-detail__status" variant={shop.isOpen ? 'success' : 'secondary'}>
                {shop.isOpen == null ? '営業状況未確認' : shop.isOpen ? '営業中' : '営業時間外'}
              </Tag>
              <Tag className="shop-detail__status" variant={shop.availableRooms > 0 ? 'vacant' : 'secondary'}>{availability}</Tag>
            </div>
          </section>
          <section className="shop-detail__rooms" aria-label="部屋一覧">
            {shop.rooms.length > 0 ? (
              <ul className="shop-detail__room-list">
                {shop.rooms.map((room) => <li key={room.id}><RoomCard room={room} /></li>)}
              </ul>
            ) : <p className="shop-detail__empty">部屋情報は準備中です。</p>}
          </section>
          <Button className="shop-detail__reserve" aria-disabled={!onReserve} onClick={() => onReserve?.(shop)}>
            この店舗を予約する
          </Button>
        </div>
      </main>
      {bottomNavigation && <div className="shop-detail__navigation">{bottomNavigation}</div>}
    </div>
  )
}

export default ShopDetail
