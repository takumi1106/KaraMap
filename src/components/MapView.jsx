import { useEffect, useState } from 'react'
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import './MapView.scss'

// Vite が生成する公開先付き URL を使用し、画像パスの自動検出に依存しない。
const locationIcon = L.icon({
  ...L.Icon.Default.prototype.options,
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
})

function ChangeMapCenter({ location }) {
  const map = useMap()

  if (location) {
    map.setView(
      [location.latitude, location.longitude],
      16
    )
  }

  return null
}

function ResizeMap({ isExpanded }) {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 100)
    return () => clearTimeout(timer)
  }, [isExpanded, map])

  return null
}

function ResetMapCenter({ location, shouldReset }) {
  const map = useMap()

  useEffect(() => {
    if (shouldReset && location) {
      const timer = setTimeout(() => {
        map.invalidateSize()

        map.setView(
          [location.latitude, location.longitude],
          16
        )
      }, 150)

      return () => clearTimeout(timer)
    }
  }, [shouldReset, location, map])

  return null
}

const karaokeIcon = L.divIcon({
  className: 'map-view__shop-marker',
  html: '<span>🎤</span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

function MapView({ location, shops = [] }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const defaultPosition = [35.1709, 136.8815]

  const center = location
    ? [location.latitude, location.longitude]
    : defaultPosition

  return (
    <div className={`map-view${isExpanded ? ' map-view--expanded' : ''}`}>
      <MapContainer
        center={center}
        zoom={15}
        className="map-view__map"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ChangeMapCenter location={location} />
        <ResizeMap isExpanded={isExpanded} />
        <ResetMapCenter
          location={location}
          shouldReset={!isExpanded}
        />

    {location && (
      <Marker
        icon={locationIcon}
        position={[
          location.latitude,
          location.longitude,
        ]}
      />
    )}

    {shops
      .filter((shop) => shop.latitude && shop.longitude)
      .map((shop) => (
        <Marker
          key={shop.id}
          position={[shop.latitude, shop.longitude]}
          icon={karaokeIcon}
        >
          <Tooltip permanent direction="top">
            {shop.name}
          </Tooltip>
        </Marker>
      ))}

      </MapContainer>

      <button
        className="map-view__expand"
        type="button"
        aria-label={isExpanded ? '地図を元のサイズに戻す' : '地図を拡大表示'}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <svg
          className="map-view__expand-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
        <path
          d={
            isExpanded
              ? 'M3 8h5V3M21 8h-5V3M3 16h5v5M21 16h-5v5'
              : 'M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5'
          }
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        </svg>
      </button>
    </div>
  )
}

export default MapView
