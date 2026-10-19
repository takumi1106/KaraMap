import { useCallback, useEffect, useRef, useState } from 'react'
import { Map, Marker, NavigationControl, AttributionControl, setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { fetchRoute } from '../services/routing/fetchRoute.js'
import { pageUrl } from '../utils/paths.js'
import { getMapShopInfo, availabilityLabel } from './mapShopInfo.js'
import { prepareMapStyle } from './mapViewStyle.js'
import './MapView.scss'

setWorkerUrl(workerUrl)
const emptyShops = []

function hasCoordinates(point) {
  return Number.isFinite(point?.latitude) && Math.abs(point.latitude) <= 90
    && Number.isFinite(point?.longitude) && Math.abs(point.longitude) <= 180
}

function MapView({ location, shops = emptyShops, tileStyle = 'dark', selectedShopId, onShopSelect }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const directionRef = useRef(null)
  const [directionEnabled, setDirectionEnabled] = useState(false)
  const [directionMessage, setDirectionMessage] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [mapError, setMapError] = useState('')
  const [localSelectedShop, setLocalSelectedShop] = useState(null)
  const selectedShop = selectedShopId === undefined ? localSelectedShop : selectedShopId
  const setSelectedShop = useCallback((id) => {
    setLocalSelectedShop(id)
    onShopSelect?.(id)
  }, [onShopSelect])
  const [routeMode, setRouteMode] = useState('walking')
  const [routeState, setRouteState] = useState({ status: 'idle' })
  // 店舗詳細の開閉とは独立して、表示済みの経路を保持する。
  const [displayedRoute, setDisplayedRoute] = useState(null)
  const routeRequest = useRef(null)
  const routeDestination = shops.find((shop) => shop.id === selectedShop)
  const selectedShopInfo = getMapShopInfo(routeDestination)
  const reservationParams = routeDestination ? new URLSearchParams({ reserve: String(routeDestination.id), shopName: routeDestination.name ?? '', from: 'map' }) : null
  const routeKey = JSON.stringify([location?.latitude, location?.longitude, routeDestination?.id,
    routeDestination?.latitude, routeDestination?.longitude, routeMode])
  const currentRoute = routeState.key === routeKey ? routeState : { status: 'idle' }

  useEffect(() => () => routeRequest.current?.abort(), [routeKey])

  async function showRoute() {
    routeRequest.current?.abort()
    const controller = new AbortController()
    routeRequest.current = controller
    setRouteState({ status: 'loading', key: routeKey })
    try {
      const result = await fetchRoute({ origin: location, destination: routeDestination, mode: routeMode,
        signal: controller.signal, endpoint: import.meta.env.VITE_ROUTING_API_URL || undefined })
      if (controller.signal.aborted) return
      setRouteState({ status: 'success', key: routeKey, result })
      setDisplayedRoute(result)
      const bounds = result.geometry.coordinates.reduce((b, [lng, lat]) => [Math.min(b[0], lng), Math.min(b[1], lat), Math.max(b[2], lng), Math.max(b[3], lat)], [180, 90, -180, -90])
      mapRef.current?.fitBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]], {
        padding: { top: 110, bottom: 180, left: 40, right: 40 }, maxZoom: 17, duration: 500,
      })
    } catch {
      if (!controller.signal.aborted) setRouteState({ status: 'error', key: routeKey })
    }
  }


  useEffect(() => {
    let map
    try {
      map = new Map({
        container: containerRef.current,
        style: { version: 8, sources: {}, layers: [] },
        center: [136.8815, 35.1709], zoom: 15, maxZoom: 19,
        attributionControl: false,
      })
    } catch {
      // 外部URLやキーをエラーメッセージに含めない。
      queueMicrotask(() => setMapError('この環境では地図を表示できません。WebGLの設定をご確認ください。'))
      return
    }
    mapRef.current = map
    map.addControl(new NavigationControl({ showCompass: false }), 'top-left')
    map.addControl(new AttributionControl({ compact: false }), 'bottom-right')
    const observer = new ResizeObserver(() => map.resize())
    observer.observe(containerRef.current)
    const onError = () => setMapError('地図を読み込めませんでした。通信環境を確認して再読み込みしてください。')
    map.on('error', onError)
    return () => {
      observer.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const controller = new AbortController()
    const isLight = tileStyle === 'light'
    async function loadStyle() {
      try {
        const response = await fetch(`https://tiles.openfreemap.org/styles/${isLight ? 'positron' : 'dark'}`, { signal: controller.signal })
        if (!response.ok) throw new Error('Style unavailable')
        const style = await response.json()
        if (controller.signal.aborted) return
        map.setStyle(prepareMapStyle(style, isLight))
        setMapError('')
      } catch {
        if (!controller.signal.aborted) setMapError('地図を読み込めませんでした。通信環境を確認して再読み込みしてください。')
      }
    }
    loadStyle()
    return () => controller.abort()
  }, [tileStyle])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    let drawn = false
    const draw = () => {
      if (drawn || !map.isStyleLoaded()) return
      drawn = true
      if (map.getLayer('karamap-route')) map.removeLayer('karamap-route')
      if (map.getLayer('karamap-route-outline')) map.removeLayer('karamap-route-outline')
      if (map.getSource('karamap-route')) map.removeSource('karamap-route')
      if (!displayedRoute) return
      map.addSource('karamap-route', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: displayedRoute.geometry } })
      map.addLayer({ id: 'karamap-route-outline', type: 'line', source: 'karamap-route',
        layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 8 } })
      map.addLayer({ id: 'karamap-route', type: 'line', source: 'karamap-route',
        layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#3488ff', 'line-width': 5 } })
    }
    const redraw = () => {
      drawn = false
      draw()
    }
    draw()
    // fitBounds後のタイル読込中はstyle.loadが再発火しないため、idleでも再試行する。
    map.on('idle', draw)
    map.on('style.load', redraw)
    return () => {
      map.off('idle', draw)
      map.off('style.load', redraw)
    }
  }, [displayedRoute])

  async function enableDirection() {
    if (!window.isSecureContext || !window.DeviceOrientationEvent) {
      setDirectionMessage('この端末では向きを取得できません。')
      return
    }
    try {
      if (typeof window.DeviceOrientationEvent.requestPermission === 'function') {
        const permission = await window.DeviceOrientationEvent.requestPermission(true)
        if (permission !== 'granted') {
          setDirectionMessage('向きの表示にはセンサーの許可が必要です。')
          return
        }
      }
      setDirectionMessage('スマホを水平にしてください。')
      setDirectionEnabled(true)
    } catch {
      setDirectionMessage('向きを取得できませんでした。')
    }
  }

  useEffect(() => {
    if (!directionEnabled) return
    let heading = null
    let lastReading = 0
    const map = mapRef.current
    const draw = () => {
      const cone = directionRef.current
      if (!cone) return
      const valid = heading !== null && Date.now() - lastReading < 8000
      cone.hidden = !valid
      if (valid) cone.style.transform = `rotate(${heading - (map?.getBearing() ?? 0)}deg)`
    }
    const onOrientation = (event) => {
      let value = null
      if (Number.isFinite(event.webkitCompassHeading) && event.webkitCompassHeading >= 0
        && !(Number.isFinite(event.webkitCompassAccuracy) && (event.webkitCompassAccuracy < 0 || event.webkitCompassAccuracy > 50))) {
        value = event.webkitCompassHeading
      } else if (event.absolute && Number.isFinite(event.alpha)) {
        value = 360 - event.alpha
      }
      if (value === null) return
      const screenAngle = window.screen.orientation?.angle ?? window.orientation ?? 0
      heading = (value + screenAngle + 360) % 360
      lastReading = Date.now()
      setDirectionMessage('')
      draw()
    }
    window.addEventListener('deviceorientationabsolute', onOrientation)
    window.addEventListener('deviceorientation', onOrientation)
    map?.on('rotate', draw)
    const timer = setInterval(() => {
      draw()
      if (!lastReading || Date.now() - lastReading >= 8000) {
        setDirectionMessage('向きを取得できません。スマホを水平にしてください。')
      }
    }, 2000)
    return () => {
      window.removeEventListener('deviceorientationabsolute', onOrientation)
      window.removeEventListener('deviceorientation', onOrientation)
      map?.off('rotate', draw)
      clearInterval(timer)
      if (directionRef.current) directionRef.current.hidden = true
    }
  }, [directionEnabled])

  const latitude = location?.latitude
  const longitude = location?.longitude
  useEffect(() => {
    const map = mapRef.current
    if (!map || !hasCoordinates({ latitude, longitude })) return
    const element = document.createElement('div')
    element.className = 'map-view__location-marker'
    element.title = '現在地'
    element.setAttribute('aria-label', '現在地')
    const dot = document.createElement('span')
    dot.className = 'map-view__location-dot'
    const direction = document.createElement('span')
    direction.className = 'map-view__direction'
    direction.hidden = true
    direction.setAttribute('aria-hidden', 'true')
    directionRef.current = direction
    element.append(direction, dot)
    const marker = new Marker({ element }).setLngLat([longitude, latitude]).addTo(map)
    map.jumpTo({ center: [longitude, latitude], zoom: 16 })
    return () => {
      marker.remove()
      directionRef.current = null
    }
  }, [latitude, longitude])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const markers = shops.filter(hasCoordinates).map((shop) => {
      const element = document.createElement('div')
      element.className = 'map-view__shop-marker'
      element.title = shop.name || 'カラオケ店舗'
      element.setAttribute('aria-label', element.title)
      element.tabIndex = 0
      element.setAttribute('role', 'button')
      element.setAttribute('aria-label', `${element.title}の店舗情報を開く`)
      element.addEventListener('click', () => setSelectedShop(shop.id))
      element.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          setSelectedShop(shop.id)
        }
      })
      const symbol = document.createElement('span')
      symbol.className = 'map-view__shop-symbol'
      symbol.setAttribute('aria-hidden', 'true')
      const label = document.createElement('span')
      label.className = 'map-view__tooltip'
      label.textContent = element.title
      element.append(symbol, label)
      return new Marker({ element, anchor: 'bottom' }).setLngLat([shop.longitude, shop.latitude]).addTo(map)
    })
    return () => markers.forEach((marker) => marker.remove())
  }, [shops, setSelectedShop])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const frame = requestAnimationFrame(() => {
      map.resize()
      if (!isExpanded && hasCoordinates({ latitude, longitude })) {
        map.jumpTo({ center: [longitude, latitude], zoom: 16 })
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [isExpanded, latitude, longitude])

  return (
    <div className={`map-view map-view--${tileStyle}${isExpanded ? ' map-view--expanded' : ''}`}>
      <div className="map-view__map" ref={containerRef} aria-label="周辺のカラオケ店舗の地図" />
      {hasCoordinates(location) && (
        <div className="map-view__direction-control">
          <button type="button" className="map-view__direction-button" aria-pressed={directionEnabled}
            onClick={() => {
              if (directionEnabled) { setDirectionEnabled(false); setDirectionMessage('') }
              else enableDirection()
            }}>
            {directionEnabled ? '向き表示 OFF' : '向きを表示'}
          </button>
          {directionMessage && <p className="map-view__direction-message" role="status">{directionMessage}</p>}
        </div>
      )}
      {routeDestination && (
        <section className="map-view__route" aria-label="選択した店舗の情報">
          <div className="map-view__route-heading">
            <strong>{routeDestination.name}</strong>
            <button type="button" onClick={() => setSelectedShop(null)} aria-label="店舗情報を閉じる">×</button>
          </div>
          <p className="map-view__shop-status">
            {selectedShopInfo.matchedOnly ? '条件に一致した部屋：' : ''}{selectedShopInfo.availability}
          </p>
          {selectedShopInfo.isTestData && <p className="map-view__shop-note">表示例・テストデータです。実際の空室情報ではありません。</p>}
          <div className="map-view__shop-actions">
            <a href={pageUrl(`/search?${reservationParams.toString()}`)}>予約画面へ</a>
            {selectedShopInfo.telephone
              ? <a href={selectedShopInfo.telephone} aria-label={`${routeDestination.name}に電話する`}>電話する</a>
              : <span aria-disabled="true">電話番号未登録</span>}
          </div>
          <details className="map-view__rooms" key={routeDestination.id}>
            <summary>部屋の空き情報を見る</summary>
            {selectedShopInfo.rooms.length > 0 ? (
              <ul>
                {selectedShopInfo.rooms.map((room, index) => (
                  <li key={room.id ?? index}>
                    <span>{room.name ?? room.id ?? `部屋${index + 1}`}</span>
                    <span>{availabilityLabel(room.availability?.status)}</span>
                  </li>
                ))}
              </ul>
            ) : <p>部屋情報は未登録です。店舗へご確認ください。</p>}
          </details>
          <div className="map-view__route-actions">
            <select aria-label="経路の移動手段" value={routeMode} onChange={(event) => setRouteMode(event.target.value)}>
              <option value="walking">徒歩</option><option value="driving">車</option>
            </select>
            <button type="button" disabled={!hasCoordinates(location) || currentRoute.status === 'loading'} onClick={showRoute}>
              {currentRoute.status === 'loading' ? '検索中…' : '経路を表示'}
            </button>
          </div>
          <p className="map-view__route-summary" role="status">
            {!hasCoordinates(location) ? '現在地を取得してからお試しください。'
              : currentRoute.status === 'success'
                ? `約${Math.max(1, Math.ceil(currentRoute.result.durationSeconds / 60))}分・${currentRoute.result.distanceMeters < 1000 ? `${Math.round(currentRoute.result.distanceMeters)}m` : `${(currentRoute.result.distanceMeters / 1000).toFixed(1)}km`}（目安）`
                : currentRoute.status === 'error' ? '経路を取得できませんでした。時間をおいてお試しください。'
                  : '現在地から選択した店舗までの経路を表示します。'}
          </p>
          <small>経路：<a href="https://valhalla.openstreetmap.de/" target="_blank" rel="noreferrer">Valhalla / FOSSGIS</a></small>
        </section>
      )}
      {mapError && <p className="map-view__error" role="status">{mapError}</p>}
      <button
        className="map-view__expand" type="button"
        aria-label={isExpanded ? '地図を元のサイズに戻す' : '地図を拡大表示'}
        aria-expanded={isExpanded} onClick={() => setIsExpanded(!isExpanded)}
      >
        <svg className="map-view__expand-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d={isExpanded ? 'M3 8h5V3M21 8h-5V3M3 16h5v5M21 16h-5v5' : 'M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5'}
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}

export default MapView
