import { searchRooms } from './searchRooms.js'
import { roomCatalog } from './roomCatalog.js'
import { sortShopsByDistance } from '../shop-distance/shopDistance.js'

function normalizeShopName(value) {
  return (value ?? '').normalize('NFKC').trim().toLowerCase()
}

export function readRoomSearch(params) {
  const keyword = params.get('keyword') ?? ''
  try {
    const raw = params.get('filters')
    const values = raw === null ? {} : JSON.parse(raw)
    if (Object.hasOwn(values ?? {}, 'vacantOnly')) throw new Error('Invalid filter')
    const flag = params.get('available')
    if (flag !== null && flag !== 'true' && flag !== 'false') throw new Error('Invalid availability')
    searchRooms({ shops: [], filters: values })
    return { values, realtimeAvailable: flag === 'true', keyword, error: null }
  } catch {
    return { values: {}, realtimeAvailable: false, keyword, error: '検索条件を読み込めませんでした。条件を選び直してください。' }
  }
}

export function roomSearchParams({ values, realtimeAvailable, keyword = '' }) {
  const params = new URLSearchParams({ from: 'search-filter', filters: JSON.stringify(values), available: String(realtimeAvailable) })
  if (keyword) params.set('keyword', keyword)
  if (readRoomSearch(params).error) throw new TypeError('検索条件が不正です。')
  return params
}

// 保存店舗の品質・距離を保ち、既存の同室AND検索結果を画面の店舗形式へ変換。
// 実空室は未接続のため、テスト空室を自動付与しない。
export function searchRoomPageShops(shops, { values, realtimeAvailable, keyword = '' }) {
  const query = normalizeShopName(keyword)
  const candidates = shops.filter((shop) => {
    if (shop.quality?.status !== 'osm_tagged') return false
    const store = roomCatalog.find((item) => item.osmIds.includes(shop.id))
    return !query || normalizeShopName(store?.name ?? shop.name).includes(query)
  })
  const matches = searchRooms({
    shops: candidates,
    filters: { ...values, vacantOnly: realtimeAvailable },
  })
  const matchedShops = matches.map(({ shop, storeId, matchedRooms }) => {
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
  })
  const hasConditions = realtimeAvailable || Object.values(values).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value))
  if (hasConditions) return sortShopsByDistance(matchedShops)
  // 条件未指定時だけ未登録店舗も表示。設備一致を推測しない。
  const matchedIds = new Set(matchedShops.map((shop) => shop.id))
  return sortShopsByDistance([...matchedShops, ...candidates.filter((shop) => !matchedIds.has(shop.id))])
}
