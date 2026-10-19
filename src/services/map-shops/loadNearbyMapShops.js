import { buildNearbyKaraokeQuery, fetchNearbyKaraokeShops } from '../overpass/fetchNearbyKaraokeShops.js'
import { prepareMapShops } from './prepareMapShops.js'

const endpoints = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter']
const cache = new Map()
let retryAfter = 0

export function shopFetchMessage(error) {
  if (error?.status === 429 || error?.status === 406) return '店舗取得サーバーが利用を制限しています。30秒以上待ってから再試行してください。'
  if (error?.name === 'TimeoutError') return '店舗取得サーバーの応答が遅れています。時間をおくか、検索範囲を小さくして再試行してください。'
  if (error?.status >= 500) return '店舗取得サーバーで障害が発生しています。時間をおいて再試行してください。'
  return '店舗取得サーバーに接続できません。通信環境を確認して再試行してください。'
}

/** 接続先の切り替えは最大1回。座標・取得データを端末へ永続保存しない。 */
export async function loadNearbyMapShops({ latitude, longitude, radiusMeters, signal, onFallback, fetchShops = fetchNearbyKaraokeShops, now = Date.now }) {
  buildNearbyKaraokeQuery({ latitude, longitude, radiusMeters })
  signal?.throwIfAborted()
  const key = `${latitude}:${longitude}:${radiusMeters}`
  if (fetchShops === fetchNearbyKaraokeShops && cache.get(key)?.expires > now()) return cache.get(key).value
  if (now() < retryAfter) {
    const error = new Error('Rate limited')
    error.status = 429
    throw error
  }
  for (const [index, endpoint] of endpoints.entries()) {
    try {
      const shops = await fetchShops({ latitude, longitude, radiusMeters, endpoint, signal })
      signal?.throwIfAborted()
      const value = prepareMapShops({ latitude, longitude }, shops)
      if (fetchShops === fetchNearbyKaraokeShops) {
        if (cache.size >= 10) cache.delete(cache.keys().next().value)
        cache.set(key, { value, expires: now() + 120000 })
      }
      return value
    } catch (error) {
      if (signal?.aborted) throw error
      if (error.status === 429 || error.status === 406) {
        retryAfter = now() + 30000
        throw error
      }
      const retryable = error.name === 'TimeoutError' || error instanceof TypeError || error.status >= 500
      if (!retryable || index === endpoints.length - 1) throw error
      onFallback?.()
    }
  }
}
