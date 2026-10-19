import { assetUrl, pageUrl, getPageLocation } from '../../utils/paths.js'
import useNearbyShops from '../../hooks/useNearbyShops.js'
import { useEffect, useState } from 'react'
import MapView from '../../components/MapView.jsx'
import useCurrentLocation from '../../hooks/useCurrentLocation.js'
import Button from '../../components/Button.jsx'
import Tag from '../../components/Tag.jsx'
import ReservationForm from '../reservation-form/reservation-form.jsx'
import { sampleResults } from './searchResultsData.js'
import { readRoomSearch, searchRoomPageShops } from '../../services/room-search/roomSearchPage.js'
import { roomCatalog } from '../../services/room-search/roomCatalog.js'
import './search-results.scss'

function returnToSource() {
  const params = getPageLocation().searchParams
  window.location.assign(pageUrl(params.get('from') === 'search-filter' ? `/search-filter?${params}` : '/'))
}

// 共通カードが完成するまでの画面専用表示。店舗データを1つのpropで受け取る。
function renderDefaultShop(shop, { roomHref, onShopClick } = {}) {
  const availability = shop.availableRooms == null
    ? '空室状況未確認'
    : shop.availableRooms > 0
      ? `空室あり（残り${shop.availableRooms}部屋）`
      : '満室'

  return (
    <article className={`result-item${shop.image ? ' result-item--with-image' : ''}`}>
      {shop.image && <img className="result-item__image" src={assetUrl(shop.image)} alt={`${shop.name}の店内イメージ`} width="92" height="118" loading="lazy" />}
      <div className="result-item__content">
        <h2 className="result-item__name">{roomHref
          ? <a className="search-results__card-link" href="#search-results-map" onClick={onShopClick}>{shop.name}</a>
          : shop.name}</h2>
        <div className="result-item__details">
          <span>{shop.isRealShop ? `直線距離 約${Math.round(shop.distanceMeters)}m` : `徒歩${shop.walkingMinutes}分 (${shop.distanceMeters}m)`}</span>
          <span className="result-item__business">
            <svg className="result-item__pin" aria-hidden="true"><use href={assetUrl('/images/icons.svg#pin')} /></svg>
            {shop.isOpen == null ? '営業状況未確認' : shop.isOpen ? '営業中' : '営業時間外'}
          </span>
        </div>
        {shop.matchedRooms && <ul className="result-item__rooms" aria-label="条件に一致した部屋">
          {shop.matchedRooms.map(({ room, availability: roomAvailability }) => <li className="result-item__room" key={room.id}>
            <a className="result-item__room-link" href={roomHref?.(room)} aria-label={`${room.name}を指定して予約画面へ進む`}>
              <span className="result-item__room-name">{room.name}</span>
              <span>{room.machineModel}・{room.capacity.min}〜{room.capacity.max}名</span>
              <div className="result-item__tags">
                <Tag className="result-item__tag" variant={roomAvailability?.status === 'vacant' ? 'vacant' : 'secondary'}>
                  {roomAvailability?.source === 'test' ? 'テスト空室：' : ''}
                  {roomAvailability?.status === 'vacant' ? '空室あり' : roomAvailability?.status === 'occupied' ? '使用中' : '空室状況未確認'}
                </Tag>
                <ul className="result-item__machines" aria-label="この部屋の対応機種">
                  {(room.machines ?? []).map((machine) => <li key={machine}>
                    <Tag className="result-item__tag" variant={machine === 'dam' ? 'dam' : machine === 'joysound' ? 'joysound' : 'secondary'}>
                      {machine === 'dam' ? 'DAM' : machine === 'joysound' ? 'JOYSOUND' : machine}
                    </Tag>
                  </li>)}
                </ul>
              </div>
            </a>
          </li>)}
        </ul>}
        {!shop.matchedRooms?.length && <div className="result-item__tags">
          <Tag className="result-item__tag" variant={shop.availableRooms > 0 ? 'vacant' : 'secondary'}>{availability}</Tag>
          <ul className="result-item__machines" aria-label="対応機種">
            {shop.machines.map((machine) => (
              <li key={machine}>
                <Tag className="result-item__tag" variant={machine === 'DAM' ? 'dam' : machine === 'JOYSOUND' ? 'joysound' : 'secondary'}>{machine}</Tag>
              </li>
            ))}
          </ul>
        </div>}
      </div>
    </article>
  )
}

function SearchResults({
  shops: suppliedShops,
  onBack = returnToSource,
  mapContent,
  renderShop = renderDefaultShop,
  bottomNavigation = null,
}) {
  const { status, location, error, requestLocation } = useCurrentLocation()
  const pageLocation = getPageLocation()
  const reservationId = pageLocation.searchParams.get('reserve')
  const isReservationPage = Boolean(reservationId)
  const isRecommended = pageLocation.searchParams.get('sort') === 'recommended'
  const [selectedShopId, setSelectedShopId] = useState(null)
  const nearby = useNearbyShops(location, 5000, suppliedShops === undefined && !isRecommended && !isReservationPage)
  const isRoomSearch = !isRecommended && !isReservationPage && pageLocation.searchParams.get('from') === 'search-filter'
  const conditions = readRoomSearch(pageLocation.searchParams)
  const sourceShops = suppliedShops ?? (isRecommended ? sampleResults : nearby.results)
  const shops = isRoomSearch
    ? conditions.error ? [] : searchRoomPageShops(sourceShops, conditions)
    : sourceShops
  const reservationShop = shops.find((shop) => shop.id === reservationId) 
  const displayedShops = isRecommended && shops.length > 0
    ? Array.from({ length: 12 }, (_, index) => ({
      ...shops[index % shops.length],
      id: `recommended-${index + 1}`,
    }))
    : shops

  useEffect(() => {
    if (!isRecommended && !isReservationPage) requestLocation()
  }, [isRecommended, isReservationPage, requestLocation])

  if (isReservationPage) {
    const from = pageLocation.searchParams.get('from')
    const returnParams = new URLSearchParams(pageLocation.searchParams)
    for (const key of ['reserve', 'shopName', 'room']) returnParams.delete(key)
    const returnPath = from === 'shop-detail' ? '/shop-detail' : `/search?${returnParams}`
    const roomId = pageLocation.searchParams.get('room')
    const store = roomCatalog.find((item) => item.osmIds.includes(reservationId))
    const room = store?.rooms.find((item) => item.id === roomId)
    if (roomId && !room) return <main className="search-results__list-section">
      <p role="alert">指定された部屋が見つかりません。検索結果から選び直してください。</p>
      <Button onClick={() => window.location.assign(pageUrl(returnPath))}>検索結果に戻る</Button>
    </main>
    return (
      <ReservationForm
        key={`${reservationId}:${roomId ?? ''}`}
        room={room}
        shopName={store?.name || pageLocation.searchParams.get('shopName') || reservationShop?.name}
        conditions={reservationShop?.machines?.join('・') || '設備情報未確認'}
        onBack={() => window.location.assign(pageUrl(returnPath))}
      />
    )
  }

  function reservationHref(shop, room) {
    const params = new URLSearchParams(pageLocation.searchParams)
    params.set('reserve', shop.id)
    params.set('shopName', shop.name)
    if (room) params.set('room', room.id)
    else params.delete('room')
    if (pageLocation.searchParams.get('from') === 'search-filter') params.set('from', 'search-filter')
    return pageUrl(`/search?${params.toString()}`)
  }

  return (
    <div className={`search-results${isRecommended ? ' search-results--recommended' : ''}`}>
      <main className="search-results__main">
        <header className="search-results__header">
          <Button className="search-results__back" onClick={onBack} aria-label="前の画面に戻る">
            <svg className="search-results__back-icon" aria-hidden="true"><use href={assetUrl('/images/icons.svg#chevron')} /></svg>
          </Button>
          <h1 className="search-results__title">{isRecommended ? 'おすすめ店舗' : '検索結果'}</h1>
        </header>
        {!isRecommended && status !== 'success' && <section className="search-results__location" aria-label="現在地の取得">
          {status === 'error' && (
            <Button
                className="search-results__locate"
                onClick={requestLocation}
            >
                現在地を再取得
            </Button>
        )}
          <p className="search-results__location-message" role="status">
            {status === 'idle' && '位置情報を許可すると、現在地を中心に地図を表示します。'}
            {status === 'loading' && '端末の位置情報を確認しています。'}
            {status === 'error' && error}
          </p>
        </section>}
        {!isRecommended && <section id="search-results-map" className="search-results__map" aria-label="周辺地図">
          {mapContent ?? <MapView location={location} shops={shops} tileStyle="dark" selectedShopId={selectedShopId} onShopSelect={setSelectedShopId} />}
        </section>}
        <section className="search-results__list-section" aria-label="検索結果の店舗一覧">
          {!isRecommended && suppliedShops === undefined && nearby.status === 'loading' && <p role="status">{nearby.message ?? '半径5kmのカラオケ店舗を取得しています…'}</p>}
          {!isRecommended && suppliedShops === undefined && nearby.status === 'error' && <p role="alert">{nearby.message}<Button onClick={nearby.retry}>再試行</Button></p>}
          {isRoomSearch && <p>現在地から半径5km以内で、確認済みの部屋情報を検索しています。登録済みは名駅東口店の2室です。未確認の設備は条件に一致しません。</p>}
          {isRoomSearch && conditions.realtimeAvailable && <p>空室情報は未接続です。実際の空室を検索することはできません。空室条件をOFFにしてお試しください。</p>}
          {isRoomSearch && conditions.error && <p role="alert">{conditions.error}</p>}
          <p className="search-results__count" role="status">全{isRecommended ? displayedShops.length : shops.length}件</p>
          {displayedShops.length > 0 ? (
            <ul className="search-results__list">
              {displayedShops.map((shop) => (
                <li className="search-results__item" key={shop.id}>
                  {shop.matchedRooms?.length ? renderShop(shop, {
                    roomHref: (room) => reservationHref(shop, room),
                    onShopClick: (event) => {
                      event.preventDefault()
                      setSelectedShopId(shop.id)
                      document.getElementById('search-results-map')?.scrollIntoView({ block: 'center' })
                    },
                  }) : <a className="search-results__card-link" href={shop.isRealShop ? '#search-results-map' : pageUrl(`/shops/${shop.id}`)} onClick={shop.isRealShop ? (event) => {
                    event.preventDefault()
                    setSelectedShopId(shop.id)
                    document.getElementById('search-results-map')?.scrollIntoView({ block: 'center' })
                  } : undefined}>
                    {renderShop(shop)}
                  </a>}
                  {!shop.matchedRooms?.length && <a className="search-results__reserve-link" href={reservationHref(shop)}>この店舗を予約する</a>}
                </li>
              ))}
            </ul>
          ) : (
            (isRecommended || suppliedShops !== undefined || nearby.status === 'success') && <p className="search-results__empty">{isRoomSearch ? 'この範囲の登録済み部屋には、条件に一致する部屋がありません。条件や現在地をご確認ください。' : '周辺の店舗が見つかりませんでした。'}</p>
          )}
        </section>
      </main>
      {bottomNavigation && <div className="search-results__navigation">{bottomNavigation}</div>}
    </div>
  )
}

export default SearchResults
