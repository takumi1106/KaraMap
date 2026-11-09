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
import { demoOrigin, detailPath, groupByDistance, groupRegisteredShopsFirst, searchContext } from '../../services/search-flow/searchFlow.js'
import SearchOrigin from '../../components/SearchOrigin.jsx'
import useSearchOrigin from '../../hooks/useSearchOrigin.js'
import useSavedShop from '../../hooks/useSavedShop.js'
import { expandDistanceGroup, visibleDistanceGroups } from './visibleDistanceGroups.js'
import './search-results.scss'

function returnToSource() {
  const params = getPageLocation().searchParams
  window.location.assign(pageUrl(params.get('from') === 'search-filter' ? `/search-filter?${params}` : '/'))
}

function formatResultDistance(meters) {
  if (!Number.isFinite(meters) || meters < 0) return '距離未確認'
  return meters >= 1000 ? `約${(meters / 1000).toFixed(1)}km` : `約${Math.round(meters)}m`
}

// 共通カードが完成するまでの画面専用表示。店舗データを1つのpropで受け取る。
function renderDefaultShop(shop, { roomHref, shopHref } = {}) {
  const availability = shop.matchedRooms?.some(({ availability }) => availability?.source === 'test')
    ? '空室条件確認（デモ）'
    : shop.availableRooms == null
    ? '空室状況未確認'
    : shop.availableRooms > 0
      ? `空室あり（残り${shop.availableRooms}部屋）`
      : '満室'

  return (
    <article className={`result-item${shop.image ? ' result-item--with-image' : ''}`}>
      {shop.image && <img className="result-item__image" src={assetUrl(shop.image)} alt={`${shop.name}の店内イメージ`} width="92" height="118" loading="lazy" />}
      <div className="result-item__content">
        <header className="result-item__header">
          <h2 className="result-item__name">{roomHref
            ? <a className="search-results__card-link" href={shopHref}>{shop.name}</a>
            : shop.name}</h2>
          <div className="result-item__details">
            <span>{shop.isRealShop ? `直線距離：${formatResultDistance(shop.distanceMeters)}` : `徒歩${shop.walkingMinutes}分 (${shop.distanceMeters}m)`}</span>
            <span className="result-item__business">
              <svg className="result-item__pin" aria-hidden="true"><use href={assetUrl('/images/icons.svg#pin')} /></svg>
              {shop.isOpen == null ? '営業状況未確認' : shop.isOpen ? '営業中' : '営業時間外'}
            </span>
          </div>
        </header>
        {shop.matchedRooms && <ul className="result-item__rooms" aria-label="条件に一致した部屋">
          {shop.matchedRooms.map(({ room, availability: roomAvailability }) => <li className="result-item__room" key={room.id}>
            <a className="result-item__room-link" href={roomHref?.(room)} aria-label={`${room.name}の店舗詳細へ進む`}>
              <span className="result-item__room-name">{room.roomNumber ? `${room.roomNumber}号室` : room.name}</span>
              <span className="result-item__room-type">{room.officialRoomType ?? '部屋タイプ未確認'}</span>
              <dl className="result-item__room-info">
                <div className="result-item__room-field">
                  <dt>機種</dt>
                  <dd>
                    <ul className="result-item__machines" aria-label="この部屋の対応機種">
                      {(room.machines ?? []).map((machine) => <li key={machine}>
                        <Tag className="result-item__tag" variant={machine === 'dam' ? 'dam' : machine === 'joysound' ? 'joysound' : 'secondary'}>
                          {machine === 'dam' ? 'DAM' : machine === 'joysound' ? 'JOYSOUND' : machine}
                        </Tag>
                      </li>)}
                    </ul>
                    <span className="result-item__machine-model">{room.machineModel ?? '機種名未確認'}</span>
                  </dd>
                </div>
                <div className="result-item__room-field">
                  <dt>定員</dt>
                  <dd>{room.capacity?.min != null && room.capacity?.max != null ? `${room.capacity.min}〜${room.capacity.max}名` : '未確認'}</dd>
                </div>
                <div className="result-item__room-field">
                  <dt>空室</dt>
                  <dd><Tag className="result-item__tag" variant={roomAvailability?.status === 'vacant' ? 'vacant' : 'secondary'}>
                    {roomAvailability?.source === 'test' ? 'テスト空室：' : ''}
                    {roomAvailability?.status === 'vacant' ? '空室あり' : roomAvailability?.status === 'occupied' ? '使用中' : '空室状況未確認'}
                  </Tag></dd>
                </div>
              </dl>
              <span className="result-item__room-action">この部屋の詳細を見る →</span>
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
  const { status, location: currentLocation, error, requestLocation } = useCurrentLocation()
  const [origin, setOrigin] = useSearchOrigin()
  const location = origin === 'demo' ? demoOrigin : currentLocation
  const pageLocation = getPageLocation()
  const reservationId = pageLocation.searchParams.get('reserve')
  const isReservationPage = Boolean(reservationId)
  const reservation = useSavedShop(reservationId)
  const context = searchContext(pageLocation.searchParams)
  context.set('origin', origin)
  const paginationKey = JSON.stringify([pageLocation.search, origin, location?.latitude, location?.longitude])
  const [pagination, setPagination] = useState({ key: paginationKey, count: 5, nearCount: 10 })
  // 起点切替は同じ画面内で行うため、URL変更に加えて座標変更でもリセット。
  if (pagination.key !== paginationKey) setPagination({ key: paginationKey, count: 5, nearCount: 10 })
  const visibleNearCount = pagination.key === paginationKey ? pagination.nearCount : 10
  const visibleFarCount = pagination.key === paginationKey ? pagination.count : 5
  const isRecommended = pageLocation.searchParams.get('sort') === 'recommended'
  const [selectedShopId, setSelectedShopId] = useState(null)
  const nearby = useNearbyShops(location, null, suppliedShops === undefined && !isRecommended && !isReservationPage)
  const isRoomSearch = !isRecommended && !isReservationPage && (pageLocation.searchParams.get('from') === 'search-filter' || pageLocation.searchParams.has('keyword'))
  const conditions = readRoomSearch(pageLocation.searchParams)
  const sourceShops = suppliedShops ?? (isRecommended ? sampleResults : nearby.results)
  const shops = isRoomSearch
    ? conditions.error ? [] : searchRoomPageShops(sourceShops, conditions)
    : sourceShops
  const displayedShops = isRecommended && shops.length > 0
    ? Array.from({ length: 12 }, (_, index) => ({
      ...shops[index % shops.length],
      id: `recommended-${index + 1}`,
    }))
    : shops

  useEffect(() => {
    if (!isRecommended && !isReservationPage && origin === 'current') requestLocation()
  }, [isRecommended, isReservationPage, origin, requestLocation])

  if (isReservationPage) {
    const roomId = pageLocation.searchParams.get('room')
    const fromDetail = pageLocation.searchParams.get('returnTo') === 'shop-detail'
    const returnPath = fromDetail ? detailPath(reservationId, context, roomId) : `/search?${context}`
    const room = reservation.shop?.rooms.find((item) => item.id === roomId)
    if (reservation.status !== 'success' || !reservation.shop || (roomId && !room)) return <main className="search-results__list-section">
      <p role="status">{reservation.status === 'loading' ? '店舗情報を読み込んでいます…' : reservation.status === 'error' ? '店舗情報を読み込めませんでした。' : '指定された店舗・部屋が見つかりません。'}</p>
      {reservation.status === 'error' && <Button onClick={reservation.retry}>再試行</Button>}
      <Button onClick={() => window.location.assign(pageUrl(returnPath))}>前の画面に戻る</Button>
    </main>
    return <ReservationForm
      key={`${reservationId}:${roomId ?? ''}`}
      room={room}
      shopId={reservation.shop.id}
      searchContext={context.toString()}
      shopName={reservation.shop.name}
      conditions="設備情報未確認"
      backLabel={fromDetail ? '店舗詳細に戻る' : '検索結果に戻る'}
      onBack={() => window.location.assign(pageUrl(returnPath))}
    />
  }

  const groups = visibleDistanceGroups(isRecommended ? [{ id: 'recommended', label: 'おすすめ店舗（表示サンプル）', shops: displayedShops }] : isRoomSearch ? groupRegisteredShopsFirst(displayedShops) : groupByDistance(displayedShops), visibleFarCount, visibleNearCount)
  function selectOnMap(shop) {
    setSelectedShopId(shop.id)
    document.getElementById('search-results-map')?.scrollIntoView({ block: 'center' })
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
        {!isRecommended && <SearchOrigin mode={origin} onChange={setOrigin} />}
        {!isRecommended && origin === 'current' && status !== 'success' && <section className="search-results__location" aria-label="現在地の取得">
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
          {mapContent ?? <MapView location={location} shops={shops} tileStyle="dark" selectedShopId={selectedShopId} onShopSelect={setSelectedShopId} detailHref={(shop) => pageUrl(detailPath(shop.id, context))} originLabel={origin === 'demo' ? '名古屋駅（デモ起点）' : '現在地'} fitShops />}
        </section>}
        <section className="search-results__list-section" aria-label="検索結果の店舗一覧">
          {!isRecommended && suppliedShops === undefined && nearby.status === 'loading' && <p role="status">{nearby.message ?? '保存済みのカラオケ店舗を取得しています…'}</p>}
          {!isRecommended && suppliedShops === undefined && nearby.status === 'error' && <p role="alert">{nearby.message}<Button onClick={nearby.retry}>再試行</Button></p>}
          {isRoomSearch && <p>保存済み店舗を距離で除外せず検索しています。設備条件は確認済みの部屋情報で照合します。部屋登録済みは名駅東口店の2室です。</p>}
          {isRoomSearch && conditions.keyword.trim() && <p>店舗名：「{conditions.keyword}」の検索結果</p>}
          {isRoomSearch && conditions.realtimeAvailable && <p>ジャンカラ名駅東口店の701・702号室をデモ空室として検索しています。実際の空室状況は店舗にご確認ください。</p>}
          {isRoomSearch && conditions.error && <p role="alert">{conditions.error}</p>}
          <p className="search-results__count" role="status">全{isRecommended ? displayedShops.length : shops.length}件</p>
          {!isRecommended && <a className="search-results__reserve-link" href={pageUrl(`/search-filter?${context}`)}>検索条件を変更する</a>}
          {!displayedShops.length && !conditions.error && (isRecommended || suppliedShops !== undefined || nearby.status === 'success') && <p className="search-results__empty" role="status">条件に合う店舗がありません</p>}
          {groups.map((group) => <section className="search-results__distance-group" key={group.id} aria-label={group.label}>
            <h2 className="search-results__group-title">{isRecommended || group.id === 'unknown' || group.id === 'registered' ? '' : origin === 'demo' ? '名古屋駅から' : '現在地から'}{group.label}（{group.shops.length}件）</h2>
            <ul className="search-results__list">
              {group.visibleShops.map((shop) => <li className="search-results__item" key={shop.id}>
                {renderShop(shop, {
                  shopHref: pageUrl(detailPath(shop.id, context)),
                  roomHref: (room) => pageUrl(detailPath(shop.id, context, room.id)),
                })}
                {!isRecommended && <>
                  {!roomCatalog.some((store) => store.osmIds.includes(shop.id)) && <p>部屋情報未登録（設備条件への一致は未確認）</p>}
                  <a className="search-results__reserve-link" href={pageUrl(detailPath(shop.id, context))}>店舗詳細を見る</a>
                  <Button className="search-results__map-button" onClick={() => selectOnMap(shop)}>地図で場所・経路を確認</Button>
                </>}
              </li>)}
            </ul>
            {(group.id === 'near' || group.id === 'far') && <p className="search-results__display-count" role="status">{group.shops.length}件中{group.visibleShops.length}件を表示{group.remainingCount === 0 ? '（すべて表示済み）' : ''}</p>}
            {group.remainingCount > 0 && <Button
              className="search-results__more-button"
              onClick={() => setPagination((previous) => expandDistanceGroup(previous, paginationKey, group.id, group.shops.length))}
            >さらに{group.nextCount}件表示（残り{group.remainingCount}件）</Button>}
          </section>)}

        </section>
      </main>
      {bottomNavigation && <div className="search-results__navigation">{bottomNavigation}</div>}
    </div>
  )
}

export default SearchResults
