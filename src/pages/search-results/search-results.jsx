import { assetUrl, pageUrl, getPageLocation } from '../../utils/paths.js'
import { useEffect } from 'react'
import MapView from '../../components/MapView.jsx'
import useCurrentLocation from '../../hooks/useCurrentLocation.js'
import Button from '../../components/Button.jsx'
import Tag from '../../components/Tag.jsx'
import ReservationForm from '../reservation-form/reservation-form.jsx'
import { sampleResults } from './searchResultsData.js'
import './search-results.scss'

function returnToSource() {
  const from = getPageLocation().searchParams.get('from')
  window.location.assign(pageUrl(from === 'search-filter' ? '/search-filter' : '/'))
}

// 共通カードが完成するまでの画面専用表示。店舗データを1つのpropで受け取る。
function renderDefaultShop(shop) {
  const availability = shop.availableRooms == null
    ? '空室状況未確認'
    : shop.availableRooms > 0
      ? `空室あり（残り${shop.availableRooms}部屋）`
      : '満室'

  return (
    <article className="result-item">
      <img className="result-item__image" src={assetUrl(shop.image)} alt={`${shop.name}の店内イメージ`} width="92" height="118" loading="lazy" />
      <div className="result-item__content">
        <h2 className="result-item__name">{shop.name}</h2>
        <div className="result-item__details">
          <span>徒歩{shop.walkingMinutes}分 ({shop.distanceMeters}m)</span>
          <span className="result-item__business">
            <svg className="result-item__pin" aria-hidden="true"><use href={assetUrl('/images/icons.svg#pin')} /></svg>
            {shop.isOpen == null ? '営業状況未確認' : shop.isOpen ? '営業中' : '営業時間外'}
          </span>
        </div>
        <div className="result-item__tags">
          <Tag className="result-item__tag" variant={shop.availableRooms > 0 ? 'vacant' : 'secondary'}>{availability}</Tag>
          <ul className="result-item__machines" aria-label="対応機種">
            {shop.machines.map((machine) => (
              <li key={machine}>
                <Tag className="result-item__tag" variant={machine === 'DAM' ? 'dam' : machine === 'JOYSOUND' ? 'joysound' : 'secondary'}>{machine}</Tag>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}

function SearchResults({
  shops = sampleResults,
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
  const reservationShop = shops.find((shop) => shop.id === reservationId) ?? shops[0]
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
    const returnPath = from === 'search-filter' ? '/search?from=search-filter' : from === 'shop-detail' ? '/shop-detail' : '/search'
    return (
      <ReservationForm
        shopName={pageLocation.searchParams.get('shopName') || reservationShop?.name}
        conditions={reservationShop?.machines?.join('・') || '禁煙・DAM'}
        onBack={() => window.location.assign(pageUrl(returnPath))}
      />
    )
  }

  function reservationHref(shop) {
    const params = new URLSearchParams({ reserve: shop.id, shopName: shop.name })
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
        {!isRecommended && <section className="search-results__location" aria-label="現在地の取得">
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
            {status === 'success' && '現在地を取得しました。'}
          </p>
          <p className="search-results__location-message">店舗一覧は仮データです。現在地による絞り込みは未連携です。</p>
        </section>}
        {!isRecommended && <section className="search-results__map" aria-label="周辺地図">
          {mapContent ?? <MapView location={location} shops={shops} />}
        </section>}
        <section className="search-results__list-section" aria-label="検索結果の店舗一覧">
          <p className="search-results__count" role="status">全{isRecommended ? displayedShops.length : shops.length}件</p>
          {displayedShops.length > 0 ? (
            <ul className="search-results__list">
              {displayedShops.map((shop) => (
                <li className="search-results__item" key={shop.id}>
                  {renderShop(shop)}
                  <a className="search-results__reserve-link" href={reservationHref(shop)}>この店舗を予約する</a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="search-results__empty">条件に合う店舗が見つかりませんでした。</p>
          )}
        </section>
      </main>
      {bottomNavigation && <div className="search-results__navigation">{bottomNavigation}</div>}
    </div>
  )
}

export default SearchResults
