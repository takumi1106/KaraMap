import { assetUrl, pageUrl } from '../../utils/paths.js'
import { useEffect, useState } from 'react'
import MapView from '../../components/MapView.jsx'
import StoreCard from '../../components/StoreCard.jsx'
import Button from '../../components/Button.jsx'
import useCurrentLocation from '../../hooks/useCurrentLocation.js'
import { distanceOptions, previewShops } from './currentLocationData.js'
import './current-location.scss'

function returnHome() {
  window.location.href = pageUrl('/')
}

function CurrentLocation({
  shops = previewShops,
  initialRadius = '1',
  onRadiusChange,
  mapContent,
  renderMap,
  onBack = returnHome,
}) {
  const [radius, setRadius] = useState(initialRadius)
  const { status, location, error, requestLocation } = useCurrentLocation()

  useEffect(() => {
    requestLocation()
  }, [])

  function changeRadius(event) {
    const nextRadius = event.target.value
    setRadius(nextRadius)
    onRadiusChange?.(Number(nextRadius))
  }

  return (
    <main className="current-location" aria-label="現在地から探す">
      <header className="current-location__header">
        <Button className="current-location__back" onClick={onBack} aria-label="ホームに戻る">
          <svg className="current-location__back-icon" aria-hidden="true">
            <use href={assetUrl('/images/icons.svg#chevron')} />
          </svg>
        </Button>
        <h1 className="current-location__title">現在地から探す</h1>
      </header>
      <section
        className="current-location__location"
        aria-label="現在地の取得"
      >
        {status === 'error' && (
          <Button
            className="current-location__locate"
            onClick={requestLocation}
          >
            現在地を再取得
          </Button>
        )}

        <p className="current-location__location-message" role="status">
          {status === 'idle' && '現在地を使うには、位置情報の利用を許可してください。'}
          {status === 'loading' && '端末の位置情報を確認しています。'}
          {status === 'error' && error}
          {status === 'success' &&
            `現在地を取得しました（精度の目安：約${Math.round(location.accuracy)}m）。`}
        </p>

        <p className="current-location__location-note">
          店舗情報は表示例です。現在地周辺の店舗検索は準備中です。
        </p>
      </section>

      <section className="current-location__map" aria-label="周辺の地図">
        {(renderMap
          ? renderMap({
              location,
              status,
              radiusKm: Number(radius),
            })
          : mapContent) ?? (
          <MapView
            location={location}
            shops={shops}
          />
        )}
      </section>

      <div className="current-location__controls">
        <div className="current-location__distance">
          <select
            className="current-location__select"
            aria-label="現在地からの検索範囲"
            value={radius}
            onChange={changeRadius}
          >
            {distanceOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                現在地から {option.label}
              </option>
            ))}
          </select>

          <svg
            className="current-location__chevron"
            aria-hidden="true"
          >
            <use href={assetUrl('/images/icons.svg#chevron')} />
          </svg>
        </div>

        <a
          className="current-location__filter"
          href={pageUrl('/search-filter')}
        >
          条件から絞り込む
          <svg
            className="current-location__chevron"
            aria-hidden="true"
          >
            <use href={assetUrl('/images/icons.svg#chevron')} />
          </svg>
        </a>
      </div>

      <section
        className="current-location__results"
        aria-label="周辺の店舗"
      >
        {shops.length ? (
          <ul className="current-location__list">
            {shops.map((shop) => (
              <li key={shop.id}>
                <StoreCard
                  className="current-location__card"
                  href={pageUrl(`/shops/${shop.id}`)}
                  image={shop.image}
                  imageAlt={shop.imageAlt}
                  name={shop.name}
                  distance={`徒歩${shop.walkingMinutes}分 (${shop.distanceMeters}m)`}
                  status={shop.status}
                  tags={shop.tags}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="current-location__empty">
            周辺の店舗が見つかりませんでした。
          </p>
        )}
      </section>
    </main>
  )
}

export default CurrentLocation
