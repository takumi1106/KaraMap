import { assetUrl, pageUrl, getPageLocation } from '../../utils/paths.js'
import Button from '../../components/Button.jsx'
import Tag from '../../components/Tag.jsx'
import useSavedShop from '../../hooks/useSavedShop.js'
import useSearchOrigin from '../../hooks/useSearchOrigin.js'
import { detailPath, reservationPath, searchContext } from '../../services/search-flow/searchFlow.js'
import { demoRoomAvailability, readRoomSearch } from '../../services/room-search/roomSearchPage.js'
import { searchRooms } from '../../services/room-search/searchRooms.js'
import './shop-detail.scss'

function ShopDetail({ shop: suppliedShop, onBack, onReserve, bottomNavigation = null }) {
  const page = getPageLocation()
  const id = page.searchParams.get('shop') ?? (page.pathname.startsWith('/shops/') ? page.pathname.slice(7) : null)
  const saved = useSavedShop(id)
  const shop = suppliedShop ?? saved.shop
  const hasDemoAvailability = demoRoomAvailability.some((item) => item.storeId === shop?.storeId || shop?.rooms.some((room) => room.id === item.roomId))
  const [origin] = useSearchOrigin()
  const context = searchContext(page.searchParams)
  context.set('origin', origin)
  const selectedRoom = page.searchParams.get('room')
  const conditions = readRoomSearch(context)
  const matching = shop && !conditions.error ? searchRooms({ shops: [shop], availability: demoRoomAvailability, includeTestAvailability: true, filters: { ...conditions.values, vacantOnly: conditions.realtimeAvailable } }).flatMap((match) => match.matchedRooms.map(({ room }) => room.id)) : []
  const showMatches = context.get('from') === 'search-filter' && !conditions.error
  const otherRooms = (shop?.rooms ?? []).filter((room) => !matching.includes(room.id))
  const otherRoomsAreDemoVacant = otherRooms.length > 0 && otherRooms.every((room) =>
    demoRoomAvailability.some((item) => item.roomId === room.id && item.status === 'vacant'))
  const roomGroups = showMatches ? [
    { id: 'matched', title: '条件に一致する部屋', rooms: (shop?.rooms ?? []).filter((room) => matching.includes(room.id)) },
    { id: 'other', title: otherRoomsAreDemoVacant ? '今空いているその他の部屋（デモ）' : 'その他の部屋', rooms: otherRooms },
  ] : [{ id: 'all', title: null, rooms: shop?.rooms ?? [] }]
  function back() {
    if (onBack) onBack()
    else window.location.assign(pageUrl(`/search?${context}`))
  }
  function reserve(room) {
    if (onReserve) onReserve(shop, room)
    else {
      // ブラウザの戻る操作でも選択部屋を復元する。
      window.history.replaceState(null, '', pageUrl(detailPath(shop.id, context, room.id)))
      window.location.assign(pageUrl(reservationPath(shop.id, room.id, context)))
    }
  }

  return <div className="shop-detail">
    <main className="shop-detail__main">
      <header className="shop-detail__header">
        <Button className="shop-detail__back" onClick={back} aria-label="検索結果に戻る">
          <svg className="shop-detail__back-icon" aria-hidden="true"><use href={assetUrl('/images/icons.svg#chevron')} /></svg>
        </Button>
        <h1 className="shop-detail__title">店舗情報</h1>
      </header>
      <div className="shop-detail__content">
        <p>{origin === 'demo' ? 'デモモード：名古屋駅起点' : '検索起点：実際の現在地'}</p>
        {!shop ? <>
          <p role="status">{id && saved.status === 'loading' ? '店舗情報を読み込んでいます…' : saved.status === 'error' ? '店舗情報を読み込めませんでした。' : '指定された店舗が保存済みデータに見つかりません。検索結果から選び直してください。'}</p>
          {saved.status === 'error' && <Button onClick={saved.retry}>再試行</Button>}
          <Button onClick={back}>検索結果に戻る</Button>
        </> : <>
          <section className="shop-detail__overview" aria-labelledby="shop-name">
            <h2 className="shop-detail__name" id="shop-name">{shop.name}</h2>
            <p>{shop.address || '住所未確認'}</p>
            <p>店舗写真・料金・営業時間は未確認です。</p>
            <div className="shop-detail__statuses">
              <Tag className="shop-detail__status" variant={hasDemoAvailability ? 'vacant' : 'secondary'}>{hasDemoAvailability ? '空室条件確認（デモ）' : '空室状況未確認'}</Tag>
            </div>
          </section>
          <section className="shop-detail__rooms" aria-label="登録済みの部屋一覧">
            <h2>登録済みの部屋</h2>
            {conditions.error && <p role="alert">{conditions.error}</p>}
            {selectedRoom && !shop.rooms.some((room) => room.id === selectedRoom) && <p role="alert">選択された部屋は見つかりません。部屋を選び直してください。</p>}
            {shop.rooms.length ? roomGroups.filter((group) => group.rooms.length).map((group) => <div className="shop-detail__room-group" key={group.id}>
              {group.title && <h3 className="shop-detail__group-title">{group.title}</h3>}
              <ul className="shop-detail__room-list">
                {group.rooms.map((room) => <li key={room.id}>
                  <article className={`shop-detail__room${group.id === 'matched' ? ' shop-detail__room--matched' : ''}${selectedRoom === room.id ? ' shop-detail__room--selected' : ''}`} aria-label={room.name}>
                    <header className="shop-detail__room-heading">
                      <div className="shop-detail__room-badges">
                        {group.id === 'matched' && <Tag className="shop-detail__match-tag">条件に一致</Tag>}
                      </div>
                      <h4 className="shop-detail__room-number">{room.roomNumber ? `${room.roomNumber}号室` : room.name}</h4>
                      <p className="shop-detail__room-type">{room.officialRoomType ?? '部屋タイプ未確認'}</p>
                    </header>
                    <dl className="shop-detail__room-info">
                      <div className="shop-detail__room-field">
                        <dt>定員</dt>
                        <dd>{room.capacity?.min != null && room.capacity?.max != null ? `${room.capacity.min}〜${room.capacity.max}名` : '未確認'}</dd>
                      </div>
                      <div className="shop-detail__room-field">
                        <dt>機種</dt>
                        <dd>
                          <div className="shop-detail__machine-tags">
                            {(room.machines ?? []).map((machine) => <Tag key={machine} variant={machine === 'dam' ? 'dam' : machine === 'joysound' ? 'joysound' : 'secondary'}>
                              {machine === 'dam' ? 'DAM' : machine === 'joysound' ? 'JOYSOUND' : machine}
                            </Tag>)}
                          </div>
                          <span className="shop-detail__machine-model">{room.machineModel ?? '機種名未確認'}</span>
                        </dd>
                      </div>
                      <div className="shop-detail__room-field">
                        <dt>料金</dt>
                        <dd>{room.price == null ? '未確認' : `￥${Number(room.price).toLocaleString('ja-JP')}${room.priceFrom ? '〜' : ''}${room.priceUnit ? `／${room.priceUnit}` : ''}`}</dd>
                      </div>
                    </dl>
                    <p className="shop-detail__equipment-note">設備情報：未確認（禁煙・喫煙、採点・録音）</p>
                    <Button className="shop-detail__room-reserve" aria-label={`${room.roomNumber ? `${room.roomNumber}号室` : room.name}を予約する`} onClick={() => reserve(room)}>この部屋を予約する</Button>
                  </article>
                </li>)}
              </ul>
            </div>) : <p className="shop-detail__empty">部屋情報未登録。設備条件への一致は確認できません。</p>}

          </section>
        </>}
      </div>
    </main>
    {bottomNavigation && <div className="shop-detail__navigation">{bottomNavigation}</div>}
  </div>
}

export default ShopDetail
