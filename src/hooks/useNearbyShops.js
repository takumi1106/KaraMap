import { useEffect, useState } from 'react'
import { loadSavedShops } from '../services/saved-shops/savedShops.js'

const empty = []
export default function useNearbyShops(location, radiusMeters = 5000, enabled = true) {
  const [state, setState] = useState({ key: '', status: 'idle', results: empty, reviewShops: empty })
  const [attempt, setAttempt] = useState(0)
  const latitude = location?.latitude
  const longitude = location?.longitude
  const valid = Number.isFinite(latitude) && Number.isFinite(longitude)
  const key = enabled && valid ? `${latitude}:${longitude}:${radiusMeters}:${attempt}` : ''
  useEffect(() => {
    if (!key) return
    const controller = new AbortController()
    // 範囲を素早く切り替えたときは、最後の指定のみ送信する。
    const timer = setTimeout(async () => {
      try {
        const result = await loadSavedShops({
          location: { latitude, longitude }, radiusMeters, signal: controller.signal,
          url: `${import.meta.env.BASE_URL}data/karaoke-shops.json`,
        })
        if (!controller.signal.aborted) setState({ key, status: 'success', ...result })
      } catch (error) {
        if (!controller.signal.aborted) setState({ key, status: 'error', results: empty, reviewShops: empty, message: error.message || '保存済み店舗データを読み込めませんでした。' })
      }
    }, 300)
    return () => { clearTimeout(timer); controller.abort() }
  }, [key, latitude, longitude, radiusMeters])
  const current = key && state.key === key ? state : { status: key ? 'loading' : 'idle', results: empty, reviewShops: empty }
  return { ...current, retry: () => setAttempt((value) => value + 1) }
}
