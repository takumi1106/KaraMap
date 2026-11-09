import { roomCatalog } from '../room-search/roomCatalog.js'
import { sortShopsByDistance } from '../shop-distance/shopDistance.js'

export const demoOrigin = { latitude: 35.1709, longitude: 136.8815 }

export function searchContext(params) {
  const next = new URLSearchParams(params)
  for (const key of ['shop', 'room', 'reserve', 'shopName', 'returnTo']) next.delete(key)
  return next
}

export function detailPath(id, params, roomId) {
  const next = searchContext(params)
  next.set('shop', id)
  if (roomId) next.set('room', roomId)
  return `/shop-detail?${next}`
}

export function reservationPath(id, roomId, params) {
  const next = searchContext(params)
  next.set('reserve', id)
  next.set('room', roomId)
  next.set('returnTo', 'shop-detail')
  return `/search?${next}`
}

export function groupByDistance(shops) {
  const sorted = sortShopsByDistance(shops)
  const known = (shop) => Number.isFinite(shop.distanceMeters) && shop.distanceMeters >= 0
  return [
    { id: 'near', label: '5km以内の店舗', shops: sorted.filter((shop) => known(shop) && shop.distanceMeters <= 5000) },
    { id: 'far', label: '5kmより遠い店舗', shops: sorted.filter((shop) => known(shop) && shop.distanceMeters > 5000) },
    ...(!sorted.every(known) ? [{ id: 'unknown', label: '距離未確認の店舗', shops: sorted.filter((shop) => !known(shop)) }] : []),
  ]
}

// 条件検索では部屋情報のある店舗を距離区分より先に表示する。
export function groupRegisteredShopsFirst(shops) {
  const registeredIds = new Set(roomCatalog.filter((store) => store.rooms.length > 0).flatMap((store) => store.osmIds))
  const registered = shops.filter((shop) => registeredIds.has(shop.id))
  const remaining = shops.filter((shop) => !registeredIds.has(shop.id))
  return [
    { id: 'registered', label: '部屋情報登録済みの店舗', shops: sortShopsByDistance(registered) },
    ...groupByDistance(remaining),
  ]
}

export function savedShopDetail(shops, id) {
  const shop = shops.find((item) => item.id === id)
  if (!shop) return null
  const store = roomCatalog.find((item) => item.osmIds.includes(id))
  return {
    ...shop,
    name: store?.name ?? shop.name,
    address: store?.address ?? shop.address,
    rooms: store?.rooms ?? [],
  }
}
