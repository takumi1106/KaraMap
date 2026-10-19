export const DEFAULT_ROUTING_URL = 'https://valhalla1.openstreetmap.de/route'

function validPoint(point) {
  return Number.isFinite(point?.latitude) && Math.abs(point.latitude) <= 90
    && Number.isFinite(point?.longitude) && Math.abs(point.longitude) <= 180
}

/** 座標は明示的な経路検索時だけ送信。現在地の取得・店舗検索は行わない。 */
export async function fetchRoute({ origin, destination, mode = 'walking', signal, endpoint = DEFAULT_ROUTING_URL, fetchImpl = fetch }) {
  if (!validPoint(origin) || !validPoint(destination)) throw new Error('出発地または店舗の位置情報がありません。')
  const costing = { walking: 'pedestrian', driving: 'auto' }[mode]
  if (!costing) throw new Error('移動手段が正しくありません。')
  const controller = new AbortController()
  const abort = () => controller.abort()
  if (signal?.aborted) controller.abort()
  signal?.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(abort, 20000)
  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'X-Client-Id': 'KaraMAP-development' },
      body: JSON.stringify({
        locations: [origin, destination].map(({ latitude, longitude }) => ({ lat: latitude, lon: longitude })),
        costing, units: 'kilometers', format: 'osrm', shape_format: 'geojson',
      }),
    })
    if (!response.ok) throw new Error('経路を取得できませんでした。時間をおいてお試しください。')
    const { code, routes } = await response.json()
    const route = routes?.[0]
    const coordinates = route?.geometry?.type === 'LineString' ? route.geometry.coordinates : null
    if (code !== 'Ok' || !coordinates || coordinates.length < 2
      || coordinates.some((p) => !Array.isArray(p) || !validPoint({ longitude: p[0], latitude: p[1] }))
      || !Number.isFinite(route?.distance) || route.distance < 0
      || !Number.isFinite(route?.duration) || route.duration < 0) {
      throw new Error('利用できる経路が見つかりませんでした。')
    }
    return {
      geometry: { type: 'LineString', coordinates },
      distanceMeters: route.distance, durationSeconds: route.duration, mode,
    }
  } catch (error) {
    if (controller.signal.aborted && !signal?.aborted) throw new Error('経路検索がタイムアウトしました。もう一度お試しください。', { cause: error })
    throw error
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
  }
}
