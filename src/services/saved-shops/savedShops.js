import { normalizeKaraokeShops } from '../overpass/normalizeKaraokeShops.js'
import { prepareMapShops } from '../map-shops/prepareMapShops.js'
import { calculateDistanceMeters } from '../shop-distance/shopDistance.js'

function featureElement(feature) {
  const properties = feature?.properties ?? {}
  const id = String(properties['@id'] ?? feature?.id ?? '').match(/^(node|way|relation)\/(\d+)$/)
  if (!id) return null
  const tags = Object.fromEntries(Object.entries(properties).filter(([key, value]) => !key.startsWith('@') && typeof value === 'string'))
  const geometry = feature.geometry
  let position = null
  if (geometry?.type === 'Point') position = geometry.coordinates
  // 非Pointは推測で中心を作らず要確認として残す。正確な座標にはout centerのJSONを使う。
  const coordinates = position ? { lat: position[1], lon: position[0] } : {}
  return { type: id[1], id: Number(id[2]), tags, ...(id[1] === 'node' ? coordinates : { center: coordinates }) }
}

export function parseSavedShops(data) {
  if (data?.remark) throw new Error('取得エラーを含むデータです。正常な結果を書き出してください。')
  if (Array.isArray(data?.elements)) return normalizeKaraokeShops(data.elements)
  if (data?.type === 'FeatureCollection' && Array.isArray(data.features)) {
    return normalizeKaraokeShops(data.features.map(featureElement).filter(Boolean))
  }
  throw new Error('Overpass JSONまたはGeoJSONのファイルを指定してください。')
}

export function searchSavedShops(data, location, radiusMeters) {
  if (calculateDistanceMeters(location, location) === null || !Number.isFinite(radiusMeters) || radiusMeters <= 0) {
    throw new RangeError('現在地と検索範囲を確認してください。')
  }
  const prepared = prepareMapShops(location, parseSavedShops(data))
  return { ...prepared, results: prepared.results.filter((shop) => shop.distanceMeters !== null && shop.distanceMeters <= radiusMeters) }
}

export async function loadSavedShops({ location, radiusMeters, url, signal, fetchImpl = fetch }) {
  const response = await fetchImpl(url, { signal, cache: 'no-cache' })
  if (response.status === 404) throw new Error('保存済み店舗データが未登録です。Overpassの書き出しファイルを登録してください。')
  if (!response.ok) throw new Error('保存済み店舗データを読み込めませんでした。')
  let data
  try { data = await response.json() } catch (cause) {
    throw new Error('店舗データが見つからないか、JSON形式が正しくありません。', { cause })
  }
  return searchSavedShops(data, location, radiusMeters)
}
