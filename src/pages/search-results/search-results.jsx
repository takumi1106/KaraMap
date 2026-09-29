import Button from '../../components/Button.jsx'
import Tag from '../../components/Tag.jsx'
import { sampleResults } from './searchResultsData.js'
import './search-results.scss'

function returnToSource() {
  const from = new URLSearchParams(window.location.search).get('from')
  window.location.assign(from === 'search-filter' ? '/search-filter' : '/')
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
      <img className="result-item__image" src={shop.image} alt={`${shop.name}の店内イメージ`} width="92" height="118" loading="lazy" />
      <div className="result-item__content">
        <h2 className="result-item__name">{shop.name}</h2>
        <div className="result-item__details">
          <span>徒歩{shop.walkingMinutes}分 ({shop.distanceMeters}m)</span>
          <span className="result-item__business">
            <svg className="result-item__pin" aria-hidden="true"><use href="/images/icons.svg#pin" /></svg>
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

// Google Maps連携時は、このコンポーネントまたは画面のmapContentを差し替える。
function MapPreview() {
  return (
    <div className="map-preview" role="img" aria-label="名古屋駅周辺の地図イメージ。青い点は仮の現在地で、実際の位置情報ではありません。">
      <img className="map-preview__image" src="/images/map-preview.svg" alt="" width="750" height="420" />
      <span className="map-preview__location" aria-hidden="true" />
      <span className="map-preview__label">地図イメージ</span>
    </div>
  )
}

function SearchResults({
  shops = sampleResults,
  onBack = returnToSource,
  mapContent = <MapPreview />,
  renderShop = renderDefaultShop,
  bottomNavigation = null,
}) {
  return (
    <div className="search-results">
      <main className="search-results__main">
        <header className="search-results__header">
          <Button className="search-results__back" onClick={onBack} aria-label="前の画面に戻る">
            <svg className="search-results__back-icon" aria-hidden="true"><use href="/images/icons.svg#chevron" /></svg>
          </Button>
          <h1 className="search-results__title">検索結果</h1>
        </header>
        <section className="search-results__map" aria-label="周辺地図">
          {mapContent}
        </section>
        <section className="search-results__list-section" aria-label="検索結果の店舗一覧">
          <p className="search-results__count" role="status">全{shops.length}件</p>
          {shops.length > 0 ? (
            <ul className="search-results__list">
              {shops.map((shop) => (
                <li className="search-results__item" key={shop.id}>{renderShop(shop)}</li>
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
