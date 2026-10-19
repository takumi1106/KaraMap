import { searchRooms } from './searchRooms.js'
import { roomCatalog } from './roomCatalog.js'
import { sortShopsByDistance } from '../shop-distance/shopDistance.js'

export function readRoomSearch(params) {
  try {
    const raw = params.get('filters')
    const values = raw === null ? {} : JSON.parse(raw)
    if (Object.hasOwn(values ?? {}, 'vacantOnly')) throw new Error('Invalid filter')
    const flag = params.get('available')
    if (flag !== null && flag !== 'true' && flag !== 'false') throw new Error('Invalid availability')
    searchRooms({ shops: [], filters: values })
    return { values, realtimeAvailable: flag === 'true', error: null }
  } catch {
    return { values: {}, realtimeAvailable: false, error: '検索条件を読み込めませんでした。条件を選び直してください。' }
  }
}

export function roomSearchParams({ values, realtimeAvailable }) {
  const params = new URLSearchParams({ from: 'search-filter', filters: JSON.stringify(values), available: String(realtimeAvailable) })
  if (readRoomSearch(params).error) throw new TypeError('検索条件が不正です。')
  return params
}

// 保存店舗の品質・距離を保ち、既存の同室AND検索結果を画面の店舗形式へ変換。
// 実空室は未接続のため、テスト空室を自動付与しない。
export function searchRoomPageShops(shops, { values, realtimeAvailable }) {
  const matches = searchRooms({
    shops: shops.filter((shop) => shop.quality?.status === 'osm_tagged'),
    filters: { ...values, vacantOnly: realtimeAvailable },
  })
  return sortShopsByDistance(matches.map(({ shop, storeId, matchedRooms }) => {
    const store = roomCatalog.find((item) => item.id === storeId)
    return {
      ...shop,
      storeId,
      name: store.name,
      address: store.address ?? shop.address,
      matchedRooms,
      machines: [...new Set(matchedRooms.flatMap(({ room }) => room.machines ?? []))]
        .map((machine) => machine === 'dam' ? 'DAM' : 'JOYSOUND'),
      availableRooms: null,
      availability: { status: 'unknown', source: null },
      isTestData: false,
    }
  }))
}
